import pandas as pd
import numpy as np
from scipy.stats import ks_2samp
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "apps" / "ai-ml" / "data"

def test_feature_drift_volume_30d():
    """
    Simulates a Continuous Data Drift check using the Kolmogorov-Smirnov test.
    In a production system, this would run as an asynchronous cron job comparing
    the baseline training distribution to a rolling 7-day live distribution.
    """
    # 1. Load baseline data
    df_stats = pd.read_csv(DATA_DIR / "account_stats.csv")
    assert "volume_30d" in df_stats.columns, "volume_30d feature missing in baseline"
    
    baseline_volume = df_stats["volume_30d"].dropna().values
    
    # 2. Simulate a "live" incoming stream that has drifted due to inflation
    # We inject a 50% increase in volume to force the drift detection to trigger
    np.random.seed(42)
    live_volume_drifted = baseline_volume * np.random.uniform(1.2, 1.8, size=len(baseline_volume))
    
    # 3. Perform Kolmogorov-Smirnov Test (Two-Sample)
    # Null hypothesis: The two samples are drawn from the same continuous distribution.
    statistic, p_value = ks_2samp(baseline_volume, live_volume_drifted)
    
    print(f"\n[DRIFT ALERT] KS Statistic: {statistic:.4f}, p-value: {p_value:.4e}")
    
    # We assert that the p-value is extremely small, meaning the null hypothesis is rejected (Drift Detected)
    alpha = 0.05
    assert p_value < alpha, f"Expected drift to be detected, but p-value was {p_value} >= {alpha}"
    
    # 4. Simulate a "live" incoming stream that has NOT drifted
    live_volume_stable = baseline_volume * np.random.uniform(0.95, 1.05, size=len(baseline_volume))
    stat_stable, p_stable = ks_2samp(baseline_volume, live_volume_stable)
    
    print(f"[DRIFT SAFE] KS Statistic: {stat_stable:.4f}, p-value: {p_stable:.4e}")
    # We assert that p-value is large, meaning no drift is detected
    assert p_stable >= alpha, f"Expected stable distribution, but p-value was {p_stable} < {alpha}"
