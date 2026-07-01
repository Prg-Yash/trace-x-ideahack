import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchSystemAuditLogs } from '../lib/api';
import { Shield, Clock, Info, FileText, Loader2, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  action_type: string;
  target_id: string;
  status: string;
  description: string;
  ip_address: string;
  user_agent: string;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("ALL");

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const response = await fetchSystemAuditLogs(100, 0);
        if (mounted) {
          setLogs(response.audit_logs);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Poll every 3 seconds
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'border-2 border-green-500 bg-transparent text-green-600';
      case 'FAILED':
      case 'DENIED': return 'border-2 border-destructive bg-transparent text-destructive';
      default: return 'border-2 border-muted-foreground bg-transparent text-muted-foreground';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    switch (searchCategory) {
      case 'ACTION': return (log.action_type || '').toLowerCase().includes(q);
      case 'ACTOR': return (log.actor_name || '').toLowerCase().includes(q) || (log.actor_id || '').toLowerCase().includes(q);
      case 'IP_ADDRESS': return (log.ip_address || '').toLowerCase().includes(q);
      case 'STATUS': return (log.status || '').toLowerCase().includes(q);
      default:
        return (log.action_type || '').toLowerCase().includes(q) || 
               (log.actor_name || '').toLowerCase().includes(q) ||
               (log.actor_id || '').toLowerCase().includes(q) ||
               (log.ip_address || '').toLowerCase().includes(q) ||
               (log.status || '').toLowerCase().includes(q);
    }
  });

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 pb-20 bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* ── HEADER ── */}
        <motion.header 
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between" 
          style={cardStyle}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
                // System Security
              </p>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Audit Logs
              </h1>
              <p className="mt-1 max-w-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                Immutable record of system security and access events
              </p>
            </div>
          </div>
        </motion.header>

        {/* ── TABLE ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={cardStyle}
          className="overflow-hidden"
        >
          <div className="p-4 border-b-2 border-border bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground hidden md:block">
                // Event Log
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="w-[130px] border-2 border-border bg-card rounded-none h-10 text-xs font-bold uppercase tracking-wider focus:ring-0">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-border rounded-none bg-card">
                    <SelectItem value="ALL" className="text-xs font-bold uppercase">All Fields</SelectItem>
                    <SelectItem value="ACTION" className="text-xs font-bold uppercase">Action</SelectItem>
                    <SelectItem value="ACTOR" className="text-xs font-bold uppercase">Actor</SelectItem>
                    <SelectItem value="IP_ADDRESS" className="text-xs font-bold uppercase">IP Address</SelectItem>
                    <SelectItem value="STATUS" className="text-xs font-bold uppercase">Status</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search logs..." 
                    className="pl-9 h-10 w-full sm:w-[200px] lg:w-[300px] border-2 border-border bg-card rounded-none focus-visible:ring-0 focus-visible:border-primary text-xs font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="px-3 py-1 bg-transparent border-2 border-primary flex-shrink-0">
              <p className="text-[10px] font-black text-foreground uppercase tracking-wider">
                Total Records: {filteredLogs.length}
              </p>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[calc(100vh-280px)] min-h-[400px]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="border-b-2 border-border bg-card">
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground">Timestamp</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground">Action</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground">Actor</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground">Details</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground">IP Address</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                         <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                         <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Loading Logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center border-b border-border bg-muted/5">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-3 opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest font-bold">No audit logs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b-2 border-border/50 bg-background transition-colors hover:bg-primary/5">
                      <td className="p-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-mono font-bold text-foreground/80">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="text-sm font-black text-foreground tracking-wider uppercase">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{log.actor_name || 'System'}</span>
                          <span className="text-[10px] font-mono font-bold text-foreground/70 truncate w-32 mt-0.5">{log.actor_id}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle max-w-xs">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground/80 truncate" title={log.description}>
                            {log.description}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {log.ip_address || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className={`inline-flex px-2 py-0.5 ${getStatusClasses(log.status)}`}>
                          <span className="text-[9px] font-black uppercase tracking-widest">{log.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
