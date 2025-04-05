import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import TaskBoardPage from "@/pages/task-board";
import AuthPage from "@/pages/auth-page";
import CalendarPage from "@/pages/calendar-page";
import TeamPage from "@/pages/team-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { WebSocketProvider } from "./hooks/use-websocket";
import { TaskProvider } from "./context/task-context";
import { Loader2 } from "lucide-react";

// Create a proper Loading component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-gray-600">Loading your dashboard...</p>
    </div>
  </div>
);

// Simple component to redirect to home if authenticated
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  console.log("AuthRoute: checking auth status", { user, isLoading });
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    console.log("User is authenticated, redirecting from /auth to /");
    // Use direct navigation instead of setTimeout
    navigate("/");
    return null;
  }
  
  return <>{children}</>;
};

// Handles protection for authenticated routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  console.log("ProtectedRoute: checking auth status", { user, isLoading });
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    console.log("User is not authenticated, redirecting to /auth");
    // Use direct navigation instead of setTimeout
    navigate("/auth");
    return null;
  }
  
  return <>{children}</>;
};

function Router() {
  const { user, isLoading } = useAuth();
  
  console.log("Main Router: Authentication state", { user, isLoading });
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      
      <Route path="/">
        {!user ? <Redirect to="/auth" /> : <HomePage />}
      </Route>
      
      <Route path="/tasks">
        {!user ? <Redirect to="/auth" /> : <TaskBoardPage />}
      </Route>
      
      <Route path="/calendar">
        {!user ? <Redirect to="/auth" /> : <CalendarPage />}
      </Route>
      
      <Route path="/team">
        {!user ? <Redirect to="/auth" /> : <TeamPage />}
      </Route>
      
      <Route path="/reports">
        {!user ? <Redirect to="/auth" /> : <ReportsPage />}
      </Route>
      
      <Route path="/settings">
        {!user ? <Redirect to="/auth" /> : <SettingsPage />}
      </Route>
      
      <Route>
        <NotFound />
      </Route>
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
