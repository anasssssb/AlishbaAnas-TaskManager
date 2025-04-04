import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, Comment, User, InsertComment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Download,
  Loader2,
  Paperclip,
  Tag,
  UserPlus,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch task assignees
  const { data: assignees = [], isLoading: isLoadingAssignees } = useQuery<User[]>({
    queryKey: ["/api/tasks", task.id, "assignees"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/assignees`, {
          credentials: "include",
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error("Error fetching assignees:", error);
        return [];
      }
    },
  });
  
  // Fetch task creator
  const { data: creator, isLoading: isLoadingCreator } = useQuery<User>({
    queryKey: ["/api/users", task.createdById],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/${task.createdById}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        return await res.json();
      } catch (error) {
        console.error("Error fetching creator:", error);
        throw error;
      }
    },
  });
  
  // Fetch task comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: ["/api/tasks", task.id, "comments"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tasks/${task.id}/comments`, {
          credentials: "include",
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
    enabled: isOpen,
  });
  
  // Fetch comment authors
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: comments.length > 0,
  });
  
  // Create comment schema
  const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
  });
  
  // Create comment form
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const newComment: InsertComment = {
        taskId: task.id,
        userId: user!.id,
        content: data.content,
      };
      
      const res = await apiRequest("POST", `/api/tasks/${task.id}/comments`, newComment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id, "comments"] });
      form.reset();
      toast({
        title: "Comment added",
        description: "Your comment has been added to the task",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof commentSchema>) => {
    addCommentMutation.mutate(data);
  };
  
  // Get user by ID
  const getUserById = (userId: number) => {
    return users.find(u => u.id === userId);
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  // Get priority badge
  const getPriorityBadge = () => {
    switch (task.priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Low Priority</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getPriorityBadge()}
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                {task.status === "todo" ? "To Do" : 
                 task.status === "inProgress" ? "In Progress" : 
                 "Completed"}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-xl mt-2">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-sm text-gray-600">
              {task.description || "No description provided."}
            </p>
          </div>
          
          {/* Assignees */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Assignees</h4>
            <div className="flex items-center space-x-2">
              {isLoadingAssignees ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : assignees.length === 0 ? (
                <div className="text-sm text-gray-500">No assignees yet</div>
              ) : (
                <div className="flex -space-x-1">
                  {assignees.map(assignee => (
                    <Avatar key={assignee.id} className="border-2 border-white">
                      <AvatarImage src={assignee.avatar} alt={assignee.fullName} />
                      <AvatarFallback>{getUserInitials(assignee.fullName)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="rounded-full">
                <UserPlus className="h-3 w-3 mr-1" />
                Assign
              </Button>
            </div>
          </div>
          
          {/* Due Date & Time Tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Due Date</h4>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {task.dueDate ? (
                  format(parseISO(task.dueDate.toString()), "MMMM d, yyyy")
                ) : (
                  "No due date set"
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Time Tracking</h4>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                {task.estimatedHours ? (
                  `${task.estimatedHours} hours estimated`
                ) : (
                  "No time estimate"
                )}
              </div>
            </div>
          </div>
          
          {/* Attachments section could go here */}
          
          <Separator />
          
          {/* Comments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Comments</h4>
            <div className="space-y-4">
              {isLoadingComments ? (
                Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-20 w-full rounded-md" />
                      </div>
                    </div>
                  ))
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map(comment => {
                  const commentUser = getUserById(comment.userId);
                  
                  return (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar>
                        <AvatarImage src={commentUser?.avatar} alt={commentUser?.fullName} />
                        <AvatarFallback>
                          {commentUser ? getUserInitials(commentUser.fullName) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium text-gray-900">
                            {commentUser?.fullName || "Unknown User"}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(comment.createdAt.toString()), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Add comment form */}
              <div className="mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-3">
                    <Avatar>
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback>
                        {user ? getUserInitials(user.fullName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Add a comment..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="submit"
                          disabled={addCommentMutation.isPending}
                        >
                          {addCommentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            "Post Comment"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Assign
            </Button>
            <Button variant="outline" size="sm">
              <Paperclip className="h-4 w-4 mr-1.5" />
              Attach
            </Button>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-1.5" />
              Label
            </Button>
          </div>
          
          <div>
            <select 
              className="rounded-md border border-gray-300 py-1.5 pl-3 pr-8 text-xs font-medium"
              value={task.status}
              onChange={(e) => {
                // Update task status handler would go here
                console.log("Status updated:", e.target.value);
              }}
            >
              <option value="" disabled>Move to...</option>
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
