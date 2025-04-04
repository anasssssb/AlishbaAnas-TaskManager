import mongoose, { Schema, Document } from 'mongoose';
import {
  User, InsertUser, Task, InsertTask, 
  TaskAssignee, InsertTaskAssignee,
  Comment, InsertComment, 
  Attachment, InsertAttachment,
  TimeEntry, InsertTimeEntry,
  Notification, InsertNotification,
  Role, TaskStatus, TaskPriority
} from '@shared/schema';

// User Model
const userSchema = new Schema<User>({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
  avatar: { type: String }
});

// Task Model
const taskSchema = new Schema<Task>({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['todo', 'inProgress', 'completed'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  createdById: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  estimatedHours: { type: Number }
});

// Task Assignee Model
const taskAssigneeSchema = new Schema<TaskAssignee>({
  id: { type: Number, required: true, unique: true },
  taskId: { type: Number, required: true },
  userId: { type: Number, required: true }
});

// Comment Model
const commentSchema = new Schema<Comment>({
  id: { type: Number, required: true, unique: true },
  taskId: { type: Number, required: true },
  userId: { type: Number, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Attachment Model
const attachmentSchema = new Schema<Attachment>({
  id: { type: Number, required: true, unique: true },
  taskId: { type: Number, required: true },
  userId: { type: Number, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Time Entry Model
const timeEntrySchema = new Schema<TimeEntry>({
  id: { type: Number, required: true, unique: true },
  taskId: { type: Number, required: true },
  userId: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  notes: { type: String }
});

// Notification Model
const notificationSchema = new Schema<Notification>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  relatedId: { type: Number }
});

// Create and export models
export const UserModel = mongoose.model<User>('User', userSchema);
export const TaskModel = mongoose.model<Task>('Task', taskSchema);
export const TaskAssigneeModel = mongoose.model<TaskAssignee>('TaskAssignee', taskAssigneeSchema);
export const CommentModel = mongoose.model<Comment>('Comment', commentSchema);
export const AttachmentModel = mongoose.model<Attachment>('Attachment', attachmentSchema);
export const TimeEntryModel = mongoose.model<TimeEntry>('TimeEntry', timeEntrySchema);
export const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);