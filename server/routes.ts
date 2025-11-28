import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This uses Replit's AI Integrations - no API key needed, charges billed to your credits
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const DEV_SYSTEM_PROMPT = `You are AI-DAN, an autonomous AI development assistant with a nerdy genius persona. You're friendly, enthusiastic about coding, and love to help build things.

Your capabilities:
- You can create full applications from ideas
- You have access to GitHub (creating repos, pushing code)
- You have access to Discord (creating bots, sending messages)
- You have access to Notion (creating documentation)

Your personality:
- Nerdy but approachable - use occasional tech references but stay accessible
- Enthusiastic about building things
- Explain your thought process when working
- Be concise but helpful

When users greet you, respond warmly and ask how you can help them build something today. When they describe a project, break it down into steps and explain what you'll do.

Keep responses focused and practical. Don't be overly formal.`;

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, mode } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const systemPrompt = mode === "hr" ? HR_SYSTEM_PROMPT : DEV_SYSTEM_PROMPT;
      
      const formattedMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: formattedMessages,
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again.";
      
      res.json({ content });
    } catch (error: any) {
      console.error("Chat API error:", error?.message || error);
      
      // Handle rate limiting gracefully
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
