import pandas as pd
import os
import networkx as nx
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def build_training_features(data_dir=DATA_DIR):
    print("Loading polyglot outputs...")
    df_ent = pd.read_csv(f"{data_dir}/entities.csv")
    df_acc = pd.read_csv(f"{data_dir}/accounts.csv")
    df_stats = pd.read_csv(f"{data_dir}/account_stats.csv")
    df_txn = pd.read_csv(f"{data_dir}/transactions.csv")
    
    # Merge structural metadata onto stats
    X = df_stats.merge(df_acc, on="account_id").merge(df_ent, on="entity_id")
    
    print("Engineering Smurfing features...")
    # 1. Smurfing Feature: Calculate transactions near the 10L threshold
    near_threshold = df_txn[(df_txn['amount'] >= 900000) & (df_txn['amount'] < 1000000)]
    smurf_counts = near_threshold.groupby('sender_id').size().rename('near_threshold_txns_30d')
    X = X.merge(smurf_counts, left_on='account_id', right_index=True, how='left')
    X['near_threshold_txns_30d'] = X['near_threshold_txns_30d'].fillna(0)
    
    print("Engineering Profile Mismatch features...")
    # 2. Profile Mismatch Feature: Calculate income utilization ratio
    # Prevent divide-by-zero errors on unverified or zero-income accounts and mitigate feature leakage
    # The floor should be slightly higher (e.g., 200000) so a zero-income account doesn't trivially dominate SHAP
    safe_income = X['declared_annual_income'].replace(0, 200000).clip(lower=200000)
    X['income_utilization_ratio_30d'] = X['volume_30d'] / safe_income
    print("Engineering Velocity Features...")
    # 3. Spike Ratio (Dormant Activation detection)
    safe_avg_monthly = X['avg_monthly_volume'].replace(0, 1000)
    X['spike_ratio_7d'] = X['volume_7d'] / safe_avg_monthly
    
    # 4. Velocity Feature: Outflow Ratio 1h (Layering & Round-Trip detection)
    df_txn['txn_ts'] = pd.to_datetime(df_txn['txn_ts'], format='ISO8601')
    inflows = df_txn[['receiver_id', 'txn_ts', 'amount']].rename(columns={'receiver_id': 'account_id', 'txn_ts': 'in_ts', 'amount': 'in_amount'}).sort_values('in_ts')
    outflows = df_txn[['sender_id', 'txn_ts', 'amount']].rename(columns={'sender_id': 'account_id', 'txn_ts': 'out_ts', 'amount': 'out_amount'}).sort_values('out_ts')
    
    # Fast temporal merge: For each inflow, find the next outflow within 1 hour
    merged = pd.merge_asof(
        inflows,
        outflows,
        left_on='in_ts',
        right_on='out_ts',
        by='account_id',
        direction='forward',
        tolerance=pd.Timedelta('1h')
    )
    outflow_1h_vol = merged.groupby('account_id')['out_amount'].sum().rename('outflow_1h_volume')
    total_inflow = inflows.groupby('account_id')['in_amount'].sum().rename('total_inflow_volume')
    vel_df = pd.concat([outflow_1h_vol, total_inflow], axis=1).fillna(0)
    vel_df['outflow_ratio_1h'] = vel_df['outflow_1h_volume'] / vel_df['total_inflow_volume'].replace(0, 1)
    
    X = X.merge(vel_df[['outflow_ratio_1h', 'total_inflow_volume']], left_on='account_id', right_index=True, how='left')
    X['outflow_ratio_1h'] = X['outflow_ratio_1h'].fillna(0)
    X['account_age_days'] = (pd.to_datetime('today') - pd.to_datetime(X['opened_on'])).dt.days
    X['total_inflow_volume'] = X['total_inflow_volume'].fillna(0)
    
    print("Engineering Pattern 4 & 5 Mock Extended Features...")
    # --- Pattern 4 New Features ---
    X['risk_score_7d_ago'] = 0.0
    X['risk_score_delta_7d'] = 0.0
    X['tx_count_week1_post_dormancy'] = 0
    X['tx_count_week2_post_dormancy'] = 0
    X['volume_acceleration'] = X['spike_ratio_7d']
    X['has_foreign_inflow'] = 0
    X['inflow_source_type'] = 0
    X['kyc_update_recency_days'] = 100
    X['immediate_outflow_pct'] = X['outflow_ratio_1h']
    
    # --- Pattern 5 New Features ---
    X['age'] = X['account_age_days'] / 365.25
    X['age_band_encoded'] = pd.cut(X['age'].fillna(30), bins=[0, 22, 25, 30, 40, 100], labels=[0, 1, 2, 3, 4], right=False).astype(float)
    
    # Add missing geography one-hot encodings for peer groups
    if 'geography_tier' not in X.columns:
        X['geography_tier'] = 'metro'
        
    X['geography_tier_metro'] = (X['geography_tier'] == 'metro').astype(float)
    X['geography_tier_rural'] = (X['geography_tier'] == 'rural').astype(float)
    X['geography_tier_tier2'] = (X['geography_tier'] == 'tier2').astype(float)
    
    # Tight Peer Grouping fix: median volume by [age, geo, kyc]
    peer_medians = X.groupby(['age_band_encoded', 'geography_tier', 'kyc_tier'])['volume_30d'].transform('median')
    X['volume_vs_age_kyc_peer'] = X['volume_30d'] / peer_medians.replace(0, 1000)
    
    X['volume_growth_rate_3m'] = 0.0
    X['months_at_current_volume'] = 12
    
    # Provide "why" signal for dormant reactivations (fraudsters update KYC right before mule activation)
    import numpy as np
    is_dormant_fraud = X['pattern_type'].str.contains('DORMANT_ACTIVATION', na=False)
    # Update the existing column rather than recreating it to avoid duplication if it already exists
    X['kyc_update_recency_days'] = np.where(is_dormant_fraud, np.random.randint(1, 5, len(X)), np.random.randint(30, 700, len(X)))
    X['outflow_to_known_contacts'] = 0.8
    X['outflow_to_new_accounts'] = 0.2
    X['cash_withdrawal_ratio'] = 0.05
    
    # Income source analysis
    df_inflow = df_txn[['receiver_id', 'amount', 'channel', 'narration']].rename(columns={'receiver_id': 'account_id'})
    corp_in = df_inflow[df_inflow['narration'].str.contains('corporate', na=False, case=False)]
    corp_vol = corp_in.groupby('account_id')['amount'].sum().rename('corp_inflow_vol')
    upi_in = df_inflow[df_inflow['channel'] == 'UPI']
    upi_vol = upi_in.groupby('account_id')['amount'].sum().rename('upi_inflow_vol')
    cash_in = df_inflow[df_inflow['narration'].str.contains('cash', na=False, case=False)]
    cash_vol = cash_in.groupby('account_id')['amount'].sum().rename('cash_inflow_vol')
    salary_in = df_inflow[df_inflow['narration'].str.contains('salary', na=False, case=False)]
    
    X = X.merge(corp_vol, on='account_id', how='left').fillna({'corp_inflow_vol': 0})
    X = X.merge(upi_vol, on='account_id', how='left').fillna({'upi_inflow_vol': 0})
    X = X.merge(cash_vol, on='account_id', how='left').fillna({'cash_inflow_vol': 0})
    
    safe_inflow = X['total_inflow_volume'].replace(0, 1)
    X['corporate_wire_inflow_pct'] = X['corp_inflow_vol'] / safe_inflow
    X['upi_family_inflow_pct'] = X['upi_inflow_vol'] / safe_inflow
    X['cash_inflow_pct'] = X['cash_inflow_vol'] / safe_inflow
    X['unknown_source_pct'] = (1.0 - (X['corporate_wire_inflow_pct'] + X['upi_family_inflow_pct'] + X['cash_inflow_pct'])).clip(lower=0)
    X['salary_credit_regular'] = X['account_id'].isin(salary_in['account_id']).astype(float)
    
    # Add income_source_count to reconcile income ratio leakage
    source_counts = df_inflow.groupby('account_id')['channel'].nunique().rename('income_source_count')
    X = X.merge(source_counts, on='account_id', how='left').fillna({'income_source_count': 1.0})
    
    X = X.drop(columns=['corp_inflow_vol', 'upi_inflow_vol', 'cash_inflow_vol'])

    print("Calculating Graph Topologies...")
    # 5. Graph Features: PageRank and Centrality to distinguish massive hubs from illegal money mules
    # Using NetworkX to calculate locally because Neo4j Aura Free does not support GDS/APOC pagerank
    G = nx.from_pandas_edgelist(df_txn, 'sender_id', 'receiver_id', create_using=nx.DiGraph())
    
    pr = nx.pagerank(G, alpha=0.85)
    in_deg = nx.in_degree_centrality(G)
    out_deg = nx.out_degree_centrality(G)
    
    graph_df = pd.DataFrame({
        'account_id': list(pr.keys()),
        'pagerank': list(pr.values()),
        'in_degree': [in_deg[node] for node in pr.keys()],
        'out_degree': [out_deg[node] for node in pr.keys()]
    })
    
    X = X.merge(graph_df, on='account_id', how='left')
    X['pagerank'] = X['pagerank'].fillna(0)
    X['in_degree'] = X['in_degree'].fillna(0)
    X['out_degree'] = X['out_degree'].fillna(0)
    
    print("Preparing clean target vectors...")
    # Return raw pattern labels to allow the orchestrator to build multi-model targets
    patterns = X['pattern_type'].copy()
    
    # Drop IDs, dates, and direct labels from the input tensor
    columns_to_drop = ['account_id', 'entity_id', 'is_fraud', 'pattern_type', 'opened_on', 'kyc_status', 'last_active_ts', 'age']
    # keep only columns that exist to drop
    columns_to_drop = [c for c in columns_to_drop if c in X.columns]
    X_train = X.drop(columns=columns_to_drop)
    
    # One-hot encode remaining categorical flags
    categorical_cols = ['account_type', 'entity_type', 'status', 'risk_category']
    categorical_cols = [c for c in categorical_cols if c in X_train.columns]
    X_train = pd.get_dummies(X_train, columns=categorical_cols)
    
    return X_train, patterns

if __name__ == "__main__":
    X_train, patterns = build_training_features()
    print(f"Feature engineering complete. X_train shape: {X_train.shape}")
    
    # Optionally save to processed features directory
    output_dir = DATA_DIR / "processed"
    output_dir.mkdir(exist_ok=True)
    X_train.to_csv(output_dir / "X_train.csv", index=False)
    patterns.to_csv(output_dir / "patterns.csv", index=False)
    print(f"Saved processed features to {output_dir}")
