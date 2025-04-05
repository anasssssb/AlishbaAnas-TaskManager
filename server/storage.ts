import { 
  User, 
  InsertUser, 
  Task, 
  InsertTask, 
  TaskAssignee, 
  InsertTaskAssignee,
  Comment,
  InsertComment,
  Attachment,
  InsertAttachment,
  TimeEntry,
  InsertTimeEntry,
  Notification,
  InsertNotification,
  roles,
  taskStatus,
  taskPriority,
  TaskStatus,
  TaskPriority
} from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";
import createMemoryStore from "memorystore";
import mongoose from "mongoose";
import { connectToDatabase, getConnection } from "./db";
import { log } from "./vite";
import { 
  UserModel, 
  TaskModel, 
  TaskAssigneeModel, 
  CommentModel, 
  AttachmentModel, 
  TimeEntryModel, 
  NotificationModel 
} from "./models";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Task Assignees
  getTaskAssignees(taskId: number): Promise<TaskAssignee[]>;
  assignTaskToUser(taskId: number, userId: number): Promise<TaskAssignee>;
  removeTaskAssignee(taskId: number, userId: number): Promise<boolean>;
  
  // Comments
  getCommentsByTaskId(taskId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Attachments
  getAttachmentsByTaskId(taskId: number): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  
  // Time Entries
  getTimeEntriesByTaskId(taskId: number): Promise<TimeEntry[]>;
  getTimeEntriesByUserId(userId: number): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  
  // Notifications
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Session store
  sessionStore: any;
  
  // Initialize the connection
  initialize(): Promise<void>;
}

// Counter for auto-incrementing IDs
class Counter {
  private counters: Map<string, number>;
  
  constructor() {
    this.counters = new Map();
  }
  
  async getNextId(collection: string): Promise<number> {
    let currentId = this.counters.get(collection) || 0;
    currentId++;
    this.counters.set(collection, currentId);
    return currentId;
  }
}

export class DatabaseStorage implements IStorage {
  private counter: Counter;
  sessionStore: any;
  
  constructor() {
    this.counter = new Counter();
    
    // Create MongoDB session store
    this.sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager',
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: 'native',
      touchAfter: 24 * 3600, // 24 hours
    });
  }
  
  async initialize(): Promise<void> {
    // Connect to MongoDB
    const connection = await connectToDatabase();
    if (!connection) {
      throw new Error("MongoDB connection failed");
    }
    
    try {
      // Check if we need to create a default admin user
      const adminUser = await this.getUserByUsername("admin");
      if (!adminUser) {
        log("Creating default admin user...", "mongodb");
        await this.createUser({
          username: "admin",
          password: "admin123", // This will be hashed in the auth layer
          email: "admin@taskflow.com",
          fullName: "Admin User",
          role: "admin",
          avatar: "",
        });
      }
    } catch (error) {
      log(`Error during database initialization: ${error}`, "mongodb");
      throw new Error(`Failed to initialize database storage: ${error}`);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).lean();
    return user || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user || undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = await this.counter.getNextId('users');
    // Cast to proper type and ensure default values
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role as "admin" | "manager" | "employee", 
      avatar: insertUser.avatar || null 
    };
    await UserModel.create(user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await UserModel.find().lean();
  }
  
  // Task methods
  async getTasks(): Promise<Task[]> {
    return await TaskModel.find().lean();
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    const task = await TaskModel.findOne({ id }).lean();
    return task || undefined;
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = await this.counter.getNextId('tasks');
    const now = new Date();
    
    // Create a properly typed task object
    const task: Task = {
      id,
      title: insertTask.title,
      status: insertTask.status as "todo" | "inProgress" | "completed",
      priority: insertTask.priority as "low" | "medium" | "high",
      createdAt: now,
      createdById: insertTask.createdById,
      description: insertTask.description ?? null,
      dueDate: insertTask.dueDate ?? null,
      estimatedHours: insertTask.estimatedHours ?? null
    };
    
    await TaskModel.create(task);
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    // Log the update
    console.log("Updating task in storage:", id, JSON.stringify(taskUpdate));
    
    // Handle date objects for Mongoose
    let update = { ...taskUpdate };
    
    // Handle any date conversions needed for MongoDB
    if ('dueDate' in update && update.dueDate !== null && typeof update.dueDate === 'string') {
      update.dueDate = new Date(update.dueDate);
    }
    
    const updatedTask = await TaskModel.findOneAndUpdate(
      { id }, 
      { $set: update }, 
      { new: true }
    ).lean();
    
    console.log("Task after update:", updatedTask);
    return updatedTask || undefined;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const result = await TaskModel.deleteOne({ id });
    return result.deletedCount > 0;
  }
  
  // Task Assignee methods
  async getTaskAssignees(taskId: number): Promise<TaskAssignee[]> {
    return await TaskAssigneeModel.find({ taskId }).lean();
  }
  
  async assignTaskToUser(taskId: number, userId: number): Promise<TaskAssignee> {
    const id = await this.counter.getNextId('taskAssignees');
    const assignee: TaskAssignee = { id, taskId, userId };
    await TaskAssigneeModel.create(assignee);
    return assignee;
  }
  
  async removeTaskAssignee(taskId: number, userId: number): Promise<boolean> {
    const result = await TaskAssigneeModel.deleteOne({ taskId, userId });
    return result.deletedCount > 0;
  }
  
  // Comment methods
  async getCommentsByTaskId(taskId: number): Promise<Comment[]> {
    return await CommentModel.find({ taskId })
      .sort({ createdAt: 1 }) // Ascending order by creation time
      .lean();
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = await this.counter.getNextId('comments');
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    await CommentModel.create(comment);
    return comment;
  }
  
  // Attachment methods
  async getAttachmentsByTaskId(taskId: number): Promise<Attachment[]> {
    return await AttachmentModel.find({ taskId })
      .sort({ createdAt: 1 }) // Ascending order by creation time
      .lean();
  }
  
  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const id = await this.counter.getNextId('attachments');
    const now = new Date();
    const attachment: Attachment = { ...insertAttachment, id, createdAt: now };
    await AttachmentModel.create(attachment);
    return attachment;
  }
  
  // Time Entry methods
  async getTimeEntriesByTaskId(taskId: number): Promise<TimeEntry[]> {
    return await TimeEntryModel.find({ taskId })
      .sort({ startTime: 1 }) // Ascending order by start time
      .lean();
  }
  
  async getTimeEntriesByUserId(userId: number): Promise<TimeEntry[]> {
    return await TimeEntryModel.find({ userId })
      .sort({ startTime: -1 }) // Descending order by start time (newest first)
      .lean();
  }
  
  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = await this.counter.getNextId('timeEntries');
    // Ensure proper typing
    const timeEntry: TimeEntry = { 
      ...insertTimeEntry, 
      id,
      endTime: insertTimeEntry.endTime ?? null,
      duration: insertTimeEntry.duration ?? null,
      notes: insertTimeEntry.notes ?? null
    };
    await TimeEntryModel.create(timeEntry);
    return timeEntry;
  }
  
  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await NotificationModel.find({ userId })
      .sort({ createdAt: -1 }) // Descending order by creation time (newest first)
      .lean();
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = await this.counter.getNextId('notifications');
    const now = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: now,
      isRead: false,
      relatedId: insertNotification.relatedId ?? null
    };
    await NotificationModel.create(notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const updatedNotification = await NotificationModel.findOneAndUpdate(
      { id }, 
      { $set: { isRead: true } }, 
      { new: true }
    ).lean();
    
    return updatedNotification || undefined;
  }
}

// Use in-memory storage as a fallback if MongoDB is not available
export class StorageFactory {
  private static instance: IStorage;

  static async getStorage(): Promise<IStorage> {
    if (!this.instance) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          const dbStorage = new DatabaseStorage();
          try {
            await dbStorage.initialize();
            this.instance = dbStorage;
            log("Using MongoDB for storage", "storage");
          } catch (initError) {
            log(`Error initializing MongoDB storage: ${initError}, using in-memory storage`, "storage");
            const memStorage = new MemStorage();
            await memStorage.initialize();
            this.instance = memStorage;
          }
        } else {
          this.instance = new MemStorage();
          await this.instance.initialize();
          log("Using in-memory storage as fallback", "storage");
        }
      } catch (error) {
        log(`Error initializing storage: ${error}, using in-memory storage`, "storage");
        this.instance = new MemStorage();
        await this.instance.initialize();
      }
    }
    return this.instance;
  }
}

// MemStorage implementation for fallback
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private taskAssignees: Map<number, TaskAssignee>;
  private comments: Map<number, Comment>;
  private attachments: Map<number, Attachment>;
  private timeEntries: Map<number, TimeEntry>;
  private notifications: Map<number, Notification>;
  
  // Counters for IDs
  private userId: number;
  private taskId: number;
  private assigneeId: number;
  private commentId: number;
  private attachmentId: number;
  private timeEntryId: number;
  private notificationId: number;
  
  // Session store
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.taskAssignees = new Map();
    this.comments = new Map();
    this.attachments = new Map();
    this.timeEntries = new Map();
    this.notifications = new Map();
    
    this.userId = 1;
    this.taskId = 1;
    this.assigneeId = 1;
    this.commentId = 1;
    this.attachmentId = 1;
    this.timeEntryId = 1;
    this.notificationId = 1;
    
    // Create in-memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async initialize(): Promise<void> {
    // Create a default admin user
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      log("Creating default admin user in memory storage...", "storage");
      await this.createUser({
        username: "admin",
        password: "admin123", // This will be hashed in the auth layer
        email: "admin@taskflow.com",
        fullName: "Admin User",
        role: "admin",
        avatar: "",
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Cast to proper type and ensure default values
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role as "admin" | "manager" | "employee", 
      avatar: insertUser.avatar || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const now = new Date();
    
    // Create a properly typed task object
    const task: Task = {
      id,
      title: insertTask.title,
      status: insertTask.status as "todo" | "inProgress" | "completed",
      priority: insertTask.priority as "low" | "medium" | "high",
      createdAt: now,
      createdById: insertTask.createdById,
      description: insertTask.description ?? null,
      dueDate: insertTask.dueDate ?? null,
      estimatedHours: insertTask.estimatedHours ?? null
    };
    
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    console.log("Updating task in MemStorage:", id, JSON.stringify(taskUpdate));
    
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    // Handle any date conversions needed for consistency with MongoDB implementation
    let update = { ...taskUpdate };
    if ('dueDate' in update && update.dueDate !== null && typeof update.dueDate === 'string') {
      update.dueDate = new Date(update.dueDate);
    }
    
    const updatedTask = { ...task, ...update };
    this.tasks.set(id, updatedTask);
    
    console.log("Task after update in MemStorage:", updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Task Assignee methods
  async getTaskAssignees(taskId: number): Promise<TaskAssignee[]> {
    return Array.from(this.taskAssignees.values()).filter(
      (assignee) => assignee.taskId === taskId
    );
  }
  
  async assignTaskToUser(taskId: number, userId: number): Promise<TaskAssignee> {
    const id = this.assigneeId++;
    const assignee: TaskAssignee = { id, taskId, userId };
    this.taskAssignees.set(id, assignee);
    return assignee;
  }
  
  async removeTaskAssignee(taskId: number, userId: number): Promise<boolean> {
    const assignee = Array.from(this.taskAssignees.values()).find(
      (a) => a.taskId === taskId && a.userId === userId
    );
    
    if (!assignee) return false;
    return this.taskAssignees.delete(assignee.id);
  }
  
  // Comment methods
  async getCommentsByTaskId(taskId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }
  
  // Attachment methods
  async getAttachmentsByTaskId(taskId: number): Promise<Attachment[]> {
    return Array.from(this.attachments.values())
      .filter((attachment) => attachment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const id = this.attachmentId++;
    const now = new Date();
    const attachment: Attachment = { ...insertAttachment, id, createdAt: now };
    this.attachments.set(id, attachment);
    return attachment;
  }
  
  // Time Entry methods
  async getTimeEntriesByTaskId(taskId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values())
      .filter((entry) => entry.taskId === taskId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
  
  async getTimeEntriesByUserId(userId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values())
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Newest first
  }
  
  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.timeEntryId++;
    // Ensure proper typing
    const timeEntry: TimeEntry = { 
      ...insertTimeEntry, 
      id,
      endTime: insertTimeEntry.endTime ?? null,
      duration: insertTimeEntry.duration ?? null,
      notes: insertTimeEntry.notes ?? null
    };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }
  
  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const now = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: now,
      isRead: false,
      relatedId: insertNotification.relatedId ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
}

// Export a placeholder storage object that will be initialized correctly
// Use MemStorage as a temporary placeholder during initialization
export let storage: IStorage = new MemStorage();

// Initialize the storage when this module is loaded
(async () => {
  try {
    storage = await StorageFactory.getStorage();
  } catch (error) {
    log(`Failed to initialize storage: ${error}, using default in-memory storage`, "storage");
    // storage is already set to MemStorage
  }
})().catch(error => {
  log(`Unhandled error in storage initialization: ${error}`, "storage");
});
