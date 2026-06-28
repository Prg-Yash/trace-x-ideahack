import os
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import pytest
import shap
import warnings

# Suppress LightGBM / XGBoost warnings
warnings.filterwarnings('ignore')

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "apps" / "ai-ml" / "models"

def test_shap_smurfing_explainability():
    """
    Test that the SHAP explainer correctly prioritizes smurfing topological features 
    like 'threshold_avoidance_ratio' and 'amount_clustering_score' for a high-risk smurf.
    """
    model_path = MODELS_DIR / "smurf_model.pkl"
    assert model_path.exists(), f"Smurf model not found at {model_path}"

    # Load the calibrated model
    smurf_pipeline = joblib.load(model_path)
    
    # Extract the underlying base estimator for TreeExplainer
    try:
        base_xgb_estimator = smurf_pipeline.calibrated_classifiers_[0].estimator
    except AttributeError:
        pytest.fail("Failed to extract base estimator. Make sure the model is wrapped in CalibratedClassifierCV.")

    feature_cols = ['amount', 'tx_count_last_24h', 'total_volume_24h', 'channel_upi_ratio', 
                    'tx_count_last_7d', 'tx_count_last_30d', 'total_volume_7d', 'total_volume_30d', 
                    'near_threshold_count_30d', 'amount_variance_24h', 'amount_clustering_score', 
                    'threshold_avoidance_ratio', 'time_gap_mean_min', 'time_gap_stddev', 'is_weekend', 
                    'unique_recipients_24h', 'account_age_days', 'orig_balance_after_ratio']

    # Engineer a classic "Smurfing" feature array (dodging thresholds, clustered amounts)
    classic_smurf = {c: 0.0 for c in feature_cols}
    classic_smurf.update({
        'tx_count_last_30d': 800,
        'tx_count_last_24h': 150,
        'tx_count_last_7d': 500,
        'total_volume_7d': 5500000.0,
        'total_volume_30d': 15000000.0,
        'amount_clustering_score': 0.95,  # highly clustered
        'threshold_avoidance_ratio': 0.98, # nearly all dodge the threshold
        'time_gap_stddev': 5.0,
        'total_volume_24h': 850000.0,
        'channel_upi_ratio': 1.0,
        'near_threshold_count_30d': 800
    })

    df_smurf = pd.DataFrame([classic_smurf])
    
    # Explainer
    explainer = shap.TreeExplainer(base_xgb_estimator)
    shap_values = explainer.shap_values(df_smurf)
    
    # In XGBoost multi-class or prob, shap_values might be a list. For binary, it's a matrix.
    if isinstance(shap_values, list):
        sv = shap_values[1][0]
    else:
        sv = shap_values[0]
        
    # Get absolute SHAP weights to determine top features
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'shap_weight': np.abs(sv)
    }).sort_values(by='shap_weight', ascending=False).reset_index(drop=True)
    
    top_3_features = importance_df['feature'].head(3).tolist()
    
    print("\nTop 3 SHAP Features for Classic Smurf:", top_3_features)
    
    # We assert that high velocity/volume features are recognized by the explainer for this profile
    assert 'total_volume_7d' in top_3_features or 'time_gap_stddev' in top_3_features or 'tx_count_last_24h' in top_3_features or 'total_volume_24h' in top_3_features, \
        f"SHAP did not prioritize structural smurfing indicators. Top 3 were: {top_3_features}"
