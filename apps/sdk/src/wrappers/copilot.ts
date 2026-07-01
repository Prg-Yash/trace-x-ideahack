import { sdkFetch } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Send a natural-language message to the G-TEN Copilot AI assistant.
 * The Copilot uses Graph-RAG to answer questions about accounts, alerts, and fraud patterns.
 *
 * @param message The natural language query
 * @returns The AI-generated response text
 */
export async function chat(message: string): Promise<string> {
    const validMessage = validateRequiredString(message, "message");
    const response = await sdkFetch<{ response: string }>(`/sdk/v1/chat`, {
        method: "POST",
        body: JSON.stringify({ message: validMessage }),
    });
    return response.response;
}
