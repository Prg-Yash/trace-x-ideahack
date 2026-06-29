import asyncio
import sys

sys.path.append('../api')
sys.path.append('../ai-ml')

from app.core.database import init_db
from fraud_detector import detect_smurfing, detect_dormant, _fetch_postgres_account_stats

async def main():
    print('postgres:', _fetch_postgres_account_stats('ACC_DEMO_KYC_MISMATCH_369557'))
    print('smurf:', await detect_smurfing('ACC_DEMO_KYC_MISMATCH_369557'))
    print('dorm:', await detect_dormant('ACC_DEMO_KYC_MISMATCH_369557'))

asyncio.run(main())
