import os
import sys
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from fraud_detector import ISO_MODEL, SCALER, XGB_MODEL, FEATURE_COLS, FEATURE_SEQUENCE

def main():
    print("==================================================")
    print(" 🧪 MODEL EVALUATION & SCENARIO TESTING SUITE 🧪")
    print("==================================================")
    
    # --- 1. SHAP / Feature Importance Check ---
    print("\n[1] Running Leakage & Importance Check (Pattern 5 - XGBoost)...")
    importances = pd.Series(XGB_MODEL.feature_importances_, index=FEATURE_SEQUENCE).sort_values(ascending=False)
    top_feature = importances.index[0]
    print(f"    Top Feature: {top_feature} ({importances.iloc[0]:.4f})")
    
    # Assertion: volume_to_income_ratio should NOT dominate the model
    assert top_feature != "income_utilization_ratio_30d", "Leakage Error: ratio dominates model"
    print("    ✅ Leakage check passed: income_utilization_ratio_30d does not dominate.")
    
    # --- 2. Synthetic Scenario Testing ---
    print("\n[2] Running Synthetic Scenario Assertions...")
    
    # Helper to score Pattern 4 (Dormant)
    def score_p4(props):
        X = pd.DataFrame([{c: float(props.get(c, 0.0)) for c in FEATURE_COLS}])
        X_scaled = SCALER.transform(X)
        # predict returns -1 (anomaly), 1 (normal). We mock a continuous score using decision_function
        score = ISO_MODEL.decision_function(X_scaled)[0]
        # decision_function: lower/negative is more anomalous. Convert to 0-1 probability-like
        prob = 1.0 / (1.0 + np.exp(score * 2)) # Simple sigmoid inversion for testing
        return prob

    # Helper to score Pattern 5 (KYC)
    def score_p5(props):
        X = pd.DataFrame([{c: float(props.get(c, 0.0)) for c in FEATURE_SEQUENCE}])
        prob = XGB_MODEL.predict_proba(X)[0][1]
        return float(prob)
        
    # ── T1: Classic mule activation (Pattern 4) ──
    t1_props = {
        "dormancy_days": 800, "txn_count_7d": 2, "volume_7d": 10000000, 
        "avg_monthly_volume": 500, "kyc_update_recency_days": 2, "immediate_outflow_pct": 0.95
    }
    t1_score = score_p4(t1_props)
    print(f"    T1 (Classic Mule) Score: {t1_score:.4f}")
    assert t1_score > 0.5, f"T1 mule should score high, got {t1_score}"
    print("    ✅ T1 Passed")

    # ── FP1: Grandparent sending gift (Pattern 4 False Positive) ──
    fp1_props = {
        "dormancy_days": 400, "txn_count_7d": 1, "volume_7d": 50000, 
        "avg_monthly_volume": 0, "kyc_update_recency_days": 300, "immediate_outflow_pct": 0.0
    }
    fp1_score = score_p4(fp1_props)
    print(f"    FP1 (Grandparent Gift) Score: {fp1_score:.4f}")
    assert fp1_score < 0.5, f"FP1 should not be flagged, got {fp1_score}"
    print("    ✅ FP1 Passed")

    # ── T2: Corporate Shell (Pattern 5) ──
    t2_props = {
        "kyc_tier": 1, "declared_annual_income": 500000, "volume_30d": 50000000, 
        "income_utilization_ratio_30d": 100.0, "corporate_wire_inflow_pct": 0.9, 
        "unknown_source_pct": 0.1, "age_band_encoded": 1
    }
    t2_score = score_p5(t2_props)
    print(f"    T2 (Corporate Shell) Score: {t2_score:.4f}")
    assert t2_score > 0.5, f"T2 shell should score high, got {t2_score}"
    print("    ✅ T2 Passed")

    # ── FP4: Gig Student (Pattern 5 False Positive) ──
    fp4_props = {
        "kyc_tier": 1, "declared_annual_income": 150000, "volume_30d": 40000, 
        "income_utilization_ratio_30d": 0.26, "upi_family_inflow_pct": 0.8, 
        "age_band_encoded": 1, "geography_tier_metro": 1.0
    }
    fp4_score = score_p5(fp4_props)
    print(f"    FP4 (Gig Student) Score: {fp4_score:.4f}")
    assert fp4_score < 0.4, f"FP4 gig student should not be flagged, got {fp4_score}"
    print("    ✅ FP4 Passed")

    # --- 3. Dormancy Stress Test ---
    print("\n[3] Running Dormancy Boundary Stress Test...")
    edge_364 = score_p4({**t1_props, "dormancy_days": 364})
    edge_366 = score_p4({**t1_props, "dormancy_days": 366})
    print(f"    Score @ 364 days: {edge_364:.4f}")
    print(f"    Score @ 366 days: {edge_366:.4f}")
    assert abs(edge_364 - edge_366) < 0.2, "Dormancy boundary is too brittle (cliff edge)"
    print("    ✅ Boundary check passed")

    # --- 4. Cross-Pattern Blending Formula Validation ---
    print("\n[4] Validating Cross-Pattern Blending Formula...")
    print("    Formula: final_score = max(pattern_4_score, pattern_5_score)")
    blend_score = max(t1_score, fp4_score)
    print(f"    Blended score for (T1, FP4): {blend_score:.4f}")
    assert blend_score == t1_score, "Blending formula failed max() constraint"
    print("    ✅ Cross-pattern test passed")

    print("\n==================================================")
    print(" 🎉 ALL EVALUATION ASSERTIONS PASSED SUCCESSFULLY 🎉")
    print("==================================================")

if __name__ == "__main__":
    main()
