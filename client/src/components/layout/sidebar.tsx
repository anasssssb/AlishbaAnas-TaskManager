import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3, 
  Calendar, 
  CheckSquare,
  LogOut, 
  Settings, 
  Users, 
  LayoutDashboard, 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
    },
    {
      title: "Tasks",
      href: "/tasks",
      icon: <CheckSquare className="mr-3 h-5 w-5" />,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: <Calendar className="mr-3 h-5 w-5" />,
    },
    {
      title: "Team",
      href: "/team",
      icon: <Users className="mr-3 h-5 w-5" />,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
    },
  ];
  
  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="hidden md:flex md:w-64 bg-gray-900 text-white flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
            />
          </svg>
          <h1 className="text-2xl font-bold">TaskFlow</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === item.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={user?.avatar || undefined} alt={user?.fullName || "User"} />
            <AvatarFallback>{user ? getUserInitials(user.fullName) : "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.fullName || "User"}</p>
            <p className="text-xs text-gray-400">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto text-gray-400 hover:text-white"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
