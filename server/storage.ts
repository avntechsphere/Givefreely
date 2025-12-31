import { users, items, requests, messages, User, Item, Request, Message, InsertUser, InsertItem, InsertRequest, InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, data: { name?: string; location?: string; phoneNumber?: string }): Promise<User | undefined>;
  verifyEmail(userId: number): Promise<User | undefined>;

  getItems(filters?: { category?: string, search?: string }): Promise<(Item & { owner: User })[]>;
  getItem(id: number): Promise<(Item & { owner: User }) | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItemStatus(id: number, status: string): Promise<Item | undefined>;

  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: number): Promise<Request | undefined>;
  getRequestsByItem(itemId: number): Promise<(Request & { requester: User })[]>;
  updateRequestStatus(id: number, status: string): Promise<Request | undefined>;

  getMessages(requestId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: number, data: { name?: string; location?: string; phoneNumber?: string }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyEmail(userId: number): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ emailVerified: true, verificationCode: null, verificationCodeExpires: null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getItems(filters?: { category?: string, search?: string }): Promise<(Item & { owner: User })[]> {
    let conditions = [eq(items.status, "available")];

    if (filters?.category && filters.category !== "All") {
      conditions.push(eq(items.category, filters.category));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(items.title, `%${filters.search}%`),
          like(items.description, `%${filters.search}%`)
        )
      );
    }

    const query = db.select({
      id: items.id,
      userId: items.userId,
      title: items.title,
      description: items.description,
      category: items.category,
      condition: items.condition,
      location: items.location,
      status: items.status,
      images: items.images,
      createdAt: items.createdAt,
      owner: users
    })
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .where(and(...conditions))
    .orderBy(items.createdAt);

    const results = await query;
    return results.map(r => ({ ...r, owner: r.owner }));
  }

  async getItem(id: number): Promise<(Item & { owner: User }) | undefined> {
    const [result] = await db.select({
      item: items,
      owner: users
    })
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .where(eq(items.id, id));

    if (!result) return undefined;
    return { ...result.item, owner: result.owner };
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async updateItemStatus(id: number, status: string): Promise<Item | undefined> {
    const [updated] = await db.update(items).set({ status }).where(eq(items.id, id)).returning();
    return updated;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const [newRequest] = await db.insert(requests).values(request).returning();
    return newRequest;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async getRequestsByItem(itemId: number): Promise<(Request & { requester: User })[]> {
    const results = await db.select({
      request: requests,
      requester: users
    })
    .from(requests)
    .innerJoin(users, eq(requests.requesterId, users.id))
    .where(eq(requests.itemId, itemId));
    
    return results.map(r => ({ ...r.request, requester: r.requester }));
  }

  async updateRequestStatus(id: number, status: string): Promise<Request | undefined> {
    const [updated] = await db.update(requests).set({ status }).where(eq(requests.id, id)).returning();
    return updated;
  }

  async getMessages(requestId: number): Promise<(Message & { sender: User })[]> {
    const results = await db.select({
      message: messages,
      sender: users
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.requestId, requestId))
    .orderBy(messages.createdAt);
    
    return results.map(r => ({ ...r.message, sender: r.sender }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
