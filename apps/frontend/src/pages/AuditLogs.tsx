import React, { useEffect, useState } from 'react';
import { fetchSystemAuditLogs } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
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

      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/25">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {log.action_type}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-gray-200">{log.actor_name || 'System'}</span>
                      <span className="text-xs text-gray-500 truncate w-32">{log.actor_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate" title={log.description}>{log.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {log.ip_address || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(log.status)}>
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
