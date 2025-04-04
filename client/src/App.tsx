import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import TaskBoardPage from "@/pages/task-board";
import AuthPage from "@/pages/auth-page";
import CalendarPage from "@/pages/calendar-page";
import TeamPage from "@/pages/team-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket";
import { TaskProvider } from "./context/task-context";

function Router() {
  const { user, isLoading } = useAuth();
  
  console.log("Router: Authentication state", { user, isLoading });
  
  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/tasks" component={TaskBoardPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <TaskProvider>
          <Router />
          <Toaster />
        </TaskProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
