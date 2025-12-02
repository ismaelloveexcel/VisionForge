import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { UAELaborLawSearchTool, GratuityCalculatorTool, EmitisationCheckTool } from "./tools/uae-law-rag";
import { DAN_SYSTEM_PROMPT } from "../lib/system-prompt";
import { DeployAppTool } from "../tools/deploy-tool";
import { WriteFileTool } from "../tools/file-tool";
import { ShellTool } from "../tools/shell-tool";
import { LiveDeployTool } from "../tools/live-deploy-tool";

const DEV_TOOLS_CONTEXT = `

## CRITICAL: You Have TOOLS - USE THEM!
When someone asks you to BUILD, CREATE, or MAKE something, you MUST use your tools to actually do it. Don't just describe what you would do - DO IT.

Your tools:
1. **create_file** - Create a single code/text file in generated/ folder
2. **create_project** - Create an entire project with multiple files
3. **create_discord_bot** - Generate a complete Discord bot
4. **write_file** - Write/overwrite any file on disk (use for edits outside generated/)
5. **read_file** - Read existing project files
6. **run_command** - Run any shell command (git, npm, curl, etc.)
7. **deploy_app_live** - Deploy an app to a new public Replit with a live URL instantly

## How You Work

### When someone asks to BUILD something:
1. Briefly acknowledge the request
2. IMMEDIATELY call the appropriate tool to create it
3. Tell them what you created and where to find it

### When someone wants to DEPLOY:
Use deploy_app_live with the files object to get a live URL in seconds.

### When someone needs to run commands:
Use run_command for git, npm install, curl, or any terminal stuff.

### When someone is just chatting or asking questions:
- Have a normal conversation
- Be helpful and friendly
- Only use tools if they specifically ask you to create something

## Important
- Generated files go in the "generated/" folder
- Always report what you created
- If a tool fails, explain what went wrong
- You can chain tools: create → deploy → share URL`;

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
  new LiveDeployTool(),
  new CreateFileTool(),
  new CreateProjectTool(),
  new CreateDiscordBotTool(),
  new WriteFileTool(),
  new ReadFileTool(),
  new ShellTool(),
  new DeployAppTool(),
];

const hrTools = [
  new CreateFileTool(),
  new CreateProjectTool(),
  new WriteFileTool(),
  new ReadFileTool(),
  new ShellTool(),
  new UAELaborLawSearchTool(),
  new GratuityCalculatorTool(),
  new EmitisationCheckTool(),
];

const tools = developmentTools;

const TOOL_ENFORCEMENT_MESSAGE = `STOP. You just gave an explanation without using ANY tools.

That is UNACCEPTABLE. The user asked you to BUILD/CREATE something.

You MUST call create_file or create_project RIGHT NOW.

Do NOT explain. Do NOT give steps. CREATE THE FILES.

If you're unsure what to build, create a minimal starter project. ANYTHING is better than giving instructions.`;

function looksLikeBuildRequest(content: string): boolean {
  const buildKeywords = [
    'build', 'buid', 'buld', 'biuld',
    'create', 'crate', 'creat',
    'make', 'mak', 'mae',
    'generate', 'generat',
    'develop', 'devlop',
    'code', 'cod',
    'write', 'writ',
    'prototype', 'protoype', 'prototyp',
    'implement', 'implment',
    'setup', 'set up', 'set-up',
    'start', 'ship', 'launch', 'deploy',
    'complete', 'finish', 'do it', 'go ahead',
    'lets go', "let's go", 'lets see', "let's see",
    'show me', 'give me', 'get started',
    'app', 'website', 'bot', 'game', 'project', 'script', 'tool',
    'unity', 'react', 'discord', 'api', 'dashboard', 'template',
    'full', 'entire', 'whole', 'complete',
    'mvp', 'starter', 'boilerplate',
    'first project', 'your project',
    'what you can do', 'what can you do',
    'just do it', 'go for it',
  ];
  const lower = content.toLowerCase();
  return buildKeywords.some(kw => lower.includes(kw));
}

function looksLikeBuildRequestFromHistory(messages: AgentMessage[]): boolean {
  const recentMessages = messages.slice(-4);
  return recentMessages.some(m => m.role === "user" && looksLikeBuildRequest(m.content));
}

function looksLikeExplanatoryResponse(content: string): boolean {
  const explanationPatterns = [
    /^\d+\.\s+/m,
    /^[-•]\s+/m,
    /here's how/i,
    /you would need to/i,
    /the steps are/i,
    /first,?\s+(you|we)/i,
    /to (build|create|make)/i,
    /prototype development/i,
    /next steps:/i,
    /you'll need to/i,
    /development steps/i,
    /```[\s\S]*```/,
    /class\s+\w+\s*[:{]/,
    /function\s+\w+\s*\(/,
    /import\s+.*from/,
    /const\s+\w+\s*=/,
    /def\s+\w+\s*\(/,
    /i('ll| will)\s+(start|begin|create|set up)/i,
    /let me (explain|walk you|show you|describe)/i,
    /you can (then|start|begin)/i,
    /this (involves|requires|will need)/i,
    /here('s| is) (a|the|an|what)/i,
    /the (approach|solution|way) (is|would be)/i,
  ];
  return explanationPatterns.some(pattern => pattern.test(content));
}

function forceMinimalProject(projectType: string): { projectName: string; files: { path: string; content: string }[] } {
  const templates: Record<string, { projectName: string; files: { path: string; content: string }[] }> = {
    unity: {
      projectName: "unity-game-starter",
      files: [
        { path: "Assets/Scripts/GameManager.cs", content: `using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    void Start()
    {
        Debug.Log("Game Started!");
    }
}` },
        { path: "Assets/Scripts/PlayerController.cs", content: `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 5f;
    
    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        transform.Translate(new Vector3(h, 0, v) * moveSpeed * Time.deltaTime);
    }
}` },
        { path: "README.md", content: "# Unity Game Starter\\n\\nOpen in Unity and start building!" }
      ]
    },
    react: {
      projectName: "react-app-starter",
      files: [
        { path: "src/App.tsx", content: `export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold">Hello World</h1>
    </div>
  );
}` },
        { path: "package.json", content: JSON.stringify({ name: "react-app", scripts: { dev: "vite" }, dependencies: { react: "^18", "react-dom": "^18" } }, null, 2) }
      ]
    },
    default: {
      projectName: "starter-project",
      files: [
        { path: "main.js", content: "console.log('Hello World!');" },
        { path: "README.md", content: "# Starter Project\\n\\nYour project starts here!" }
      ]
    }
  };
  
  if (projectType.includes("unity") || projectType.includes("game")) return templates.unity;
  if (projectType.includes("react")) return templates.react;
  return templates.default;
}

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

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const isBuildRequest = looksLikeBuildRequest(lastUserMessage) || looksLikeBuildRequestFromHistory(messages);
  let enforcementRetries = 0;
  const maxEnforcementRetries = 2;

  while (iterations < maxIterations) {
    iterations++;
    
    const response = await llmWithTools.invoke(formattedMessages);
    
    if (!response.tool_calls || response.tool_calls.length === 0) {
      const finalContent = typeof response.content === "string" 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map((c: any) => c.text || "").join("")
          : "";
      
      if (isBuildRequest && looksLikeExplanatoryResponse(finalContent) && enforcementRetries < maxEnforcementRetries) {
        console.log(`[AI-DAN] Enforcement: Response looks explanatory, forcing tool usage (retry ${enforcementRetries + 1})`);
        enforcementRetries++;
        formattedMessages.push(new AIMessage(finalContent));
        formattedMessages.push(new SystemMessage(TOOL_ENFORCEMENT_MESSAGE));
        continue;
      }
      
      if (isBuildRequest && executedActions.length === 0) {
        console.log(`[AI-DAN] Enforcement: No tools used after all retries, forcing project creation`);
        const fallback = forceMinimalProject(lastUserMessage);
        const projectTool = activeTools.find(t => t.name === "create_project") as CreateProjectTool;
        if (projectTool) {
          try {
            const result = await projectTool.invoke({ projectName: fallback.projectName, files: fallback.files });
            const parsedResult = JSON.parse(result);
            executedActions.push({ tool: "create_project", input: fallback, output: parsedResult });
            return {
              content: `Done! Created your starter project at \`generated/${fallback.projectName}/\` with ${fallback.files.length} files. Check the files and let me know what you want to build on top of this!`,
              actions: executedActions
            };
          } catch (err: any) {
            console.error(`[AI-DAN] Fallback project creation failed:`, err.message);
          }
        }
      }
      
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

export async function* runAgentStream(
  messages: AgentMessage[],
  mode: "development" | "hr",
  model: string,
  provider: string
): AsyncGenerator<{ type: "token" | "tool_start" | "tool_end" | "done"; data: any }> {
  const toolsContext = mode === "hr" ? HR_TOOLS_CONTEXT : DEV_TOOLS_CONTEXT;
  const systemPrompt = DAN_SYSTEM_PROMPT + toolsContext;
  
  let llm: ChatOpenAI | ChatAnthropic;
  
  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const openaiBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const anthropicKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const openrouterKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const openrouterBase = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  
  if (provider === "openai") {
    if (!openaiKey) throw new Error("OpenAI API key not configured");
    llm = new ChatOpenAI({
      model,
      temperature: 0.85,
      apiKey: openaiKey,
      streaming: true,
      configuration: { baseURL: openaiBase }
    });
  } else if (provider === "anthropic") {
    if (!anthropicKey) throw new Error("Anthropic API key not configured");
    llm = new ChatAnthropic({
      model,
      temperature: 0.85,
      anthropicApiKey: anthropicKey,
      anthropicApiUrl: anthropicBase,
      streaming: true,
    });
  } else {
    if (!openrouterKey) throw new Error("OpenRouter API key not configured");
    llm = new ChatOpenAI({
      model,
      temperature: 0.85,
      apiKey: openrouterKey,
      streaming: true,
      configuration: { baseURL: openrouterBase }
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
  let fullContent = "";
  
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const isBuildRequest = looksLikeBuildRequest(lastUserMessage) || looksLikeBuildRequestFromHistory(messages);
  let enforcementRetries = 0;
  const maxEnforcementRetries = 2;
  let suppressedContent = "";

  while (iterations < maxIterations) {
    iterations++;
    
    let response: any = null;
    let streamedContent = "";
    const shouldSuppressStreaming = isBuildRequest && enforcementRetries < maxEnforcementRetries;
    
    for await (const chunk of await llmWithTools.stream(formattedMessages)) {
      if (chunk.content) {
        const text = typeof chunk.content === "string" 
          ? chunk.content 
          : Array.isArray(chunk.content) 
            ? chunk.content.map((c: any) => c.text || "").join("")
            : "";
        if (text) {
          streamedContent += text;
          if (!shouldSuppressStreaming || (chunk.tool_calls && chunk.tool_calls.length > 0)) {
            yield { type: "token", data: text };
          }
        }
      }
      response = chunk;
    }

    fullContent = streamedContent;

    if (!response?.tool_calls || response.tool_calls.length === 0) {
      if (isBuildRequest && looksLikeExplanatoryResponse(fullContent) && enforcementRetries < maxEnforcementRetries) {
        console.log(`[AI-DAN] Stream Enforcement: Response looks explanatory, forcing tool usage (retry ${enforcementRetries + 1})`);
        enforcementRetries++;
        suppressedContent = fullContent;
        formattedMessages.push(new AIMessage(fullContent));
        formattedMessages.push(new SystemMessage(TOOL_ENFORCEMENT_MESSAGE));
        continue;
      }
      
      if (isBuildRequest && executedActions.length === 0) {
        console.log(`[AI-DAN] Stream Enforcement: No tools used after all retries, forcing project creation`);
        const fallback = forceMinimalProject(lastUserMessage);
        const projectTool = activeTools.find(t => t.name === "create_project");
        if (projectTool) {
          yield { type: "tool_start", data: { name: "create_project", args: fallback } };
          try {
            const result = await projectTool.invoke({ projectName: fallback.projectName, files: fallback.files });
            const parsedResult = JSON.parse(result);
            executedActions.push({ tool: "create_project", input: fallback, output: parsedResult });
            yield { type: "tool_end", data: { name: "create_project", success: true, result: parsedResult } };
            const finalMsg = `Done! Created your starter project at \`generated/${fallback.projectName}/\` with ${fallback.files.length} files. Check the files and let me know what you want to build on top of this!`;
            yield { type: "token", data: finalMsg };
            yield { type: "done", data: { content: finalMsg, actions: executedActions } };
            return;
          } catch (err: any) {
            yield { type: "tool_end", data: { name: "create_project", success: false, error: err.message } };
          }
        }
      }
      
      yield { type: "done", data: { content: fullContent, actions: executedActions } };
      return;
    }

    formattedMessages.push(new AIMessage({ content: streamedContent, tool_calls: response.tool_calls }));

    for (const toolCall of response.tool_calls) {
      const tool = activeTools.find(t => t.name === toolCall.name);
      
      if (tool) {
        yield { type: "tool_start", data: { name: toolCall.name, args: toolCall.args } };
        
        try {
          const result = await tool.invoke(toolCall.args);
          const parsedResult = JSON.parse(result);
          
          executedActions.push({ tool: toolCall.name, input: toolCall.args, output: parsedResult });
          formattedMessages.push(new ToolMessage({ tool_call_id: toolCall.id || `call_${Date.now()}`, content: result }));
          
          yield { type: "tool_end", data: { name: toolCall.name, success: true, result: parsedResult } };
        } catch (error: any) {
          executedActions.push({ tool: toolCall.name, input: toolCall.args, error: error.message });
          formattedMessages.push(new ToolMessage({ tool_call_id: toolCall.id || `call_${Date.now()}`, content: JSON.stringify({ success: false, error: error.message }) }));
          
          yield { type: "tool_end", data: { name: toolCall.name, success: false, error: error.message } };
        }
      }
    }
  }

  yield { type: "done", data: { content: fullContent, actions: executedActions } };
}
