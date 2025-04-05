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

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    
    try {
      console.log("Creating task with raw data:", req.body);
      
      // Manually extract and validate fields instead of using Zod
      // This gives us more explicit control over the types
      const { 
        title, 
        description = null, 
        status = "todo", 
        priority = "medium", 
        dueDate = null, 
        estimatedHours = null
      } = req.body;
      
      // Basic validation
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Title is required and must be a string" });
      }
      
      if (status && !["todo", "inProgress", "completed"].includes(status)) {
        return res.status(400).json({ message: "Status must be one of: todo, inProgress, completed" });
      }
      
      if (priority && !["low", "medium", "high"].includes(priority)) {
        return res.status(400).json({ message: "Priority must be one of: low, medium, high" });
      }
      
      // Process date if present
      let processedDueDate = null;
      if (dueDate) {
        try {
          processedDueDate = new Date(dueDate);
          if (isNaN(processedDueDate.getTime())) {
            return res.status(400).json({ message: "Invalid date format for dueDate" });
          }
        } catch (e) {
          return res.status(400).json({ message: "Invalid date format for dueDate" });
        }
      }
      
      // Process estimatedHours if present
      let processedEstimatedHours = null;
      if (estimatedHours !== null && estimatedHours !== undefined) {
        const hours = Number(estimatedHours);
        if (isNaN(hours)) {
          return res.status(400).json({ message: "estimatedHours must be a number" });
        }
        processedEstimatedHours = hours;
      }
      
      // Create properly typed task object
      const taskData = {
        title,
        description,
        status, 
        priority,
        dueDate: processedDueDate,
        estimatedHours: processedEstimatedHours,
        createdById: userId
      };
      
      console.log("Creating task with processed data:", taskData);
      
      const task = await storage.createTask(taskData);
      
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

  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    
    try {
      console.log("Updating task:", taskId, "with raw data:", req.body);
      
      // Get the existing task first
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Extract fields with type safety
      const update: Partial<Task> = {};
      
      // Title
      if ('title' in req.body && req.body.title !== undefined) {
        if (typeof req.body.title !== 'string') {
          return res.status(400).json({ message: "Title must be a string" });
        }
        update.title = req.body.title;
      }
      
      // Description
      if ('description' in req.body) {
        if (req.body.description !== null && req.body.description !== undefined && 
            typeof req.body.description !== 'string') {
          return res.status(400).json({ message: "Description must be a string or null" });
        }
        update.description = req.body.description;
      }
      
      // Status
      if ('status' in req.body && req.body.status !== undefined) {
        if (!["todo", "inProgress", "completed"].includes(req.body.status)) {
          return res.status(400).json({ message: "Status must be one of: todo, inProgress, completed" });
        }
        update.status = req.body.status;
      }
      
      // Priority
      if ('priority' in req.body && req.body.priority !== undefined) {
        if (!["low", "medium", "high"].includes(req.body.priority)) {
          return res.status(400).json({ message: "Priority must be one of: low, medium, high" });
        }
        update.priority = req.body.priority;
      }
      
      // Due Date
      if ('dueDate' in req.body) {
        if (req.body.dueDate !== null && req.body.dueDate !== undefined) {
          try {
            const date = new Date(req.body.dueDate);
            if (isNaN(date.getTime())) {
              return res.status(400).json({ message: "Invalid date format for dueDate" });
            }
            update.dueDate = date;
          } catch (e) {
            return res.status(400).json({ message: "Invalid date format for dueDate" });
          }
        } else {
          update.dueDate = null;
        }
      }
      
      // Estimated Hours
      if ('estimatedHours' in req.body) {
        if (req.body.estimatedHours !== null && req.body.estimatedHours !== undefined) {
          const hours = Number(req.body.estimatedHours);
          if (isNaN(hours)) {
            return res.status(400).json({ message: "estimatedHours must be a number" });
          }
          update.estimatedHours = hours;
        } else {
          update.estimatedHours = null;
        }
      }
      
      console.log("Updating task with processed data:", update);
      
      const updatedTask = await storage.updateTask(taskId, update);
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
