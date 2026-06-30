import sys
import os

# Ensure Python can find our local _internal and gten folders
sys.path.insert(0, os.path.abspath("./_internal"))
sys.path.insert(0, os.path.abspath("."))

from gten.client import GTenClient

def main():
    print("1. Initializing G-TEN SDK...")
    client = GTenClient("http://localhost:8000")

    print("2. Attempting to log in...")
    try:
        user = client.login(username="admin", password="password")
        # The user object is a dict inside the Token response
        print(f"--> Success! Logged in as: {user}")
        
        print("\n3. Fetching Fraud Alerts...")
        alerts = client.fraud.get_alerts()
        print(f"--> Success! Fetched {len(alerts)} fraud alerts using the SDK!")
        
    except Exception as e:
        print(f"Error during SDK test: {e}")

if __name__ == "__main__":
    main()
