import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

export class WriteFileTool extends StructuredTool {
  name = "write_file";
  description = "Writes or overwrites a file on disk. Path is relative to project root.";
  schema = z.object({
    path: z.string().describe("File path relative to project root"),
    content: z.string().describe("Content to write to the file")
  });

  async _call({ path: filePath, content }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      
      if (!fullPath.startsWith(process.cwd())) {
        return JSON.stringify({ success: false, error: "Path traversal not allowed" });
      }
      
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      
      return JSON.stringify({ 
        success: true, 
        message: `File written: ${filePath}`,
        path: filePath
      });
    } catch (e: any) {
      return JSON.stringify({ success: false, error: `Write failed: ${e.message}` });
    }
  }
}

export class ReadFileTool extends StructuredTool {
  name = "read_file";
  description = "Reads the contents of a file from the project.";
  schema = z.object({
    path: z.string().describe("File path relative to project root")
  });

  async _call({ path: filePath }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      
      if (!fullPath.startsWith(process.cwd())) {
        return JSON.stringify({ success: false, error: "Path traversal not allowed" });
      }
      
      const content = await fs.readFile(fullPath, "utf-8");
      
      return JSON.stringify({ 
        success: true, 
        content: content.slice(0, 10000),
        path: filePath
      });
    } catch (e: any) {
      return JSON.stringify({ success: false, error: `Read failed: ${e.message}` });
    }
  }
}
