import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.services.graph_rag import process_chat_query

print("Testing: find all accounts linked to smurfing")
result = process_chat_query("find all accounts linked to smurfing")
print(result[:300])
print()
print("Testing: find all accounts linked to layering")
result2 = process_chat_query("find all accounts linked to layering")
print(result2[:300])
