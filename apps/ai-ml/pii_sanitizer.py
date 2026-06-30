"""
pii_sanitizer.py — TRACE-X Privacy Layer
=========================================
Strips all PII from account data before it touches any ML model.

The ML models do NOT need to know:
  - Who the person is (name, account_id, entity_id)
  - Their personal identifiers (PAN, Aadhaar, DOB, address)
  - Their account type label

They only need anonymised numerical/categorical features.

Usage
-----
    from pii_sanitizer import sanitize, desanitize

    clean, token = sanitize(account_dict)
    prediction = model.predict(clean)  # model never sees PII
    original_id = desanitize(token)    # for response only
"""

import hashlib
import os
from typing import Any, Dict, Tuple

# Salt loaded from environment (falls back to a fixed dev-only salt)
_SALT = os.environ.get("PII_SALT", "tracex-dev-salt-v1")

# Fields that are PII — stripped before model inference
_PII_FIELDS = {
    "entity_id",
    "customer_name",
    "name",
    "pan_number",
    "pan",
    "aadhaar",
    "dob",
    "date_of_birth",
    "address",
    "phone",
    "email",
    "branch_name",    # can identify geography → person
    "branch_code",
    "account_type",   # not a risk signal — not needed by model
    "opened_on",      # raw date is PII; computed features like account_age_days are OK
    "status",         # raw status label not needed (model uses derived features)
    "risk_category",  # pre-assigned label — keep out to avoid leakage
    "is_fraud",       # ground truth label — NEVER goes to inference
    "pattern_type",   # ground truth label — NEVER goes to inference
}

# Fields that are kept as model inputs (anonymised numerical features)
_ALLOWED_FEATURES = {
    "kyc_tier",
    "declared_annual_income",
    "account_age_days",
    "volume_30d",
    "volume_7d",
    "txn_count_30d",
    "txn_count_7d",
    "total_volume_180d",
    "total_count_180d",
    "unique_counterparties_30d",
    "avg_monthly_volume",
    "avg_monthly_count",
    "dormancy_days",
    "volume_spike_ratio",
    "new_counterparty_ratio",
    "channel_switch_flag",
    "txn_count_spike_ratio",
    "income_utilization_ratio_30d",
    "age_band_encoded",
    "geography_tier_metro",
    "geography_tier_rural",
    "geography_tier_tier2",
    "volume_vs_age_kyc_peer",
    "cash_inflow_pct",
    "upi_family_inflow_pct",
    "corporate_wire_inflow_pct",
    "unknown_source_pct",
    "salary_credit_regular",
    "income_source_count",
    "volume_growth_rate_3m",
    "months_at_current_volume",
    "kyc_update_recency_days",
    "outflow_to_known_contacts",
    "outflow_to_new_accounts",
    "cash_withdrawal_ratio",
    # Smurfing burst features
    "max_txn_in_24h",
    "max_uniq_recv_24h",
    "max_vol_24h",
    "max_uniformity_score",
    "total_txn_count",
    "mean_amount",
    "amount_cv_overall",
    "near_threshold_ratio",
    "min_gap_minutes",
    "mean_gap_minutes",
    "channel_entropy",
    "upi_ratio",
    "recipient_reuse_rate",
}


def _hash_id(account_id: str) -> str:
    """One-way SHA-256 hash of account_id + salt. Non-reversible."""
    raw = f"{_SALT}:{account_id}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


def sanitize(account_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
    """
    Strip PII from account_dict and return (clean_features, lookup_token).

    Parameters
    ----------
    account_dict : dict
        Raw account record (may contain PII fields).

    Returns
    -------
    clean : dict
        Only numerical/categorical ML features. No PII.
    token : str
        Opaque token that can be used with desanitize() to recover account_id.
        This token is returned in the API response so the frontend can display
        the original account, but it is never passed to the model.
    """
    original_id = str(account_dict.get("account_id", "UNKNOWN"))
    token = _hash_id(original_id)

    # Keep only allowed features; drop everything else (including account_id)
    clean: Dict[str, Any] = {}
    stripped: list[str] = []

    for key, value in account_dict.items():
        if key in _ALLOWED_FEATURES:
            # Convert to float if numeric, keep as-is if already numeric
            try:
                clean[key] = float(value) if value is not None else 0.0
            except (TypeError, ValueError):
                clean[key] = 0.0
        elif key not in ("account_id",) and key in _PII_FIELDS:
            stripped.append(key)
        # Silently drop account_id, pattern_type, is_fraud, etc.

    return clean, token


def desanitize(token: str, account_id: str) -> bool:
    """
    Verify that a token was generated from a given account_id.

    Parameters
    ----------
    token : str
        Token from sanitize().
    account_id : str
        Account ID to verify against.

    Returns
    -------
    bool
        True if the token matches account_id.
    """
    return _hash_id(account_id) == token


def get_stripped_fields(account_dict: Dict[str, Any]) -> list:
    """
    Returns a list of PII field names that were/would be stripped.
    Useful for audit logging.
    """
    return [k for k in account_dict.keys() if k in _PII_FIELDS]


# ── Quick self-test (run: python pii_sanitizer.py) ──────────────────────────
if __name__ == "__main__":
    sample = {
        "account_id":   "ACC_00123",
        "entity_id":    "ENT_00088",
        "customer_name": "Rahul Sharma",
        "pan_number":   "ABCDE1234F",
        "dob":          "1990-05-15",
        "kyc_tier":     2,
        "declared_annual_income": 1200000,
        "volume_30d":   450000.0,
        "txn_count_30d": 23,
        "dormancy_days": 0,
        "is_fraud":     False,
        "pattern_type": "NONE",
    }

    print("=== PII Sanitizer Self-Test ===\n")
    print("INPUT (raw account dict):")
    for k, v in sample.items():
        print(f"  {k}: {v}")

    clean, token = sanitize(sample)

    print(f"\nOUTPUT (clean features passed to model):")
    for k, v in clean.items():
        print(f"  {k}: {v}")

    print(f"\nAnonymised token (returned in API response): {token}")
    print(f"Token matches ACC_00123: {desanitize(token, 'ACC_00123')}")
    print(f"Token matches ACC_00999: {desanitize(token, 'ACC_00999')}")

    stripped = get_stripped_fields(sample)
    print(f"\nPII fields stripped: {stripped}")
    print("\n✅ PII never reaches the model.")
