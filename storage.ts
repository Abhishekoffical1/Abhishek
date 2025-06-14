import { reminders, users, type User, type InsertUser, type Reminder, type InsertReminder } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Reminder methods
  getReminders(): Promise<Reminder[]>;
  getReminderById(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
  getRemindersByCategory(category: string): Promise<Reminder[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reminders: Map<number, Reminder>;
  private currentUserId: number;
  private currentReminderId: number;

  constructor() {
    this.users = new Map();
    this.reminders = new Map();
    this.currentUserId = 1;
    this.currentReminderId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReminderById(id: number): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = this.currentReminderId++;
    const now = new Date();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: number, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const existing = this.reminders.get(id);
    if (!existing) return undefined;

    const updated: Reminder = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.reminders.set(id, updated);
    return updated;
  }

  async deleteReminder(id: number): Promise<boolean> {
    return this.reminders.delete(id);
  }

  async getRemindersByCategory(category: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getReminders(): Promise<Reminder[]> {
    return await db.select().from(reminders).orderBy(reminders.createdAt);
  }

  async getReminderById(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder || undefined;
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values(insertReminder)
      .returning();
    return reminder;
  }

  async updateReminder(id: number, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [reminder] = await db
      .update(reminders)
      .set(updates)
      .where(eq(reminders.id, id))
      .returning();
    return reminder || undefined;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db.delete(reminders).where(eq(reminders.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRemindersByCategory(category: string): Promise<Reminder[]> {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.category, category))
      .orderBy(reminders.createdAt);
  }
}

export const storage = new DatabaseStorage();
