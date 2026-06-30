import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Activity, AlertTriangle, Search, ActivitySquare } from "lucide-react";
import { BASE } from "../lib/api";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "2px solid #130537",
  borderRadius: 0,
  boxShadow: "6px 6px 0px #130537",
};

export default function LiveStream() {
  const [isRunning, setIsRunning] = useState(false);
  const [tps, setTps] = useState(0);
  const [targetTps, setTargetTps] = useState(2);
  const [brokerMode, setBrokerMode] = useState<string>("connecting...");
  const [displayedTxns, setDisplayedTxns] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Decouple backend velocity from React DOM
  const txnsBuffer = useRef<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Check if backend is already running when we mount
    const checkStatus = async () => {
      try {
        const res = await fetch(`${BASE}/stream/status`);
        const data = await res.json();
        if (data.is_running) {
          setIsRunning(true);
          connectWs();
        }
      } catch (e) {
        console.error("Failed to check stream status", e);
      }
    };
    checkStatus();

    // 250ms interval flush to DOM (4 FPS)
    const renderInterval = setInterval(() => {
      if (txnsBuffer.current.length > 0) {
        const currentTxns = [...txnsBuffer.current];
        
        setDisplayedTxns((prev) => {
          // Keep last 100 items in UI for scrolling
          const combined = [...currentTxns, ...prev];
          return combined.slice(0, 100);
        });
        
        // Calculate TPS based on buffer size over 250ms window
        // TPS = txns in 250ms * 4
        setTps(txnsBuffer.current.length * 4);
        
        // Clear buffer
        txnsBuffer.current = [];
      } else {
        setTps(0);
      }
    }, 250);

    return () => clearInterval(renderInterval);
  }, []);

  const connectWs = (retryCount = 0) => {
    if (wsRef.current) return;
    const protocol = BASE.startsWith('https') ? 'wss:' : 'ws:';
    const host = BASE.replace(/^https?:\/\//, '').split('/')[0];
    const ws = new WebSocket(`${protocol}//${host}/api/v1/stream/ws`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "broker_status") {
          setBrokerMode(data.mode);
        } else if (data.type === "alert") {
          setAlerts(prev => [data.payload, ...prev].slice(0, 5));
        } else if (data.type === "transaction") {
          txnsBuffer.current.push(data.payload);
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };
    
    ws.onclose = () => {
      setBrokerMode("disconnected (server restarted)");
      wsRef.current = null;
      setIsRunning(false);
      setTps(0);
      
      // Exponential backoff reconnect
      const nextRetry = Math.min(1000 * Math.pow(2, retryCount), 30000);
      setTimeout(() => connectWs(retryCount + 1), nextRetry);
    };
    
    ws.onerror = () => {
      setBrokerMode("connection error");
      wsRef.current = null;
    };
    
    ws.onopen = () => {
      if (retryCount > 0) {
        // If we reconnected, fetch status again
        fetch(`${BASE}/stream/status`)
          .then(res => res.json())
          .then(data => setIsRunning(data.is_running))
          .catch(() => {});
      }
    };
    
    wsRef.current = ws;
  };

  const disconnectWs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const startFirehose = async () => {
    setIsRunning(true);
    connectWs();
    await fetch(`${BASE}/stream/start`, { method: "POST" });
  };

  const stopFirehose = async () => {
    setIsRunning(false);
    await fetch(`${BASE}/stream/stop`, { method: "POST" });
    // Let lingering messages finish then close
    setTimeout(disconnectWs, 1000);
  };

  const injectPattern = async (pattern: string) => {
    await fetch(`${BASE}/stream/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern })
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-[#f8fafc] text-[#130537] p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-[#130537]">
              Live Network Simulator
            </h1>
            <p className="text-slate-600 font-medium mt-2 flex items-center gap-3">
              High-throughput streaming engine with anti-starvation architecture
              <span className={cn(
                "px-2 py-0.5 text-xs font-black border-2 border-[#130537] shadow-[2px_2px_0px_#130537]",
                brokerMode === 'kafka' 
                  ? "bg-[#a3e635] text-[#130537]" 
                  : brokerMode === 'memory' 
                  ? "bg-[#F59E0B] text-[#130537]" 
                  : "bg-slate-200 text-slate-500 shadow-none"
              )}>
                {brokerMode.toUpperCase()} BROKER
              </span>
            </p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex flex-col gap-1 items-end bg-white border-2 border-[#130537] px-4 py-2 shadow-[2px_2px_0px_#130537]">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Speed</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="1" max="300" 
                  value={targetTps}
                  onChange={(e) => {
                    const newTps = parseInt(e.target.value);
                    setTargetTps(newTps);
                    fetch(`${BASE}/stream/config`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tps: newTps })
                    });
                  }}
                  className="w-32 accent-[#130537]"
                />
                <span className="font-mono font-black text-[#130537] w-8 text-right">{targetTps}</span>
              </div>
            </div>

            <button
              onClick={isRunning ? stopFirehose : startFirehose}
              className={cn(
                "flex items-center gap-2 px-6 py-3 font-black uppercase tracking-tight border-2 border-[#130537] transition-all hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#130537]",
                isRunning 
                  ? "bg-[#EF4444] text-white shadow-[4px_4px_0px_#130537]"
                  : "bg-[#a3e635] text-[#130537] shadow-[4px_4px_0px_#130537]"
              )}
            >
              {isRunning ? <><Square className="w-5 h-5 fill-current" /> Stop Firehose</> : <><Play className="w-5 h-5 fill-current" /> Start Firehose</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <Card className="col-span-2 p-6" style={cardStyle}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black flex items-center gap-2 text-2xl uppercase tracking-tighter">
                <ActivitySquare className="w-8 h-8 text-[#06B6D4]" /> Transaction Stream
              </h3>
              <div className="flex items-center gap-3 px-4 py-2 border-2 border-[#130537] bg-white shadow-[4px_4px_0px_#130537]">
                <span className="relative flex h-3 w-3">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isRunning ? "bg-[#10B981]" : "bg-slate-400")}></span>
                  <span className={cn("relative inline-flex rounded-full h-3 w-3", isRunning ? "bg-[#10B981]" : "bg-slate-400")}></span>
                </span>
                <span className="font-mono font-bold text-lg">{tps} TPS</span>
              </div>
            </div>
            
            <div className="h-[450px] overflow-y-auto relative border-2 border-[#130537] bg-[#f8fafc] p-4 font-mono text-sm shadow-[inset_4px_4px_0px_rgba(19,5,55,0.1)]">
              <div className="space-y-3">
                {displayedTxns.map((txn, i) => {
                  const isFraud = txn.is_injected_fraud || txn.pattern === "AI Anomaly";
                  return (
                    <div key={txn.txn_id || i} className={cn(
                      "flex justify-between items-center p-3 border-2 border-[#130537]",
                      isFraud ? "bg-[#EF4444] text-white font-bold shadow-[4px_4px_0px_#130537]" : "bg-white text-[#130537] shadow-[2px_2px_0px_#130537]"
                    )}>
                      <span className={isFraud ? "text-white/90" : "text-slate-500 font-semibold"}>{new Date(txn.timestamp * 1000).toISOString().split('T')[1]}</span>
                      <span className={isFraud ? "font-black" : "font-bold text-[#06B6D4]"}>{txn.sender}</span>
                      <span className={isFraud ? "text-white" : "text-slate-300"}>→</span>
                      <span className={isFraud ? "font-black" : "font-bold text-[#a3e635]"}>{txn.receiver}</span>
                      <span className={cn("w-28 text-right font-bold", isFraud ? "text-white" : "text-[#130537]")}>₹{txn.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="space-y-8">
            <Card className="p-6" style={cardStyle}>
              <h3 className="font-black flex items-center gap-2 mb-6 text-xl uppercase tracking-tighter">
                <Search className="w-6 h-6 text-[#a3e635]" /> Fraud Injector
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={() => injectPattern('layering')}
                  disabled={!isRunning}
                  className="w-full text-left px-5 py-4 border-2 border-[#130537] bg-white hover:bg-[#a3e635] shadow-[4px_4px_0px_#130537] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px] group"
                >
                  <div className="font-black text-[#130537] uppercase tracking-tight text-lg group-hover:text-[#130537]">Inject Layering</div>
                  <div className="text-sm font-medium text-slate-600 mt-1">6-hop rapid sequential transfer</div>
                </button>
                <button 
                  onClick={() => injectPattern('smurfing')}
                  disabled={!isRunning}
                  className="w-full text-left px-5 py-4 border-2 border-[#130537] bg-white hover:bg-[#06B6D4] shadow-[4px_4px_0px_#130537] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px] group"
                >
                  <div className="font-black text-[#130537] uppercase tracking-tight text-lg group-hover:text-white">Inject Smurfing</div>
                  <div className="text-sm font-medium text-slate-600 group-hover:text-cyan-100 mt-1">High-velocity sub-threshold deposits</div>
                </button>
                <button 
                  onClick={() => injectPattern('round_trip')}
                  disabled={!isRunning}
                  className="w-full text-left px-5 py-4 border-2 border-[#130537] bg-white hover:bg-[#F59E0B] shadow-[4px_4px_0px_#130537] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px] group"
                >
                  <div className="font-black text-[#130537] uppercase tracking-tight text-lg group-hover:text-white">Inject Round-Trip</div>
                  <div className="text-sm font-medium text-slate-600 group-hover:text-amber-100 mt-1">Circular A→B→C→A topology</div>
                </button>
              </div>
            </Card>

            <Card className="p-6 min-h-[250px]" style={cardStyle}>
              <h3 className="font-black flex items-center gap-2 mb-6 text-xl uppercase tracking-tighter">
                <AlertTriangle className="w-6 h-6 text-[#EF4444]" /> Stage 2 Alerts
              </h3>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {alerts.length === 0 ? (
                  <div className="text-sm font-bold text-slate-400 text-center py-10 uppercase border-2 border-dashed border-slate-300">
                    No anomalies detected
                  </div>
                ) : (
                  alerts.map((a, i) => (
                    <div key={i} className="p-4 border-2 border-[#130537] bg-[#EF4444] text-white shadow-[4px_4px_0px_#130537]">
                      <div className="font-black uppercase tracking-tight text-base leading-tight">{a.title}</div>
                      <div className="text-xs font-semibold mt-2 text-white/90 leading-relaxed">{a.message}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
