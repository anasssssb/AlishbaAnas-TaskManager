import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData, unknown>;
  logoutMutation: UseMutationResult<void, Error, void, unknown>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser, unknown>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    staleTime: 0, // Don't cache the data
  });
  
  // Debug current authentication state
  useEffect(() => {
    console.log("AuthProvider state:", {
      isAuthenticated: !!user,
      user,
      isLoading,
      error: error?.message
    });
  }, [user, isLoading, error]);

  const loginMutation = useMutation<SelectUser, Error, LoginData, unknown>({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login attempt:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        // We need to clone the response since we can only read the body once
        const clonedResponse = res.clone();
        
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || "Login failed");
          } catch {
            throw new Error("Login failed. Please try again.");
          }
        }
        
        const userData = await clonedResponse.json();
        console.log("Login API response:", userData);
        
        return userData;
      } catch (error: any) {
        console.error("Login error:", error);
        throw new Error(error.message || "Login failed");
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Login successful, user data:", user);
      
      // Ensure the cache is updated with the user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Force a complete refetch of user data
      queryClient.invalidateQueries({
        queryKey: ["/api/user"],
        exact: true,
        refetchType: "all"
      });
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.username}`,
      });

      // Manually force a window reload to ensure the auth state is completely refreshed
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<SelectUser, Error, InsertUser, unknown>({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Register attempt:", credentials.username);
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        // Clone the response since we can only read the body once
        const clonedResponse = res.clone();
        
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || "Registration failed");
          } catch {
            throw new Error("Registration failed. Please try again.");
          }
        }
        
        const userData = await clonedResponse.json();
        console.log("Register API response:", userData);
        return userData;
      } catch (error: any) {
        console.error("Registration error:", error);
        throw new Error(error.message || "Registration failed");
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Registration successful, user data:", user);
      
      // Ensure the cache is updated with the user data
      queryClient.setQueryData(["/api/user"], user);
      
      // Force a complete refetch of user data
      queryClient.invalidateQueries({
        queryKey: ["/api/user"],
        exact: true,
        refetchType: "all"
      });
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
      
      // Manually force a redirect to ensure the auth state is completely refreshed
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
        // Return void to match the mutation type
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear the cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Force a refetch
      queryClient.invalidateQueries({
        queryKey: ["/api/user"], 
        exact: true
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to auth page
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
