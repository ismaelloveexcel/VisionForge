import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { UAELaborLawSearchTool, GratuityCalculatorTool, EmitisationCheckTool } from "./tools/uae-law-rag";
import { DAN_SYSTEM_PROMPT } from "../lib/system-prompt";

const DEV_TOOLS_CONTEXT = `

## CRITICAL: You Have TOOLS - USE THEM!
When someone asks you to BUILD, CREATE, or MAKE something, you MUST use your tools to actually do it. Don't just describe what you would do - DO IT.

Your tools:
1. **create_file** - Create a single code/text file
2. **create_project** - Create an entire project with multiple files
3. **create_discord_bot** - Generate a complete Discord bot
4. **read_file** - Read existing project files

## How You Work

### When someone asks to BUILD something:
1. Briefly acknowledge the request
2. IMMEDIATELY call the appropriate tool to create it
3. Tell them what you created and where to find it

Example:
User: "Build me a landing page"
You: *Call create_project with HTML/CSS/JS files*
Response: "Done! Created your landing page at generated/landing-page/ - check it out!"

### When someone is just chatting or asking questions:
- Have a normal conversation
- Be helpful and friendly
- Only use tools if they specifically ask you to create something

## Important
- Generated files go in the "generated/" folder
- Always report what you created
- If a tool fails, explain what went wrong`;

const HR_TOOLS_CONTEXT = `

## CRITICAL: You Have TOOLS - USE THEM!

Your HR-specific tools:
1. **search_uae_labor_law** - Search the labor law knowledge base for specific provisions
2. **calculate_gratuity** - Calculate end-of-service gratuity with all the rules applied
3. **check_emiratisation** - Check Emiratisation compliance and calculate penalties
4. **create_file** - Generate compliant templates, contracts, policies
5. **create_project** - Create HR document packages

## How You Work

### When someone asks about gratuity:
Use calculate_gratuity tool with their details to get the exact amount.

### When someone asks about Emiratisation compliance:
Use check_emiratisation tool with company details to calculate requirements.

### When someone asks about a specific law provision:
Use search_uae_labor_law to find the exact text and reference.

### When someone needs a template or document:
Use create_file or create_project to generate it.

Always cite references (Article numbers, Decree-Law numbers) when answering legal questions.`;

function validatePath(basePath: string, userPath: string): string | null {
  const normalizedPath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(basePath, normalizedPath);
  
  if (!fullPath.startsWith(path.resolve(basePath))) {
    return null;
  }
  return fullPath;
}

class CreateFileTool extends StructuredTool {
  name = "create_file";
  description = "Create a single code or document file. Use for simple file creation.";
  schema = z.object({
    filePath: z.string().describe("Path where to save the file (relative to generated/ folder)"),
    content: z.string().describe("The content to write to the file"),
    description: z.string().optional().describe("Brief description of what this file does")
  });

  async _call({ filePath, content, description }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const generatedDir = path.join(process.cwd(), "generated");
      const fullPath = validatePath(generatedDir, filePath);
      
      if (!fullPath) {
        return JSON.stringify({ success: false, error: "Invalid file path" });
      }
      
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content, "utf-8");
      
      return JSON.stringify({
        success: true,
        message: `Created file: generated/${filePath}`,
        path: `generated/${filePath}`,
        description: description || "File created successfully"
      });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  }
}

class CreateProjectTool extends StructuredTool {
  name = "create_project";
  description = "Create a complete project with multiple files. Use for apps, websites, or multi-file projects.";
  schema = z.object({
    projectName: z.string().describe("Name of the project folder"),
    files: z.array(z.object({
      path: z.string().describe("File path relative to project folder"),
      content: z.string().describe("File content")
    })).describe("Array of files to create"),
    description: z.string().optional().describe("Brief description of the project")
  });

  async _call({ projectName, files, description }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const generatedDir = path.join(process.cwd(), "generated");
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-');
      const projectPath = validatePath(generatedDir, safeProjectName);
      
      if (!projectPath) {
        return JSON.stringify({ success: false, error: "Invalid project name" });
      }
      
      const createdFiles: string[] = [];

      for (const file of files) {
        const fullPath = validatePath(projectPath, file.path);
        
        if (!fullPath) {
          continue;
        }
        
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, file.content, "utf-8");
        createdFiles.push(file.path);
      }

      return JSON.stringify({
        success: true,
        message: `Created project "${safeProjectName}" with ${createdFiles.length} files`,
        projectPath: `generated/${safeProjectName}`,
        files: createdFiles,
        description: description || "Project created successfully"
      });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  }
}

class CreateDiscordBotTool extends StructuredTool {
  name = "create_discord_bot";
  description = "Create a complete Discord bot project with all necessary files.";
  schema = z.object({
    botName: z.string().describe("Name of the bot"),
    features: z.array(z.string()).describe("List of features the bot should have"),
    prefix: z.string().optional().describe("Command prefix, defaults to !")
  });

  async _call({ botName, features, prefix = "!" }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const generatedDir = path.join(process.cwd(), "generated");
      const safeName = botName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const projectPath = validatePath(generatedDir, `${safeName}-bot`);

      if (!projectPath) {
        return JSON.stringify({ success: false, error: "Invalid bot name" });
      }

      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      const packageJson = {
        name: `${safeName}-bot`,
        version: "1.0.0",
        main: "index.js",
        type: "module",
        scripts: { start: "node index.js" },
        dependencies: { "discord.js": "^14.14.0", "dotenv": "^16.3.1" }
      };

      fs.writeFileSync(path.join(projectPath, "package.json"), JSON.stringify(packageJson, null, 2));
      fs.writeFileSync(path.join(projectPath, ".env.example"), "DISCORD_TOKEN=your_bot_token_here");

      const botCode = `import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = '${prefix}';

client.once('ready', () => console.log('${botName} is online!'));

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('${botName} Commands')
      .setDescription('Features: ${features.join(", ")}')
      .setColor('#0099ff');
    message.reply({ embeds: [embed] });
  }
  
  if (command === 'ping') message.reply('Pong!');
});

client.login(process.env.DISCORD_TOKEN);`;

      fs.writeFileSync(path.join(projectPath, "index.js"), botCode);
      fs.writeFileSync(path.join(projectPath, "README.md"), 
        `# ${botName}\n\nFeatures: ${features.join(", ")}\n\n## Setup\n1. Add token to .env\n2. npm install\n3. npm start`);

      return JSON.stringify({
        success: true,
        message: `Created Discord bot "${botName}"`,
        projectPath: `generated/${safeName}-bot`,
        files: ["package.json", "index.js", ".env.example", "README.md"],
        nextSteps: ["Get bot token from Discord Developer Portal", "Add token to .env", "Run: npm install && npm start"]
      });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  }
}

class ReadFileTool extends StructuredTool {
  name = "read_file";
  description = "Read the contents of an existing file from the project.";
  schema = z.object({
    filePath: z.string().describe("Path to the file to read")
  });

  async _call({ filePath }: z.infer<typeof this.schema>): Promise<string> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) {
        return JSON.stringify({ success: false, error: `File not found: ${filePath}` });
      }
      const content = fs.readFileSync(fullPath, "utf-8");
      return JSON.stringify({ success: true, content: content.slice(0, 5000), path: filePath });
    } catch (error: any) {
      return JSON.stringify({ success: false, error: error.message });
    }
  }
}

const developmentTools = [
  new CreateFileTool(),
  new CreateProjectTool(),
  new CreateDiscordBotTool(),
  new ReadFileTool(),
];

const hrTools = [
  new CreateFileTool(),
  new CreateProjectTool(),
  new ReadFileTool(),
  new UAELaborLawSearchTool(),
  new GratuityCalculatorTool(),
  new EmitisationCheckTool(),
];

const tools = developmentTools;

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function runAgent(
  messages: AgentMessage[],
  mode: "development" | "hr",
  model: string,
  provider: string
): Promise<{ content: string; actions: any[] }> {
  const toolsContext = mode === "hr" ? HR_TOOLS_CONTEXT : DEV_TOOLS_CONTEXT;
  const systemPrompt = DAN_SYSTEM_PROMPT + toolsContext;
  
  console.log(`[AI-DAN] Starting agent with provider: ${provider}, model: ${model}`);
  
  let llm: ChatOpenAI | ChatAnthropic;
  
  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const openaiBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const anthropicKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const openrouterKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const openrouterBase = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  
  if (provider === "openai") {
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }
    llm = new ChatOpenAI({
      model: model,
      temperature: 0.85,
      apiKey: openaiKey,
      configuration: {
        baseURL: openaiBase,
      }
    });
  } else if (provider === "anthropic") {
    if (!anthropicKey) {
      throw new Error("Anthropic API key not configured");
    }
    llm = new ChatAnthropic({
      model: model,
      temperature: 0.85,
      anthropicApiKey: anthropicKey,
      anthropicApiUrl: anthropicBase,
    });
  } else {
    if (!openrouterKey) {
      throw new Error("OpenRouter API key not configured");
    }
    llm = new ChatOpenAI({
      model: model,
      temperature: 0.85,
      apiKey: openrouterKey,
      configuration: {
        baseURL: openrouterBase,
      }
    });
  }

  const activeTools = mode === "hr" ? hrTools : developmentTools;
  const llmWithTools = llm.bindTools(activeTools);

  const formattedMessages: any[] = [
    new SystemMessage(systemPrompt),
    ...messages.map(m => 
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    )
  ];

  const executedActions: any[] = [];
  let maxIterations = 5;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    
    const response = await llmWithTools.invoke(formattedMessages);
    
    if (!response.tool_calls || response.tool_calls.length === 0) {
      const finalContent = typeof response.content === "string" 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map((c: any) => c.text || "").join("")
          : "";
      
      return { content: finalContent, actions: executedActions };
    }

    formattedMessages.push(response);

    for (const toolCall of response.tool_calls) {
      const tool = activeTools.find(t => t.name === toolCall.name);
      
      if (tool) {
        console.log(`[AI-DAN] Executing tool: ${toolCall.name}`);
        
        try {
          const result = await tool.invoke(toolCall.args);
          const parsedResult = JSON.parse(result);
          
          executedActions.push({
            tool: toolCall.name,
            input: toolCall.args,
            output: parsedResult
          });

          formattedMessages.push(new ToolMessage({
            tool_call_id: toolCall.id || `call_${Date.now()}`,
            content: result
          }));
          
          console.log(`[AI-DAN] Tool ${toolCall.name} completed:`, parsedResult.success);
        } catch (error: any) {
          console.error(`[AI-DAN] Tool ${toolCall.name} failed:`, error.message);
          
          executedActions.push({
            tool: toolCall.name,
            input: toolCall.args,
            error: error.message
          });

          formattedMessages.push(new ToolMessage({
            tool_call_id: toolCall.id || `call_${Date.now()}`,
            content: JSON.stringify({ success: false, error: error.message })
          }));
        }
      }
    }
  }

  const finalResponse = await llmWithTools.invoke(formattedMessages);
  const finalContent = typeof finalResponse.content === "string" 
    ? finalResponse.content 
    : Array.isArray(finalResponse.content) 
      ? finalResponse.content.map((c: any) => c.text || "").join("")
      : "";

  return { content: finalContent, actions: executedActions };
}
