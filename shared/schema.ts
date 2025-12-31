import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // email or phone
  password: text("password").notNull(),
  name: text("name").notNull(),
  location: text("location"),
  phoneNumber: text("phone_number"),
  emailPrivate: boolean("email_private").default(true),
  phonePrivate: boolean("phone_private").default(true),
  reputation: integer("reputation").default(0),
  givenCount: integer("given_count").default(0),
  receivedCount: integer("received_count").default(0),
  emailVerified: boolean("email_verified").default(false),
  verificationCode: text("verification_code"),
  verificationCodeExpires: timestamp("verification_code_expires"),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // references users.id
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  location: text("location").notNull(),
  status: text("status").default("available"), // available, reserved, given
  images: jsonb("images").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(), // references items.id
  requesterId: integer("requester_id").notNull(), // references users.id
  message: text("message"),
  status: text("status").default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(), // references requests.id
  senderId: integer("sender_id").notNull(), // references users.id
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  requests: many(requests),
  messages: many(messages),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  owner: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  requests: many(requests),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  item: one(items, {
    fields: [requests.itemId],
    references: [items.id],
  }),
  requester: one(users, {
    fields: [requests.requesterId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  request: one(requests, {
    fields: [messages.requestId],
    references: [requests.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  reputation: true, 
  givenCount: true, 
  receivedCount: true 
});

export const insertItemSchema = createInsertSchema(items).omit({ 
  id: true, 
  userId: true, 
  createdAt: true 
});

export const insertRequestSchema = createInsertSchema(requests).omit({ 
  id: true, 
  requesterId: true, 
  status: true,
  createdAt: true 
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  senderId: true, 
  createdAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
