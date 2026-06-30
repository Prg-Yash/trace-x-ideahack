import { useState, useEffect, useRef, useCallback } from "react";
import { buildAMLPrompt } from "@/utils/buildAMLPrompt";
import { fetchAICommentary } from "@/services/openRouterService";

/**
 * @typedef {import('../services/openRouterService').AICommentary} AICommentary
 * @typedef {import('../data/replayData').ReplayTransaction} ReplayTransaction
 * @typedef {import('../data/replayData').ReplayAccount} ReplayAccount
 * @typedef {import('../lib/replayFromTrace').LiveAlertMeta} LiveAlertMeta
 */

/** Session-level cache to avoid duplicate API calls across re-renders */
const commentaryCache = new Map();

/**
 * Hook that fetches, caches, and manages AI investigation commentary.
 *
 * @param {string} alertId
 * @param {ReplayTransaction[]} transactions
 * @param {ReplayAccount[]} accounts
 * @param {LiveAlertMeta | null} alertMeta
 * @returns {{ commentary: AICommentary | null; loading: boolean; error: string | null; regenerate: () => void }}
 */
export function useAICommentary(alertId, transactions, accounts, alertMeta) {
  const [commentary, setCommentary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  // Track if we already triggered for this alertId to avoid double-fire in StrictMode
  const triggeredRef = useRef(null);

  const generate = useCallback(
    async (ignoreCache = false) => {
      if (!alertId || !alertMeta || !transactions.length || !accounts.length) return;

      // Serve from cache unless explicitly regenerating
      if (!ignoreCache && commentaryCache.has(alertId)) {
        setCommentary(commentaryCache.get(alertId));
        setError(null);
        return;
      }

      // Cancel any in-flight request
      if (abortRef.current) abortRef.current = false;
      const thisRequest = {};
      abortRef.current = thisRequest;

      setLoading(true);
      setError(null);

      try {
        const { systemPrompt, userPrompt } = buildAMLPrompt(
          transactions,
          accounts,
          alertMeta
        );
        const result = await fetchAICommentary(systemPrompt, userPrompt);

        // Only apply result if this is still the active request
        if (abortRef.current === thisRequest) {
          commentaryCache.set(alertId, result);
          setCommentary(result);
        }
      } catch (err) {
        if (abortRef.current === thisRequest) {
          setError(err.message || "Unknown error occurred");
        }
      } finally {
        if (abortRef.current === thisRequest) {
          setLoading(false);
        }
      }
    },
    [alertId, alertMeta, transactions, accounts]
  );

  // Auto-generate once per alertId
  useEffect(() => {
    if (!alertId || triggeredRef.current === alertId) return;
    triggeredRef.current = alertId;
    generate(false);

    return () => {
      // Mark the old request as stale on cleanup
      abortRef.current = null;
    };
  }, [alertId, generate]);

  const regenerate = useCallback(() => {
    commentaryCache.delete(alertId);
    generate(true);
  }, [alertId, generate]);

  return { commentary, loading, error, regenerate };
}
