import * as vscode from 'vscode';
import { FileOperations } from './fileOperations';
import { TerminalOperations } from './terminalOperations';
import { UnityMcpBridge } from './unityMcp';
import { ParsedAction } from './aiService';

export interface ExecutionResult {
    success: boolean;
    action: ParsedAction;
    message: string;
    output?: string;
}

export class AgentExecutor {
    constructor(
        private fileOps: FileOperations,
        private terminalOps: TerminalOperations,
        private unityBridge: UnityMcpBridge
    ) {}

    async executeActions(actions: ParsedAction[], autoExecute: boolean = false): Promise<ExecutionResult[]> {
        const results: ExecutionResult[] = [];

        for (const action of actions) {
            let shouldExecute = autoExecute;

            if (!autoExecute) {
                const choice = await vscode.window.showQuickPick(
                    ['Execute', 'Skip', 'Cancel All'],
                    {
                        placeHolder: `${action.description} - Execute this action?`
                    }
                );

                if (choice === 'Cancel All') {
                    break;
                }
                shouldExecute = choice === 'Execute';
            }

            if (shouldExecute) {
                const result = await this.executeAction(action);
                results.push(result);

                if (!result.success) {
                    const continueChoice = await vscode.window.showQuickPick(
                        ['Continue', 'Stop'],
                        { placeHolder: `Action failed: ${result.message}. Continue with remaining actions?` }
                    );
                    if (continueChoice === 'Stop') {
                        break;
                    }
                }
            } else {
                results.push({
                    success: true,
                    action,
                    message: 'Skipped by user'
                });
            }
        }

        return results;
    }

    async executeAction(action: ParsedAction): Promise<ExecutionResult> {
        try {
            switch (action.type) {
                case 'create_file':
                    if (!action.path || action.content === undefined) {
                        throw new Error('Path and content required for create_file');
                    }
                    await this.fileOps.createFile(action.path, action.content);
                    return {
                        success: true,
                        action,
                        message: `Created file: ${action.path}`
                    };

                case 'edit_file':
                    if (!action.path || action.content === undefined) {
                        throw new Error('Path and content required for edit_file');
                    }
                    await this.fileOps.editFile(action.path, action.content);
                    return {
                        success: true,
                        action,
                        message: `Edited file: ${action.path}`
                    };

                case 'delete_file':
                    if (!action.path) {
                        throw new Error('Path required for delete_file');
                    }
                    await this.fileOps.deleteFile(action.path);
                    return {
                        success: true,
                        action,
                        message: `Deleted file: ${action.path}`
                    };

                case 'run_command':
                    if (!action.command) {
                        throw new Error('Command required for run_command');
                    }
                    await this.terminalOps.runCommand(action.command);
                    return {
                        success: true,
                        action,
                        message: `Executed command: ${action.command}`
                    };

                case 'read_file':
                    if (!action.path) {
                        throw new Error('Path required for read_file');
                    }
                    const content = await this.fileOps.readFile(action.path);
                    return {
                        success: true,
                        action,
                        message: `Read file: ${action.path}`,
                        output: content
                    };

                case 'unity_create_object':
                    if (!action.objectName) {
                        throw new Error('Object name required for unity_create_object');
                    }
                    if (!this.unityBridge.isEnabled()) {
                        throw new Error('Unity MCP is not enabled. Enable it in settings.');
                    }
                    const createResult = await this.unityBridge.createGameObject(action.objectName);
                    return {
                        success: createResult.success,
                        action,
                        message: createResult.message
                    };

                case 'unity_add_component':
                    if (!action.objectName || !action.componentType) {
                        throw new Error('Object name and component type required');
                    }
                    if (!this.unityBridge.isEnabled()) {
                        throw new Error('Unity MCP is not enabled. Enable it in settings.');
                    }
                    const addResult = await this.unityBridge.addComponent(action.objectName, action.componentType);
                    return {
                        success: addResult.success,
                        action,
                        message: addResult.message
                    };

                case 'unity_create_script':
                    if (!action.path || action.content === undefined) {
                        throw new Error('Path and content required for unity_create_script');
                    }
                    if (!this.unityBridge.isEnabled()) {
                        throw new Error('Unity MCP is not enabled. Enable it in settings.');
                    }
                    const scriptResult = await this.unityBridge.createScript(action.path, action.content);
                    return {
                        success: scriptResult.success,
                        action,
                        message: scriptResult.message
                    };

                case 'unity_run_menu':
                    if (!action.menuItem) {
                        throw new Error('Menu item required for unity_run_menu');
                    }
                    if (!this.unityBridge.isEnabled()) {
                        throw new Error('Unity MCP is not enabled. Enable it in settings.');
                    }
                    const menuResult = await this.unityBridge.runMenuItem(action.menuItem);
                    return {
                        success: menuResult.success,
                        action,
                        message: menuResult.message
                    };

                default:
                    throw new Error(`Unknown action type: ${(action as any).type}`);
            }
        } catch (error: any) {
            return {
                success: false,
                action,
                message: error.message || 'Unknown error'
            };
        }
    }

    async executeBatch(actions: ParsedAction[]): Promise<{ success: number; failed: number; results: ExecutionResult[] }> {
        const config = vscode.workspace.getConfiguration('aidan');
        const autoExecute = config.get<boolean>('autoExecute') || false;

        const results = await this.executeActions(actions, autoExecute);

        const success = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return { success, failed, results };
    }

    async checkUnityConnection(): Promise<boolean> {
        return this.unityBridge.checkConnection();
    }
}
