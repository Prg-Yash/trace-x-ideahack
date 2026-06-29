import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

def test_connection():
    load_dotenv()
    
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    password = os.getenv("NEO4J_PASSWORD")
    
    if not uri or not user or not password:
        print("❌ Missing Neo4j credentials in .env file.")
        return
        
    print(f"Connecting to Neo4j at {uri}...")
    
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        # Verify connectivity
        driver.verify_connectivity()
        print("SUCCESS: Connection established successfully!")
        
        # Run a simple query
        with driver.session() as session:
            result = session.run("RETURN 1 AS number, 'Hello Neo4j' AS greeting")
            record = result.single()
            print(f"SUCCESS: Successfully executed query: {record['greeting']} (number: {record['number']})")
            
    except Exception as e:
        print(f"ERROR: Failed to connect or query: {e}")
    finally:
        if 'driver' in locals():
            driver.close()
            print("Connection closed.")

if __name__ == "__main__":
    test_connection()
