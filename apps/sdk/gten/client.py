import sys
import os

# Add the _internal generated package to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_internal"))

from gten_internal.api.auth_api import AuthApi
from gten_internal.api_client import ApiClient
from gten_internal.configuration import Configuration
from .modules.fraud import FraudModule


class GTenClient:
    """
    G-TEN SDK Client — Zero PII.
    
    This client wraps the G-TEN Fraud Intelligence API.
    No credentials or PII are stored, cached, or logged.
    The JWT token is held only in-memory for the session lifetime.
    """

    def __init__(self, base_url: str = "http://localhost:8000"):
        self._config = Configuration(host=base_url)
        self._api_client = ApiClient(self._config)

        # Sub-modules
        self.fraud = FraudModule(self._api_client)

    def login(self, username: str, password: str) -> dict:
        """
        Authenticates against the G-TEN API and stores the JWT token
        in-memory for all subsequent requests.
        
        Returns the user profile dict (no PII is persisted to disk).
        """
        auth_api = AuthApi(self._api_client)

        response = auth_api.login_for_access_token_api_v1_auth_login_post(
            username=username,
            password=password,
        )

        # Store the bearer token in-memory for authenticated requests
        self._config.access_token = response.access_token
        return response.user
