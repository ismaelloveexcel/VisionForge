import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runAgent, runAgentStream } from "./agent";
import * as fs from "fs";
import * as path from "path";
import { saveChat, loadChat, clearChat } from "./lib/memory";

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

  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { messages, mode, model = "gpt-4o-mini" } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS];
      if (!modelConfig) {
        return res.status(400).json({ error: "Invalid model selected" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const stream = runAgentStream(
        messages.map((m: any) => ({ role: m.role, content: m.content })),
        mode === "hr" ? "hr" : "development",
        model,
        modelConfig.provider
      );

      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Stream API error:", error?.message || error);
      res.write(`data: ${JSON.stringify({ type: "error", data: error.message })}\n\n`);
      res.end();
    }
  });

  app.get("/api/generated", (_req, res) => {
    const generatedPath = path.join(process.cwd(), "generated");
    
    if (!fs.existsSync(generatedPath)) {
      return res.json({ files: [] });
    }
    
    function buildFileTree(dirPath: string, relativePath = ""): any[] {
      try {
        const items = fs.readdirSync(dirPath);
        return items.map((name: string) => {
          const itemPath = path.join(dirPath, name);
          const relPath = relativePath ? `${relativePath}/${name}` : name;
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            return {
              name,
              type: "folder",
              path: relPath,
              children: buildFileTree(itemPath, relPath),
              modifiedAt: stat.mtime
            };
          }
          
          return {
            name,
            type: "file",
            path: relPath,
            size: stat.size,
            modifiedAt: stat.mtime
          };
        });
      } catch {
        return [];
      }
    }
    
    res.json({ files: buildFileTree(generatedPath) });
  });
  
  app.get("/api/generated/file", (req, res) => {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({ error: "File path required" });
    }
    
    const fullPath = path.join(process.cwd(), "generated", filePath);
    const generatedDir = path.join(process.cwd(), "generated");
    
    if (!fullPath.startsWith(generatedDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const ext = path.extname(filePath).slice(1);
      res.json({ content, path: filePath, extension: ext });
    } catch {
      res.status(500).json({ error: "Failed to read file" });
    }
  });
  
  app.get("/api/chat/history", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || "default";
      const history = await loadChat(userId);
      res.json({ messages: history });
    } catch {
      res.json({ messages: [] });
    }
  });
  
  app.post("/api/chat/history", async (req, res) => {
    try {
      const { messages, userId = "default" } = req.body;
      await saveChat(userId, messages || []);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to save history" });
    }
  });
  
  app.delete("/api/chat/history", async (req, res) => {
    try {
      const userId = (req.query.userId as string) || "default";
      await clearChat(userId);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  return httpServer;
}
