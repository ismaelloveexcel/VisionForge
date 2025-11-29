import * as vscode from 'vscode';
import { AIService, Message, ParsedAction } from './aiService';
import { AgentExecutor, ExecutionResult } from './agentExecutor';
import { FileOperations } from './fileOperations';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messages: Message[] = [];
    private workspaceContext: string = '';
    private currentModel: string = 'gpt-4o-mini';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly aiService: AIService,
        private readonly agentExecutor: AgentExecutor,
        private readonly fileOps: FileOperations
    ) {}

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlContent();

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this.handleMessage(data.message);
                    break;
                case 'changeModel':
                    this.currentModel = data.model;
                    break;
                case 'executeActions':
                    await this.executeActions(data.actions);
                    break;
                case 'clearChat':
                    this.messages = [];
                    this.postMessage({ type: 'chatCleared' });
                    break;
                case 'scanWorkspace':
                    this.workspaceContext = await this.fileOps.getWorkspaceStructure();
                    this.postMessage({ 
                        type: 'workspaceScanned',
                        structure: this.workspaceContext 
                    });
                    break;
            }
        });

        this.initializeWorkspace();
    }

    private async initializeWorkspace() {
        try {
            this.workspaceContext = await this.fileOps.getWorkspaceStructure();
        } catch {
        }
    }

    private async handleMessage(content: string) {
        this.messages.push({ role: 'user', content });
        this.postMessage({ type: 'userMessage', content });
        this.postMessage({ type: 'thinking', isThinking: true });

        try {
            const response = await this.aiService.chat(
                this.messages,
                this.currentModel,
                this.workspaceContext
            );

            this.messages.push({ role: 'assistant', content: response.content });

            this.postMessage({
                type: 'assistantMessage',
                content: response.content,
                actions: response.actions,
                model: this.currentModel
            });

            if (response.actions && response.actions.length > 0) {
                const config = vscode.workspace.getConfiguration('aidan');
                const autoExecute = config.get<boolean>('autoExecute') || false;

                if (autoExecute) {
                    await this.executeActions(response.actions);
                }
            }
        } catch (error: any) {
            this.postMessage({
                type: 'error',
                message: error.message || 'Failed to get AI response'
            });
        } finally {
            this.postMessage({ type: 'thinking', isThinking: false });
        }
    }

    private async executeActions(actions: ParsedAction[]) {
        const results = await this.agentExecutor.executeBatch(actions);

        this.postMessage({
            type: 'actionsExecuted',
            results: results.results,
            summary: `${results.success} succeeded, ${results.failed} failed`
        });

        const readResults = results.results.filter(r => r.action.type === 'read_file' && r.output);
        if (readResults.length > 0) {
            const fileContents = readResults.map(r => 
                `File: ${r.action.path}\n\`\`\`\n${r.output}\n\`\`\``
            ).join('\n\n');

            this.messages.push({
                role: 'user',
                content: `Here are the contents of the files you requested:\n\n${fileContents}`
            });
        }
    }

    sendWorkspaceContext(structure: string) {
        this.workspaceContext = structure;
        this.postMessage({ 
            type: 'workspaceScanned',
            structure 
        });
    }

    async executeAction(prompt: string) {
        await this.handleMessage(prompt);
    }

    private postMessage(message: any) {
        this._view?.webview.postMessage(message);
    }

    private getHtmlContent(): string {
        const models = this.aiService.getAvailableModels();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-DAN</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header h1 {
            font-size: 14px;
            font-weight: 600;
            flex: 1;
        }

        .model-select {
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
        }

        .toolbar {
            padding: 8px 12px;
            display: flex;
            gap: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .toolbar button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
        }

        .toolbar button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .message {
            display: flex;
            gap: 8px;
            max-width: 100%;
        }

        .message.user {
            flex-direction: row-reverse;
        }

        .message-content {
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 85%;
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.4;
        }

        .message.user .message-content {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .message.assistant .message-content {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
        }

        .message-meta {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .actions-container {
            margin-top: 8px;
            padding: 8px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }

        .action-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
            font-size: 12px;
        }

        .action-item button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
        }

        .thinking {
            display: flex;
            gap: 4px;
            padding: 8px 12px;
        }

        .thinking span {
            width: 8px;
            height: 8px;
            background: var(--vscode-button-background);
            border-radius: 50%;
            animation: bounce 1s infinite;
        }

        .thinking span:nth-child(2) { animation-delay: 0.1s; }
        .thinking span:nth-child(3) { animation-delay: 0.2s; }

        @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
        }

        .input-container {
            padding: 12px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .input-wrapper {
            display: flex;
            gap: 8px;
        }

        textarea {
            flex: 1;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px;
            border-radius: 4px;
            font-family: inherit;
            font-size: 13px;
            resize: none;
            min-height: 60px;
        }

        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .send-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        }

        .send-button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }

        code {
            font-family: var(--vscode-editor-font-family);
        }

        .welcome {
            text-align: center;
            padding: 24px;
            color: var(--vscode-descriptionForeground);
        }

        .welcome h2 {
            color: var(--vscode-foreground);
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI-DAN</h1>
        <select class="model-select" id="modelSelect">
            ${models.map(m => `<option value="${m.id}" ${m.id === 'gpt-4o-mini' ? 'selected' : ''}>${m.name}</option>`).join('')}
        </select>
    </div>

    <div class="toolbar">
        <button onclick="scanWorkspace()">Scan Workspace</button>
        <button onclick="clearChat()">Clear Chat</button>
    </div>

    <div class="messages" id="messages">
        <div class="welcome">
            <h2>Hey, I'm AI-DAN!</h2>
            <p>Your autonomous coding assistant.<br>I can create files, run commands, and build things for you.</p>
            <p style="margin-top: 12px;">Try: "Create a simple Express server"</p>
        </div>
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <textarea 
                id="input" 
                placeholder="Ask me to build something..."
                onkeydown="handleKeydown(event)"
            ></textarea>
            <button class="send-button" id="sendBtn" onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('sendBtn');
        const modelSelect = document.getElementById('modelSelect');

        let isThinking = false;
        let hasMessages = false;

        modelSelect.addEventListener('change', () => {
            vscode.postMessage({ type: 'changeModel', model: modelSelect.value });
        });

        function handleKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }

        function sendMessage() {
            const message = input.value.trim();
            if (!message || isThinking) return;

            vscode.postMessage({ type: 'sendMessage', message });
            input.value = '';
        }

        function scanWorkspace() {
            vscode.postMessage({ type: 'scanWorkspace' });
        }

        function clearChat() {
            vscode.postMessage({ type: 'clearChat' });
        }

        function executeAction(action) {
            vscode.postMessage({ type: 'executeActions', actions: [action] });
        }

        function executeAllActions(actions) {
            vscode.postMessage({ type: 'executeActions', actions });
        }

        function addMessage(role, content, model, actions) {
            if (!hasMessages) {
                messagesContainer.innerHTML = '';
                hasMessages = true;
            }

            const msgDiv = document.createElement('div');
            msgDiv.className = 'message ' + role;

            let formattedContent = content
                .replace(/\`\`\`(\\w*)?([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
                .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                .replace(/\\n/g, '<br>')
                .replace(/<create_file[^>]*>[\\s\\S]*?<\\/create_file>/g, '')
                .replace(/<edit_file[^>]*>[\\s\\S]*?<\\/edit_file>/g, '')
                .replace(/<delete_file[^>]*\\/>/g, '')
                .replace(/<run_command>[\\s\\S]*?<\\/run_command>/g, '')
                .replace(/<read_file[^>]*\\/>/g, '')
                .replace(/<unity_create_object[^>]*\\/>/g, '')
                .replace(/<unity_add_component[^>]*\\/>/g, '')
                .replace(/<unity_create_script[^>]*>[\\s\\S]*?<\\/unity_create_script>/g, '')
                .replace(/<unity_run_menu[^>]*\\/>/g, '');

            let actionsHtml = '';
            if (actions && actions.length > 0) {
                actionsHtml = '<div class="actions-container">' +
                    '<strong>Actions:</strong>' +
                    actions.map((a, i) => 
                        '<div class="action-item">' +
                        '<span>' + a.description + '</span>' +
                        '<button onclick="executeAction(' + JSON.stringify(a).replace(/"/g, '&quot;') + ')">Execute</button>' +
                        '</div>'
                    ).join('') +
                    '<button onclick="executeAllActions(' + JSON.stringify(actions).replace(/"/g, '&quot;') + ')" style="margin-top:8px;width:100%">Execute All</button>' +
                    '</div>';
            }

            msgDiv.innerHTML = 
                '<div class="message-content">' + 
                    formattedContent + 
                    actionsHtml +
                    (model ? '<div class="message-meta">' + model + '</div>' : '') +
                '</div>';

            messagesContainer.appendChild(msgDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showThinking(show) {
            isThinking = show;
            sendBtn.disabled = show;

            const existingThinking = document.querySelector('.thinking');
            if (existingThinking) {
                existingThinking.remove();
            }

            if (show) {
                const thinkingDiv = document.createElement('div');
                thinkingDiv.className = 'message assistant thinking';
                thinkingDiv.innerHTML = '<span></span><span></span><span></span>';
                messagesContainer.appendChild(thinkingDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        window.addEventListener('message', event => {
            const data = event.data;

            switch (data.type) {
                case 'userMessage':
                    addMessage('user', data.content);
                    break;
                case 'assistantMessage':
                    showThinking(false);
                    addMessage('assistant', data.content, data.model, data.actions);
                    break;
                case 'thinking':
                    showThinking(data.isThinking);
                    break;
                case 'error':
                    showThinking(false);
                    addMessage('assistant', 'Error: ' + data.message);
                    break;
                case 'chatCleared':
                    hasMessages = false;
                    messagesContainer.innerHTML = 
                        '<div class="welcome">' +
                        '<h2>Hey, I\\'m AI-DAN!</h2>' +
                        '<p>Your autonomous coding assistant.<br>I can create files, run commands, and build things for you.</p>' +
                        '<p style="margin-top: 12px;">Try: "Create a simple Express server"</p>' +
                        '</div>';
                    break;
                case 'workspaceScanned':
                    addMessage('assistant', 'Workspace scanned! I now have context about your project structure.');
                    break;
                case 'actionsExecuted':
                    let resultDetails = data.results.map(r => 
                        (r.success ? '[OK] ' : '[FAIL] ') + r.message
                    ).join('<br>');
                    addMessage('assistant', 'Actions completed: ' + data.summary + '<br><br>' + resultDetails);
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}
