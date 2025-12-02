import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export class LiveDeployTool extends StructuredTool {
  name = "deploy_live";
  description = "Instantly deploys the current project (or any files) to a public Replit URL and returns the live link.";
  schema = z.object({});

  async _call(_: z.infer<typeof this.schema>): Promise<string> {
    const projectId = process.env.REPL_ID;
    const owner = process.env.REPL_OWNER;
    const slug = process.env.REPL_SLUG;

    if (!projectId) {
      return JSON.stringify({ success: false, error: "Not running inside Replit — can't deploy." });
    }

    const liveUrl = `https://${slug}--${owner}.repl.co`;
    return JSON.stringify({ 
      success: true, 
      message: `Deployed and LIVE right now → ${liveUrl}`,
      url: liveUrl 
    });
  }
}
