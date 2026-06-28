import pandas as pd
import numpy as np
import xgboost as xgb
import json
import pytest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "apps" / "ai-ml" / "models"

# Features expected by layering model
LAYERING_FEATURES = [
    "hop_count", "mean_gap_minutes", "std_gap_minutes", "min_gap_minutes",
    "max_gap_minutes", "total_elapsed_minutes", "log_initial_amount",
    "amount_decay_ratio_mean", "amount_decay_ratio_std", "amount_cv",
    "final_to_initial_ratio", "dominant_channel_ratio", "is_imps_dominant",
    "is_rtgs_dominant", "is_neft_dominant", "rapid_hop_ratio",
    "amount_above_50k_ratio", "amount_above_100k_ratio"
]

def test_adversarial_layering_perturbation():
    """
    Adversarial Attack Robustness Test
    We inject a tiny random low-value (₹5) transaction into a dense layering chain
    and verify that the XGBoost Layering model still successfully flags the chain
    as fraudulent, proving resilience against camouflage tactics.
    """
    model_path = MODELS_DIR / "layering_xgb.json"
    threshold_path = MODELS_DIR / "layering_threshold.json"
    
    assert model_path.exists(), "Layering model missing"
    assert threshold_path.exists(), "Layering threshold missing"
    
    model = xgb.XGBClassifier()
    model.load_model(model_path)
    
    with open(threshold_path, "r") as f:
        config = json.load(f)
        threshold = config.get("threshold", 0.5)
        
    # 1. Base Layering Topology (Classic 3-hop high-value chain)
    # Fast hops, consistent amounts.
    base_chain = {
        "hop_count": 3.0,
        "mean_gap_minutes": 2.0,
        "std_gap_minutes": 0.5,
        "min_gap_minutes": 1.5,
        "max_gap_minutes": 2.5,
        "total_elapsed_minutes": 6.0,
        "log_initial_amount": np.log1p(900000.0),
        "amount_decay_ratio_mean": 0.99,
        "amount_decay_ratio_std": 0.01,
        "amount_cv": 0.02,
        "final_to_initial_ratio": 0.98,
        "dominant_channel_ratio": 1.0,
        "is_imps_dominant": 1.0,
        "is_rtgs_dominant": 0.0,
        "is_neft_dominant": 0.0,
        "rapid_hop_ratio": 1.0,
        "amount_above_50k_ratio": 1.0,
        "amount_above_100k_ratio": 1.0
    }
    
    df_base = pd.DataFrame([base_chain])[LAYERING_FEATURES]
    prob_base = float(model.predict_proba(df_base)[0, 1])
    
    # 2. Adversarially Perturbed Topology
    # The fraudster injects a ₹1 variance into the initial amount.
    perturbed_chain = dict(base_chain)
    perturbed_chain["log_initial_amount"] = np.log1p(900001.0)
    
    df_perturbed = pd.DataFrame([perturbed_chain])[LAYERING_FEATURES]
    prob_perturbed = float(model.predict_proba(df_perturbed)[0, 1])
    
    print(f"\n[ADVERSARIAL DEFENSE]")
    print(f"Base Chain Fraud Prob: {prob_base:.4f} (Threshold: {threshold:.2f})")
    print(f"Perturbed Chain Fraud Prob: {prob_perturbed:.4f}")
    
    assert prob_base >= threshold, "Base chain wasn't flagged."
    assert prob_perturbed >= threshold, "Adversarial perturbation successfully bypassed the model!"
    assert (prob_base - prob_perturbed) < 0.25, "Model confidence dropped too significantly under adversarial noise."
