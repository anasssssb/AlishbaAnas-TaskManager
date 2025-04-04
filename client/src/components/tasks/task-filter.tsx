import { useRef } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FilterValues {
  search: string;
  priority: string;
  assignee: string;
  project: string;
}

interface TaskFilterProps {
  filters: FilterValues;
  setFilters: (filters: FilterValues) => void;
}

export default function TaskFilter({ filters, setFilters }: TaskFilterProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const handleSearchChange = () => {
    const searchValue = searchInputRef.current?.value || "";
    setFilters({ ...filters, search: searchValue });
  };
  
  const handlePriorityChange = (value: string) => {
    setFilters({ ...filters, priority: value });
  };
  
  const handleAssigneeChange = (value: string) => {
    setFilters({ ...filters, assignee: value });
  };
  
  const handleProjectChange = (value: string) => {
    setFilters({ ...filters, project: value });
  };
  
  const clearFilters = () => {
    setFilters({
      search: "",
      priority: "all",
      assignee: "all",
      project: "all",
    });
    
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchInputRef}
              type="text"
              className="pl-10 pr-3 py-2"
              placeholder="Search tasks..."
              defaultValue={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Select 
            value={filters.priority} 
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.assignee} 
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="me">Assigned to Me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={clearFilters}
          >
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
