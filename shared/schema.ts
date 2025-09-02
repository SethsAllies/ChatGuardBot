import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const botSessions = pgTable("bot_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number"),
  status: text("status").notNull().default("disconnected"), // connected, disconnected, connecting, error
  connectedAt: timestamp("connected_at"),
  sessionData: jsonb("session_data"),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groups = pgTable("groups", {
  id: text("id").primaryKey(), // WhatsApp group ID
  name: text("name").notNull(),
  memberCount: integer("member_count").default(0),
  isAdmin: boolean("is_admin").default(false),
  moderationEnabled: boolean("moderation_enabled").default(true),
  antiSpam: boolean("anti_spam").default(true),
  antiLink: boolean("anti_link").default(false),
  welcomeMessage: text("welcome_message"),
  farewellMessage: text("farewell_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commands = pgTable("commands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // moderation, music, utility
  enabled: boolean("enabled").default(true),
  adminOnly: boolean("admin_only").default(false),
  usage: text("usage"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: text("level").notNull(), // info, warning, error
  source: text("source").notNull(), // whatsapp, commands, music, system
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const musicQueue = pgTable("music_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist"),
  url: text("url").notNull(),
  requestedBy: text("requested_by").notNull(),
  position: integer("position").notNull(),
  status: text("status").notNull().default("queued"), // queued, playing, completed, skipped
  createdAt: timestamp("created_at").defaultNow(),
});

export const stats = pgTable("stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activeGroups: integer("active_groups").default(0),
  commandsToday: integer("commands_today").default(0),
  musicRequests: integer("music_requests").default(0),
  uptime: text("uptime").default("0%"),
  date: timestamp("date").defaultNow(),
});

// Insert schemas
export const insertBotSessionSchema = createInsertSchema(botSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCommandSchema = createInsertSchema(commands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  createdAt: true,
});

export const insertMusicQueueSchema = createInsertSchema(musicQueue).omit({
  id: true,
  createdAt: true,
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
  date: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BotSession = typeof botSessions.$inferSelect;
export type InsertBotSession = z.infer<typeof insertBotSessionSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Command = typeof commands.$inferSelect;
export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type MusicQueue = typeof musicQueue.$inferSelect;
export type InsertMusicQueue = z.infer<typeof insertMusicQueueSchema>;
export type Stats = typeof stats.$inferSelect;
export type InsertStats = z.infer<typeof insertStatsSchema>;
