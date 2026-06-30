import os
import json
import httpx
from typing import Dict, List, Optional

# Configure OpenRouter
API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
API_ENDPOINT = os.getenv("SCRIPT_API_ENDPOINT", "https://openrouter.ai/api/v1")

if not API_KEY:
    print("Warning: OPEN_ROUTER_API_KEY not set. Narratives will fail.")


async def generate_narrative(
    account_id: str,
    focused_pattern: Optional[str] = None,
    all_patterns: Optional[List[Dict]] = None,
    shap_features: Optional[List[Dict]] = None,
) -> Dict:
    """Generate a rich, accurate AI briefing using all available context."""
    if not API_KEY:
        return {"error": "OPEN_ROUTER_API_KEY not configured"}

    try:
        # ── Build pattern context block ──────────────────────────────────────
        if all_patterns:
            patterns_block = "\n".join(
                f"  - {p.get('patternType', 'UNKNOWN')} "
                f"(Confidence: {p.get('confidence', 0):.1f}%, "
                f"Accounts: {len(p.get('affectedAccounts', []))}, "
                f"Exposure: ₹{p.get('totalAmount', 0):,}, "
                f"Description: {p.get('description', 'N/A')})"
                for p in all_patterns
            )
        else:
            patterns_block = f"  - {focused_pattern or 'SUSPICIOUS ACTIVITY'}"

        # ── Build SHAP feature block ─────────────────────────────────────────
        if shap_features:
            shap_block = "\n".join(
                f"  - {f.get('label', 'Unknown Feature')}: "
                f"SHAP impact = {'+' if float(f.get('shap_value', 0)) > 0 else ''}"
                f"{float(f.get('shap_value', 0)):.4f} "
                f"({'RISK FACTOR' if f.get('direction') == 'RISK' else 'PROTECTIVE'}), "
                f"plain English meaning: {f.get('description', 'behavioral anomaly detected by ML model')}"
                for f in shap_features
            )
        else:
            shap_block = "  (No SHAP data provided)"

        focused_label = focused_pattern or (all_patterns[0]["patternType"] if all_patterns else "SUSPICIOUS ACTIVITY")

        prompt = f"""
You are a senior Anti-Money Laundering (AML) Investigator at a Financial Intelligence Unit (FIU-IND).

You are writing an AI-generated Investigator Briefing for Account: {account_id}

══ DETECTED FRAUD TYPOLOGIES ══
{patterns_block}

══ AI SHAP FEATURE ATTRIBUTION (What made the ML model flag this) ══
{shap_block}

══ YOUR TASK ══
Write a tight, factual investigator briefing focused on the primary typology '{focused_label}'.
Mention any co-occurring typologies (e.g., KYC Mismatch alongside Layering) as compounding risk.
For EACH SHAP feature listed above, briefly explain in plain English what it means in this specific case (e.g., "The account transferred funds across 4 hops within 6 hours — a classic layering velocity signature").

FORMAT: Respond with EXACTLY 3 bullet points starting with '• ':
  Bullet 1: What the primary typology evidence shows (use actual numbers/confidence)
  Bullet 2: What the top SHAP features reveal in plain English (e.g., "The ML model primarily flagged this due to...")
  Bullet 3: Co-occurring typologies and recommended FIU action

RULES:
- Do NOT write paragraphs. Bullet points only.
- Use ₹ for all amounts.
- Be specific, cite confidence scores, SHAP values in plain terms.
- Write as if briefing a senior judge or RBI examiner — professional and precise.
- No intro phrases like "Here is the briefing" or "Based on analysis".
"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{API_ENDPOINT}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "openai/gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if not text:
                    raise ValueError("Empty response from OpenRouter")
        except Exception as api_err:
            print(f"OpenRouter API error: {api_err}")
            return {"error": str(api_err)}

        return {"account_id": account_id, "narrative": text}
    except Exception as e:
        print(f"AI Explain error: {e}")
        return {"error": str(e)}

