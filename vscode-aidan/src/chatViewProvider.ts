import * as vscode from 'vscode';
import { AIService, Message, ParsedAction } from './aiService';
import { AgentExecutor, ExecutionResult } from './agentExecutor';
import { FileOperations } from './fileOperations';
import { VisionPlanner } from './visionPlanner';
import { ProjectTemplateManager } from './projectTemplates';
import { MemoryManager } from './memoryManager';
import { LearningEngine } from './learningEngine';
import { GitOperations } from './gitOperations';
import { TestGenerator } from './testGenerator';
import { RefactorEngine } from './refactorEngine';
import { ErrorRecovery } from './errorRecovery';
import { ResourceFinder } from './resourceFinder';
import { ProgressTracker } from './progressTracker';
import { CodeReview } from './codeReview';
import { DeploymentHelper } from './deploymentHelper';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messages: Message[] = [];
    private workspaceContext: string = '';
    private currentModel: string = 'gpt-4o-mini';
    private currentTab: 'chat' | 'vision' | 'progress' | 'templates' = 'chat';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly aiService: AIService,
        private readonly agentExecutor: AgentExecutor,
        private readonly fileOps: FileOperations,
        private readonly visionPlanner?: VisionPlanner,
        private readonly templateManager?: ProjectTemplateManager,
        private readonly memoryManager?: MemoryManager,
        private readonly learningEngine?: LearningEngine,
        private readonly gitOps?: GitOperations,
        private readonly testGenerator?: TestGenerator,
        private readonly refactorEngine?: RefactorEngine,
        private readonly errorRecovery?: ErrorRecovery,
        private readonly resourceFinder?: ResourceFinder,
        private readonly progressTracker?: ProgressTracker,
        private readonly codeReview?: CodeReview,
        private readonly deploymentHelper?: DeploymentHelper
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
                    if (this.learningEngine) {
                        await this.learningEngine.analyzeWorkspace();
                    }
                    this.postMessage({ 
                        type: 'workspaceScanned',
                        structure: this.workspaceContext 
                    });
                    break;
                case 'changeTab':
                    this.currentTab = data.tab;
                    this.updateTabContent();
                    break;
                case 'planProject':
                    await this.handlePlanProject(data.description);
                    break;
                case 'applyTemplate':
                    await this.handleApplyTemplate(data.templateId);
                    break;
                case 'gitCommit':
                    await this.handleGitCommit();
                    break;
                case 'generateTests':
                    await this.handleGenerateTests();
                    break;
                case 'reviewCode':
                    await this.handleCodeReview();
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
            let contextAddition = '';
            if (this.memoryManager) {
                contextAddition = this.memoryManager.getContextForPrompt();
            }
            if (this.learningEngine) {
                contextAddition += this.learningEngine.getStylePromptAddition();
            }

            const fullContext = this.workspaceContext + '\n\n' + contextAddition;

            const response = await this.aiService.chat(
                this.messages,
                this.currentModel,
                fullContext
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

    private async handlePlanProject(description: string) {
        if (!this.visionPlanner) return;

        this.postMessage({ type: 'thinking', isThinking: true });
        try {
            const vision = await this.visionPlanner.createProjectVision(description, this.workspaceContext);
            this.postMessage({
                type: 'visionCreated',
                vision: vision,
                markdown: this.visionPlanner.exportVisionToMarkdown()
            });
        } catch (error: any) {
            this.postMessage({ type: 'error', message: error.message });
        } finally {
            this.postMessage({ type: 'thinking', isThinking: false });
        }
    }

    private async handleApplyTemplate(templateId: string) {
        if (!this.templateManager) return;

        this.postMessage({ type: 'thinking', isThinking: true });
        try {
            const result = await this.templateManager.applyTemplate(templateId);
            this.postMessage({
                type: 'templateApplied',
                success: result.success,
                message: result.message
            });
        } catch (error: any) {
            this.postMessage({ type: 'error', message: error.message });
        } finally {
            this.postMessage({ type: 'thinking', isThinking: false });
        }
    }

    private async handleGitCommit() {
        if (!this.gitOps) return;

        try {
            const status = await this.gitOps.getStatus();
            if (status.staged.length === 0) {
                await this.gitOps.stageFiles([]);
            }

            const suggestion = await this.gitOps.suggestCommitMessage();
            this.postMessage({
                type: 'commitSuggestion',
                message: suggestion.message,
                type_: suggestion.type
            });
        } catch (error: any) {
            this.postMessage({ type: 'error', message: error.message });
        }
    }

    private async handleGenerateTests() {
        if (!this.testGenerator) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.postMessage({ type: 'error', message: 'No active file' });
            return;
        }

        this.postMessage({ type: 'thinking', isThinking: true });
        try {
            const filePath = vscode.workspace.asRelativePath(editor.document.uri);
            const suite = await this.testGenerator.generateTests(filePath);
            await this.testGenerator.createTestFile(suite);
            this.postMessage({
                type: 'testsGenerated',
                testFile: suite.testFile,
                count: suite.cases.length
            });
        } catch (error: any) {
            this.postMessage({ type: 'error', message: error.message });
        } finally {
            this.postMessage({ type: 'thinking', isThinking: false });
        }
    }

    private async handleCodeReview() {
        if (!this.codeReview) return;

        this.postMessage({ type: 'thinking', isThinking: true });
        try {
            const result = await this.codeReview.reviewChanges();
            this.postMessage({
                type: 'codeReviewComplete',
                score: result.score,
                summary: result.summary,
                comments: result.comments
            });
        } catch (error: any) {
            this.postMessage({ type: 'error', message: error.message });
        } finally {
            this.postMessage({ type: 'thinking', isThinking: false });
        }
    }

    private updateTabContent() {
        switch (this.currentTab) {
            case 'vision':
                if (this.visionPlanner) {
                    const vision = this.visionPlanner.getCurrentVision();
                    this.postMessage({
                        type: 'tabContent',
                        tab: 'vision',
                        content: vision ? this.visionPlanner.exportVisionToMarkdown() : null
                    });
                }
                break;
            case 'progress':
                if (this.progressTracker) {
                    const progress = this.progressTracker.getProgress();
                    const report = this.progressTracker.generateProgressReport();
                    this.postMessage({
                        type: 'tabContent',
                        tab: 'progress',
                        progress,
                        report
                    });
                }
                break;
            case 'templates':
                if (this.templateManager) {
                    const templates = this.templateManager.getTemplates();
                    this.postMessage({
                        type: 'tabContent',
                        tab: 'templates',
                        templates
                    });
                }
                break;
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
        const hasEnhancements = !!this.visionPlanner;

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

        .version-badge {
            font-size: 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 10px;
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

        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .tab {
            padding: 8px 16px;
            font-size: 12px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            color: var(--vscode-foreground);
            opacity: 0.7;
        }

        .tab:hover {
            opacity: 1;
        }

        .tab.active {
            border-bottom-color: var(--vscode-button-background);
            opacity: 1;
        }

        .toolbar {
            padding: 8px 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
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

        .quick-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            padding: 12px;
        }

        .quick-action {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            text-align: left;
        }

        .quick-action:hover {
            border-color: var(--vscode-button-background);
        }

        .quick-action-title {
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 4px;
        }

        .quick-action-desc {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .progress-bar {
            height: 8px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            overflow: hidden;
            margin: 8px 0;
        }

        .progress-fill {
            height: 100%;
            background: var(--vscode-button-background);
            transition: width 0.3s ease;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
        }

        .status-success { background: #2ea043; color: white; }
        .status-warning { background: #d29922; color: white; }
        .status-error { background: #cf222e; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI-DAN</h1>
        <span class="version-badge">v2.0</span>
        <select class="model-select" id="modelSelect">
            ${models.map(m => `<option value="${m.id}" ${m.id === 'gpt-4o-mini' ? 'selected' : ''}>${m.name}</option>`).join('')}
        </select>
    </div>

    ${hasEnhancements ? `
    <div class="tabs">
        <div class="tab active" data-tab="chat" onclick="switchTab('chat')">Chat</div>
        <div class="tab" data-tab="vision" onclick="switchTab('vision')">Vision</div>
        <div class="tab" data-tab="progress" onclick="switchTab('progress')">Progress</div>
        <div class="tab" data-tab="templates" onclick="switchTab('templates')">Templates</div>
    </div>
    ` : ''}

    <div class="toolbar">
        <button onclick="scanWorkspace()">Scan</button>
        <button onclick="planProject()">Plan</button>
        <button onclick="gitCommit()">Commit</button>
        <button onclick="generateTests()">Tests</button>
        <button onclick="reviewCode()">Review</button>
        <button onclick="clearChat()">Clear</button>
    </div>

    <div class="messages" id="messages">
        <div class="welcome">
            <h2>Hey, I'm AI-DAN v2.0!</h2>
            <p>Your autonomous development partner.</p>
            <p style="margin-top:8px;font-size:11px;">I can plan, code, test, review, and deploy!</p>
        </div>
        <div class="quick-actions">
            <div class="quick-action" onclick="quickAction('Plan a new project')">
                <div class="quick-action-title">Plan Project</div>
                <div class="quick-action-desc">Create a vision & roadmap</div>
            </div>
            <div class="quick-action" onclick="quickAction('Use a template')">
                <div class="quick-action-title">Templates</div>
                <div class="quick-action-desc">Start from a template</div>
            </div>
            <div class="quick-action" onclick="quickAction('Review my code')">
                <div class="quick-action-title">Code Review</div>
                <div class="quick-action-desc">Check quality & security</div>
            </div>
            <div class="quick-action" onclick="quickAction('Help me deploy')">
                <div class="quick-action-title">Deploy</div>
                <div class="quick-action-desc">Deploy to cloud</div>
            </div>
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
        let currentTab = 'chat';

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

        function quickAction(prompt) {
            input.value = prompt;
            sendMessage();
        }

        function scanWorkspace() {
            vscode.postMessage({ type: 'scanWorkspace' });
        }

        function clearChat() {
            vscode.postMessage({ type: 'clearChat' });
        }

        function planProject() {
            const desc = prompt('Describe your project idea:');
            if (desc) {
                vscode.postMessage({ type: 'planProject', description: desc });
            }
        }

        function gitCommit() {
            vscode.postMessage({ type: 'gitCommit' });
        }

        function generateTests() {
            vscode.postMessage({ type: 'generateTests' });
        }

        function reviewCode() {
            vscode.postMessage({ type: 'reviewCode' });
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="' + tab + '"]')?.classList.add('active');
            vscode.postMessage({ type: 'changeTab', tab });
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
                        '<h2>Hey, I\\'m AI-DAN v2.0!</h2>' +
                        '<p>Your autonomous development partner.</p>' +
                        '</div>';
                    break;
                case 'workspaceScanned':
                    addMessage('assistant', 'Workspace scanned! I now know your project structure and have learned your coding patterns.');
                    break;
                case 'actionsExecuted':
                    let resultDetails = data.results.map(r => 
                        (r.success ? '[OK] ' : '[FAIL] ') + r.message
                    ).join('<br>');
                    addMessage('assistant', 'Actions completed: ' + data.summary + '<br><br>' + resultDetails);
                    break;
                case 'visionCreated':
                    addMessage('assistant', 'Project vision created!<br><br><pre>' + data.markdown.substring(0, 500) + '...</pre>');
                    break;
                case 'templateApplied':
                    addMessage('assistant', data.success ? 'Template applied: ' + data.message : 'Error: ' + data.message);
                    break;
                case 'commitSuggestion':
                    addMessage('assistant', 'Suggested commit message:<br><code>' + data.message + '</code>');
                    break;
                case 'testsGenerated':
                    addMessage('assistant', 'Generated ' + data.count + ' tests in ' + data.testFile);
                    break;
                case 'codeReviewComplete':
                    const scoreClass = data.score >= 80 ? 'success' : data.score >= 60 ? 'warning' : 'error';
                    addMessage('assistant', '<span class="status-badge status-' + scoreClass + '">Score: ' + data.score + '</span><br>' + data.summary);
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}
