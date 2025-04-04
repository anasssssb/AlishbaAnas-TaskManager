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
  InsertNotification
} from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import { 
  UserModel, 
  TaskModel, 
  TaskAssigneeModel, 
  CommentModel, 
  AttachmentModel, 
  TimeEntryModel, 
  NotificationModel 
} from "./models";
import { log } from "./vite";

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
    });
  }
  
  async initialize(): Promise<void> {
    // Connect to MongoDB
    await connectToDatabase();
    
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
    const user: User = { ...insertUser, id };
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
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now 
    };
    await TaskModel.create(task);
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    const updatedTask = await TaskModel.findOneAndUpdate(
      { id }, 
      { $set: taskUpdate }, 
      { new: true }
    ).lean();
    
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
  
  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = await this.counter.getNextId('timeEntries');
    const timeEntry: TimeEntry = { ...insertTimeEntry, id };
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
      isRead: false
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

export const storage = new DatabaseStorage();
