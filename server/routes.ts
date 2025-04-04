import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema, insertCommentSchema, Task } from "@shared/schema";
import { validateRequest } from "zod-express-middleware";

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
    const task = await storage.createTask({
      ...req.body,
      createdById: userId,
    });
    res.status(201).json(task);
  });

  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const updatedTask = await storage.updateTask(taskId, req.body);
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(updatedTask);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const success = await storage.deleteTask(taskId);
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(204).send();
  });

  // Task Assignees
  app.post("/api/tasks/:id/assignees", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const { userId } = req.body;
    
    const assignee = await storage.assignTaskToUser(taskId, userId);
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
    res.status(201).json(comment);
  });

  // Time entries
  app.post("/api/tasks/:id/time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const taskId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const timeEntry = await storage.createTimeEntry({
      ...req.body,
      taskId,
      userId,
    });
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

  return httpServer;
}
