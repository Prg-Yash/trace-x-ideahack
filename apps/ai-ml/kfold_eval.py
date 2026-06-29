import sys
from pathlib import Path
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import average_precision_score, f1_score
import joblib
from sklearn.calibration import CalibratedClassifierCV

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from train_models import load_accounts, load_transactions, detect_smurf_accounts
from scripts.extract_chain_features import build_layering_training_dataset, build_roundtrip_training_dataset

def evaluate_kfold():
    print("Loading datasets for Stratified K-Fold (k=5)...")
    df_acc = load_accounts()
    df_txn = load_transactions()
    df_txn_success = df_txn[df_txn["status"].str.upper() == "SUCCESS"].copy()
    
    kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # 1. Smurfing (Calibrated XGBoost)
    print("\n=== K-Fold: Smurfing (Calibrated XGBoost) ===")
    labels_path = BASE_DIR / "data" / "labels" / "smurf_accounts.csv"
    if labels_path.exists():
        labels_df = pd.read_csv(labels_path)
        smurfers = {str(x) for x in labels_df["account_id"].dropna()}
    else:
        smurfers = {str(x) for x in detect_smurf_accounts(df_txn_success)}
        
    feature_cols_smurf = ['amount', 'tx_count_last_24h', 'total_volume_24h', 'channel_upi_ratio', 'tx_count_last_7d', 'tx_count_last_30d', 'total_volume_7d', 'total_volume_30d', 'near_threshold_count_30d', 'amount_variance_24h', 'amount_clustering_score', 'threshold_avoidance_ratio', 'time_gap_mean_min', 'time_gap_stddev', 'is_weekend', 'unique_recipients_24h', 'account_age_days', 'orig_balance_after_ratio']
    
    out_txn = df_txn_success.dropna(subset=['txn_ts', 'sender_id']).copy()
    gb = out_txn.groupby('sender_id')
    features = pd.DataFrame(index=gb.groups.keys())
    time_span = (out_txn.groupby('sender_id')['txn_ts'].max() - out_txn.groupby('sender_id')['txn_ts'].min()).dt.total_seconds() / 86400.0
    time_span = time_span.replace(0, 1)
    features['tx_count_last_24h'] = gb.size() / time_span
    features['total_volume_24h'] = gb['amount'].sum() / time_span
    features['channel_upi_ratio'] = out_txn[out_txn['channel'].str.upper() == 'UPI'].groupby('sender_id').size() / gb.size()
    features['amount_variance_24h'] = gb['amount'].var()
    out_txn = out_txn.sort_values(['sender_id', 'txn_ts'])
    out_txn['time_gap'] = out_txn.groupby('sender_id')['txn_ts'].diff().dt.total_seconds() / 60.0
    features['time_gap_mean_min'] = out_txn.groupby('sender_id')['time_gap'].mean()
    features['time_gap_stddev'] = out_txn.groupby('sender_id')['time_gap'].std()
    features['unique_recipients_24h'] = gb['receiver_id'].nunique()
    features['is_weekend'] = out_txn[out_txn['txn_ts'].dt.dayofweek >= 5].groupby('sender_id').size() / gb.size()
    features['amount_clustering_score'] = features['amount_variance_24h'] / (gb['amount'].mean() ** 2 + 1)
    features['threshold_avoidance_ratio'] = out_txn[(out_txn['amount'] >= 900000) & (out_txn['amount'] <= 999999)].groupby('sender_id').size() / gb.size()
    features['amount'] = gb['amount'].mean()
    features['orig_balance_after_ratio'] = 0.1
    features = features.fillna(0)
    
    X_full = df_acc.merge(features, left_on='account_id', right_index=True, how='left').fillna(0)
    X_full['tx_count_last_7d'] = X_full.get('txn_count_7d', 0)
    X_full['tx_count_last_30d'] = X_full.get('txn_count_30d', 0)
    X_full['total_volume_7d'] = X_full.get('volume_7d', 0)
    X_full['total_volume_30d'] = X_full.get('volume_30d', 0)
    X_full['near_threshold_count_30d'] = X_full.get('near_threshold_txns_30d', 0)
    
    for col in feature_cols_smurf:
        if col not in X_full.columns:
            X_full[col] = 0
            
    X_smurf = X_full[feature_cols_smurf].copy().fillna(0).values
    def norm(x): 
        try: return f"ACC_{int(str(x).split('_')[1]):05d}" 
        except: return str(x)
    y_smurf = X_full['account_id'].apply(lambda x: 1 if norm(x) in smurfers else 0).values

    smurf_auc_prs = []
    for i, (train_idx, test_idx) in enumerate(kf.split(X_smurf, y_smurf)):
        X_tr, y_tr = X_smurf[train_idx], y_smurf[train_idx]
        X_te, y_te = X_smurf[test_idx], y_smurf[test_idx]
        
        pos_weight = float((y_tr == 0).sum()) / max(1, float((y_tr == 1).sum()))
        base = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, scale_pos_weight=pos_weight, reg_alpha=0.1, reg_lambda=1.0, min_child_weight=1, random_state=42)
        calibrated = CalibratedClassifierCV(estimator=base, method='isotonic', cv=3)
        calibrated.fit(X_tr, y_tr)
        
        probs = calibrated.predict_proba(X_te)[:, 1]
        auc_pr = average_precision_score(y_te, probs)
        smurf_auc_prs.append(auc_pr)
        print(f"  Fold {i+1} AUC-PR: {auc_pr:.4f} (Positives: {int(y_te.sum())}/{len(y_te)})")
    
    print(f"-> Smurfing Mean AUC-PR: {np.mean(smurf_auc_prs):.4f} +/- {np.std(smurf_auc_prs):.4f}")

    # 2. Layering
    print("\n=== K-Fold: Layering (XGBoost) ===")
    try:
        X_layer, y_layer = build_layering_training_dataset(df_txn, neg_multiplier=10, rng_seed=42)
        X_layer = X_layer.values if hasattr(X_layer, 'values') else np.array(X_layer)
        y_layer = np.array(y_layer)
        
        layering_auc_prs = []
        for i, (train_idx, test_idx) in enumerate(kf.split(X_layer, y_layer)):
            X_tr, y_tr = X_layer[train_idx], y_layer[train_idx]
            X_te, y_te = X_layer[test_idx], y_layer[test_idx]
            
            model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, scale_pos_weight=max(1, (len(y_tr) - sum(y_tr))/sum(y_tr)), random_state=42)
            model.fit(X_tr, y_tr)
            probs = model.predict_proba(X_te)[:, 1]
            auc_pr = average_precision_score(y_te, probs)
            layering_auc_prs.append(auc_pr)
            print(f"  Fold {i+1} AUC-PR: {auc_pr:.4f} (Positives: {int(y_te.sum())}/{len(y_te)})")
            
        print(f"-> Layering Mean AUC-PR: {np.mean(layering_auc_prs):.4f} +/- {np.std(layering_auc_prs):.4f}")
    except Exception as e:
        print(f"Failed Layering K-Fold: {e}")

    # 3. Round-Trip
    print("\n=== K-Fold: Round-Trip (XGBoost) ===")
    try:
        X_rt, y_rt = build_roundtrip_training_dataset(df_txn, neg_multiplier=5)
        X_rt = X_rt.values if hasattr(X_rt, 'values') else np.array(X_rt)
        y_rt = np.array(y_rt)
        
        rt_auc_prs = []
        for i, (train_idx, test_idx) in enumerate(kf.split(X_rt, y_rt)):
            X_tr, y_tr = X_rt[train_idx], y_rt[train_idx]
            X_te, y_te = X_rt[test_idx], y_rt[test_idx]
            
            model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, scale_pos_weight=max(1, (len(y_tr) - sum(y_tr))/sum(y_tr)), random_state=42)
            model.fit(X_tr, y_tr)
            probs = model.predict_proba(X_te)[:, 1]
            auc_pr = average_precision_score(y_te, probs)
            rt_auc_prs.append(auc_pr)
            print(f"  Fold {i+1} AUC-PR: {auc_pr:.4f} (Positives: {int(y_te.sum())}/{len(y_te)})")
            
        print(f"-> Round-Trip Mean AUC-PR: {np.mean(rt_auc_prs):.4f} +/- {np.std(rt_auc_prs):.4f}")
    except Exception as e:
        print(f"Failed Round-Trip K-Fold: {e}")

if __name__ == "__main__":
    evaluate_kfold()
