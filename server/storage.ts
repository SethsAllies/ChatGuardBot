import { 
  type User, 
  type InsertUser, 
  type BotSession, 
  type InsertBotSession, 
  type Group, 
  type InsertGroup, 
  type Command, 
  type InsertCommand, 
  type Log, 
  type InsertLog, 
  type MusicQueue, 
  type InsertMusicQueue, 
  type Stats, 
  type InsertStats 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bot Sessions
  getBotSession(): Promise<BotSession | undefined>;
  createBotSession(session: InsertBotSession): Promise<BotSession>;
  updateBotSession(id: string, session: Partial<InsertBotSession>): Promise<BotSession | undefined>;
  
  // Groups
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;
  
  // Commands
  getCommands(): Promise<Command[]>;
  getCommandsByCategory(category: string): Promise<Command[]>;
  getCommand(id: string): Promise<Command | undefined>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(id: string, command: Partial<InsertCommand>): Promise<Command | undefined>;
  deleteCommand(id: string): Promise<boolean>;
  
  // Logs
  getLogs(limit?: number): Promise<Log[]>;
  getLogsByLevel(level: string, limit?: number): Promise<Log[]>;
  getLogsBySource(source: string, limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  clearLogs(): Promise<boolean>;
  
  // Music Queue
  getMusicQueue(groupId: string): Promise<MusicQueue[]>;
  addToMusicQueue(music: InsertMusicQueue): Promise<MusicQueue>;
  updateMusicQueueItem(id: string, music: Partial<InsertMusicQueue>): Promise<MusicQueue | undefined>;
  removeMusicQueueItem(id: string): Promise<boolean>;
  clearMusicQueue(groupId: string): Promise<boolean>;
  
  // Stats
  getStats(): Promise<Stats | undefined>;
  updateStats(stats: InsertStats): Promise<Stats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private botSessions: Map<string, BotSession>;
  private groups: Map<string, Group>;
  private commands: Map<string, Command>;
  private logs: Log[];
  private musicQueue: Map<string, MusicQueue>;
  private stats: Stats | undefined;

  constructor() {
    this.users = new Map();
    this.botSessions = new Map();
    this.groups = new Map();
    this.commands = new Map();
    this.logs = [];
    this.musicQueue = new Map();
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize default commands
    const defaultCommands = [
      { name: "/kick", description: "Remove member from group", category: "moderation", enabled: true, adminOnly: true, usage: "/kick @user" },
      { name: "/mute", description: "Mute/unmute member", category: "moderation", enabled: true, adminOnly: true, usage: "/mute @user [duration]" },
      { name: "/promote", description: "Promote to admin", category: "moderation", enabled: true, adminOnly: true, usage: "/promote @user" },
      { name: "/demote", description: "Demote from admin", category: "moderation", enabled: true, adminOnly: true, usage: "/demote @user" },
      { name: "/play", description: "Play music from YouTube", category: "music", enabled: true, adminOnly: false, usage: "/play [song name]" },
      { name: "/queue", description: "Show music queue", category: "music", enabled: true, adminOnly: false, usage: "/queue" },
      { name: "/skip", description: "Skip current song", category: "music", enabled: true, adminOnly: false, usage: "/skip" },
      { name: "/help", description: "Show command list", category: "utility", enabled: true, adminOnly: false, usage: "/help" },
      { name: "/ping", description: "Check bot response time", category: "utility", enabled: true, adminOnly: false, usage: "/ping" },
      { name: "/userinfo", description: "Get user information", category: "utility", enabled: true, adminOnly: false, usage: "/userinfo [@user]" },
    ];

    defaultCommands.forEach(cmd => {
      const id = randomUUID();
      const command: Command = {
        id,
        ...cmd,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.commands.set(id, command);
    });

    // Initialize default stats
    this.stats = {
      id: randomUUID(),
      activeGroups: 0,
      commandsToday: 0,
      musicRequests: 0,
      uptime: "0%",
      date: new Date(),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBotSession(): Promise<BotSession | undefined> {
    return Array.from(this.botSessions.values())[0];
  }

  async createBotSession(session: InsertBotSession): Promise<BotSession> {
    const id = randomUUID();
    const botSession: BotSession = { 
      ...session, 
      id,
      status: session.status || 'disconnected',
      phoneNumber: session.phoneNumber || null,
      connectedAt: session.connectedAt || null,
      sessionData: session.sessionData || null,
      qrCode: session.qrCode || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.botSessions.set(id, botSession);
    return botSession;
  }

  async updateBotSession(id: string, session: Partial<InsertBotSession>): Promise<BotSession | undefined> {
    const existing = this.botSessions.get(id);
    if (!existing) return undefined;
    
    const updated: BotSession = { 
      ...existing, 
      ...session, 
      updatedAt: new Date() 
    };
    this.botSessions.set(id, updated);
    return updated;
  }

  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const newGroup: Group = { 
      ...group, 
      memberCount: group.memberCount || 0,
      isAdmin: group.isAdmin || false,
      moderationEnabled: group.moderationEnabled || true,
      antiSpam: group.antiSpam || true,
      antiLink: group.antiLink || false,
      welcomeMessage: group.welcomeMessage || null,
      farewellMessage: group.farewellMessage || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.groups.set(group.id, newGroup);
    return newGroup;
  }

  async updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined> {
    const existing = this.groups.get(id);
    if (!existing) return undefined;
    
    const updated: Group = { 
      ...existing, 
      ...group, 
      updatedAt: new Date() 
    };
    this.groups.set(id, updated);
    return updated;
  }

  async deleteGroup(id: string): Promise<boolean> {
    return this.groups.delete(id);
  }

  async getCommands(): Promise<Command[]> {
    return Array.from(this.commands.values());
  }

  async getCommandsByCategory(category: string): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
  }

  async getCommand(id: string): Promise<Command | undefined> {
    return this.commands.get(id);
  }

  async createCommand(command: InsertCommand): Promise<Command> {
    const id = randomUUID();
    const newCommand: Command = { 
      ...command, 
      id,
      enabled: command.enabled !== undefined ? command.enabled : true,
      adminOnly: command.adminOnly !== undefined ? command.adminOnly : false,
      usage: command.usage || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.commands.set(id, newCommand);
    return newCommand;
  }

  async updateCommand(id: string, command: Partial<InsertCommand>): Promise<Command | undefined> {
    const existing = this.commands.get(id);
    if (!existing) return undefined;
    
    const updated: Command = { 
      ...existing, 
      ...command, 
      updatedAt: new Date() 
    };
    this.commands.set(id, updated);
    return updated;
  }

  async deleteCommand(id: string): Promise<boolean> {
    return this.commands.delete(id);
  }

  async getLogs(limit: number = 100): Promise<Log[]> {
    return this.logs
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getLogsByLevel(level: string, limit: number = 100): Promise<Log[]> {
    return this.logs
      .filter(log => log.level === level)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getLogsBySource(source: string, limit: number = 100): Promise<Log[]> {
    return this.logs
      .filter(log => log.source === source)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const id = randomUUID();
    const newLog: Log = { 
      ...log, 
      id,
      metadata: log.metadata || null,
      createdAt: new Date(),
    };
    this.logs.push(newLog);
    return newLog;
  }

  async clearLogs(): Promise<boolean> {
    this.logs = [];
    return true;
  }

  async getMusicQueue(groupId: string): Promise<MusicQueue[]> {
    return Array.from(this.musicQueue.values())
      .filter(item => item.groupId === groupId)
      .sort((a, b) => a.position - b.position);
  }

  async addToMusicQueue(music: InsertMusicQueue): Promise<MusicQueue> {
    const id = randomUUID();
    const queueItem: MusicQueue = { 
      ...music, 
      id,
      status: music.status || 'queued',
      artist: music.artist || null,
      createdAt: new Date(),
    };
    this.musicQueue.set(id, queueItem);
    return queueItem;
  }

  async updateMusicQueueItem(id: string, music: Partial<InsertMusicQueue>): Promise<MusicQueue | undefined> {
    const existing = this.musicQueue.get(id);
    if (!existing) return undefined;
    
    const updated: MusicQueue = { ...existing, ...music };
    this.musicQueue.set(id, updated);
    return updated;
  }

  async removeMusicQueueItem(id: string): Promise<boolean> {
    return this.musicQueue.delete(id);
  }

  async clearMusicQueue(groupId: string): Promise<boolean> {
    const items = Array.from(this.musicQueue.entries());
    items.forEach(([id, item]) => {
      if (item.groupId === groupId) {
        this.musicQueue.delete(id);
      }
    });
    return true;
  }

  async getStats(): Promise<Stats | undefined> {
    return this.stats;
  }

  async updateStats(stats: InsertStats): Promise<Stats> {
    if (this.stats) {
      this.stats = { ...this.stats, ...stats };
    } else {
      this.stats = { 
        id: randomUUID(), 
        activeGroups: stats.activeGroups || 0,
        commandsToday: stats.commandsToday || 0,
        musicRequests: stats.musicRequests || 0,
        uptime: stats.uptime || '0%',
        date: new Date() 
      };
    }
    return this.stats;
  }
}

export const storage = new MemStorage();
