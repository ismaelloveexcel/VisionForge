import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ShellTool extends StructuredTool {
  name = "run_command";
  description = "Runs any shell/terminal command in the Replit environment (git, npm, curl, etc).";
  schema = z.object({
    command: z.string().describe("The shell command to execute")
  });

  async _call({ command }: z.infer<typeof this.schema>): Promise<string> {
    const dangerousPatterns = [
      /rm\s+-rf\s+[\/~]/i,
      />\s*\/dev\/sd/i,
      /mkfs/i,
      /dd\s+if=/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return JSON.stringify({ 
          success: false, 
          error: "Nice try. That command is blocked for safety." 
        });
      }
    }

    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000,
        cwd: process.cwd(),
        env: { ...process.env }
      });
      
      const output = stdout || stderr || "Command ran successfully (no output)";
      
      return JSON.stringify({ 
        success: true, 
        output: output.slice(0, 5000),
        command 
      });
    } catch (e: any) {
      return JSON.stringify({ 
        success: false, 
        error: e.message,
        stderr: e.stderr?.slice(0, 2000)
      });
    }
  }
}
