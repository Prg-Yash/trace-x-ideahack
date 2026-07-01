/**
 * Desktop Badge Component
 * Shows a badge when running as desktop application
 */

import React, { useEffect, useState } from 'react';
import { isTauri, getPlatform } from '@/lib/tauri';
import { Badge } from '@/components/ui/badge';
import { Monitor } from 'lucide-react';

export const DesktopBadge: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    const checkDesktop = async () => {
      const desktop = isTauri();
      setIsDesktop(desktop);
      
      if (desktop) {
        const plat = await getPlatform();
        setPlatform(plat);
      }
    };
    
    checkDesktop();
  }, []);

  if (!isDesktop) {
    return null;
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Monitor className="h-3 w-3" />
      <span className="text-xs">Desktop</span>
      {platform && platform !== 'web' && (
        <span className="text-xs text-muted-foreground">
          ({platform})
        </span>
      )}
    </Badge>
  );
};
