import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReminderSchema } from "@shared/schema";
import { z } from "zod";
import { callOpenAI } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Reminder routes
  app.get("/api/reminders", async (req, res) => {
    try {
      const { category } = req.query;
      let reminders;
      
      if (category && typeof category === 'string') {
        reminders = await storage.getRemindersByCategory(category);
      } else {
        reminders = await storage.getReminders();
      }
      
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const validatedData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(validatedData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reminder" });
      }
    }
  });

  app.put("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertReminderSchema.partial().parse(req.body);
      const reminder = await storage.updateReminder(id, validatedData);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update reminder" });
      }
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteReminder(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // AI chat route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, reminders } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get all reminders for context if not provided
      const reminderContext = reminders || await storage.getReminders();
      
      const aiResponse = await callOpenAI(message, reminderContext);
      res.json({ response: aiResponse });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
