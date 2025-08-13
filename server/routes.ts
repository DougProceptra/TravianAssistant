import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExampleItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({
      status: "success",
      message: "Server is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Hello World endpoint
  app.get("/api/hello", async (req, res) => {
    res.json({
      message: "Hello World!",
      timestamp: new Date().toISOString(),
      status: "success",
      version: "1.0.0"
    });
  });

  // Get example items
  app.get("/api/items", async (req, res) => {
    const items = await storage.getExampleItems();
    res.json({
      status: "success",
      data: items,
      timestamp: new Date().toISOString()
    });
  });

  // Create example item
  app.post("/api/items", async (req, res) => {
    try {
      const parsed = insertExampleItemSchema.parse(req.body);
      const item = await storage.createExampleItem(parsed);
      res.json({
        status: "success",
        data: item,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Invalid request body",
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}