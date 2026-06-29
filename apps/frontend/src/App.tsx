import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { InvestigationProvider } from "@/context/InvestigationContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Alerts from "@/pages/Alerts";
import Demo from "@/pages/Demo";
import GraphAnalytics from "@/pages/GraphAnalytics";
import Accounts from "@/pages/Accounts";
import Evidence from "@/pages/Evidence";
import BranchRisk from "@/pages/BranchRisk";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/demo" component={Demo} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/graph/:alertId" component={GraphAnalytics} />
        <Route path="/graph" component={GraphAnalytics} />
        <Route path="/graph-analytics" component={GraphAnalytics} />
        <Route path="/branch-risk" component={BranchRisk} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/evidence" component={Evidence} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <InvestigationProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </InvestigationProvider>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
