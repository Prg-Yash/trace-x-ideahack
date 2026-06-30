import asyncio
from app.core.config import settings
from neo4j import AsyncGraphDatabase

async def main():
    driver = AsyncGraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))
    async with driver.session() as session:
        res = await session.run('MATCH (a:Account) RETURN a LIMIT 1')
        rec = await res.single()
        print(rec['a'])
    await driver.close()

if __name__ == "__main__":
    asyncio.run(main())
