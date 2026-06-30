import sys
sys.path.insert(0, "apps/api")
from app.routers.fraud import get_alerts_quick
import asyncio

async def main():
    res = await get_alerts_quick(limit=200, branch_code="SBIN0000001", current_user={"role": "Admin"})
    print("Result for SBIN0000001:", res.get("total"), len(res.get("alerts", [])))

asyncio.run(main())
