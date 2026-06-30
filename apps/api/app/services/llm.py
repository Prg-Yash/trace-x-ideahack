import json
import urllib.request
import urllib.error
from app.core.config import settings

# Free models on OpenRouter (tested working)
OPENROUTER_MODEL = "openai/gpt-oss-20b:free"
OPENROUTER_FALLBACK_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def _call_model(model: str, messages: list, api_key: str) -> tuple[str | None, str | None]:
    """Try calling a specific model. Returns (result, error)."""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.0,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OPENROUTER_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://trace-x.local",
            "X-Title": "TRACE-X AML Intelligence",
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            try:
                return result["choices"][0]["message"]["content"].strip(), None
            except (KeyError, IndexError):
                return None, f"Unexpected response format: {json.dumps(result)}"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return None, f"{e.code} {e.reason}: {body[:200]}"
    except Exception as e:
        return None, str(e)


def call_gemini(prompt: str, system_instruction: str = "") -> str:
    """
    Calls OpenRouter (OpenAI-compatible API) to generate a response.
    Tries primary free model, falls back to secondary model on failure.
    """
    api_key = settings.OPEN_ROUTER_API_KEY
    if not api_key:
        return "Error: OPEN_ROUTER_API_KEY not configured on the backend."

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    # Try primary model
    result, err = _call_model(OPENROUTER_MODEL, messages, api_key)
    if result:
        return result

    # Primary failed — try fallback
    print(f"[LLM] Primary model failed ({err}), trying fallback...")
    result, err = _call_model(OPENROUTER_FALLBACK_MODEL, messages, api_key)
    if result:
        return result

    return f"Error communicating with LLM: {err}"
