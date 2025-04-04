import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TaskColumn from "@/components/tasks/task-column";
import TaskDetailModal from "@/components/tasks/task-detail-modal";
import TaskForm from "@/components/tasks/task-form";
import TaskFilter from "@/components/tasks/task-filter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function TaskBoardPage() {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    priority: "all",
    assignee: "all",
    project: "all",
  });
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by search term
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }
    
    return true;
  });
  
  // Group tasks by status
  const todoTasks = filteredTasks.filter(task => task.status === "todo");
  const inProgressTasks = filteredTasks.filter(task => task.status === "inProgress");
  const completedTasks = filteredTasks.filter(task => task.status === "completed");
  
  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Get the task ID
    const taskId = parseInt(draggableId.split("-")[1]);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Update task status based on destination
    let newStatus: "todo" | "inProgress" | "completed";
    
    switch (destination.droppableId) {
      case "todo":
        newStatus = "todo";
        break;
      case "inProgress":
        newStatus = "inProgress";
        break;
      case "completed":
        newStatus = "completed";
        break;
      default:
        return;
    }
    
    // Call mutation to update task status
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };
  
  // Open task detail modal
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
                <p className="mt-1 text-sm text-gray-600">Manage and track your team's tasks in one place.</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <TaskForm onClose={() => setIsNewTaskOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Filter and Search Bar */}
            <TaskFilter filters={filters} setFilters={setFilters} />
            
            {/* Kanban Board */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="p-4 space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} className="h-32 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Droppable droppableId="todo">
                    {(provided) => (
                      <TaskColumn
                        title="To Do"
                        tasks={todoTasks}
                        color="bg-primary-500"
                        provided={provided}
                        onTaskClick={handleTaskClick}
                      />
                    )}
                  </Droppable>
                  
                  <Droppable droppableId="inProgress">
                    {(provided) => (
                      <TaskColumn
                        title="In Progress"
                        tasks={inProgressTasks}
                        color="bg-yellow-500"
                        provided={provided}
                        onTaskClick={handleTaskClick}
                      />
                    )}
                  </Droppable>
                  
                  <Droppable droppableId="completed">
                    {(provided) => (
                      <TaskColumn
                        title="Completed"
                        tasks={completedTasks}
                        color="bg-green-500"
                        provided={provided}
                        onTaskClick={handleTaskClick}
                      />
                    )}
                  </Droppable>
                </div>
              </DragDropContext>
            )}
          </div>
        </main>
      </div>
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
}
