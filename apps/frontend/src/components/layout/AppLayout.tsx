import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3, AlertTriangle, Network, Users,
  FileText, Home, Shield, Activity, Terminal, Building2, Globe2, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/auth/SettingsModal";

const navSections = [
  {
    label: "Intelligence",
    items: [
      { name: "Home", href: "/", icon: Home },
      { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
      { name: "Alerts", href: "/alerts", icon: AlertTriangle, badge: "Live" },
    ],
  },
  {
    label: "Investigation",
    items: [
      { name: "Branch Risk", href: "/branch-risk", icon: Building2 },
      { name: "Risk Map", href: "/risk-map", icon: Globe2, badge: "New" },
      { name: "Graph Analytics", href: "/graph", icon: Network, badge: "Core" },
      { name: "Accounts", href: "/accounts", icon: Users },
      { name: "Evidence", href: "/evidence", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Live Stream", href: "/livestream", icon: Activity, badge: "300 TPS" },
      { name: "Demo Control", href: "/demo", icon: Terminal, badge: "Inject" },
    ],
  },
];

import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div
        className="w-56 h-screen flex flex-col fixed left-0 top-0 select-none"
        style={{
          backgroundColor: "var(--color-sidebar)",
          borderRight: "2px solid var(--color-sidebar-border)",
        }}
      >
        {/* Wordmark */}
        <div
          className="h-14 flex items-center px-4 flex-shrink-0 gap-3"
          style={{ borderBottom: "2px solid rgba(232,232,226,0.15)" }}
        >
          <div
            className="h-8 w-8 flex items-center justify-center flex-shrink-0"
            style={{ border: "2px solid var(--color-primary)", backgroundColor: "transparent" }}
          >
            <Shield className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="leading-none">
            <p
              className="text-[14px] font-black tracking-tight uppercase"
              style={{ color: "var(--color-sidebar-foreground)" }}
            >
              G-TEN
            </p>
            <p
              className="text-[9px] uppercase tracking-[0.25em] mt-0.5"
              style={{ color: "rgba(232,232,226,0.35)" }}
            >
              AML Platform
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {(() => {
            const sectionsToRender = navSections.filter(section => {
              if (section.label === "System" && user?.role === "Investigator") return false;
              return true;
            });
            if (user?.role === "Admin" || user?.role === "Branch Manager") {
              const adminItems = [];
              if (user?.role === "Admin") {
                adminItems.push({ name: "Branches", href: "/branches", icon: Building2 });
                adminItems.push({ name: "Audit Logs", href: "/audit-logs", icon: Shield });
              }
              adminItems.push({ name: "User Management", href: "/users", icon: Users });

              sectionsToRender.push({
                label: "Admin",
                items: adminItems
              });
            }
            return sectionsToRender.map((section) => (
              <div key={section.label}>
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.25em] px-2 mb-2"
                  style={{ color: "rgba(232,232,226,0.3)" }}
                >
              // {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      location === item.href ||
                      (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <Link key={item.name} href={item.href}>
                        <div
                          className={cn(
                            "group flex items-center px-2.5 py-[7px] text-[13px] font-semibold transition-all cursor-pointer gap-2.5",
                            isActive ? "" : "hover:opacity-100",
                            // hover styles using theme tokens
                            "hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(232,232,226,0.85)]"
                          )}
                          style={{
                            borderLeft: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                            backgroundColor: isActive ? "rgba(163,230,53,0.08)" : "transparent",
                            color: isActive ? "var(--color-primary)" : "rgba(232,232,226,0.45)",
                            paddingLeft: "10px",
                          }}
                        >
                          <item.icon
                            className="h-[15px] w-[15px] flex-shrink-0 transition-colors"
                            style={{ color: isActive ? "var(--color-primary)" : "rgba(232,232,226,0.3)" }}
                          />
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <span
                              className="text-[8.5px] font-bold tracking-wider uppercase px-1.5 py-0.5"
                              style={{
                                border: `1px solid ${item.badge === "Core" ? "rgba(163,230,53,0.4)" : "rgba(52,211,153,0.4)"}`,
                                color: item.badge === "Core" ? "var(--color-primary)" : "#34d399",
                                backgroundColor:
                                  item.badge === "Core"
                                    ? "rgba(163,230,53,0.07)"
                                    : "rgba(52,211,153,0.07)",
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </nav>

        {/* Status + User */}
        <div
          className="px-3 pb-3 pt-2 space-y-2 flex-shrink-0"
          style={{ borderTop: "2px solid rgba(232,232,226,0.15)" }}
        >
          <div
            className="flex items-center gap-2 px-2.5 py-2"
            style={{
              border: "1px solid var(--color-primary)",
              backgroundColor: "rgba(163,230,53,0.05)",
            }}
          >
            <Activity className="h-3 w-3 flex-shrink-0" style={{ color: "#a3e635" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(163,230,53,0.8)" }}
            >
              ● System Operational
            </span>
          </div>
          <div className="flex items-center gap-2.5 px-1 pt-1 justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="h-7 w-7 flex items-center justify-center flex-shrink-0"
                style={{
                  border: "2px solid var(--color-primary)",
                  backgroundColor: "rgba(163,230,53,0.08)",
                }}
              >
                <span className="text-[10px] font-black text-[#a3e635]">
                  {user?.username?.substring(0, 2).toUpperCase() || "FI"}
                </span>
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[12px] font-bold text-[#e8e8e2] truncate" title={user?.name}>
                  {user?.name || "Guest"}
                </p>
                <p className="text-[9px] font-medium text-[rgba(232,232,226,0.6)] uppercase tracking-wider truncate" title={user?.role}>
                  {user?.role || "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex">
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5 text-[rgba(232,232,226,0.45)] hover:text-[#a3e635]" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
                title="Log out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(232,232,226,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-[#ef4444]">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isHome = location === "/";

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.18),_transparent_28%),linear-gradient(135deg,_#f5f5f0_0%,_#e8e8e2_100%)] text-foreground flex">
      {!isHome && <Sidebar />}
      <main className={cn("flex-1 min-w-0", !isHome && "ml-56")}>
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
