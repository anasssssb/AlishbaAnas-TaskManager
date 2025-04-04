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
import createMemoryStore from "memorystore";
import session from "express-session";

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
  sessionStore: session.SessionStore;
}

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;

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
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create a default admin user
    this.createUser({
      username: "admin",
      password: "admin123", // This will be hashed in the auth layer
      email: "admin@taskflow.com",
      fullName: "Admin User",
      role: "admin",
      avatar: "",
    });
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
    const user: User = { ...insertUser, id };
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
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now 
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
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
  
  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.timeEntryId++;
    const timeEntry: TimeEntry = { ...insertTimeEntry, id };
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
      isRead: false
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

export const storage = new MemStorage();
