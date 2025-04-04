import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFilterProps {
  filters: {
    search: string;
    priority: string;
    assignee: string;
    project: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      search: string;
      priority: string;
      assignee: string;
      project: string;
    }>
  >;
}

export default function TaskFilter({ filters, setFilters }: TaskFilterProps) {
  // Fetch users for assignee filter
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            className="pl-10"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Filter Selects */}
        <div className="flex flex-1 space-x-3">
          {/* Priority Filter */}
          <div className="w-1/3">
            <Select
              value={filters.priority}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="w-1/3">
            <Select
              value={filters.assignee}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, assignee: value }))
              }
              disabled={usersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Filter (Placeholder for future implementation) */}
          <div className="w-1/3">
            <Select
              value={filters.project}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, project: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="1">Marketing</SelectItem>
                <SelectItem value="2">Development</SelectItem>
                <SelectItem value="3">Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}