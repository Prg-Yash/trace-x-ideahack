import React, { useEffect, useState } from 'react';
import { fetchSystemAuditLogs } from '../lib/api';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Shield, Clock, User, Info, FileText } from 'lucide-react';

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

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const response = await fetchSystemAuditLogs(1000, 0);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'DENIED': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading audit logs...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            System Audit Logs
          </h1>
          <p className="text-gray-400 mt-1">Immutable record of system security and access events.</p>
        </div>
      </div>

      <Card className="p-0 bg-slate-900 border-slate-800 overflow-hidden shadow-xl ring-1 ring-white/5">
        <div className="overflow-auto max-h-[calc(100vh-13rem)] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left text-sm text-gray-300 relative">
            <thead className="text-xs text-gray-400 uppercase bg-slate-800/90 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-slate-700">
              <tr>
                <th className="px-5 py-4 font-semibold tracking-wider">Timestamp</th>
                <th className="px-5 py-4 font-semibold tracking-wider">Action</th>
                <th className="px-5 py-4 font-semibold tracking-wider">Actor</th>
                <th className="px-5 py-4 font-semibold tracking-wider">Details</th>
                <th className="px-5 py-4 font-semibold tracking-wider">IP Address</th>
                <th className="px-5 py-4 font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-200">
                    <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300">
                      {log.action_type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-medium">{log.actor_name || 'System'}</span>
                      <span className="text-[10px] text-slate-500 font-mono truncate w-32">{log.actor_id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 max-w-sm">
                    <div className="flex items-center gap-2 text-slate-400 group">
                      <Info className="w-4 h-4 text-slate-500 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                      <span className="truncate" title={log.description}>{log.description}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                    {log.ip_address || 'N/A'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={`${getStatusColor(log.status)} px-2 py-0.5 rounded-sm shadow-sm`}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
