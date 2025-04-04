import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWeekend, addMonths, subMonths, parseISO } from "date-fns";
import { Task } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TaskDetailModal from "@/components/tasks/task-detail-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskForm from "@/components/tasks/task-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  
  // Get calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter tasks with due dates
  const tasksWithDueDate = tasks.filter(task => task.dueDate);
  
  // Navigate calendar
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
  
  // Open task detail modal
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };
  
  // Get task priority class
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                <p className="mt-1 text-sm text-gray-600">View your tasks and deadlines in calendar view.</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Select defaultValue={view} onValueChange={setView}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
                
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
            
            {/* Calendar Header */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Calendar grid */}
              <div className="border-t border-gray-200">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="bg-gray-50 py-2 text-sm font-semibold text-gray-700 text-center"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                {isLoading ? (
                  <div className="grid grid-cols-7 gap-px bg-gray-200 min-h-[600px]">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className="bg-white min-h-[100px] p-2">
                        <Skeleton className="h-5 w-5 rounded-full mb-2" />
                        <Skeleton className="h-6 w-full mb-1" />
                        <Skeleton className="h-6 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {/* Add empty cells for days before the start of the month */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div
                        key={`empty-start-${i}`}
                        className="bg-gray-50 min-h-[100px] p-2"
                      ></div>
                    ))}
                    
                    {/* Calendar days */}
                    {calendarDays.map((day) => {
                      const dayTasks = getTasksForDay(day);
                      return (
                        <div
                          key={day.toString()}
                          className={`bg-white min-h-[100px] p-2 ${
                            !isSameMonth(day, currentDate)
                              ? "text-gray-300"
                              : isSameDay(day, new Date())
                              ? "bg-blue-50"
                              : isWeekend(day)
                              ? "bg-gray-50"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={`text-sm font-medium ${
                                isSameDay(day, new Date())
                                  ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                  : ""
                              }`}
                            >
                              {format(day, "d")}
                            </span>
                            {dayTasks.length > 0 && (
                              <span className="text-xs text-gray-500">{dayTasks.length} tasks</span>
                            )}
                          </div>
                          
                          <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                            {dayTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className="text-xs bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200"
                                onClick={() => handleTaskClick(task)}
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`w-2 h-2 ${getPriorityClass(task.priority)} rounded-full mr-1`}
                                  ></div>
                                  <span className="truncate">{task.title}</span>
                                </div>
                              </div>
                            ))}
                            {dayTasks.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{dayTasks.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add empty cells for days after the end of the month */}
                    {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
                      <div
                        key={`empty-end-${i}`}
                        className="bg-gray-50 min-h-[100px] p-2"
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
              </div>
              <div className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : tasksWithDueDate.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                ) : (
                  <div className="space-y-3">
                    {tasksWithDueDate
                      .filter(task => task.status !== "completed")
                      .sort((a, b) => {
                        const dateA = parseISO(a.dueDate!.toString());
                        const dateB = parseISO(b.dueDate!.toString());
                        return dateA.getTime() - dateB.getTime();
                      })
                      .slice(0, 5)
                      .map((task) => {
                        const dueDate = parseISO(task.dueDate!.toString());
                        const isPastDue = dueDate < new Date() && task.status !== "completed";
                        
                        return (
                          <div
                            key={task.id}
                            className={`flex items-center p-2 rounded-md ${
                              isPastDue
                                ? "bg-red-50"
                                : task.priority === "high"
                                ? "bg-yellow-50"
                                : "bg-blue-50"
                            } cursor-pointer hover:opacity-90`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div
                              className={`w-2 h-2 ${
                                isPastDue
                                  ? "bg-red-500"
                                  : task.priority === "high"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              } rounded-full`}
                            ></div>
                            <div className="ml-2">
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                              <p className="text-xs text-gray-500">
                                {isPastDue
                                  ? `Overdue: ${format(dueDate, "MMM d")}`
                                  : format(dueDate, "MMM d")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
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
