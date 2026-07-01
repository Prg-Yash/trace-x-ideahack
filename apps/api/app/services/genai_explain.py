"""
genai_explain.py — Narrative Explainability Service

Model: gemma-4-31b-it (Google Gemma 4 31B Instruction-Tuned)
  - Google's open-weight instruction-tuned model via Gemini API
  - Excellent for structured narrative generation and professional writing
  - Runs via the same GEMINI_API_KEY — no OpenRouter dependency
"""

import json
from typing import Dict, List, Optional
from app.core.config import settings

NARRATIVE_MODEL = "gemma-4-31b-it"


async def generate_narrative(
    account_id: str,
    focused_pattern: Optional[str] = None,
    all_patterns: Optional[List[Dict]] = None,
    shap_features: Optional[List[Dict]] = None,
) -> Dict:
    """Generate a rich, accurate AI briefing using all available context."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured"}

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
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=NARRATIVE_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=512,
                ),
            )
            text = response.text.strip()
            if not text:
                raise ValueError("Empty response from Gemini")

        except Exception as api_err:
            print(f"Gemini Narrative API error: {api_err}")
            return {"error": str(api_err)}

        return {"account_id": account_id, "narrative": text}

    except Exception as e:
        print(f"AI Explain error: {e}")
        return {"error": str(e)}
