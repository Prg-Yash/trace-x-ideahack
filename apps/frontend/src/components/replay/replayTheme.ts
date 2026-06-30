export const REPLAY_THEME = {
  bg: "#e8e8e2",
  surface: "#ffffff",
  surfaceAlt: "#f5f5f0",
  border: "#130537",
  borderMuted: "rgba(19, 5, 55, 0.25)",
  text: "#130537",
  textMuted: "rgba(19, 5, 55, 0.55)",
  textDim: "rgba(19, 5, 55, 0.35)",
  accent: "#a3e635",
  cyan: "#06B6D4",
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#10B981",
} as const;

export const cardStyle: React.CSSProperties = {
  backgroundColor: REPLAY_THEME.surface,
  border: `2px solid ${REPLAY_THEME.border}`,
  borderRadius: 0,
  boxShadow: `4px 4px 0px ${REPLAY_THEME.border}`,
};

export const glassStyle: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(12px)",
  border: `1px solid ${REPLAY_THEME.borderMuted}`,
  borderRadius: 0,
};

export const sectionLabelClass =
  "text-[9px] font-bold uppercase tracking-[0.22em]";
