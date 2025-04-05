import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Redirect, Route, useLocation } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading, error } = useAuth();
  const [location, setLocation] = useLocation();

  // Debugging information
  useEffect(() => {
    console.log("ProtectedRoute render:", {
      path,
      currentLocation: location,
      isAuthenticated: !!user,
      isLoading,
      authError: error?.message
    });
  }, [path, location, user, isLoading, error]);

  // Handle loading state
  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your data...</p>
          </div>
        )}
      </Route>
    );
  }

  // Handle unauthenticated state
  if (!user) {
    console.log("User not authenticated, redirecting to /auth");
    // Use immediate redirect when possible
    if (location.startsWith(path)) {
      setLocation("/auth");
    }
    
    // Also return a Route with Redirect as fallback
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  // User is authenticated, render the protected component
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}
