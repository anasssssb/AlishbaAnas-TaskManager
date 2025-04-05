import { Dispatch, SetStateAction } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskPriority } from "@shared/schema";

interface FilterProps {
  filters: {
    search: string;
    priority: string;
    assignee: string;
    project: string;
  };
  setFilters: Dispatch<
    SetStateAction<{
      search: string;
      priority: string;
      assignee: string;
      project: string;
    }>
  >;
}

export default function TaskFilter({ filters, setFilters }: FilterProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search tasks..."
          className="pl-10"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-40">
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              setFilters({ ...filters, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {taskPriority.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignee filter would go here, but will be implemented later */}
        <div className="w-full sm:w-40">
          <Select
            value={filters.assignee}
            onValueChange={(value) =>
              setFilters({ ...filters, assignee: value })
            }
            disabled
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project filter would go here, but will be implemented later */}
        <div className="w-full sm:w-40">
          <Select
            value={filters.project}
            onValueChange={(value) =>
              setFilters({ ...filters, project: value })
            }
            disabled
          >
            <SelectTrigger>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}