import React, { useEffect, useState } from "react";
import { ServerCrash, Activity, CheckCircle2, XCircle } from "lucide-react";
import { fetchHealth, simulateCrash } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function DRDrill() {
  const { toast } = useToast();
  const [activeDC, setActiveDC] = useState<string | null>(null);
  const [crashing, setCrashing] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchHealth();
        if (res.data_center) {
          setActiveDC(res.data_center);
          setErrorCount(0); // reset on success
        }
      } catch (err) {
        console.error("Health check failed:", err);
        setErrorCount((prev) => prev + 1);
        if (errorCount > 3) {
          setActiveDC(null);
        }
      }
    }, 1000); // Polling every 1 second

    return () => clearInterval(interval);
  }, [errorCount]);

  const handleSimulateCrash = async () => {
    if (activeDC !== "ap-south-1a") {
      toast({
        title: "Simulation Unvailable",
        description: "The primary Mumbai node is not the currently active node.",
        variant: "destructive"
      });
      return;
    }
    
    setCrashing(true);
    toast({
      title: "Initiating Crash",
      description: "Sending SIGTERM to the Primary Container (Mumbai)...",
    });

    try {
      await simulateCrash();
    } catch (err) {
      // The network connection might break abruptly which will throw an error, which is expected.
      console.log("Crash requested, expecting network drop:", err);
    }

    setTimeout(() => {
      setCrashing(false);
      toast({
        title: "Simulated Crash Executed",
        description: "Wait a moment for Nginx load balancer to automatically route to the Standby Node.",
      });
    }, 1000);
  };

  const isMumbaiActive = activeDC === "ap-south-1a";
  const isHyderabadActive = activeDC === "ap-south-1b";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <ServerCrash className="h-8 w-8 text-primary" />
          Disaster Recovery (DR) Drill
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor the live multi-region container setup. Simulate a catastrophic failure in the primary data center and observe the Nginx load balancer automatically failover to the standby data center.
        </p>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mumbai Container (Primary) */}
        <div className={`relative flex flex-col rounded-xl border p-6 overflow-hidden transition-all duration-300 ${isMumbaiActive ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(163,230,53,0.15)]' : 'border-border bg-card/30'}`}>
          {isMumbaiActive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
          )}
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Mumbai (ap-south-1a)</h2>
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mt-1">Primary Node</p>
            </div>
            {isMumbaiActive ? (
              <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-bold">
                <Activity className="h-4 w-4 animate-pulse" />
                ACTIVE
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-destructive/20 text-destructive px-3 py-1.5 rounded-full text-sm font-bold">
                <XCircle className="h-4 w-4" />
                DOWN / STANDBY
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-bold ${isMumbaiActive ? 'text-primary' : 'text-destructive'}`}>
                  {isMumbaiActive ? "Routing Traffic" : "Offline"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Container Image</span>
                <span className="font-mono text-xs">python:3.11-slim</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button 
              variant="destructive" 
              className="w-full font-bold uppercase tracking-wider"
              onClick={handleSimulateCrash}
              disabled={!isMumbaiActive || crashing}
            >
              <ServerCrash className="mr-2 h-4 w-4" />
              {crashing ? "Crashing Container..." : "Simulate Primary Failure"}
            </Button>
          </div>
        </div>

        {/* Hyderabad Container (Standby) */}
        <div className={`relative flex flex-col rounded-xl border p-6 overflow-hidden transition-all duration-300 ${isHyderabadActive ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(163,230,53,0.15)]' : 'border-border bg-card/30'}`}>
          {isHyderabadActive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
          )}
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Hyderabad (ap-south-1b)</h2>
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mt-1">Disaster Recovery (Backup)</p>
            </div>
            {isHyderabadActive ? (
              <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-bold">
                <Activity className="h-4 w-4 animate-pulse" />
                ACTIVE
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" />
                STANDBY
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-bold ${isHyderabadActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isHyderabadActive ? "Routing Traffic" : "Waiting for Failover"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Container Image</span>
                <span className="font-mono text-xs">python:3.11-slim</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground flex gap-3 items-start border border-border">
              <Activity className="h-5 w-5 mt-0.5 text-primary" />
              <p>
                In a real-world scenario, this container remains dormant (backup state) until Nginx upstream detects `max_fails=1` on the primary node. Once the primary node is unreachable, traffic seamlessly shifts here.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="p-4 bg-muted/30 border border-border rounded-xl">
         <h3 className="text-lg font-bold mb-2">How it works</h3>
         <ol className="list-decimal pl-5 space-y-2 text-muted-foreground text-sm">
           <li>Nginx Load Balancer is configured with <code>server api-mumbai:8000 max_fails=1</code> and <code>server api-hyderabad:8000 backup</code>.</li>
           <li>By default, 100% of the traffic flows to the Mumbai container.</li>
           <li>Clicking the "Simulate Failure" button sends a <code>SIGTERM</code> signal directly to the Mumbai API container, stopping the web server immediately.</li>
           <li>The next 1-second interval UI polling request hits the Nginx load balancer. Nginx detects the Mumbai failure and instantaneously falls back to Hyderabad.</li>
           <li>The UI receives the new <code>DATA_CENTER</code> context from the healthy standby container, updating the dashboard instantly.</li>
         </ol>
      </div>
    </div>
  );
}
