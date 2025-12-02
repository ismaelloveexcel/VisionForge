import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export class DeployAppTool extends StructuredTool {
  name = "deploy_app_live";
  description = "Deploys a complete app on a brand-new public Replit and returns the live URL instantly.";
  schema = z.object({
    title: z.string().describe("Name/title for the deployed app"),
    files: z.record(z.string()).describe("Object with file paths as keys and file contents as values")
  });

  async _call({ title, files }: z.infer<typeof this.schema>): Promise<string> {
    const token = process.env.REPLIT_TOKEN;
    
    if (!token) {
      return JSON.stringify({ 
        success: false, 
        error: "REPLIT_TOKEN not configured. Add it to secrets to enable live deployments." 
      });
    }

    try {
      const res = await fetch("https://replit.com/api/v0/repls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          language: "nodejs", 
          title: title || "AI-DAN creation", 
          isPublic: true, 
          files 
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return JSON.stringify({ success: false, error: `Deploy failed: ${errorText}` });
      }

      const data = await res.json();
      const liveUrl = `https://${data.slug}--${data.ownerUsername}.repl.co`;
      
      return JSON.stringify({
        success: true,
        message: `Deployed and live right now!`,
        url: liveUrl,
        replUrl: `https://replit.com/@${data.ownerUsername}/${data.slug}`
      });
    } catch (e: any) {
      return JSON.stringify({ success: false, error: e.message });
    }
  }
}
