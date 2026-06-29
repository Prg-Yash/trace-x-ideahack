import asyncio
from fraud_detector import _get_account_alerts

async def test():
    existing = await _get_account_alerts('ACC_DEMO_DORMANT_185803')
    print('existing:', existing)
    
asyncio.run(test())
