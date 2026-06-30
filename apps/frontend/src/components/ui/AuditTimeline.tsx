import React from 'react';
import { AuditEntry } from '../../lib/auditLog';
import { Clock } from 'lucide-react';

export const AuditTimeline = ({ logs }: { logs: AuditEntry[] }) => {
  if (!logs.length) return <div className="text-sm text-slate-500 italic">No activity recorded.</div>;

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
      {logs.map((log, i) => (
        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-700 bg-slate-900 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
            <Clock size={10} />
          </div>
          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-slate-800/50 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">{log.actor}</span>
              <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div className="text-sm text-slate-400">{log.action}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
