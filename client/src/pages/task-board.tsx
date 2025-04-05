import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DraggableProvided, DroppableProvided, DropResult } from "react-beautiful-dnd";
import { PlusCircle, Loader2 } from "lucide-react";
import { Task } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TaskFilter from "@/components/tasks/task-filter";
import TaskForm from "@/components/tasks/task-form";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TaskBoard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [filters, setFilters] = useState({
    search: "",
    priority: "all",
    assignee: "all",
    project: "all",
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTask(undefined);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (
      filters.search &&
      !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !task.description?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Priority filter
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    // In a real implementation, we would also filter by assignee and project
    // but for now we'll just return true since we haven't implemented those yet
    return true;
  });

  // Group tasks by status
  const groupedTasks = {
    todo: filteredTasks.filter((task) => task.status === "todo"),
    inProgress: filteredTasks.filter((task) => task.status === "inProgress"),
    completed: filteredTasks.filter((task) => task.status === "completed"),
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Skip if dropped in the same place
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the task ID
    const taskId = parseInt(draggableId.split("-")[1]);
    const task = tasks.find((t) => t.id === taskId);
    
    if (!task) return;

    // Update the task status if the column changed
    if (source.droppableId !== destination.droppableId) {
      // Optimistically update in the UI
      queryClient.setQueryData(["/api/tasks"], (oldData: Task[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((t) => {
          if (t.id === taskId) {
            return { ...t, status: destination.droppableId };
          }
          return t;
        });
      });

      // Call the API to update the task status
      try {
        await apiRequest("PUT", `/api/tasks/${taskId}`, {
          ...task,
          status: destination.droppableId,
        });
      } catch (error) {
        toast({
          title: "Error updating task",
          description: (error as Error).message,
          variant: "destructive",
        });
        
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      }
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Task Board</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <TaskForm task={selectedTask} onClose={handleDialogClose} />
              </DialogContent>
            </Dialog>
          </div>

          <TaskFilter filters={filters} setFilters={setFilters} />

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* To Do Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">To Do</h2>
                <Droppable droppableId="todo">
                  {(provided: DroppableProvided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3 min-h-[200px]"
                    >
                      {groupedTasks.todo.map((task, index) => (
                        <Draggable
                          key={`task-${task.id}`}
                          draggableId={`task-${task.id}`}
                          index={index}
                        >
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleTaskClick(task)}
                            >
                              <Card className="cursor-pointer hover:border-primary transition-colors">
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{task.title}</CardTitle>
                                    <Badge
                                      className={`${getPriorityColor(task.priority)} text-white`}
                                    >
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </Badge>
                                  </div>
                                  {task.dueDate && (
                                    <CardDescription className="text-xs">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <p className="text-sm line-clamp-2">
                                    {task.description || "No description"}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">In Progress</h2>
                <Droppable droppableId="inProgress">
                  {(provided: DroppableProvided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3 min-h-[200px]"
                    >
                      {groupedTasks.inProgress.map((task, index) => (
                        <Draggable
                          key={`task-${task.id}`}
                          draggableId={`task-${task.id}`}
                          index={index}
                        >
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleTaskClick(task)}
                            >
                              <Card className="cursor-pointer hover:border-primary transition-colors">
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{task.title}</CardTitle>
                                    <Badge
                                      className={`${getPriorityColor(task.priority)} text-white`}
                                    >
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </Badge>
                                  </div>
                                  {task.dueDate && (
                                    <CardDescription className="text-xs">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <p className="text-sm line-clamp-2">
                                    {task.description || "No description"}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Completed Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Completed</h2>
                <Droppable droppableId="completed">
                  {(provided: DroppableProvided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3 min-h-[200px]"
                    >
                      {groupedTasks.completed.map((task, index) => (
                        <Draggable
                          key={`task-${task.id}`}
                          draggableId={`task-${task.id}`}
                          index={index}
                        >
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleTaskClick(task)}
                            >
                              <Card className="cursor-pointer hover:border-primary transition-colors opacity-80">
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base line-through">
                                      {task.title}
                                    </CardTitle>
                                    <Badge
                                      className={`${getPriorityColor(task.priority)} text-white opacity-60`}
                                    >
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </Badge>
                                  </div>
                                  <CardDescription className="text-xs">
                                    Completed: {new Date(task.createdAt).toLocaleDateString()}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                  <p className="text-sm line-clamp-2 opacity-80">
                                    {task.description || "No description"}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
        </main>
      </div>
    </div>
  );
}