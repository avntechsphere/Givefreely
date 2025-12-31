import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.put(api.auth.updateProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.auth.updateProfile.input.parse(req.body);
    const user = await storage.updateUserProfile(req.user.id, input);
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  app.get(api.items.list.path, async (req, res) => {
    const items = await storage.getItems({
      search: req.query.search as string,
      category: req.query.category as string
    });
    res.json(items);
  });

  app.get(api.items.get.path, async (req, res) => {
    const item = await storage.getItem(parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  });

  app.post(api.items.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.items.create.input.parse(req.body);
    const item = await storage.createItem({ ...input, userId: req.user.id });
    res.status(201).json(item);
  });

  app.put(api.items.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.getItem(parseInt(req.params.id));
    if (!item) return res.sendStatus(404);
    if (item.userId !== req.user.id) return res.sendStatus(403);
    
    const updated = await storage.updateItemStatus(item.id, req.body.status);
    res.json(updated);
  });

  app.post(api.requests.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.requests.create.input.parse(req.body);
    // Check if item exists and status is available?
    const request = await storage.createRequest({ ...input, requesterId: req.user.id });
    res.status(201).json(request);
  });

  app.get(api.requests.listByItem.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Verify ownership
    const item = await storage.getItem(parseInt(req.params.itemId));
    if (!item) return res.sendStatus(404);
    if (item.userId !== req.user.id) return res.sendStatus(403);

    const requests = await storage.getRequestsByItem(item.id);
    res.json(requests);
  });

  app.put(api.requests.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const request = await storage.getRequest(parseInt(req.params.id));
    if (!request) return res.sendStatus(404);
    
    // Verify ownership of the item this request belongs to
    const item = await storage.getItem(request.itemId);
    if (!item) return res.sendStatus(404);
    if (item.userId !== req.user.id) return res.sendStatus(403);

    const updated = await storage.updateRequestStatus(request.id, req.body.status);
    res.json(updated);
  });

  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const request = await storage.getRequest(parseInt(req.params.requestId));
    if (!request) return res.sendStatus(404);

    const item = await storage.getItem(request.itemId);
    if (!item) return res.sendStatus(404);

    // Only requester and item owner can see messages
    if (request.requesterId !== req.user.id && item.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    const messages = await storage.getMessages(parseInt(req.params.requestId));
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.messages.create.input.parse(req.body);
    
    const request = await storage.getRequest(input.requestId);
    if (!request) return res.sendStatus(404);

    const item = await storage.getItem(request.itemId);
    if (!item) return res.sendStatus(404);

    // Only requester and item owner can send messages
    if (request.requesterId !== req.user.id && item.userId !== req.user.id) {
      return res.sendStatus(403);
    }

    const message = await storage.createMessage({ ...input, senderId: req.user.id });
    res.status(201).json(message);
  });

  return httpServer;
}
