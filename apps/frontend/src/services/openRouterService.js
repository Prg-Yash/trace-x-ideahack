/**
 * openRouterService.js
 * Isolated API communication layer for OpenRouter Chat Completion.
 * Uses env vars: VITE_SCRIPT_API_ENDPOINT, VITE_OPEN_ROUTER_API_KEY
 */

const API_ENDPOINT = import.meta.env.VITE_SCRIPT_API_ENDPOINT;
const API_KEY = import.meta.env.VITE_OPEN_ROUTER_API_KEY;

/**
 * @typedef {Object} AICommentary
 * @property {string} summary
 * @property {string} riskLevel
 * @property {number} overallRiskScore
 * @property {string[]} patternsDetected
 * @property {{ timestamp: string; title: string; description: string }[]} commentary
 * @property {string} recommendation
 */

/**
 * Call OpenRouter chat completion endpoint.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<AICommentary>}
 */
export async function fetchAICommentary(systemPrompt, userPrompt) {
  if (!API_ENDPOINT || !API_KEY) {
    throw new Error(
      "Missing environment variables: VITE_SCRIPT_API_ENDPOINT or VITE_OPEN_ROUTER_API_KEY"
    );
  }

  const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "G-TEN AML Investigation Platform",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter API error ${response.status}: ${text || response.statusText}`
    );
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("Empty response from OpenRouter API");
  }

  try {
    const parsed = JSON.parse(raw);
    // Validate required fields
    if (!parsed.summary || !parsed.riskLevel || !Array.isArray(parsed.commentary)) {
      throw new Error("Incomplete AI response structure");
    }
    return parsed;
  } catch (parseErr) {
    throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
  }
}
