/**
 * buildAMLPrompt.js
 * Constructs the structured AML investigator prompt for OpenRouter.
 */

/**
 * @param {import('../data/replayData').ReplayTransaction[]} transactions
 * @param {import('../data/replayData').ReplayAccount[]} accounts
 * @param {import('../lib/replayFromTrace').LiveAlertMeta} alertMeta
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildAMLPrompt(transactions, accounts, alertMeta) {
  const txnSummary = transactions.map((t, i) => ({
    hop: i + 1,
    from: t.from,
    to: t.to,
    amount_inr: t.amount,
    channel: t.channel,
    timestamp: t.timestamp,
    pattern_hint: t.patternDetected,
    risk_increment: t.riskIncrement,
    transaction_type: t.transactionType,
  }));

  const accountSummary = accounts.map((a) => ({
    id: a.id,
    label: a.label,
    name: a.customerName,
    branch: a.branch,
    type: a.customerType,
    base_risk_score: a.baseRiskScore,
    dormancy_days: a.dormancyDays,
  }));

  const systemPrompt = `You are a senior Anti-Money Laundering (AML) investigator working for a financial intelligence unit (FIU). 
Analyze the supplied transaction graph and produce a professional, forensic-grade investigation report.

You MUST reason about the transaction graph as a whole — not simply describe individual transactions. 
Identify money laundering strategies, fund flow anomalies, and suspicious behavioral patterns.

You MUST respond ONLY with a valid JSON object. Do NOT include markdown, code blocks, explanations, or any text outside the JSON.

Required JSON structure:
{
  "summary": "string — 2-4 sentence narrative explaining the overall laundering strategy and fund flow",
  "riskLevel": "string — one of: LOW, MEDIUM, HIGH, CRITICAL",
  "overallRiskScore": "number — 0 to 100",
  "patternsDetected": ["array of strings — e.g. Layering, Fan-Out, Round Tripping, Structuring"],
  "commentary": [
    {
      "timestamp": "string — ISO 8601 or time string",
      "title": "string — short investigative finding title",
      "description": "string — professional 1-2 sentence explanation of what occurred at this point"
    }
  ],
  "recommendation": "string — 1-2 sentence recommended investigative action"
}`;

  const userPrompt = `ALERT ID: ${alertMeta.alertId}
ACCOUNT UNDER INVESTIGATION: ${alertMeta.accountName} (${alertMeta.accountNumber})
FLAGGED PATTERN: ${alertMeta.pattern}
ALERT SEVERITY: ${alertMeta.severity}
TOTAL SUSPICIOUS AMOUNT: ₹${alertMeta.amount?.toLocaleString("en-IN") ?? "Unknown"}

TRANSACTION GRAPH (${transactions.length} hops):
${JSON.stringify(txnSummary, null, 2)}

ACCOUNTS IN GRAPH (${accounts.length} nodes):
${JSON.stringify(accountSummary, null, 2)}

Analyze this transaction graph for the following indicators:
- Origin and destination of funds
- Layering (multiple hop fund movement)
- Fan-Out (one-to-many disbursement)
- Fan-In (many-to-one convergence)
- Round Tripping (funds returning to origin)
- Structuring (amounts split to avoid reporting thresholds)
- Dormant account activation
- Rapid fund movement (velocity anomalies)
- Cross-branch movement
- Unusual transaction timing
- High-value transfers
- Behavioral anomalies
- Overall laundering strategy

Produce the full investigation report as a single valid JSON object.`;

  return { systemPrompt, userPrompt };
}
