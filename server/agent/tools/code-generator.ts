import { Tool } from "@langchain/core/tools";
import * as fs from "fs";
import * as path from "path";

export class CodeGeneratorTool extends Tool {
  name = "code_generator";
  description = `Generate and save code files to the project. Use this when you need to create new files or modify existing code.
Input should be a JSON object with:
- filePath: the path where to save the file (relative to project root)
- content: the code content to write
- action: "create" or "update"
Example: {"filePath": "src/components/Button.tsx", "content": "export function Button() { return <button>Click</button>; }", "action": "create"}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { filePath, content, action } = parsed;

      if (!filePath || !content) {
        return JSON.stringify({ 
          success: false, 
          error: "Missing filePath or content" 
        });
      }

      const fullPath = path.join(process.cwd(), "generated", filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, "utf-8");

      return JSON.stringify({
        success: true,
        message: `File ${action === "update" ? "updated" : "created"} at generated/${filePath}`,
        path: `generated/${filePath}`
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to generate code"
      });
    }
  }
}

export class FileReaderTool extends Tool {
  name = "file_reader";
  description = `Read the contents of a file from the project.
Input should be a JSON object with:
- filePath: the path to read (relative to project root)
Example: {"filePath": "package.json"}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { filePath } = parsed;

      if (!filePath) {
        return JSON.stringify({ success: false, error: "Missing filePath" });
      }

      const fullPath = path.join(process.cwd(), filePath);

      if (!fs.existsSync(fullPath)) {
        return JSON.stringify({ 
          success: false, 
          error: `File not found: ${filePath}` 
        });
      }

      const content = fs.readFileSync(fullPath, "utf-8");

      return JSON.stringify({
        success: true,
        content,
        path: filePath
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to read file"
      });
    }
  }
}

export class ProjectStructureTool extends Tool {
  name = "project_structure";
  description = `Create a complete project structure with multiple files at once.
Input should be a JSON object with:
- projectName: name of the project folder
- files: array of {path, content} objects
Example: {"projectName": "my-app", "files": [{"path": "index.html", "content": "<!DOCTYPE html>..."}, {"path": "styles.css", "content": "body {...}"}]}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { projectName, files } = parsed;

      if (!projectName || !files || !Array.isArray(files)) {
        return JSON.stringify({ 
          success: false, 
          error: "Missing projectName or files array" 
        });
      }

      const projectPath = path.join(process.cwd(), "generated", projectName);
      const createdFiles: string[] = [];

      for (const file of files) {
        const fullPath = path.join(projectPath, file.path);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, file.content, "utf-8");
        createdFiles.push(file.path);
      }

      return JSON.stringify({
        success: true,
        message: `Created project "${projectName}" with ${createdFiles.length} files`,
        projectPath: `generated/${projectName}`,
        files: createdFiles
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to create project structure"
      });
    }
  }
}
