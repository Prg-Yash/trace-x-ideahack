import { ChatApi } from "../generated/src/apis/ChatApi";
import { HistoryTurn } from "../generated/src/models/HistoryTurn";
import { getAuthenticatedConfig } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Send a message to the G-TEN AI Investigator Copilot.
 *
 * @param message The user query or message to the copilot
 * @param history The conversational history for context
 */
export async function chat(message: string, history: HistoryTurn[] = []): Promise<any> {
    const validMessage = validateRequiredString(message, "message");
    const config = getAuthenticatedConfig();
    const api = new ChatApi(config);
    return await api.handleChatApiV1ChatPost({
        chatRequest: {
            message: validMessage,
            history,
        },
    });
}
