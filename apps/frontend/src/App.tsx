import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvestigationProvider } from "@/context/InvestigationContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Alerts from "@/pages/Alerts";
import Demo from "@/pages/Demo";
import GraphAnalytics from "@/pages/GraphAnalytics";
import Accounts from "@/pages/Accounts";
import Evidence from "@/pages/Evidence";
import LiveStream from "@/pages/LiveStream";
import BranchRisk from "@/pages/BranchRisk";
import RiskMap from "@/pages/RiskMap";
import UserManagement from "@/pages/UserManagement";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
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

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/demo" component={Demo} />
        <Route path="/livestream" component={LiveStream} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/graph/:alertId" component={GraphAnalytics} />
        <Route path="/graph" component={GraphAnalytics} />
        <Route path="/graph-analytics" component={GraphAnalytics} />
        <Route path="/branch-risk" component={BranchRisk} />
        <Route path="/risk-map" component={RiskMap} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/evidence" component={Evidence} />
        <Route path="/users" component={UserManagement} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route>
        <ProtectedRoute>
          <ProtectedRoutes />
        </ProtectedRoute>
      </Route>
    </Switch>
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
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;

