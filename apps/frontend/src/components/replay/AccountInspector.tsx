import { User, Building2, Landmark, Clock } from "lucide-react";
import type { AccountSnapshot, ReplayDataset } from "@/data/replayData";
import { getAccountById } from "@/data/replayData";
import { AnimatedValue } from "./AnimatedValue";
import { REPLAY_THEME, cardStyle } from "./replayTheme";

type AccountInspectorProps = {
  dataset: ReplayDataset;
  snapshot: AccountSnapshot | null;
  selectedNodeId: string | null;
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: REPLAY_THEME.textDim }}>
        // {label}
      </p>
      <p className="text-[12px] font-semibold leading-snug" style={{ color: REPLAY_THEME.text }}>
        {value}
      </p>
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes("corp") || t.includes("investment") || t.includes("shell"))
    return <Building2 className="h-3 w-3" style={{ color: REPLAY_THEME.textDim }} />;
  if (t.includes("branch")) return <Landmark className="h-3 w-3" style={{ color: REPLAY_THEME.textDim }} />;
  if (t.includes("individual")) return <User className="h-3 w-3" style={{ color: REPLAY_THEME.textDim }} />;
  return <Clock className="h-3 w-3" style={{ color: REPLAY_THEME.textDim }} />;
}

export function AccountInspector({ dataset, snapshot, selectedNodeId }: AccountInspectorProps) {
  const account = snapshot?.account ?? (selectedNodeId ? getAccountById(dataset, selectedNodeId) : null);

  if (!account) {
    return (
      <div className="p-4 h-full flex items-center justify-center" style={cardStyle}>
        <p className="text-[12px] italic text-center" style={{ color: REPLAY_THEME.textMuted }}>
          Click any node on the graph to inspect account details
        </p>
      </div>
    );
  }

  const snap = snapshot ?? {
    account,
    balance: account.initialBalance,
    incoming: 0,
    outgoing: 0,
    connectedAccounts: [],
    transactionCount: 0,
    riskScore: account.baseRiskScore,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={cardStyle}>
      <div
        className="px-3 py-2 flex items-center gap-2 shrink-0"
        style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
      >
        <TypeIcon type={account.customerType} />
        <p className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: REPLAY_THEME.textDim }}>
          // Account Inspector
        </p>
        <span className="text-[10px] font-semibold truncate ml-auto" style={{ color: REPLAY_THEME.text }}>
          {account.customerName}
        </span>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 py-2">
        <div className="flex gap-4 min-w-max">
          <Field label="Account" value={account.accountNumber} />
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: REPLAY_THEME.textDim }}>
              // Balance
            </p>
            <AnimatedValue
              value={snap.balance}
              className="text-[13px] font-black font-mono tabular-nums"
              style={{ color: REPLAY_THEME.text }}
            />
          </div>
          <Field label="In" value={<AnimatedValue value={snap.incoming} className="font-mono tabular-nums text-[11px]" />} />
          <Field label="Out" value={<AnimatedValue value={snap.outgoing} className="font-mono tabular-nums text-[11px]" />} />
          <Field label="Txns" value={snap.transactionCount} />
          <Field label="Risk" value={`${snap.riskScore}/100`} />
          <Field label="Branch" value={account.branch} />
        </div>
      </div>
    </div>
  );
}
