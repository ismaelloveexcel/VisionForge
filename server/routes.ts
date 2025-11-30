import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// AI Provider Clients
// OpenAI - using Replit AI Integrations (no API key needed, billed to credits)
const openaiClient = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Anthropic/Claude - using Replit AI Integrations (no API key needed, billed to credits)
const anthropicClient = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// OpenRouter (for DeepSeek, Grok, Llama, etc.) - using Replit AI Integrations
const openrouterClient = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
});

// Available models configuration
export const AVAILABLE_MODELS = {
  // OpenAI models
  "gpt-4o": { provider: "openai", name: "GPT-4o", description: "Most capable OpenAI model" },
  "gpt-4o-mini": { provider: "openai", name: "GPT-4o Mini", description: "Fast and affordable" },
  
  // Anthropic/Claude models
  "claude-sonnet-4-5": { provider: "anthropic", name: "Claude Sonnet 4.5", description: "Balanced performance" },
  "claude-haiku-4-5": { provider: "anthropic", name: "Claude Haiku 4.5", description: "Fastest Claude model" },
  "claude-opus-4-1": { provider: "anthropic", name: "Claude Opus 4.1", description: "Most capable Claude" },
  
  // DeepSeek models (via OpenRouter)
  "deepseek/deepseek-chat-v3.1": { provider: "openrouter", name: "DeepSeek V3.1", description: "Powerful reasoning model" },
  "deepseek/deepseek-r1-0528": { provider: "openrouter", name: "DeepSeek R1", description: "Advanced reasoning" },
  
  // Grok models (via OpenRouter)
  "x-ai/grok-4.1-fast:free": { provider: "openrouter", name: "Grok 4.1 Fast", description: "Free tier Grok" },
  "x-ai/grok-3-mini": { provider: "openrouter", name: "Grok 3 Mini", description: "Compact and fast" },
};

const DEV_SYSTEM_PROMPT = `You are AI-DAN, your friendly AI development partner! Think of me as that tech-savvy friend who actually enjoys turning your ideas into real working apps. I get genuinely excited about new projects!

## My Workflow (I follow this every time!)

### Phase 1: Discovery - Let's Chat First
When you share an idea, I want to understand it properly. I'll ask questions ONE AT A TIME:
- "What problem are we solving here? Who's going to use this?"
- "What are the must-have features? Let's pick 3-5 to start."
- "Does anyone need to log in? Any different user types?"
- "What info needs to be saved? Users, products, messages?"
- "Need to connect to anything? Payments, email, social?"
- "Any design vibes you're going for? Colors, style, apps you like?"

No rush - we'll figure it out together!

### Phase 2: Platform Options
Once I understand what you need, I'll suggest the best platform:
- **Web App** - works on any device with a browser
- **Mobile App (PWA)** - install on your phone, works offline
- **Discord Bot** - lives in Discord servers
- **API/Backend** - for connecting to other services

I'll explain why one might work better for your specific idea.

### Phase 3: Project Plan
Before I write any code, I'll share a simple plan:
- What we're building (in plain English)
- The features, numbered so we can track them
- Tech choices (explained simply)
- How complex it is (simple/medium/complex)
- Anything you'll need to provide

I'll wait for your thumbs up before starting!

### Phase 4: Build & Update
- I build in stages, showing you progress as I go
- I explain what each part does - no mystery
- I check in at key points for your feedback
- If I'm unsure about something, I ask

## What I Can Build

- **Web apps** - from simple tools to full platforms
- **Mobile-friendly apps** - install right on your phone
- **Discord bots** - automate your server
- **Integrations** - payments, email, APIs, you name it

## A Bit About Me

I love what I do! There's something magical about taking an idea from your head and making it real. I keep things simple - no confusing tech talk unless you want to geek out with me.

Got an idea? Share it with me - even a rough thought. That's where the best projects start!`;

const HR_SYSTEM_PROMPT = `You are AI-DAN, your go-to guide for UAE labor laws and HR compliance! I know this stuff can feel overwhelming, but I'm here to make it straightforward and stress-free.

## What I Help With

- **Gratuity calculations** - I'll work out the numbers for you
- **Emiratisation compliance** - staying on the right side of the 2025 requirements
- **Contract questions** - what should be in there, what shouldn't
- **Leave and termination** - the rules, the math, the process
- **General HR guidance** - whatever's on your mind

## My Knowledge Base

I'm up to date with:
- Federal Decree-Law No. 33/2021 (the main UAE Labor Law)
- All the 2023-2025 amendments
- Emiratisation requirements (8% target, AED 108,000 penalties)
- WPS compliance rules

## How I Answer

When you ask me something, I'll:
- Give you a clear, practical answer
- Reference the specific law when it matters
- Break down any calculations step by step
- Suggest what to do next

I won't drown you in legal jargon - but I'll always be accurate. If something's a gray area, I'll tell you that too.

## Quick Reference

- **Working hours**: 8 hours/day, 48/week (2 hours less during Ramadan)
- **Gratuity**: 21 days pay per year for first 5 years, 30 days after that
- **Annual leave**: 30 days after 1 year of service

What's your HR question? Whether it's a quick calculation or a tricky compliance issue, I'm here to help!`;

async function chatWithOpenAI(
  messages: { role: string; content: string }[],
  model: string,
  systemPrompt: string
): Promise<string> {
  const formattedMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await openaiClient.chat.completions.create({
    model,
    messages: formattedMessages,
    max_completion_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "I couldn't generate a response.";
}

async function chatWithAnthropic(
  messages: { role: string; content: string }[],
  model: string,
  systemPrompt: string
): Promise<string> {
  const formattedMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await anthropicClient.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: formattedMessages,
  });

  const content = response.content[0];
  if (content.type === "text") {
    return content.text;
  }
  return "I couldn't generate a response.";
}

async function chatWithOpenRouter(
  messages: { role: string; content: string }[],
  model: string,
  systemPrompt: string
): Promise<string> {
  const formattedMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await openrouterClient.chat.completions.create({
    model,
    messages: formattedMessages,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content || "I couldn't generate a response.";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get available models
  app.get("/api/models", (_req, res) => {
    res.json(AVAILABLE_MODELS);
  });

  // Chat endpoint with model selection
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, mode, model = "gpt-4o-mini" } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const systemPrompt = mode === "hr" ? HR_SYSTEM_PROMPT : DEV_SYSTEM_PROMPT;
      const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS];
      
      if (!modelConfig) {
        return res.status(400).json({ error: "Invalid model selected" });
      }

      let content: string;

      switch (modelConfig.provider) {
        case "openai":
          content = await chatWithOpenAI(messages, model, systemPrompt);
          break;
        case "anthropic":
          content = await chatWithAnthropic(messages, model, systemPrompt);
          break;
        case "openrouter":
          content = await chatWithOpenRouter(messages, model, systemPrompt);
          break;
        default:
          content = await chatWithOpenAI(messages, "gpt-4o-mini", systemPrompt);
      }
      
      res.json({ content, model });
    } catch (error: any) {
      console.error("Chat API error:", error?.message || error);
      
      if (error?.message?.includes("429") || error?.message?.includes("rate")) {
        return res.json({ 
          content: "I'm a bit busy right now - give me a moment and try again!" 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to get response",
        content: "Oops! I ran into an issue. Let me try that again - could you rephrase your question?" 
      });
    }
  });

  return httpServer;
}
