import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvestigationProvider } from "@/context/InvestigationContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import { CommandPalette } from "@/components/chat/CommandPalette";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Alerts from "@/pages/Alerts";
import Demo from "@/pages/Demo";
import GraphAnalytics from "@/pages/GraphAnalytics";
import Accounts from "@/pages/Accounts";
import Evidence from "@/pages/Evidence";
import LiveStream from "@/pages/LiveStream";
import BranchRisk from "@/pages/BranchRisk";
import TransactionTimeMachine from "@/pages/TransactionTimeMachine";
import RiskMap from "@/pages/RiskMap";
import UserManagement from "@/pages/UserManagement";
import Branches from "@/pages/Branches";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: 'red', color: 'white', fontFamily: 'monospace' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function RoleRoute({ path, component: Component, allowedRoles }: { path: string, component: any, allowedRoles: string[] }) {
  const { user } = useAuth();
  if (user && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }
  return <Route path={path} component={Component} />;
}

function BranchRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <RoleRoute path="/demo" component={Demo} allowedRoles={["Admin", "Branch Manager"]} />
        <RoleRoute path="/livestream" component={LiveStream} allowedRoles={["Admin", "Branch Manager"]} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/graph/:alertId" component={GraphAnalytics} />
        <Route path="/graph" component={GraphAnalytics} />
        <Route path="/graph-analytics" component={GraphAnalytics} />
        <Route path="/branch-risk" component={BranchRisk} />
        <Route path="/risk-map" component={RiskMap} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/evidence" component={Evidence} />
        <RoleRoute path="/users" component={UserManagement} allowedRoles={["Admin", "Branch Manager"]} />
        <RoleRoute path="/branches" component={Branches} allowedRoles={["Admin"]} />
        <Route path="/transaction-time-machine/:alertId" component={TransactionTimeMachine} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function RoutingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!user) return;

    const isRootOrDashboard = location === "/" || location === "/dashboard";

    if (isRootOrDashboard) {
      if (user.role !== "Admin") {
        const fallbackBranch = user.branchId || "ALL";
        // Default Branch Managers and Investigators to their assigned branch
        // Right now the API uses branch_code, but our context has branchId?
        // Wait, the API returns branchCode or we can fallback to branchCode if user has it.
        // Let's assume user object has a branchCode field or we use branchId.
        // Actually, user schema has `branch_code` or `branchId`.
        const code = (user as any).branchCode || "ALL"; // fallback if branchCode isn't explicitly exposed yet
        setLocation(`/b/${code}/dashboard`);
      }
    }
  }, [user, location, setLocation]);

  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <RoutingGuard>
      <Switch>
        <Route path="/login" component={Login} />
        
        {/* Home Page */}
        <Route path="/" component={Home} />

        {/* Admin Branch Selector (No Sidebar) */}
        <Route path="/dashboard">
          <ProtectedRoute>
            {user?.role === "Admin" ? (
              <AdminDashboard onSelectBranch={(b) => setLocation(`/b/${b || "ALL"}/dashboard`)} />
            ) : null}
          </ProtectedRoute>
        </Route>

        {/* Nested Branch Router */}
        <Route path="/b/:branchCode" nest>
          <ProtectedRoute>
            <BranchRoutes />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RoutingGuard>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <InvestigationProvider>
              <Router />
            </InvestigationProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
        <CommandPalette />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
