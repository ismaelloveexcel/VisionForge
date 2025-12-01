import { Tool } from "@langchain/core/tools";
import { Client } from "@notionhq/client";

const getNotionClient = () => {
  const token = process.env.NOTION_API_KEY;
  if (!token) {
    throw new Error("NOTION_API_KEY not configured. Please add your Notion API key to secrets.");
  }
  return new Client({ auth: token });
};

export class NotionCreatePageTool extends Tool {
  name = "notion_create_page";
  description = `Create a new page in Notion.
Input should be a JSON object with:
- parentId: the ID of the parent page or database (required)
- title: page title (required)
- content: array of content blocks, each with {type, text} - types: "paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "code"
Example: {"parentId": "abc123", "title": "Project Docs", "content": [{"type": "heading_1", "text": "Overview"}, {"type": "paragraph", "text": "This is the overview."}]}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { parentId, title, content = [] } = parsed;

      if (!parentId || !title) {
        return JSON.stringify({ 
          success: false, 
          error: "parentId and title are required" 
        });
      }

      const notion = getNotionClient();

      const children = content.map((block: { type: string; text: string; language?: string }) => {
        const blockType = block.type || "paragraph";
        const richText = [{ type: "text" as const, text: { content: block.text } }];

        if (blockType === "code") {
          return {
            object: "block" as const,
            type: "code" as const,
            code: {
              rich_text: richText,
              language: block.language || "javascript"
            }
          };
        }

        if (blockType.startsWith("heading_")) {
          const level = blockType as "heading_1" | "heading_2" | "heading_3";
          return {
            object: "block" as const,
            type: level,
            [level]: { rich_text: richText }
          };
        }

        if (blockType === "bulleted_list_item" || blockType === "numbered_list_item") {
          return {
            object: "block" as const,
            type: blockType,
            [blockType]: { rich_text: richText }
          };
        }

        return {
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: { rich_text: richText }
        };
      });

      const response = await notion.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: {
            title: [{ text: { content: title } }]
          }
        },
        children: children as any
      });

      return JSON.stringify({
        success: true,
        message: `Page "${title}" created successfully!`,
        pageId: response.id,
        url: (response as any).url
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to create Notion page"
      });
    }
  }
}

export class NotionSearchTool extends Tool {
  name = "notion_search";
  description = `Search for pages in Notion.
Input should be a JSON object with:
- query: search query string
- limit: max results (default: 10)
Example: {"query": "project roadmap", "limit": 5}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { query, limit = 10 } = parsed;

      if (!query) {
        return JSON.stringify({ success: false, error: "Query is required" });
      }

      const notion = getNotionClient();

      const response = await notion.search({
        query,
        page_size: limit,
        filter: { property: "object", value: "page" }
      });

      const pages = response.results.map((page: any) => ({
        id: page.id,
        title: page.properties?.title?.title?.[0]?.text?.content || 
               page.properties?.Name?.title?.[0]?.text?.content ||
               "Untitled",
        url: page.url,
        lastEdited: page.last_edited_time
      }));

      return JSON.stringify({
        success: true,
        results: pages,
        count: pages.length
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to search Notion"
      });
    }
  }
}

export class NotionDocGeneratorTool extends Tool {
  name = "notion_doc_generator";
  description = `Generate comprehensive documentation for a project and create it as a Notion page.
Input should be a JSON object with:
- parentId: Notion parent page ID where docs will be created
- projectName: name of the project
- description: project description
- features: array of feature descriptions
- techStack: array of technologies used
- setupInstructions: array of setup steps
Example: {"parentId": "abc123", "projectName": "My App", "description": "A task manager", "features": ["Create tasks", "Set deadlines"], "techStack": ["React", "Node.js"], "setupInstructions": ["npm install", "npm start"]}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { parentId, projectName, description, features = [], techStack = [], setupInstructions = [] } = parsed;

      if (!parentId || !projectName) {
        return JSON.stringify({ 
          success: false, 
          error: "parentId and projectName are required" 
        });
      }

      const notion = getNotionClient();

      const children: any[] = [
        {
          object: "block",
          type: "heading_1",
          heading_1: { rich_text: [{ type: "text", text: { content: "Overview" } }] }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ type: "text", text: { content: description || `Documentation for ${projectName}` } }] }
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "Features" } }] }
        },
        ...features.map((f: string) => ({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: f } }] }
        })),
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "Tech Stack" } }] }
        },
        ...techStack.map((t: string) => ({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ type: "text", text: { content: t } }] }
        })),
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ type: "text", text: { content: "Setup Instructions" } }] }
        },
        ...setupInstructions.map((s: string, i: number) => ({
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: { rich_text: [{ type: "text", text: { content: s } }] }
        })),
        {
          object: "block",
          type: "divider",
          divider: {}
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { 
            rich_text: [{ 
              type: "text", 
              text: { content: `Generated by AI-DAN on ${new Date().toLocaleDateString()}` },
              annotations: { italic: true, color: "gray" }
            }] 
          }
        }
      ];

      const response = await notion.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: {
            title: [{ text: { content: `${projectName} - Documentation` } }]
          }
        },
        children
      });

      return JSON.stringify({
        success: true,
        message: `Documentation for "${projectName}" created successfully!`,
        pageId: response.id,
        url: (response as any).url
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to generate documentation"
      });
    }
  }
}
