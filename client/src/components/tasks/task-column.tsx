import { DroppableProvided } from "react-beautiful-dnd";
import { Task } from "@shared/schema";
import TaskCard from "./task-card";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  color: string;
  provided: DroppableProvided;
  onTaskClick: (task: Task) => void;
}

export default function TaskColumn({
  title,
  tasks,
  color,
  provided,
  onTaskClick,
}: TaskColumnProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow"
      ref={provided.innerRef}
      {...provided.droppableProps}
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <div className={`w-3 h-3 ${color} rounded-full mr-2`}></div>
            {title}
            <span className="ml-2 text-gray-500 text-xs">({tasks.length})</span>
          </h3>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3 min-h-[500px]">
        {tasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={onTaskClick} 
          />
        ))}
        {provided.placeholder}
      </div>
    </div>
  );
}
