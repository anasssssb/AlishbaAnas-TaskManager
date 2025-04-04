import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, roles } from "@shared/schema";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form schema
  const profileSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
  });
  
  // Notification settings schema
  const notificationSchema = z.object({
    emailNotifications: z.boolean(),
    taskAssignments: z.boolean(),
    taskUpdates: z.boolean(),
    deadlineReminders: z.boolean(),
    teamUpdates: z.boolean(),
  });
  
  // Create profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
      bio: "",
      location: "",
      website: "",
    },
  });
  
  // Create notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      taskAssignments: true,
      taskUpdates: true,
      deadlineReminders: true,
      teamUpdates: false,
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PUT", `/api/users/${user!.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      // In a real app, this would call an API endpoint to update notification settings
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle profile form submission
  const onSubmitProfile = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle notification settings form submission
  const onSubmitNotifications = (data: z.infer<typeof notificationSchema>) => {
    updateNotificationsMutation.mutate(data);
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase();
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
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
              <Card>
                <CardContent className="p-4">
                  <Tabs 
                    defaultValue="profile" 
                    orientation="vertical"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="h-full"
                  >
                    <TabsList className="flex flex-col h-full items-stretch bg-transparent border-r-0">
                      <TabsTrigger
                        value="profile"
                        className="justify-start px-2 data-[state=active]:bg-gray-100"
                      >
                        Profile
                      </TabsTrigger>
                      <TabsTrigger
                        value="account"
                        className="justify-start px-2 data-[state=active]:bg-gray-100"
                      >
                        Account
                      </TabsTrigger>
                      <TabsTrigger
                        value="notifications"
                        className="justify-start px-2 data-[state=active]:bg-gray-100"
                      >
                        Notifications
                      </TabsTrigger>
                      <TabsTrigger
                        value="security"
                        className="justify-start px-2 data-[state=active]:bg-gray-100"
                      >
                        Security
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                {/* Profile Settings */}
                {activeTab === "profile" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>
                        Manage your public profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                          <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage 
                                  src={profileForm.watch("avatar")} 
                                  alt={user?.fullName} 
                                />
                                <AvatarFallback className="text-lg">
                                  {user ? getUserInitials(user.fullName) : "U"}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <h3 className="text-sm font-medium">Profile Picture</h3>
                                <p className="text-sm text-gray-500">
                                  Update your profile picture
                                </p>
                                <div className="mt-2">
                                  <Button variant="outline" size="sm">
                                    Upload
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={profileForm.control}
                              name="bio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bio</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Tell us about yourself" 
                                      className="resize-none"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Brief description for your profile.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={profileForm.control}
                                name="location"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="e.g. San Francisco, CA" 
                                        {...field}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="website"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Website</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="https://example.com" 
                                        {...field}
                                        value={field.value || ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex justify-end">
                              <Button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                              >
                                {updateProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
                
                {/* Account Settings */}
                {activeTab === "account" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Account</CardTitle>
                      <CardDescription>
                        Manage your account settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium">Account Information</h3>
                          <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-gray-500">Username</div>
                                <div className="mt-1 text-sm">{user?.username}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-500">Role</div>
                                <div className="mt-1 text-sm capitalize">{user?.role}</div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-gray-500">Account Status</div>
                              <div className="mt-1 flex items-center">
                                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium">Delete Account</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <div className="mt-4">
                            <Button variant="destructive">Delete Account</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Notification Settings */}
                {activeTab === "notifications" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>
                        Manage how you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...notificationForm}>
                        <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)}>
                          <div className="space-y-6">
                            <FormField
                              control={notificationForm.control}
                              name="emailNotifications"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Email Notifications</FormLabel>
                                    <FormDescription>
                                      Receive email notifications for all activities
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <div className="space-y-4">
                              <h3 className="text-lg font-medium">Notification Preferences</h3>
                              
                              <FormField
                                control={notificationForm.control}
                                name="taskAssignments"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Task Assignments</FormLabel>
                                      <FormDescription>
                                        Get notified when you are assigned to a task
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={notificationForm.control}
                                name="taskUpdates"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Task Updates</FormLabel>
                                      <FormDescription>
                                        Get notified when a task you created or are assigned to is updated
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={notificationForm.control}
                                name="deadlineReminders"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Deadline Reminders</FormLabel>
                                      <FormDescription>
                                        Get reminders about upcoming deadlines for your tasks
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={notificationForm.control}
                                name="teamUpdates"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">Team Updates</FormLabel>
                                      <FormDescription>
                                        Get notified about general team announcements and updates
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex justify-end">
                              <Button
                                type="submit"
                                disabled={updateNotificationsMutation.isPending}
                              >
                                {updateNotificationsMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}
                
                {/* Security Settings */}
                {activeTab === "security" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>
                        Manage your security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium">Change Password</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Update your password to keep your account secure
                          </p>
                          <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                                  Current Password
                                </label>
                                <Input 
                                  id="current-password" 
                                  type="password" 
                                  className="mt-1" 
                                  placeholder="Enter current password"
                                />
                              </div>
                              <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                  New Password
                                </label>
                                <Input 
                                  id="new-password" 
                                  type="password" 
                                  className="mt-1" 
                                  placeholder="Enter new password"
                                />
                              </div>
                              <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                  Confirm New Password
                                </label>
                                <Input 
                                  id="confirm-password" 
                                  type="password" 
                                  className="mt-1" 
                                  placeholder="Confirm new password"
                                />
                              </div>
                            </div>
                            <div>
                              <Button>Update Password</Button>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                          <div className="mt-4">
                            <Button variant="outline">Enable Two-Factor Authentication</Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium">Sessions</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Manage your active sessions
                          </p>
                          <div className="mt-4">
                            <div className="bg-gray-50 p-4 rounded-md border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">Current Session</p>
                                  <p className="text-xs text-gray-500">Started: {new Date().toLocaleString()}</p>
                                </div>
                                <Button variant="outline" size="sm">Log Out</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
