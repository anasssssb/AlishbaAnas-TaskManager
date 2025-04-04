import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCard from "@/components/dashboard/stats-card";
import TaskChart from "@/components/dashboard/chart";
import ActivityFeed from "@/components/dashboard/activity-feed";
import CalendarWidget from "@/components/dashboard/calendar-widget";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, CheckSquare, Clock, Timer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("week");
  
  // Fetch tasks for the dashboard
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const inProgressTasks = tasks.filter(task => task.status === "inProgress").length;
  const todoTasks = tasks.filter(task => task.status === "todo").length;
  
  // Calculate productivity score (simplified - actually would be more complex)
  const productivityScore = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;
  
  // Calculate upcoming deadlines
  const upcomingDeadlines = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const differenceInDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return differenceInDays >= 0 && differenceInDays <= 7 && task.status !== "completed";
  }).length;
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {user?.fullName || user?.username}! Here's an overview of your productivity.
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Select 
                  defaultValue={timeRange} 
                  onValueChange={setTimeRange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="default" className="flex items-center">
                  <svg 
                    className="mr-2 h-4 w-4" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export
                </Button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="Tasks Completed"
                value={completedTasks}
                icon={<CheckSquare className="h-5 w-5" />}
                iconBgColor="bg-primary-100"
                iconColor="text-primary-500"
                change={12}
                changeLabel="vs last week"
                isLoading={isLoading}
              />
              
              <StatsCard
                title="In Progress"
                value={inProgressTasks}
                icon={<Timer className="h-5 w-5" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-500"
                change={-3}
                changeLabel="vs last week"
                isLoading={isLoading}
              />
              
              <StatsCard
                title="Productivity Score"
                value={`${productivityScore}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-500"
                change={7}
                changeLabel="vs last week"
                isLoading={isLoading}
              />
              
              <StatsCard
                title="Upcoming Deadlines"
                value={upcomingDeadlines}
                icon={<Clock className="h-5 w-5" />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-500"
                change={0}
                highlight="2 urgent"
                changeLabel="in next 48 hours"
                isLoading={isLoading}
              />
            </div>
            
            {/* Charts & Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
                <TaskChart timeRange={timeRange} isLoading={isLoading} />
              </div>
              
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Task Distribution</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse h-40 w-40 rounded-full bg-gray-200"></div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="relative h-40 w-40">
                      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        {/* Task distribution pie chart */}
                        <circle r="25" cx="50" cy="50" fill="transparent" stroke="#3B82F6" strokeWidth="50" strokeDasharray={`${todoTasks / tasks.length * 100} 100`} />
                        <circle r="25" cx="50" cy="50" fill="transparent" stroke="#EAB308" strokeWidth="50" strokeDasharray={`${inProgressTasks / tasks.length * 100} 100`} strokeDashoffset={`${-1 * (todoTasks / tasks.length * 100)}`} />
                        <circle r="25" cx="50" cy="50" fill="transparent" stroke="#22C55E" strokeWidth="50" strokeDasharray={`${completedTasks / tasks.length * 100} 100`} strokeDashoffset={`${-1 * ((todoTasks + inProgressTasks) / tasks.length * 100)}`} />
                      </svg>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="h-3 w-3 bg-primary-500 rounded-full mx-auto"></div>
                    <p className="mt-1 text-gray-600">To Do</p>
                    <p className="font-semibold text-gray-900">
                      {tasks.length > 0 ? `${Math.round((todoTasks / tasks.length) * 100)}%` : '0%'}
                    </p>
                  </div>
                  <div>
                    <div className="h-3 w-3 bg-yellow-500 rounded-full mx-auto"></div>
                    <p className="mt-1 text-gray-600">In Progress</p>
                    <p className="font-semibold text-gray-900">
                      {tasks.length > 0 ? `${Math.round((inProgressTasks / tasks.length) * 100)}%` : '0%'}
                    </p>
                  </div>
                  <div>
                    <div className="h-3 w-3 bg-green-500 rounded-full mx-auto"></div>
                    <p className="mt-1 text-gray-600">Completed</p>
                    <p className="font-semibold text-gray-900">
                      {tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity & Calendar Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
                <ActivityFeed />
              </div>
              
              <div className="bg-white rounded-lg shadow">
                <CalendarWidget />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
