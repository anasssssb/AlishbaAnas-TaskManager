import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  addMonths,
  subMonths
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter tasks with due dates
  const tasksWithDueDate = tasks.filter(task => task.dueDate);
  
  // Generate days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Navigate through months
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasksWithDueDate.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = parseISO(task.dueDate.toString());
      return isSameDay(dueDate, day);
    });
  };
  
  // Get upcoming deadlines (next 7 days)
  const getUpcomingDeadlines = () => {
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);
    
    return tasksWithDueDate
      .filter(task => {
        if (!task.dueDate) return false;
        const dueDate = parseISO(task.dueDate.toString());
        return dueDate >= today && dueDate <= in7Days && task.status !== "completed";
      })
      .sort((a, b) => {
        const dateA = parseISO(a.dueDate!.toString());
        const dateB = parseISO(b.dueDate!.toString());
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
  };
  
  const upcomingDeadlines = getUpcomingDeadlines();
  
  return (
    <>
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h4 className="text-sm font-medium">
            {format(currentDate, "MMMM yyyy")}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-600 mb-2">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
              <div>Su</div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Empty cells for days before the month starts */}
              {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
                <div key={`empty-start-${i}`} className="py-1.5 text-sm" />
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, new Date());
                const hasTask = dayTasks.length > 0;
                const hasPriorityTask = dayTasks.some(task => task.priority === "high");
                
                return (
                  <div
                    key={day.toString()}
                    className={`py-1.5 text-sm ${
                      !isSameMonth(day, currentDate)
                        ? "text-gray-400"
                        : isToday
                        ? "bg-primary-500 text-white rounded-full"
                        : hasTask
                        ? hasPriorityTask
                          ? "bg-yellow-500 text-white rounded-full"
                          : "bg-primary-200 rounded-full"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>
            
            {/* Upcoming deadlines list */}
            <div className="mt-4 space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-2 text-sm text-gray-500">
                  No upcoming deadlines
                </div>
              ) : (
                upcomingDeadlines.map((task) => {
                  const dueDate = parseISO(task.dueDate!.toString());
                  const isPastDue = dueDate < new Date();
                  const bgColor = isPastDue 
                    ? "bg-red-50" 
                    : task.priority === "high" 
                    ? "bg-yellow-50" 
                    : "bg-primary-50";
                  const dotColor = isPastDue 
                    ? "bg-red-500" 
                    : task.priority === "high" 
                    ? "bg-yellow-500" 
                    : "bg-primary-500";
                  
                  return (
                    <div key={task.id} className={`flex items-center p-2 rounded-md ${bgColor}`}>
                      <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                      <div className="ml-2">
                        <p className="text-xs font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{format(dueDate, "MMM d")}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
