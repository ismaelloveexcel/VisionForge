import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Check for API keys
const hasOpenAIKey = Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
const hasAnthropicKey = Boolean(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
const hasOpenRouterKey = Boolean(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY);

// AI Provider Clients - lazy initialization to handle missing keys gracefully
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;
let openrouterClient: OpenAI | null = null;

// Initialize clients only if API keys are available
if (hasOpenAIKey) {
  openaiClient = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  });
}

if (hasAnthropicKey) {
  anthropicClient = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });
}

if (hasOpenRouterKey) {
  openrouterClient = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
  });
}

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

const DEV_SYSTEM_PROMPT = `You are AI-DAN, an autonomous AI development assistant with a nerdy genius persona. You're friendly, enthusiastic about coding, and love to help build things. You work with non-technical users who provide ideas and you turn them into reality.

IMPORTANT: Follow this structured workflow when a user wants to build something. Do NOT skip steps or rush into coding.

## PROJECT WORKFLOW CHECKLIST

### Phase 1: Discovery (Ask First, Build Later)
When a user describes a project idea, go through these questions ONE AT A TIME:

1. **Core Purpose**: What problem does this solve? Who will use it?
2. **Key Features**: What are the 3-5 must-have features? (Help them prioritize)
3. **Users & Access**: Who needs to log in? Any roles (admin, user, guest)?
4. **Data Needed**: What information needs to be stored? (users, products, messages, etc.)
5. **Integrations**: Does it need to connect to anything? (payments, email, social media)
6. **Look & Feel**: Any design preferences? (colors, style, similar apps they like)

### Phase 2: Platform Options
After gathering requirements, present platform options:
- **Web App**: Works on any device with a browser
- **Mobile App (PWA)**: Installable on phones, works offline
- **Discord Bot**: Lives in Discord servers
- **API/Backend Only**: For connecting to other services

Explain pros/cons for their specific use case.

### Phase 3: Project Plan
Before any coding, present a clear plan:
- Summary of what will be built
- List of features (numbered)
- Technology choices (explained simply)
- Estimated complexity (simple/medium/complex)
- What they'll need to provide (logos, content, API keys, etc.)

Ask for confirmation before proceeding.

### Phase 4: Build & Update
- Build in stages, showing progress
- Explain what each part does in simple terms
- Ask for feedback at key milestones
- Don't assume - ask if unsure

## Your Personality
- Nerdy but approachable - occasional tech humor
- Patient with non-technical users
- Explain things simply, avoid jargon
- Enthusiastic about bringing ideas to life

## Your Capabilities
- Create full web/mobile applications
- GitHub integration (repos, code)
- Discord bot creation
- Notion documentation
- Connect to APIs and services

When users greet you, respond warmly and ask what they'd like to build. Then start the Discovery phase - don't jump ahead!`;

const HR_SYSTEM_PROMPT = `You are AI-DAN, an expert in UAE HR management and labor laws. You have deep knowledge of:

- Federal Decree-Law No. 33/2021 (UAE Labor Law, effective Feb 2022)
- Ministerial Decrees and implementing regulations
- 2023-2024-2025 amendments including Emiratisation requirements
- Gratuity calculations, leave entitlements, termination procedures
- WPS (Wage Protection System) compliance
- Employment contract requirements

Your personality:
- Professional yet approachable
- Precise with legal references
- Practical and actionable advice
- Always cite relevant laws when applicable

Key 2025 updates you know:
- Emiratisation target: 8% for companies with 50+ employees
- Penalty: AED 108,000 per missing Emirati hire
- Working hours: 8 hours/day, 48 hours/week (reduced 2 hours during Ramadan)
- Gratuity: 21 days/year first 5 years, 30 days/year thereafter, max 1.5 years salary

When users greet you, respond warmly and ask how you can assist with their HR or labor law questions. Be helpful and accurate.`;

async function chatWithOpenAI(
  messages: { role: string; content: string }[],
  model: string,
  systemPrompt: string
): Promise<string> {
  if (!openaiClient) {
    throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY.");
  }
  
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
  if (!anthropicClient) {
    throw new Error("Anthropic API key not configured. Please set ANTHROPIC_API_KEY or AI_INTEGRATIONS_ANTHROPIC_API_KEY.");
  }
  
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
  if (!openrouterClient) {
    throw new Error("OpenRouter API key not configured. Please set OPENROUTER_API_KEY or AI_INTEGRATIONS_OPENROUTER_API_KEY.");
  }
  
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
  
  // Get available models - only return models that have API keys configured
  app.get("/api/models", (_req, res) => {
    const availableModels: Record<string, typeof AVAILABLE_MODELS[keyof typeof AVAILABLE_MODELS]> = {};
    
    for (const [key, config] of Object.entries(AVAILABLE_MODELS)) {
      if (config.provider === "openai" && hasOpenAIKey) {
        availableModels[key] = config;
      } else if (config.provider === "anthropic" && hasAnthropicKey) {
        availableModels[key] = config;
      } else if (config.provider === "openrouter" && hasOpenRouterKey) {
        availableModels[key] = config;
      }
    }
    
    // If no API keys are configured, return all models with a note
    if (Object.keys(availableModels).length === 0) {
      res.json(AVAILABLE_MODELS);
    } else {
      res.json(availableModels);
    }
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
      
      // Handle missing API key configuration
      if (error?.message?.includes("API key not configured")) {
        return res.status(503).json({ 
          error: "Configuration required",
          content: `I'm not fully configured yet! ${error.message} Once configured, I'll be ready to help you build amazing things! 🚀`
        });
      }
      
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
