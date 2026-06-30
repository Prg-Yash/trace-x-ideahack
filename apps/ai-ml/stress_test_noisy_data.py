"""
stress_test_noisy_data.py
=========================
Chaos & Stress Testing TRACE-X ML Models against Messy, Unknown, Real-World Data.

We test the trained XGBoost model against 3 messy scenarios it has NEVER seen:
1. The Camouflaged Criminal (Noisy Smurfer mixing small random amounts & shopping).
2. The Innocent Wedding Father / Merchant (High volume to many unique vendors).
3. The Slow / Stealthy Structurer (Low frequency over longer gaps).
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
from pii_sanitizer import sanitize

def run_stress_test():
    print("======================================================================")
    print("🔥 TRACE-X REAL-WORLD CHAOS & NOISE STRESS TEST")
    print("======================================================================")
    
    models_dir = BASE_DIR / "models"
    smurf_bundle = joblib.load(models_dir / "smurf_model.pkl")
    model = smurf_bundle["model"]
    feature_cols = smurf_bundle["features"]
    threshold = smurf_bundle["threshold"]

    # Helper function to predict
    def test_scenario(title, desc, features_dict):
        print(f"\n──────────────────────────────────────────────────────────────────────")
        print(f"🧪 SCENARIO: {title}")
        print(f"──────────────────────────────────────────────────────────────────────")
        print(f"📖 Context: {desc}")
        
        # Sanitize and prepare feature vector
        clean, _ = sanitize(features_dict)
        X_test = pd.DataFrame(0.0, index=[0], columns=feature_cols)
        for col in feature_cols:
            if col in clean:
                X_test.at[0, col] = clean[col]
                
        prob = model.predict_proba(X_test)[0][1]
        
        print("\n  🔍 Key Behavioral Signals Observed by AI:")
        print(f"     • Transfers in 24h       : {features_dict.get('max_txn_in_24h', 0)}")
        print(f"     • Unique Recipients      : {features_dict.get('max_uniq_recv_24h', 0)}")
        print(f"     • Amount Uniformity Score: {features_dict.get('max_uniformity_score', 0):.3f} (0=Random, 1=Identical)")
        
        print(f"\n  📊 AI Risk Prediction Score: {prob*100:.1f}%")
        
        if prob >= threshold:
            print("  🚨 Verdict: 🔴 FREEZE & STR REPORT (High Fraud Confidence)")
        elif prob >= 0.25:
            print("  ⚠️ Verdict: 🟡 MONITOR & OTP WATCHLIST (Suspicious / Borderline)")
        else:
            print("  ✅ Verdict: 🟢 SAFE (Allowed through)")

    # ── SCENARIO 1: The Camouflaged Criminal (Noisy Smurfer) ────────────────
    # A criminal trying to trick AI by sending random amounts (₹1,432, ₹18,990, ₹7,210)
    # and mixing in 3 Swiggy/Amazon shopping txns.
    test_scenario(
        "The Camouflaged Criminal (Noisy Smurfer)",
        "A fraudster sends money to 14 different mules in 24 hours, but deliberately uses completely random amounts (low uniformity) to evade simple threshold rules.",
        {
            "account_id": "NOISY_FRAUD_01",
            "max_txn_in_24h": 17.0,
            "max_uniq_recv_24h": 14.0,
            "max_uniformity_score": 0.15, # Very low uniformity due to random amounts!
            "mean_amount": 18500.0,
            "amount_cv_overall": 0.85,
            "channel_entropy": 1.1,
            "total_txn_count": 25.0
        }
    )

    # ── SCENARIO 2: The Honest Wedding Father / Small Business ──────────────
    # An innocent citizen paying 15 caterers, decorators, and relatives in 1 day.
    test_scenario(
        "The Honest Citizen (Wedding Father paying vendors)",
        "An innocent customer makes 12 transfers in 24 hours to pay wedding decorators, hotels, and relatives. Amounts vary wildly.",
        {
            "account_id": "INNOCENT_DAD_02",
            "max_txn_in_24h": 12.0,
            "max_uniq_recv_24h": 11.0,
            "max_uniformity_score": 0.04, # Near zero uniformity (paying completely different bills)
            "mean_amount": 45000.0,
            "amount_cv_overall": 1.45,
            "channel_entropy": 0.4,
            "total_txn_count": 40.0
        }
    )

    # ── SCENARIO 3: Stealthy Slow Structurer (Low frequency) ────────────────
    # A fraudster moving money slowly (just 5 transfers below reporting limit)
    test_scenario(
        "Stealthy Low-Volume Structurer",
        "Someone making just 5 transfers of ₹88,000 carefully spaced out.",
        {
            "account_id": "STEALTH_03",
            "max_txn_in_24h": 5.0,
            "max_uniq_recv_24h": 5.0,
            "max_uniformity_score": 0.62, # Moderate uniformity
            "mean_amount": 88000.0,
            "amount_cv_overall": 0.12,
            "near_threshold_ratio": 1.0,
            "total_txn_count": 10.0
        }
    )

    print("\n======================================================================")
    print("🏁 CHAOS STRESS TEST COMPLETE.")
    print("======================================================================")

if __name__ == "__main__":
    run_stress_test()
