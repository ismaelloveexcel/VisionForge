import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';
import { TerminalOperations } from './terminalOperations';
import { AgentExecutor } from './agentExecutor';
import { ChatViewProvider } from './chatViewProvider';

let chatViewProvider: ChatViewProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI-DAN Extension is now active!');

    const aiService = new AIService();
    const fileOps = new FileOperations();
    const terminalOps = new TerminalOperations();
    const agentExecutor = new AgentExecutor(fileOps, terminalOps);

    chatViewProvider = new ChatViewProvider(
        context.extensionUri,
        aiService,
        agentExecutor,
        fileOps
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'aidan.chatView',
            chatViewProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.openChat', () => {
            vscode.commands.executeCommand('aidan.chatView.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.setApiKey', async () => {
            const provider = await vscode.window.showQuickPick(
                ['OpenAI', 'Anthropic', 'OpenRouter'],
                { placeHolder: 'Select AI provider' }
            );

            if (provider) {
                const key = await vscode.window.showInputBox({
                    prompt: `Enter your ${provider} API key`,
                    password: true,
                    placeHolder: 'sk-...'
                });

                if (key) {
                    const config = vscode.workspace.getConfiguration('aidan');
                    const keyName = provider.toLowerCase() + 'ApiKey';
                    await config.update(keyName, key, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`${provider} API key saved!`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.scanWorkspace', async () => {
            const structure = await fileOps.getWorkspaceStructure();
            vscode.window.showInformationMessage(
                `Scanned ${structure.split('\n').length} items in workspace`
            );
            chatViewProvider.sendWorkspaceContext(structure);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.executeAction', async () => {
            const action = await vscode.window.showInputBox({
                prompt: 'Describe the action for AI-DAN to execute',
                placeHolder: 'e.g., Create a new React component called Button'
            });

            if (action) {
                chatViewProvider.executeAction(action);
            }
        })
    );

    vscode.window.showInformationMessage('AI-DAN is ready! Press Ctrl+Shift+A to open chat.');
}

export function deactivate() {
    console.log('AI-DAN Extension deactivated');
}
