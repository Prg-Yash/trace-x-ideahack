import os
from dotenv import load_dotenv
from graphdatascience import GraphDataScience

load_dotenv('.env')
uri = os.getenv('NEO4J_URI')
user = os.getenv('NEO4J_USER')
password = os.getenv('NEO4J_PASSWORD')

from neo4j import GraphDatabase
driver = GraphDatabase.driver(uri, auth=(user, password))
with driver.session() as session:
    try:
        res = session.run('CALL apoc.help("pagerank") YIELD name RETURN name').data()
        print("APOC PageRank available:", res)
    except Exception as e:
        print("APOC failed:", e)
