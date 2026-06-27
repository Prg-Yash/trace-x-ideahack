import sys
from pathlib import Path
import pandas as pd
from scripts.feature_engineering import build_training_features

sys.path.append(str(Path(__file__).resolve().parent))
from fraud_detector import _run_query

from scripts.feature_engineering import build_training_features, DATA_DIR
import pandas as pd

def sync_ml_features_to_neo4j():
    print("Building full ML feature matrix in Pandas...")
    # We call build_training_features to build the data, but it drops account_id. 
    # However, it doesn't shuffle the data. So we can just read the original merged data 
    # and assign the account_ids in the same order.
    X_train, _ = build_training_features()
    df_ent = pd.read_csv(f"{DATA_DIR}/entities.csv")
    df_acc = pd.read_csv(f"{DATA_DIR}/accounts.csv")
    df_stats = pd.read_csv(f"{DATA_DIR}/account_stats.csv")
    X_orig = df_stats.merge(df_acc, on="account_id").merge(df_ent, on="entity_id")
    
    X_train['account_id'] = X_orig['account_id']
    
    # Some columns that were dropped in X_train but needed for sync
    X_train['declared_annual_income'] = X_orig['declared_annual_income']
    X_train['kyc_tier'] = X_orig['kyc_tier']
    
    # Clean up for Neo4j insertion
    X_train = X_train.fillna(0.0)
    rows = X_train.to_dict('records')
    
    print(f"Syncing {len(rows)} accounts to Neo4j...")
    
    query = """
    UNWIND $rows AS row
    MATCH (a:Account {account_id: row.account_id})
    SET a.dormancy_days = toInteger(row.dormancy_days),
        a.volume_7d = toFloat(row.volume_7d),
        a.volume_30d = toFloat(row.volume_30d),
        a.spike_ratio_7d = toFloat(row.spike_ratio_7d),
        a.income_utilization_ratio_30d = toFloat(row.income_utilization_ratio_30d),
        a.declared_annual_income = toFloat(row.declared_annual_income),
        a.txn_count_7d = toInteger(row.txn_count_7d),
        a.txn_count_30d = toInteger(row.txn_count_30d),
        a.avg_monthly_volume = toFloat(row.avg_monthly_volume),
        a.unique_counterparties_30d = toInteger(row.unique_counterparties_30d),
        a.pagerank = toFloat(row.pagerank),
        a.in_degree = toInteger(row.in_degree),
        a.out_degree = toInteger(row.out_degree),
        a.risk_score_7d_ago = toFloat(row.risk_score_7d_ago),
        a.risk_score_delta_7d = toFloat(row.risk_score_delta_7d),
        a.tx_count_week1_post_dormancy = toInteger(row.tx_count_week1_post_dormancy),
        a.tx_count_week2_post_dormancy = toInteger(row.tx_count_week2_post_dormancy),
        a.volume_acceleration = toFloat(row.volume_acceleration),
        a.has_foreign_inflow = toInteger(row.has_foreign_inflow),
        a.inflow_source_type = toInteger(row.inflow_source_type),
        a.kyc_last_updated_days = toInteger(row.kyc_last_updated_days),
        a.immediate_outflow_pct = toFloat(row.immediate_outflow_pct),
        a.account_age_days = toInteger(row.account_age_days),
        a.age_band_encoded = toFloat(row.age_band_encoded),
        a.geography_tier_metro = toFloat(row.geography_tier_metro),
        a.geography_tier_rural = toFloat(row.geography_tier_rural),
        a.geography_tier_tier2 = toFloat(row.geography_tier_tier2),
        a.volume_vs_age_kyc_peer = toFloat(row.volume_vs_age_kyc_peer),
        a.cash_inflow_pct = toFloat(row.cash_inflow_pct),
        a.upi_family_inflow_pct = toFloat(row.upi_family_inflow_pct),
        a.corporate_wire_inflow_pct = toFloat(row.corporate_wire_inflow_pct),
        a.unknown_source_pct = toFloat(row.unknown_source_pct),
        a.salary_credit_regular = toFloat(row.salary_credit_regular),
        a.income_source_count = toFloat(row.income_source_count),
        a.volume_growth_rate_3m = toFloat(row.volume_growth_rate_3m),
        a.months_at_current_volume = toInteger(row.months_at_current_volume),
        a.kyc_update_recency_days = toInteger(row.kyc_update_recency_days),
        a.outflow_to_known_contacts = toFloat(row.outflow_to_known_contacts),
        a.outflow_to_new_accounts = toFloat(row.outflow_to_new_accounts),
        a.cash_withdrawal_ratio = toFloat(row.cash_withdrawal_ratio),
        a.amount = toFloat(row.amount),
        a.tx_count_last_24h = toInteger(row.tx_count_last_24h),
        a.total_volume_24h = toFloat(row.total_volume_24h),
        a.channel_upi_ratio = toFloat(row.channel_upi_ratio),
        a.tx_count_last_7d = toInteger(row.tx_count_last_7d),
        a.tx_count_last_30d = toInteger(row.tx_count_last_30d),
        a.total_volume_7d = toFloat(row.total_volume_7d),
        a.total_volume_30d = toFloat(row.total_volume_30d),
        a.near_threshold_count_30d = toInteger(row.near_threshold_count_30d),
        a.amount_variance_24h = toFloat(row.amount_variance_24h),
        a.amount_clustering_score = toFloat(row.amount_clustering_score),
        a.threshold_avoidance_ratio = toFloat(row.threshold_avoidance_ratio),
        a.time_gap_mean_min = toFloat(row.time_gap_mean_min),
        a.time_gap_stddev = toFloat(row.time_gap_stddev),
        a.is_weekend = toFloat(row.is_weekend),
        a.unique_recipients_24h = toInteger(row.unique_recipients_24h),
        a.orig_balance_after_ratio = toFloat(row.orig_balance_after_ratio)
    """
    
    import asyncio
    async def do_sync():
        await _run_query(query, rows=rows)
    asyncio.run(do_sync())
    print("Neo4j Graph Database successfully updated with all ML Features!")

if __name__ == "__main__":
    sync_ml_features_to_neo4j()
