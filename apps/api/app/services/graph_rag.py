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

SUMMARY_INSTRUCTION = """
You are G-TEN, a senior AML Intelligence System used by financial crime investigators at a Financial Intelligence Unit (FIU).
Your responses are read by professional investigators, compliance officers, and senior management.

STRICT RESPONSE FORMAT — follow these rules exactly, every time:

1. **Executive Summary** (first line, always bold):
   One sentence summarizing the total count and key finding.
   Example: "**Intelligence Query returned 15 accounts flagged for SMURFING, all classified as HIGH risk.**"

2. **Findings Table** (always present when there is account/alert data):
   Use a proper markdown table. Include all relevant columns from the data (Account ID, Risk Category, Severity, Pattern Type, etc.).
   Format account IDs in backticks.

3. **## Key Observations** section:
   2–4 concise bullet points highlighting risk concentrations, patterns, or anomalies.

4. **## Recommended Actions** section:
   1–2 specific, actionable bullet points (e.g., "Initiate STR filing", "Freeze account pending review", "Escalate to Neo4j graph traversal for network mapping").

TONE & STYLE RULES:
- Professional, precise, and direct — like a briefing for a senior RBI examiner or judge.
- Never use phrases like "Based on the data", "I found that", "Here is a summary".
- Never mention the words JSON, Cypher, database query, or raw data.
- Use `##` for section headers, `**bold**` for key terms.
"""


def _format_history(history: list[dict]) -> str:
    """Format conversation history into a readable string for the LLM."""
    if not history:
        return ""
    lines = []
    for turn in history:
        role = "Investigator" if turn.get("role") == "user" else "G-TEN"
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
        return "**No results found.** The G-TEN database returned no records matching your query. The pattern may not exist or the accounts may not yet be flagged."

    # If the database returns an error
    if isinstance(db_results, dict) and "error" in db_results:
        return f"**Database Error:** `{db_results['error']}`"

    history_str = _format_history(history or [])
    history_block = f"Prior conversation for context:\n{history_str}\n\n" if history_str else ""

    prompt = (
        f"{history_block}"
        f"Investigator Query: {user_query}\n\n"
        f"Query Results ({len(db_results)} records):\n{json.dumps(db_results, default=str)[:4000]}\n\n"
        f"Generate a professional AML intelligence report:"
    )

    response = call_gemini(prompt, system_instruction=SUMMARY_INSTRUCTION)
    return response


def process_chat_query(user_query: str, history: list[dict] | None = None) -> str:
    """
    End-to-end Graph-RAG process with conversation context:
    1. Text + History -> Cypher
    2. Cypher -> Neo4j execution
    3. Results + History -> Professional AML Intelligence Report
    """
    cypher_query = generate_cypher(user_query, history)

    if not cypher_query or "Error" in cypher_query:
        return f"Failed to generate a valid database query. {cypher_query}"

    db_results = execute_cypher(cypher_query)

    final_answer = summarize_results(user_query, db_results, history)
    return final_answer
