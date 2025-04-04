import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for different time ranges
// In a real app, this would be fetched from the backend
const chartData = {
  week: [
    { name: "Mon", completed: 5, total: 8 },
    { name: "Tue", completed: 7, total: 10 },
    { name: "Wed", completed: 3, total: 5 },
    { name: "Thu", completed: 6, total: 8 },
    { name: "Fri", completed: 8, total: 11 },
    { name: "Sat", completed: 4, total: 4 },
    { name: "Sun", completed: 2, total: 3 },
  ],
  month: [
    { name: "Week 1", completed: 18, total: 25 },
    { name: "Week 2", completed: 22, total: 30 },
    { name: "Week 3", completed: 17, total: 22 },
    { name: "Week 4", completed: 24, total: 30 },
  ],
  quarter: [
    { name: "Jan", completed: 65, total: 85 },
    { name: "Feb", completed: 72, total: 95 },
    { name: "Mar", completed: 80, total: 100 },
  ],
  year: [
    { name: "Q1", completed: 220, total: 280 },
    { name: "Q2", completed: 250, total: 320 },
    { name: "Q3", completed: 280, total: 350 },
    { name: "Q4", completed: 300, total: 380 },
  ],
};

interface TaskChartProps {
  timeRange: string;
  isLoading?: boolean;
}

export default function TaskChart({ timeRange, isLoading = false }: TaskChartProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  
  const data = chartData[timeRange as keyof typeof chartData] || chartData.week;
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          <p className="text-green-600">
            Completed: {payload[0].value}
          </p>
          <p className="text-gray-500">
            Total: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };
  
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }
    
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="total" name="Total" stroke="#94A3B8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" fill="#E2E8F0" stroke="#94A3B8" />
              <Area type="monotone" dataKey="completed" name="Completed" fill="#BFDBFE" stroke="#3B82F6" />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total Tasks" fill="#94A3B8" />
              <Bar dataKey="completed" name="Completed Tasks" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Task Completion Trend</h3>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              chartType === "bar"
                ? "bg-primary-100 text-primary-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setChartType("bar")}
          >
            Bar
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              chartType === "line"
                ? "bg-primary-100 text-primary-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              chartType === "area"
                ? "bg-primary-100 text-primary-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setChartType("area")}
          >
            Area
          </button>
        </div>
      </div>
      {renderChart()}
    </>
  );
}
