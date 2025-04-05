import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema, insertCommentSchema, Task, insertNotificationSchema } from "@shared/schema";
import { validateRequest } from "zod-express-middleware";
import { z } from "zod";

// WebSocket clients map
type WebSocketClient = {
  userId: number;
  socket: WebSocket;
};

// Global variable to hold WebSocket clients
const wsClients: WebSocketClient[] = [];

// WebSocket message types
export type WebSocketMessage = {
  type: 'task_update' | 'comment_added' | 'notification' | 'task_assigned' | 'time_entry_added';
  payload: any;
};

// Function to broadcast message to all connected clients
export function broadcastMessage(message: WebSocketMessage, excludeUserId?: number) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN && (!excludeUserId || client.userId !== excludeUserId)) {
      client.socket.send(messageStr);
    }
  });
}

// Function to send a message to a specific user
export function sendMessageToUser(userId: number, message: WebSocketMessage) {
  const messageStr = JSON.stringify(message);
  const userClients = wsClients.filter(client => client.userId === userId);
  
  userClients.forEach(client => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(messageStr);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Tasks API
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  app.post("/api/tasks", validateRequest({ body: insertTaskSchema }), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    
    try {
      console.log("Creating task with data:", req.body);
      
      const task = await storage.createTask({
        ...req.body,
        createdById: userId,
      });
      
      // Broadcast to all clients about new task
      broadcastMessage({
        type: 'task_update',
        payload: { action: 'created', task }
      });
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task", error: (error as Error).message });
    }
  });

  app.put("/api/tasks/:id", validateRequest({ 
    body: insertTaskSchema
      .extend({
        status: z.enum(["todo", "inProgress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      })
      .partial() 
  }), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    
    try {
      // Ensure the request has valid data
      console.log("Updating task:", taskId, "with data:", req.body);
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Broadcast task update
      broadcastMessage({
        type: 'task_update',
        payload: { action: 'updated', task: updatedTask }
      });
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task", error: (error as Error).message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const success = await storage.deleteTask(taskId);
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    // Broadcast task deletion
    broadcastMessage({
      type: 'task_update',
      payload: { action: 'deleted', taskId }
    });
    
    res.status(204).send();
  });

  // Task Assignees
  app.post("/api/tasks/:id/assignees", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const { userId } = req.body;
    
    const assignee = await storage.assignTaskToUser(taskId, userId);
    const task = await storage.getTask(taskId);
    
    if (task) {
      // Create notification for assigned user
      const notification = await storage.createNotification({
        userId,
        type: 'task_assigned',
        title: 'New Task Assignment',
        message: `You have been assigned to task: ${task.title}`,
        relatedId: taskId
      });
      
      // Send real-time notification to the assigned user
      sendMessageToUser(userId, {
        type: 'notification',
        payload: notification
      });
      
      // Broadcast assignment to all clients
      broadcastMessage({
        type: 'task_assigned',
        payload: { taskId, userId, task }
      });
    }
    
    res.status(201).json(assignee);
  });

  app.delete("/api/tasks/:taskId/assignees/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.taskId);
    const userId = parseInt(req.params.userId);
    
    const success = await storage.removeTaskAssignee(taskId, userId);
    if (!success) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.status(204).send();
  });

  // Comments
  app.get("/api/tasks/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const comments = await storage.getCommentsByTaskId(taskId);
    res.json(comments);
  });

  app.post("/api/tasks/:id/comments", validateRequest({ body: insertCommentSchema }), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const comment = await storage.createComment({
      ...req.body,
      taskId,
      userId,
    });
    
    // Get task and assignees for notifications
    const task = await storage.getTask(taskId);
    const assignees = await storage.getTaskAssignees(taskId);
    
    if (task) {
      // Broadcast the new comment to all clients
      broadcastMessage({
        type: 'comment_added',
        payload: { comment, task }
      }, userId); // Don't send to the comment author
      
      // Notify task assignees
      for (const assignee of assignees) {
        // Don't notify the comment author
        if (assignee.userId !== userId) {
          const notification = await storage.createNotification({
            userId: assignee.userId,
            type: 'comment_added',
            title: 'New Comment',
            message: `New comment on task: ${task.title}`,
            relatedId: taskId
          });
          
          // Send real-time notification
          sendMessageToUser(assignee.userId, {
            type: 'notification',
            payload: notification
          });
        }
      }
    }
    
    res.status(201).json(comment);
  });

  // Time entries
  app.get("/api/timeEntries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In a real app, you might want to filter by user or date range
    const timeEntries = await storage.getTimeEntriesByUserId(req.user!.id);
    res.json(timeEntries);
  });

  app.get("/api/tasks/:id/time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const timeEntries = await storage.getTimeEntriesByTaskId(taskId);
    res.json(timeEntries);
  });
  
  app.post("/api/tasks/:id/time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const timeEntry = await storage.createTimeEntry({
      ...req.body,
      taskId,
      userId,
    });
    
    // Get task and assignees for notifications
    const task = await storage.getTask(taskId);
    const assignees = await storage.getTaskAssignees(taskId);
    
    if (task) {
      // Broadcast time entry creation via WebSocket
      broadcastMessage({
        type: 'time_entry_added',
        payload: { 
          taskId,
          userId,
          timeEntry,
          task
        }
      });
      
      // Notify task assignees and creator (if different from current user)
      const notifyUsers = [...assignees.map(a => a.userId)];
      if (task.createdById !== userId && !notifyUsers.includes(task.createdById)) {
        notifyUsers.push(task.createdById);
      }
      
      // Create and send notifications
      for (const notifyUserId of notifyUsers) {
        if (notifyUserId !== userId) { // Don't notify the time entry creator
          const notification = await storage.createNotification({
            userId: notifyUserId,
            type: 'time_tracked',
            title: 'Time Entry Added',
            message: `New time entry logged for task: ${task.title}`,
            relatedId: taskId
          });
          
          // Send real-time notification
          sendMessageToUser(notifyUserId, {
            type: 'notification',
            payload: notification
          });
        }
      }
    }
    
    res.status(201).json(timeEntry);
  });

  // Users
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getUsers();
    res.json(users);
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const notifications = await storage.getNotificationsByUserId(userId);
    res.json(notifications);
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notificationId = parseInt(req.params.id);
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(updatedNotification);
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server on a different path to avoid conflict with Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    // Extract session ID from cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};
    
    // Authentication based on session cookie
    const sessionId = cookies['connect.sid'];
    
    if (!sessionId) {
      ws.close(1008, 'Unauthorized');
      return;
    }
    
    // Add a temporary client ID
    let userId: number | undefined;
    
    // Get session data and user from session store
    storage.sessionStore.get(sessionId.slice(2).split('.')[0], (err: Error | null, session: any) => {
      if (err || !session || !session.passport || !session.passport.user) {
        ws.close(1008, 'Unauthorized');
        return;
      }
      
      userId = session.passport.user;
      
      // Register the authenticated client
      if (userId) {
        wsClients.push({ userId, socket: ws });
        
        // Send initial connection confirmation
        ws.send(JSON.stringify({ type: 'connected', payload: { userId } }));
      }
    });
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        // Process messages if needed
        const data = JSON.parse(message.toString());
        console.log('Received:', data);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (userId) {
        // Remove client from the clients list
        const index = wsClients.findIndex(client => 
          client.userId === userId && client.socket === ws
        );
        
        if (index !== -1) {
          wsClients.splice(index, 1);
        }
      }
    });
  });

  return httpServer;
}
