import * as vscode from 'vscode';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIResponse {
    content: string;
    actions?: ParsedAction[];
}

export interface ParsedAction {
    type: 'create_file' | 'edit_file' | 'delete_file' | 'run_command' | 'read_file' | 'unity_create_object' | 'unity_add_component' | 'unity_create_script' | 'unity_run_menu';
    path?: string;
    content?: string;
    command?: string;
    objectName?: string;
    componentType?: string;
    menuItem?: string;
    description: string;
}

const DEV_SYSTEM_PROMPT = `You are AI-DAN, an autonomous AI development assistant running inside VS Code. You are a nerdy genius who loves building things.

You have the ability to:
1. CREATE files: Use <create_file path="path/to/file">content</create_file>
2. EDIT files: Use <edit_file path="path/to/file">new content</edit_file>
3. DELETE files: Use <delete_file path="path/to/file"/>
4. RUN commands: Use <run_command>npm install express</run_command>
5. READ files: Use <read_file path="path/to/file"/>

UNITY INTEGRATION (when user is working on Unity projects):
6. CREATE GameObject: Use <unity_create_object name="ObjectName"/>
7. ADD Component: Use <unity_add_component object="ObjectName" component="Rigidbody"/>
8. CREATE Unity Script: Use <unity_create_script path="Assets/Scripts/MyScript.cs">script content</unity_create_script>
9. RUN Menu Item: Use <unity_run_menu item="GameObject/Create Empty"/>

When the user asks you to build something:
1. Think through the structure needed
2. Create the files using the XML tags above
3. Run any necessary commands

IMPORTANT: Always use these XML tags when you want to perform actions. The extension will parse them and execute the actions.

Example response when asked to create a simple Express server:
"I'll create an Express server for you!

<create_file path="server.js">
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
</create_file>

<run_command>npm init -y && npm install express</run_command>

Done! Your server is ready. Run \`node server.js\` to start it."

Example response when asked to create a Unity player controller:
"I'll create a player controller for Unity!

<unity_create_script path="Assets/Scripts/PlayerController.cs">
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 5f;
    
    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        transform.Translate(new Vector3(h, 0, v) * moveSpeed * Time.deltaTime);
    }
}
</unity_create_script>

<unity_create_object name="Player"/>
<unity_add_component object="Player" component="PlayerController"/>

Done! I've created the script and attached it to a new Player object."

Be helpful, nerdy, and actually execute the actions - don't just describe them!`;

export class AIService {
    private openaiClient: OpenAI | null = null;
    private anthropicClient: Anthropic | null = null;
    private openrouterClient: OpenAI | null = null;

    private getOpenAIClient(): OpenAI {
        const config = vscode.workspace.getConfiguration('aidan');
        const apiKey = config.get<string>('openaiApiKey');
        
        if (!apiKey) {
            throw new Error('OpenAI API key not set. Use "AI-DAN: Set API Key" command.');
        }

        if (!this.openaiClient) {
            this.openaiClient = new OpenAI({ apiKey });
        }
        return this.openaiClient;
    }

    private getAnthropicClient(): Anthropic {
        const config = vscode.workspace.getConfiguration('aidan');
        const apiKey = config.get<string>('anthropicApiKey');
        
        if (!apiKey) {
            throw new Error('Anthropic API key not set. Use "AI-DAN: Set API Key" command.');
        }

        if (!this.anthropicClient) {
            this.anthropicClient = new Anthropic({ apiKey });
        }
        return this.anthropicClient;
    }

    private getOpenRouterClient(): OpenAI {
        const config = vscode.workspace.getConfiguration('aidan');
        const apiKey = config.get<string>('openrouterApiKey');
        
        if (!apiKey) {
            throw new Error('OpenRouter API key not set. Use "AI-DAN: Set API Key" command.');
        }

        if (!this.openrouterClient) {
            this.openrouterClient = new OpenAI({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1'
            });
        }
        return this.openrouterClient;
    }

    async chat(messages: Message[], model: string, workspaceContext?: string): Promise<AIResponse> {
        const systemMessage: Message = {
            role: 'system',
            content: DEV_SYSTEM_PROMPT + (workspaceContext ? `\n\nCurrent workspace structure:\n${workspaceContext}` : '')
        };

        const allMessages = [systemMessage, ...messages];

        try {
            let responseContent: string;

            if (model.startsWith('gpt-')) {
                responseContent = await this.chatWithOpenAI(allMessages, model);
            } else if (model.startsWith('claude-')) {
                responseContent = await this.chatWithAnthropic(allMessages, model);
            } else if (model.startsWith('deepseek-') || model.startsWith('grok-')) {
                responseContent = await this.chatWithOpenRouter(allMessages, model);
            } else {
                responseContent = await this.chatWithOpenAI(allMessages, 'gpt-4o-mini');
            }

            const actions = this.parseActions(responseContent);

            return { content: responseContent, actions };
        } catch (error: any) {
            throw new Error(`AI request failed: ${error.message}`);
        }
    }

    private async chatWithOpenAI(messages: Message[], model: string): Promise<string> {
        const client = this.getOpenAIClient();
        
        const response = await client.chat.completions.create({
            model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            max_tokens: 4096
        });

        return response.choices[0]?.message?.content || '';
    }

    private async chatWithAnthropic(messages: Message[], model: string): Promise<string> {
        const client = this.getAnthropicClient();
        
        const systemContent = messages.find(m => m.role === 'system')?.content || '';
        const chatMessages = messages.filter(m => m.role !== 'system');

        const response = await client.messages.create({
            model,
            max_tokens: 4096,
            system: systemContent,
            messages: chatMessages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))
        });

        const content = response.content[0];
        return content.type === 'text' ? content.text : '';
    }

    private async chatWithOpenRouter(messages: Message[], model: string): Promise<string> {
        const client = this.getOpenRouterClient();
        
        const modelMap: Record<string, string> = {
            'deepseek-chat': 'deepseek/deepseek-chat-v3.1',
            'grok-4': 'x-ai/grok-4.1-fast:free'
        };

        const response = await client.chat.completions.create({
            model: modelMap[model] || model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            max_tokens: 4096
        });

        return response.choices[0]?.message?.content || '';
    }

    private parseActions(content: string): ParsedAction[] {
        const actions: ParsedAction[] = [];

        const createFileRegex = /<create_file\s+path="([^"]+)">([\s\S]*?)<\/create_file>/g;
        let match;
        while ((match = createFileRegex.exec(content)) !== null) {
            actions.push({
                type: 'create_file',
                path: match[1],
                content: match[2].trim(),
                description: `Create file: ${match[1]}`
            });
        }

        const editFileRegex = /<edit_file\s+path="([^"]+)">([\s\S]*?)<\/edit_file>/g;
        while ((match = editFileRegex.exec(content)) !== null) {
            actions.push({
                type: 'edit_file',
                path: match[1],
                content: match[2].trim(),
                description: `Edit file: ${match[1]}`
            });
        }

        const deleteFileRegex = /<delete_file\s+path="([^"]+)"\s*\/>/g;
        while ((match = deleteFileRegex.exec(content)) !== null) {
            actions.push({
                type: 'delete_file',
                path: match[1],
                description: `Delete file: ${match[1]}`
            });
        }

        const runCommandRegex = /<run_command>([\s\S]*?)<\/run_command>/g;
        while ((match = runCommandRegex.exec(content)) !== null) {
            actions.push({
                type: 'run_command',
                command: match[1].trim(),
                description: `Run: ${match[1].trim()}`
            });
        }

        const readFileRegex = /<read_file\s+path="([^"]+)"\s*\/>/g;
        while ((match = readFileRegex.exec(content)) !== null) {
            actions.push({
                type: 'read_file',
                path: match[1],
                description: `Read file: ${match[1]}`
            });
        }

        const unityCreateObjectRegex = /<unity_create_object\s+name="([^"]+)"\s*\/>/g;
        while ((match = unityCreateObjectRegex.exec(content)) !== null) {
            actions.push({
                type: 'unity_create_object',
                objectName: match[1],
                description: `Unity: Create GameObject "${match[1]}"`
            });
        }

        const unityAddComponentRegex = /<unity_add_component\s+object="([^"]+)"\s+component="([^"]+)"\s*\/>/g;
        while ((match = unityAddComponentRegex.exec(content)) !== null) {
            actions.push({
                type: 'unity_add_component',
                objectName: match[1],
                componentType: match[2],
                description: `Unity: Add ${match[2]} to "${match[1]}"`
            });
        }

        const unityCreateScriptRegex = /<unity_create_script\s+path="([^"]+)">([\s\S]*?)<\/unity_create_script>/g;
        while ((match = unityCreateScriptRegex.exec(content)) !== null) {
            actions.push({
                type: 'unity_create_script',
                path: match[1],
                content: match[2].trim(),
                description: `Unity: Create script "${match[1]}"`
            });
        }

        const unityRunMenuRegex = /<unity_run_menu\s+item="([^"]+)"\s*\/>/g;
        while ((match = unityRunMenuRegex.exec(content)) !== null) {
            actions.push({
                type: 'unity_run_menu',
                menuItem: match[1],
                description: `Unity: Run menu "${match[1]}"`
            });
        }

        return actions;
    }

    getAvailableModels(): { id: string; name: string; provider: string }[] {
        return [
            { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
            { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
            { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
            { id: 'claude-opus-4-1', name: 'Claude Opus 4.1', provider: 'Anthropic' },
            { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'OpenRouter' },
            { id: 'grok-4', name: 'Grok 4', provider: 'OpenRouter' }
        ];
    }
}
