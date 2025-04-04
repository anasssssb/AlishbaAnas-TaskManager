import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Filter users by search term
  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group users by role
  const admins = filteredUsers.filter(user => user.role === "admin");
  const managers = filteredUsers.filter(user => user.role === "manager");
  const employees = filteredUsers.filter(user => user.role === "employee");
  
  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
  };
  
  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                <h1 className="text-2xl font-bold text-gray-900">Team</h1>
                <p className="mt-1 text-sm text-gray-600">Manage and collaborate with your team members.</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Team Members */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
                <TabsTrigger value="managers">Managers</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
              </TabsList>
              
              {/* All Users Tab */}
              <TabsContent value="all">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-10 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No team members found matching your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                      <Card key={user.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={user.avatar} alt={user.fullName} />
                              <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{user.fullName}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500">@{user.username}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Admins Tab */}
              <TabsContent value="admins">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-10 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No admins found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {admins.map((user) => (
                      <Card key={user.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={user.avatar} alt={user.fullName} />
                              <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{user.fullName}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-red-100 text-red-800">Admin</Badge>
                            <span className="text-sm text-gray-500">@{user.username}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Managers Tab */}
              <TabsContent value="managers">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-10 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : managers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No managers found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managers.map((user) => (
                      <Card key={user.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={user.avatar} alt={user.fullName} />
                              <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{user.fullName}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
                            <span className="text-sm text-gray-500">@{user.username}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Employees Tab */}
              <TabsContent value="employees">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-10 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No employees found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.map((user) => (
                      <Card key={user.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={user.avatar} alt={user.fullName} />
                              <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{user.fullName}</CardTitle>
                              <CardDescription>{user.email}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-100 text-green-800">Employee</Badge>
                            <span className="text-sm text-gray-500">@{user.username}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
