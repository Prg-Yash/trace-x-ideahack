"""
llm.py — Gemini AI client for Graph-RAG pipeline

Model: gemini-2.5-flash-lite
  - Google's most cost-efficient Gemini 2.5 model (paid tier)
  - Excellent for structured tasks: Cypher generation + text summarization
  - Low latency, reliable for production inference
  - Chosen to maximize credit lifespan (3+ days of regular usage)
  - Much cheaper than gemini-2.5-flash or any Pro model

SDK: google-genai (official Google Gen AI SDK)
"""

from app.core.config import settings

GEMINI_MODEL = "gemini-3.1-flash-lite"


def call_gemini(prompt: str, system_instruction: str = "") -> str:
    """
    Calls Google Gemini API (gemini-2.5-flash-lite) to generate a response.
    Retries up to 3 times with exponential backoff on rate limit (429) errors.
    """
    import time

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return "Error: GEMINI_API_KEY not configured on the backend."

    try:
        from google import genai
        from google.genai import types
        from google.genai.errors import ClientError

        client = genai.Client(api_key=api_key)

        config = types.GenerateContentConfig(
            temperature=0.0,
            max_output_tokens=2048,
            system_instruction=system_instruction if system_instruction else None,
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=config,
                )
                return response.text.strip()

            except ClientError as ce:
                if ce.status_code == 429 and attempt < max_retries - 1:
                    wait = 2 ** attempt  # 1s, 2s, 4s
                    print(f"[LLM] Rate limited (429), retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait)
                    continue
                # Non-429 or final attempt — surface the error
                raise

    except Exception as e:
        error_msg = str(e)
        print(f"[LLM] Gemini error: {error_msg}")
        return f"Error communicating with Gemini: {error_msg[:200]}"

