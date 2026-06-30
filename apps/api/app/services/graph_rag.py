import json
from app.db.session import get_db
from app.services.llm import call_gemini

NEO4J_SCHEMA_HINT = """
We have a Neo4j database for an Anti-Money Laundering (AML) system.

Nodes:
- Account (account_id, account_type, risk_category, is_fraud, status)
- Alert (alert_id, pattern_type, severity, status, fraud_probability, created_at)
  - pattern_type values: 'LAYERING', 'SMURFING', 'ROUND_TRIP', 'KYC_MISMATCH', 'DORMANT'
  - severity values: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'

Edges:
- (Account)-[:SENT {amount, channel, txn_ts, txn_id}]->(Account)
- (Account)-[:FLAGGED_IN]->(Alert)

Example Cypher queries:
- All accounts linked to smurfing:
  MATCH (a:Account)-[:FLAGGED_IN]->(al:Alert) WHERE al.pattern_type = 'SMURFING' RETURN DISTINCT a.account_id, a.risk_category, al.severity LIMIT 50
- All accounts linked to layering:
  MATCH (a:Account)-[:FLAGGED_IN]->(al:Alert) WHERE al.pattern_type = 'LAYERING' RETURN DISTINCT a.account_id, a.risk_category, al.severity LIMIT 50
- Accounts with CRITICAL alerts:
  MATCH (a:Account)-[:FLAGGED_IN]->(al:Alert) WHERE al.severity = 'CRITICAL' RETURN DISTINCT a.account_id, al.pattern_type LIMIT 50

You are an expert Neo4j Cypher generator.
Given a user's question, write ONLY the Cypher query to retrieve the answer.
No markdown formatting, no explanations, just the raw Cypher string.
Always use DISTINCT when returning accounts to avoid duplicates.
Always limit results to a reasonable amount (e.g., LIMIT 50) if not specified.
"""

def _format_history(history: list[dict]) -> str:
    """Format conversation history into a readable string for the LLM."""
    if not history:
        return ""
    lines = []
    for turn in history:
        role = "User" if turn.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {turn.get('content', '')}")
    return "\n".join(lines)

def generate_cypher(user_query: str, history: list[dict] | None = None) -> str:
    history_str = _format_history(history or [])
    history_block = f"\nConversation so far:\n{history_str}\n" if history_str else ""
    prompt = (
        f"{history_block}"
        f"Current User Question: {user_query}\n"
        f"Generate the Cypher query to answer the current question (use the conversation above for context):"
    )
    cypher = call_gemini(prompt, system_instruction=NEO4J_SCHEMA_HINT)
    # Clean up possible markdown tags from LLM
    cypher = cypher.replace("```cypher", "").replace("```", "").strip()
    return cypher

def execute_cypher(cypher_query: str):
    driver = get_db()
    with driver.session() as session:
        try:
            result = session.run(cypher_query)
            data = [record.data() for record in result]
            return data
        except Exception as e:
            return {"error": str(e)}

def summarize_results(user_query: str, db_results: list, history: list[dict] | None = None) -> str:
    if not db_results:
        return "I couldn't find any relevant data in the database for your query."
    
    # If the database returns an error
    if isinstance(db_results, dict) and "error" in db_results:
        return f"There was an error querying the database: {db_results['error']}"

    history_str = _format_history(history or [])
    history_block = f"Prior conversation for context:\n{history_str}\n\n" if history_str else ""

    summary_instruction = """
    You are an AI assistant for an AML investigator. 
    You have just queried the database on behalf of the user.
    I will provide the conversation history, the user's latest question, and the raw database results.
    Write a concise, professional summary answering the current question based ONLY on the data provided.
    Use the conversation history only to understand the context of the current question.
    Do not mention the words 'JSON' or 'Cypher'. Just give the insights in clear markdown with bullet points or tables where useful.
    """
    
    prompt = (
        f"{history_block}"
        f"Current User Question: {user_query}\n\n"
        f"Database Results:\n{json.dumps(db_results, default=str)[:4000]}\n\n"
        f"Summarize the findings concisely:"
    )
    
    response = call_gemini(prompt, system_instruction=summary_instruction)
    return response

def process_chat_query(user_query: str, history: list[dict] | None = None) -> str:
    """
    End-to-end Graph-RAG process with conversation context:
    1. Text + History -> Cypher
    2. Cypher -> Neo4j execution
    3. Results + History -> Natural Language Summary
    """
    cypher_query = generate_cypher(user_query, history)
    
    if not cypher_query or "Error" in cypher_query:
        return f"Failed to generate a valid database query. {cypher_query}"

    db_results = execute_cypher(cypher_query)
    
    final_answer = summarize_results(user_query, db_results, history)
    return final_answer
