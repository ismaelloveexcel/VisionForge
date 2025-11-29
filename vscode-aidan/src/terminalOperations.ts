import * as vscode from 'vscode';

export class TerminalOperations {
    private terminal: vscode.Terminal | null = null;

    private getOrCreateTerminal(): vscode.Terminal {
        if (this.terminal && !this.terminal.exitStatus) {
            return this.terminal;
        }

        this.terminal = vscode.window.createTerminal({
            name: 'AI-DAN Terminal',
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        });

        return this.terminal;
    }

    async runCommand(command: string): Promise<void> {
        const terminal = this.getOrCreateTerminal();
        terminal.show();
        terminal.sendText(command);
    }

    async runCommandWithOutput(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const cp = require('child_process');
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

            cp.exec(command, { cwd: workspaceRoot, maxBuffer: 1024 * 1024 * 10 }, (error: any, stdout: string, stderr: string) => {
                if (error && !stdout) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout + (stderr ? '\n' + stderr : ''));
                }
            });
        });
    }

    async runMultipleCommands(commands: string[]): Promise<void> {
        const terminal = this.getOrCreateTerminal();
        terminal.show();

        for (const command of commands) {
            terminal.sendText(command);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async runCommandInBackground(command: string): Promise<{ stdout: string; stderr: string }> {
        return new Promise((resolve, reject) => {
            const cp = require('child_process');
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

            cp.exec(command, { cwd: workspaceRoot }, (error: any, stdout: string, stderr: string) => {
                if (error && !stdout) {
                    reject({ stdout: '', stderr: stderr || error.message });
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    showTerminal(): void {
        const terminal = this.getOrCreateTerminal();
        terminal.show();
    }

    hideTerminal(): void {
        if (this.terminal) {
            this.terminal.hide();
        }
    }

    disposeTerminal(): void {
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
    }
}
