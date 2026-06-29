import { createContext, useContext, useState, type ReactNode } from "react";
import type { InvestigationAlert } from "@/data/investigationData";

type InvestigationContextValue = {
  investigation: InvestigationAlert | null;
  setInvestigation: (alert: InvestigationAlert | null) => void;
  clearInvestigation: () => void;
};

const InvestigationContext = createContext<InvestigationContextValue | null>(null);

export function InvestigationProvider({ children }: { children: ReactNode }) {
  const [investigation, setInvestigation] = useState<InvestigationAlert | null>(null);

  const clearInvestigation = () => setInvestigation(null);

  return (
    <InvestigationContext.Provider value={{ investigation, setInvestigation, clearInvestigation }}>
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx) {
    throw new Error("useInvestigation must be used within InvestigationProvider");
  }
  return ctx;
}
