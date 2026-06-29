import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Zap, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LogMessage {
  id: number;
  time: string;
  type: "info" | "success" | "error" | "system";
  text: string;
}

const VALID_PATTERNS = ["LAYERING", "SMURFING", "ROUND_TRIP", "DORMANT", "KYC_MISMATCH"];

export default function Demo() {
  const [pattern, setPattern] = useState(VALID_PATTERNS[0]);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type: "system",
      text: "TRACE-X Demo Injector Initialized.",
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // WebSocket Connection
  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1/ws";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog("info", "WebSocket connected. Listening for ML Pipeline updates...");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload) return;

          if (payload.event === "STAGE_UPDATE") {
            addLog("info", `[STAGE ${payload.data.stage}] ${payload.data.message}`);
          } else if (payload.event === "NEW_ALERT") {
            addLog("success", `[COMPLETE] Alert ${payload.data.alert_id} generated successfully!`);
            setIsInjecting(false);
          } else if (payload.event === "INJECTION_ERROR") {
            addLog("error", `[ERROR] Pipeline failed: ${payload.data.message}`);
            setIsInjecting(false);
          } else if (payload.event === "DEMO_RESET") {
            addLog("system", "[CLEANUP] All demo data has been purged from databases.");
            setIsCleaning(false);
          }
        } catch (e) {
          console.error("WS Parse Error", e);
        }
      };

      ws.onclose = () => {
        addLog("error", "WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const addLog = (type: LogMessage["type"], text: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        type,
        text,
      },
    ]);
  };

  const handleInject = async () => {
    if (isInjecting) return;
    setIsInjecting(true);
    addLog("system", `>> Requesting ${pattern} injection pipeline...`);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demo/inject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      addLog("info", `Injection started. Demo Tag: ${data.demo_tag}`);
    } catch (err: any) {
      addLog("error", `Fetch failed: ${err.message}`);
      setIsInjecting(false);
      toast.error("Failed to trigger injection endpoint.");
    }
  };

  const handleCleanup = async () => {
    if (isCleaning) return;
    setIsCleaning(true);
    addLog("system", ">> Requesting database purge for demo data...");
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/demo/cleanup`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      // Success will be handled by the DEMO_RESET websocket event
    } catch (err: any) {
      addLog("error", `Cleanup failed: ${err.message}`);
      setIsCleaning(false);
      toast.error("Failed to trigger cleanup endpoint.");
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div
          className="flex items-center justify-between p-6"
          style={{
            backgroundColor: "#ffffff",
            border: "2px solid #130537",
            boxShadow: "6px 6px 0px #130537",
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
              // System Administration
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              Demo Control Center
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Inject live fraud typologies into the ML pipeline and monitor computation stages.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── CONTROLS PANEL ── */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="p-6"
            style={{
              backgroundColor: "var(--card)",
              border: "2px solid var(--border)",
            }}
          >
            <h3 className="font-bold uppercase tracking-wider text-sm mb-4" style={{ color: "var(--foreground)" }}>
              Pipeline Trigger
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(232,232,226,0.6)" }}>
                  Select Pattern
                </label>
                <Select value={pattern} onValueChange={setPattern}>
                  <SelectTrigger
                    className="w-full text-[13px] h-10 rounded-none border-2"
                    style={{ backgroundColor: "#141820", borderColor: "var(--border)", color: "#ffffff" }}
                  >
                    <SelectValue placeholder="Select Pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_PATTERNS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleInject}
                disabled={isInjecting || isCleaning}
                className="w-full rounded-none font-black uppercase tracking-[0.18em] h-12 transition-all hover:brightness-105"
                style={{
                  backgroundColor: "#a3e635",
                  color: "#130537",
                  border: "2px solid #130537",
                  boxShadow: "3px 3px 0px #130537",
                }}
              >
                {isInjecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                {isInjecting ? "Injecting..." : "Inject Pattern"}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="p-6"
            style={{
              backgroundColor: "rgba(239,68,68,0.05)",
              border: "2px solid rgba(239,68,68,0.2)",
            }}
          >
            <h3 className="font-bold uppercase tracking-wider text-sm mb-4 text-red-500">
              Danger Zone
            </h3>
            <p className="text-[12px] mb-4 text-red-400/80">
              Wipes all demo-tagged accounts, transactions, and alerts from both PostgreSQL and Neo4j.
            </p>
            <Button
              onClick={handleCleanup}
              disabled={isInjecting || isCleaning}
              variant="outline"
              className="w-full rounded-none font-bold uppercase tracking-widest h-10 transition-colors"
              style={{
                borderColor: "rgba(239,68,68,0.5)",
                color: "#ef4444",
                backgroundColor: "transparent",
              }}
            >
              {isCleaning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isCleaning ? "Cleaning..." : "Reset Database"}
            </Button>
          </motion.div>
        </div>

        {/* ── LIVE TERMINAL ── */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="h-full min-h-[400px] flex flex-col"
            style={{
              backgroundColor: "#0A0A0A",
              border: "2px solid var(--border)",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Terminal Header */}
            <div className="h-10 flex items-center px-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#141414" }}>
              <div className="flex gap-1.5 mr-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <Terminal className="h-3.5 w-3.5 text-gray-500 mr-2" />
              <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">ML Pipeline Execution Log</span>
            </div>
            
            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] space-y-1.5">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-gray-600 shrink-0 select-none">[{log.time}]</span>
                  <span className={`
                    ${log.type === "info" ? "text-blue-400" : ""}
                    ${log.type === "success" ? "text-[#a3e635]" : ""}
                    ${log.type === "error" ? "text-red-400" : ""}
                    ${log.type === "system" ? "text-gray-400" : ""}
                  `}>
                    {log.type === "success" && <CheckCircle2 className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                    {log.type === "error" && <AlertTriangle className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
