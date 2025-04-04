import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { Task } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Date range for filtering
  const startDate = timeRange === "month" 
    ? startOfMonth(currentDate) 
    : subMonths(currentDate, 3);
  const endDate = timeRange === "month" 
    ? endOfMonth(currentDate) 
    : addMonths(currentDate, 3);
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter tasks by date range
  const periodTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    const createdDate = parseISO(task.createdAt.toString());
    return createdDate >= startDate && createdDate <= endDate;
  });
  
  // Navigate through time periods
  const prevPeriod = () => {
    if (timeRange === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 3));
    }
  };
  
  const nextPeriod = () => {
    if (timeRange === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 3));
    }
  };
  
  // Calculate statistics
  const completedTasks = periodTasks.filter(task => task.status === "completed").length;
  const totalTasks = periodTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : "0";
  
  // Group tasks by status for pie chart
  const statusCounts = {
    todo: periodTasks.filter(task => task.status === "todo").length,
    inProgress: periodTasks.filter(task => task.status === "inProgress").length,
    completed: periodTasks.filter(task => task.status === "completed").length,
  };
  
  const statusPieData = [
    { name: "To Do", value: statusCounts.todo },
    { name: "In Progress", value: statusCounts.inProgress },
    { name: "Completed", value: statusCounts.completed },
  ];
  
  // Group tasks by priority for pie chart
  const priorityCounts = {
    low: periodTasks.filter(task => task.priority === "low").length,
    medium: periodTasks.filter(task => task.priority === "medium").length,
    high: periodTasks.filter(task => task.priority === "high").length,
  };
  
  const priorityPieData = [
    { name: "Low", value: priorityCounts.low },
    { name: "Medium", value: priorityCounts.medium },
    { name: "High", value: priorityCounts.high },
  ];
  
  // Prepare data for bar chart (completion by week/day)
  const getBarChartData = () => {
    // This is a simplified version - in a real app, you'd group tasks by date more precisely
    return [
      { name: "Week 1", completed: 8, total: 12 },
      { name: "Week 2", completed: 10, total: 15 },
      { name: "Week 3", completed: 7, total: 10 },
      { name: "Week 4", completed: 12, total: 14 },
    ];
  };
  
  const barChartData = getBarChartData();
  
  // Colors for charts
  const COLORS = ["#3B82F6", "#EAB308", "#22C55E", "#8B5CF6"];
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="mt-1 text-sm text-gray-600">Track task progress and productivity insights.</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Select defaultValue={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={prevPeriod}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {timeRange === "month" 
                      ? format(currentDate, "MMMM yyyy") 
                      : `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextPeriod}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button variant="outline" className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{totalTasks}</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Completed Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{completedTasks}</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{completionRate}%</div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Completion Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">2.3 days</div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="space-y-6">
              {/* Task Completion Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Trend</CardTitle>
                  <CardDescription>
                    Overview of tasks completed vs. total tasks over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-80 w-full flex items-center justify-center">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" name="Total Tasks" fill="#94A3B8" />
                          <Bar dataKey="completed" name="Completed Tasks" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Distribution Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Status Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of tasks by current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 w-full flex items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Task Priority Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Priority Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of tasks by priority level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 w-full flex items-center justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={priorityPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {priorityPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Productivity Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Productivity Insights</CardTitle>
                  <CardDescription>
                    Key performance metrics and productivity trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="individual">Individual Performance</TabsTrigger>
                      <TabsTrigger value="team">Team Performance</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Average Task Completion Time</h4>
                              <div className="text-lg font-semibold">2.3 days</div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Tasks Completed per Week</h4>
                              <div className="text-lg font-semibold">8.5</div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">On-time Completion Rate</h4>
                              <div className="text-lg font-semibold">78%</div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Overdue Tasks</h4>
                              <div className="text-lg font-semibold">4</div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Trends</h4>
                            <p className="text-sm text-gray-600">
                              Your team's productivity has increased by 12% compared to the previous month.
                              The average task completion time has decreased from 3.1 days to 2.3 days.
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="individual">
                      <div className="text-center py-8 text-gray-500">
                        Individual performance metrics will be available in the next update.
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="team">
                      <div className="text-center py-8 text-gray-500">
                        Team performance metrics will be available in the next update.
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
