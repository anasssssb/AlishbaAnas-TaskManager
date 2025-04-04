import { useQuery } from "@tanstack/react-query";
import { Comment, Task, User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: number;
  type: "task_created" | "task_completed" | "comment_added" | "task_assigned";
  userId: number;
  timestamp: Date;
  taskId?: number;
  taskTitle?: string;
  commentId?: number;
  commentContent?: string;
}

export default function ActivityFeed() {
  // Fetch users for displaying user info
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch tasks for creating the activity feed
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch comments
  const { data: allComments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: ["/api/tasks/comments"],
    queryFn: async () => {
      try {
        // Since we don't have a global comments endpoint, we'll return an empty array
        // In a real app, you would fetch comments from each task or have a dedicated endpoint
        return [];
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
  });
  
  const isLoading = isLoadingUsers || isLoadingTasks || isLoadingComments;
  
  // Create a synthetic activity feed based on tasks and comments
  // In a real app, this would likely be a dedicated API endpoint
  const createActivityFeed = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    
    // Add task creation activities
    tasks.forEach(task => {
      activities.push({
        id: task.id * 10000, // Use a multiplier to avoid ID collisions
        type: "task_created",
        userId: task.createdById,
        timestamp: new Date(task.createdAt),
        taskId: task.id,
        taskTitle: task.title,
      });
      
      // Add task completion activities for completed tasks
      if (task.status === "completed") {
        activities.push({
          id: task.id * 10000 + 1,
          type: "task_completed",
          userId: task.createdById, // In a real app, this would be the user who completed the task
          timestamp: new Date(task.createdAt), // This should be the completion date in a real app
          taskId: task.id,
          taskTitle: task.title,
        });
      }
    });
    
    // Add comment activities
    allComments.forEach(comment => {
      activities.push({
        id: comment.id * 10000 + 2,
        type: "comment_added",
        userId: comment.userId,
        timestamp: new Date(comment.createdAt),
        taskId: comment.taskId,
        taskTitle: tasks.find(t => t.id === comment.taskId)?.title,
        commentId: comment.id,
        commentContent: comment.content,
      });
    });
    
    // Sort by timestamp (newest first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };
  
  const activities = createActivityFeed();
  
  // Get user info by ID
  const getUserById = (userId: number) => {
    return users.find(user => user.id === userId);
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  // Format the activity message based on type
  const getActivityMessage = (activity: ActivityItem) => {
    const user = getUserById(activity.userId);
    
    if (!user) return null;
    
    switch (activity.type) {
      case "task_created":
        return (
          <p className="text-sm text-gray-900">
            <span className="font-medium">{user.fullName}</span> created the task{" "}
            <span className="font-medium">{activity.taskTitle}</span>
          </p>
        );
      case "task_completed":
        return (
          <p className="text-sm text-gray-900">
            <span className="font-medium">{user.fullName}</span> completed the task{" "}
            <span className="font-medium">{activity.taskTitle}</span>
          </p>
        );
      case "comment_added":
        return (
          <p className="text-sm text-gray-900">
            <span className="font-medium">{user.fullName}</span> commented on{" "}
            <span className="font-medium">{activity.taskTitle}</span>
          </p>
        );
      case "task_assigned":
        return (
          <p className="text-sm text-gray-900">
            <span className="font-medium">{user.fullName}</span> was assigned to{" "}
            <span className="font-medium">{activity.taskTitle}</span>
          </p>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
          View all
        </a>
      </div>
      
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="px-5 py-4 flex items-start">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3">
                  <Skeleton className="h-4 w-64 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
        ) : activities.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">
            No recent activity found
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => {
            const user = getUserById(activity.userId);
            
            if (!user) return null;
            
            return (
              <div key={activity.id} className="px-5 py-4 flex items-start">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                  <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  {getActivityMessage(activity)}
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
