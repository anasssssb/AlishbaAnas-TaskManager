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
  const [, setLocation] = useLocation();

  console.log("AuthRoute: checking auth status", { user, isLoading });
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    console.log("User is authenticated, redirecting from /auth to /");
    // Use setTimeout to ensure the redirection happens after the render cycle
    setTimeout(() => setLocation("/"), 0);
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
};

// Handles protection for authenticated routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  console.log("ProtectedRoute: checking auth status", { user, isLoading });
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    console.log("User is not authenticated, redirecting to /auth");
    // Use setTimeout to ensure the redirection happens after the render cycle
    setTimeout(() => setLocation("/auth"), 0);
    return <LoadingScreen />;
  }
  
  return <>{children}</>;
};

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthRoute>
          <AuthPage />
        </AuthRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/tasks">
        <ProtectedRoute>
          <TaskBoardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/calendar">
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/team">
        <ProtectedRoute>
          <TeamPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
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
