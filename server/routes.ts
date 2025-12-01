import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runAgent } from "./agent";

export const AVAILABLE_MODELS = {
  "gpt-4o": { provider: "openai", name: "GPT-4o", description: "Most capable OpenAI model" },
  "gpt-4o-mini": { provider: "openai", name: "GPT-4o Mini", description: "Fast and affordable" },
  "claude-sonnet-4-5": { provider: "anthropic", name: "Claude Sonnet 4.5", description: "Balanced performance" },
  "claude-haiku-4-5": { provider: "anthropic", name: "Claude Haiku 4.5", description: "Fastest Claude model" },
  "claude-opus-4-1": { provider: "anthropic", name: "Claude Opus 4.1", description: "Most capable Claude" },
  "deepseek/deepseek-chat-v3.1": { provider: "openrouter", name: "DeepSeek V3.1", description: "Powerful reasoning model" },
  "deepseek/deepseek-r1-0528": { provider: "openrouter", name: "DeepSeek R1", description: "Advanced reasoning" },
  "x-ai/grok-4.1-fast:free": { provider: "openrouter", name: "Grok 4.1 Fast", description: "Free tier Grok" },
  "x-ai/grok-3-mini": { provider: "openrouter", name: "Grok 3 Mini", description: "Compact and fast" },
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/models", (_req, res) => {
    res.json(AVAILABLE_MODELS);
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, mode, model = "gpt-4o-mini" } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS];
      
      if (!modelConfig) {
        return res.status(400).json({ error: "Invalid model selected" });
      }

      console.log(`[AI-DAN] Processing ${mode} request with ${model}...`);

      const result = await runAgent(
        messages.map((m: any) => ({ role: m.role, content: m.content })),
        mode === "hr" ? "hr" : "development",
        model,
        modelConfig.provider
      );

      console.log(`[AI-DAN] Completed. Actions: ${result.actions.length}`);
      
      res.json({ 
        content: result.content, 
        model,
        actions: result.actions 
      });
    } catch (error: any) {
      console.error("Chat API error:", error?.message || error);
      
      if (error?.message?.includes("429") || error?.message?.includes("rate")) {
        return res.json({ 
          content: "I'm a bit busy right now - give me a moment and try again!",
          actions: []
        });
      }
      
      res.status(500).json({ 
        error: "Failed to get response",
        content: "Oops! I ran into an issue. Let me try that again - could you rephrase your question?",
        actions: []
      });
    }
  });

  app.get("/api/generated", (_req, res) => {
    const fs = require("fs");
    const path = require("path");
    const generatedPath = path.join(process.cwd(), "generated");
    
    if (!fs.existsSync(generatedPath)) {
      return res.json({ projects: [] });
    }
    
    try {
      const items = fs.readdirSync(generatedPath);
      const projects = items.map((name: string) => {
        const itemPath = path.join(generatedPath, name);
        const stat = fs.statSync(itemPath);
        return {
          name,
          isDirectory: stat.isDirectory(),
          createdAt: stat.birthtime
        };
      });
      res.json({ projects });
    } catch (error) {
      res.json({ projects: [] });
    }
  });

  return httpServer;
}
