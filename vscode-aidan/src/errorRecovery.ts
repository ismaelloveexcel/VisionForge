import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';
import { TerminalOperations } from './terminalOperations';

export interface ErrorInfo {
    type: 'syntax' | 'runtime' | 'type' | 'import' | 'dependency' | 'configuration' | 'unknown';
    message: string;
    file?: string;
    line?: number;
    column?: number;
    stack?: string;
    severity: 'error' | 'warning';
}

export interface ErrorFix {
    description: string;
    code?: string;
    file?: string;
    command?: string;
    confidence: number;
    autoApplicable: boolean;
}

export interface RecoveryResult {
    error: ErrorInfo;
    fixes: ErrorFix[];
    applied?: ErrorFix;
    success: boolean;
    message: string;
}

export class ErrorRecovery {
    private errorPatterns: Array<{
        pattern: RegExp;
        type: ErrorInfo['type'];
        extractor: (match: RegExpMatchArray) => Partial<ErrorInfo>;
    }> = [
        {
            pattern: /SyntaxError: (.+?) \((\d+):(\d+)\)/,
            type: 'syntax',
            extractor: (m) => ({ message: m[1], line: parseInt(m[2]), column: parseInt(m[3]) })
        },
        {
            pattern: /TypeError: (.+)/,
            type: 'type',
            extractor: (m) => ({ message: m[1] })
        },
        {
            pattern: /Cannot find module ['"](.+?)['"]/,
            type: 'import',
            extractor: (m) => ({ message: `Module not found: ${m[1]}` })
        },
        {
            pattern: /Error: Cannot find module ['"](.+?)['"]/,
            type: 'dependency',
            extractor: (m) => ({ message: `Missing dependency: ${m[1]}` })
        },
        {
            pattern: /ReferenceError: (\w+) is not defined/,
            type: 'runtime',
            extractor: (m) => ({ message: `${m[1]} is not defined` })
        },
        {
            pattern: /at (.+?):(\d+):(\d+)/,
            type: 'runtime',
            extractor: (m) => ({ file: m[1], line: parseInt(m[2]), column: parseInt(m[3]) })
        }
    ];

    constructor(
        private aiService: AIService,
        private fileOps: FileOperations,
        private terminalOps: TerminalOperations
    ) {}

    parseError(errorOutput: string): ErrorInfo {
        const error: ErrorInfo = {
            type: 'unknown',
            message: errorOutput.split('\n')[0] || 'Unknown error',
            severity: 'error'
        };

        for (const { pattern, type, extractor } of this.errorPatterns) {
            const match = errorOutput.match(pattern);
            if (match) {
                error.type = type;
                Object.assign(error, extractor(match));
                break;
            }
        }

        if (errorOutput.includes('at ')) {
            error.stack = errorOutput;
        }

        return error;
    }

    async suggestFixes(error: ErrorInfo): Promise<ErrorFix[]> {
        const fixes: ErrorFix[] = [];

        switch (error.type) {
            case 'dependency':
                const depMatch = error.message.match(/['"](.+?)['"]/);
                if (depMatch) {
                    fixes.push({
                        description: `Install missing package: ${depMatch[1]}`,
                        command: `npm install ${depMatch[1]}`,
                        confidence: 0.95,
                        autoApplicable: true
                    });
                }
                break;

            case 'import':
                fixes.push({
                    description: 'Check if the import path is correct',
                    confidence: 0.7,
                    autoApplicable: false
                });
                if (error.file) {
                    fixes.push({
                        description: 'Create the missing file',
                        confidence: 0.5,
                        autoApplicable: false
                    });
                }
                break;

            case 'syntax':
                if (error.file && error.line) {
                    const fix = await this.generateSyntaxFix(error);
                    if (fix) fixes.push(fix);
                }
                break;

            case 'type':
                const typeFix = await this.generateTypeFix(error);
                if (typeFix) fixes.push(typeFix);
                break;

            case 'runtime':
                const runtimeFixes = await this.generateRuntimeFixes(error);
                fixes.push(...runtimeFixes);
                break;
        }

        if (fixes.length === 0) {
            const aiFixes = await this.getAIFixes(error);
            fixes.push(...aiFixes);
        }

        return fixes.sort((a, b) => b.confidence - a.confidence);
    }

    private async generateSyntaxFix(error: ErrorInfo): Promise<ErrorFix | null> {
        if (!error.file || !error.line) return null;

        try {
            const content = await this.fileOps.readFile(error.file);
            const lines = content.split('\n');
            const errorLine = lines[error.line - 1] || '';

            const commonFixes: Array<{ pattern: RegExp; fix: string; description: string }> = [
                { pattern: /[^;]$/, fix: ';', description: 'Add missing semicolon' },
                { pattern: /\{[^}]*$/, fix: '}', description: 'Add missing closing brace' },
                { pattern: /\([^)]*$/, fix: ')', description: 'Add missing closing parenthesis' },
                { pattern: /\[[^\]]*$/, fix: ']', description: 'Add missing closing bracket' }
            ];

            for (const { pattern, fix, description } of commonFixes) {
                if (pattern.test(errorLine)) {
                    return {
                        description,
                        code: errorLine + fix,
                        file: error.file,
                        confidence: 0.8,
                        autoApplicable: true
                    };
                }
            }
        } catch {
        }

        return null;
    }

    private async generateTypeFix(error: ErrorInfo): Promise<ErrorFix | null> {
        if (error.message.includes('undefined')) {
            return {
                description: 'Add null/undefined check before accessing property',
                code: '// Add optional chaining: obj?.property or null check',
                confidence: 0.7,
                autoApplicable: false
            };
        }

        if (error.message.includes('is not a function')) {
            return {
                description: 'Check if the value is actually a function before calling',
                code: '// Add type check: typeof fn === "function" && fn()',
                confidence: 0.7,
                autoApplicable: false
            };
        }

        return null;
    }

    private async generateRuntimeFixes(error: ErrorInfo): Promise<ErrorFix[]> {
        const fixes: ErrorFix[] = [];

        if (error.message.includes('is not defined')) {
            const varName = error.message.match(/(\w+) is not defined/)?.[1];
            if (varName) {
                fixes.push({
                    description: `Import or declare "${varName}"`,
                    confidence: 0.8,
                    autoApplicable: false
                });
            }
        }

        if (error.message.includes('Cannot read property')) {
            fixes.push({
                description: 'Add null check or use optional chaining (?.) operator',
                confidence: 0.85,
                autoApplicable: false
            });
        }

        return fixes;
    }

    private async getAIFixes(error: ErrorInfo): Promise<ErrorFix[]> {
        const prompt = `Analyze this error and suggest fixes.

ERROR TYPE: ${error.type}
MESSAGE: ${error.message}
${error.file ? `FILE: ${error.file}` : ''}
${error.line ? `LINE: ${error.line}` : ''}
${error.stack ? `STACK:\n${error.stack.substring(0, 500)}` : ''}

Suggest 1-3 practical fixes. Respond with ONLY valid JSON:
[
    {
        "description": "What to do to fix this",
        "code": "example code if applicable",
        "command": "npm command if applicable",
        "confidence": 0.8,
        "autoApplicable": false
    }
]`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as ErrorFix[];
            }
        } catch {
        }

        return [{
            description: 'Review the error message and check related code',
            confidence: 0.3,
            autoApplicable: false
        }];
    }

    async applyFix(fix: ErrorFix): Promise<RecoveryResult> {
        const result: RecoveryResult = {
            error: { type: 'unknown', message: '', severity: 'error' },
            fixes: [fix],
            applied: fix,
            success: false,
            message: ''
        };

        try {
            if (fix.command) {
                await this.terminalOps.runCommand(fix.command);
                result.success = true;
                result.message = `Executed: ${fix.command}`;
            } else if (fix.code && fix.file) {
                const content = await this.fileOps.readFile(fix.file);
                await this.fileOps.editFile(fix.file, content);
                result.success = true;
                result.message = `Applied fix to ${fix.file}`;
            } else {
                result.message = 'Fix requires manual intervention';
            }
        } catch (error: any) {
            result.message = `Failed to apply fix: ${error.message}`;
        }

        return result;
    }

    async recover(errorOutput: string): Promise<RecoveryResult> {
        const error = this.parseError(errorOutput);
        const fixes = await this.suggestFixes(error);

        const result: RecoveryResult = {
            error,
            fixes,
            success: false,
            message: ''
        };

        const autoFix = fixes.find(f => f.autoApplicable && f.confidence >= 0.8);
        if (autoFix) {
            return this.applyFix(autoFix);
        }

        result.message = `Found ${fixes.length} potential fixes. Manual review recommended.`;
        return result;
    }

    async watchAndRecover(outputChannel: vscode.OutputChannel): Promise<void> {
        const errorPattern = /error|Error|ERROR|failed|Failed|FAILED/;

        vscode.window.onDidCloseTerminal(terminal => {
        });

        vscode.tasks.onDidEndTaskProcess(async event => {
            if (event.exitCode !== 0) {
                outputChannel.appendLine(`Task failed with exit code ${event.exitCode}`);
            }
        });
    }

    getCommonFixSuggestions(): Array<{ problem: string; solution: string; command?: string }> {
        return [
            {
                problem: 'Module not found',
                solution: 'Install the missing package',
                command: 'npm install <package-name>'
            },
            {
                problem: 'TypeScript type errors',
                solution: 'Install type definitions',
                command: 'npm install -D @types/<package-name>'
            },
            {
                problem: 'Node modules issues',
                solution: 'Clean and reinstall dependencies',
                command: 'rm -rf node_modules && npm install'
            },
            {
                problem: 'Cache issues',
                solution: 'Clear npm cache',
                command: 'npm cache clean --force'
            },
            {
                problem: 'Permission errors',
                solution: 'Fix npm permissions or use sudo'
            },
            {
                problem: 'Port already in use',
                solution: 'Kill the process using the port',
                command: 'npx kill-port <port-number>'
            }
        ];
    }
}
