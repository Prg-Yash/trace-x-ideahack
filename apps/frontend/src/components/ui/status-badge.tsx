import React from 'react';
import { Badge } from '@/components/ui/badge';

export const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "NEW":
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>;
    case "UNDER_INVESTIGATION":
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Under Investigation</Badge>;
    case "PENDING_APPROVAL":
      return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Pending Approval</Badge>;
    case "FILED":
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Filed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
