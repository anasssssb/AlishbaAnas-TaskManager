import { MouseEvent } from "react";
import { Task } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  // Fetch assignees for this task
  const { data: assignees = [] } = useQuery({
    queryKey: ["/api/tasks", task.id, "assignees"],
    queryFn: async () => {
      // In a real app, this would fetch the actual assignees for this task
      // Here we'll just assume there are none for simplicity
      return [];
    },
  });
  
  // Fetch comments count
  const { data: commentsCount = 0 } = useQuery({
    queryKey: ["/api/tasks", task.id, "comments", "count"],
    queryFn: async () => {
      // In a real app, this would fetch the actual comments count
      // Here we'll just assume there are none for simplicity
      return 0;
    },
  });
  
  // Fetch attachments count
  const { data: attachmentsCount = 0 } = useQuery({
    queryKey: ["/api/tasks", task.id, "attachments", "count"],
    queryFn: async () => {
      // In a real app, this would fetch the actual attachments count
      // Here we'll just assume there are none for simplicity
      return 0;
    },
  });
  
  const handleTaskClick = () => {
    onClick(task);
  };
  
  const handleMenuClick = (e: MouseEvent) => {
    e.stopPropagation();
    // Handle menu click (would typically open a dropdown menu)
  };
  
  // Get priority badge
  const getPriorityBadge = () => {
    switch (task.priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">High Priority</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Low Priority</Badge>;
      default:
        return null;
    }
  };
  
  // Get progress bar for in-progress tasks
  const getProgressBar = () => {
    if (task.status !== "inProgress") return null;
    
    // In a real app, you'd calculate this based on completed subtasks or time tracking
    const progressPercent = 50;
    
    return (
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-primary-500 h-1.5 rounded-full" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    );
  };
  
  // Format due date or completed date
  const getFormattedDate = () => {
    if (!task.dueDate) return null;
    
    const dueDate = parseISO(task.dueDate.toString());
    
    if (task.status === "completed") {
      return `Completed ${format(dueDate, "MMM d")}`;
    }
    
    return format(dueDate, "MMM d");
  };

  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-md shadow-sm p-4 task-card cursor-pointer hover:shadow-md transition-shadow ${
        task.status === "completed" ? "opacity-75" : ""
      }`}
      onClick={handleTaskClick}
    >
      <div className="flex justify-between items-start">
        {getPriorityBadge()}
        
        <div className="flex space-x-2">
          {attachmentsCount > 0 && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
              <Paperclip className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-gray-600"
            onClick={handleMenuClick}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <h4 className={`mt-2 text-sm font-medium text-gray-900 ${task.status === "completed" ? "line-through" : ""}`}>
        {task.title}
      </h4>
      
      {task.description && (
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>
      )}
      
      {getProgressBar()}
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-1">
          {assignees.length > 0 ? (
            assignees.map((assignee: any) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={assignee.avatar} alt={assignee.fullName} />
                <AvatarFallback>{getUserInitials(assignee.fullName)}</AvatarFallback>
              </Avatar>
            ))
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              ?
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500">{getFormattedDate()}</div>
      </div>
    </div>
  );
}
