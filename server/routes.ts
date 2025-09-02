import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsappBot } from "./services/whatsapp-bot";
import { z } from "zod";
import { insertGroupSchema, insertCommandSchema, insertLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Bot connection routes
  app.get("/api/bot/status", async (req, res) => {
    try {
      const session = await storage.getBotSession();
      const connectionStatus = whatsappBot.getConnectionStatus();
      const qrCode = whatsappBot.getQRCode();
      
      res.json({
        status: connectionStatus,
        qrCode,
        session: session ? {
          phoneNumber: session.phoneNumber,
          connectedAt: session.connectedAt,
          sessionId: session.id,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  app.post("/api/bot/start", async (req, res) => {
    try {
      await whatsappBot.startBot();
      res.json({ message: "Bot started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start bot" });
    }
  });

  app.post("/api/bot/disconnect", async (req, res) => {
    try {
      await whatsappBot.disconnect();
      res.json({ message: "Bot disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect bot" });
    }
  });

  app.post("/api/bot/broadcast", async (req, res) => {
    try {
      const { message, groupIds } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const success = await whatsappBot.broadcastMessage(message, groupIds);
      if (success) {
        res.json({ message: "Broadcast sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send broadcast" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send broadcast" });
    }
  });

  // Groups routes
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get groups" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group" });
    }
  });

  app.put("/api/groups/:id", async (req, res) => {
    try {
      const groupData = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, groupData);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  app.delete("/api/groups/:id", async (req, res) => {
    try {
      const success = await storage.deleteGroup(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Commands routes
  app.get("/api/commands", async (req, res) => {
    try {
      const { category } = req.query;
      const commands = category 
        ? await storage.getCommandsByCategory(category as string)
        : await storage.getCommands();
      res.json(commands);
    } catch (error) {
      res.status(500).json({ message: "Failed to get commands" });
    }
  });

  app.post("/api/commands", async (req, res) => {
    try {
      const commandData = insertCommandSchema.parse(req.body);
      const command = await storage.createCommand(commandData);
      res.status(201).json(command);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid command data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create command" });
    }
  });

  app.put("/api/commands/:id", async (req, res) => {
    try {
      const commandData = insertCommandSchema.partial().parse(req.body);
      const command = await storage.updateCommand(req.params.id, commandData);
      if (!command) {
        return res.status(404).json({ message: "Command not found" });
      }
      res.json(command);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid command data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update command" });
    }
  });

  app.delete("/api/commands/:id", async (req, res) => {
    try {
      const success = await storage.deleteCommand(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Command not found" });
      }
      res.json({ message: "Command deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete command" });
    }
  });

  // Logs routes
  app.get("/api/logs", async (req, res) => {
    try {
      const { level, source, limit } = req.query;
      let logs;

      if (level) {
        logs = await storage.getLogsByLevel(level as string, parseInt(limit as string) || 100);
      } else if (source) {
        logs = await storage.getLogsBySource(source as string, parseInt(limit as string) || 100);
      } else {
        logs = await storage.getLogs(parseInt(limit as string) || 100);
      }

      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get logs" });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({ message: "Logs cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });

  // Music queue routes
  app.get("/api/music/queue/:groupId", async (req, res) => {
    try {
      const queue = await storage.getMusicQueue(req.params.groupId);
      res.json(queue);
    } catch (error) {
      res.status(500).json({ message: "Failed to get music queue" });
    }
  });

  app.delete("/api/music/queue/:groupId", async (req, res) => {
    try {
      await storage.clearMusicQueue(req.params.groupId);
      res.json({ message: "Music queue cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear music queue" });
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.put("/api/stats", async (req, res) => {
    try {
      const statsData = req.body;
      const stats = await storage.updateStats(statsData);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to update stats" });
    }
  });

  const httpServer = createServer(app);

  // Start the WhatsApp bot automatically
  setTimeout(async () => {
    try {
      await whatsappBot.startBot();
    } catch (error) {
      console.error("Failed to start WhatsApp bot:", error);
    }
  }, 2000);

  return httpServer;
}
