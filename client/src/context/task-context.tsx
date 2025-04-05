import { 
  createContext, 
  useContext, 
  ReactNode, 
  useState, 
  useEffect 
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, InsertTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Define valid status types using type alias
type ValidTaskStatus = "todo" | "inProgress" | "completed";

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  getTaskById: (id: number) => Task | undefined;
  createTask: (task: InsertTask) => Promise<Task>;
  updateTask: (id: number, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  updateTaskStatus: (id: number, status: ValidTaskStatus) => Promise<Task>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch all tasks
  const { 
    data: tasks = [], 
    isLoading,
    error,
  } = useQuery<Task[], Error>({
    queryKey: ["/api/tasks"],
    // Add data transform to ensure proper date handling
    select: (data: Task[]) => {
      console.log("Raw tasks data:", data);
      return data.map(task => ({
        ...task,
        // Convert date strings to Date objects
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      }));
    }
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: InsertTask) => {
      const res = await apiRequest("POST", "/api/tasks", newTask);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "New task has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: number; task: Partial<Task> }) => {
      console.log("Updating task:", id, "with data:", task);
      
      // Handle date serialization explicitly
      const processedTask = { ...task };
      
      // Process dueDate if present
      if (task.dueDate instanceof Date) {
        // Keep as is - the Date object will be serialized correctly by JSON.stringify
        console.log("Due date being sent to API:", task.dueDate.toISOString());
      }
      
      const res = await apiRequest("PUT", `/api/tasks/${id}`, processedTask);
      
      // Log the response for debugging
      const responseText = await res.text();
      console.log("Update task response:", responseText);
      
      try {
        return JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse response: ${responseText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Get task by ID
  const getTaskById = (id: number) => {
    return tasks.find(task => task.id === id);
  };
  
  // Create task
  const createTask = async (task: InsertTask) => {
    return await createTaskMutation.mutateAsync(task);
  };
  
  // Update task
  const updateTask = async (id: number, task: Partial<Task>) => {
    return await updateTaskMutation.mutateAsync({ id, task });
  };
  
  // Delete task
  const deleteTask = async (id: number) => {
    await deleteTaskMutation.mutateAsync(id);
  };
  
  // Update task status
  const updateTaskStatus = async (id: number, status: ValidTaskStatus) => {
    console.log("Updating task status:", id, status);
    
    // No need to validate here as the TypeScript type system ensures
    // only valid statuses can be passed
    return await updateTaskMutation.mutateAsync({ 
      id, 
      task: { status } 
    });
  };
  
  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error: error || null,
        getTaskById,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
}
