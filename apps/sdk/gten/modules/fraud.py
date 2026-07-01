import sys
import os

# Add the _internal generated package to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "_internal"))

from gten_internal.api.fraud_api import FraudApi


class FraudModule:
    """
    G-TEN Fraud Intelligence Module — Zero PII.
    
    Provides clean access to fraud detection, scoring, and alert APIs.
    """

    def __init__(self, api_client):
        self._api = FraudApi(api_client)

    def get_alerts(self, limit: int = 200, branch_code: str = None):
        """Fetch pre-generated fraud alerts from the G-TEN platform."""
        return self._api.get_alerts_quick_api_v1_alerts_quick_get(
            limit=limit,
            branch_code=branch_code,
        )

    def get_score(self, account_id: str):
        """Get the fraud risk score for a specific account."""
        return self._api.get_score_api_v1_score_account_id_get(
            account_id=account_id,
        )

    def get_stats(self, branch_code: str = None):
        """Get aggregated fraud statistics."""
        return self._api.get_stats_api_v1_stats_get(
            branch_code=branch_code,
        )
