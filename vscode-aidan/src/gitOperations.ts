import * as vscode from 'vscode';
import { TerminalOperations } from './terminalOperations';
import { AIService } from './aiService';

export interface GitStatus {
    branch: string;
    staged: string[];
    modified: string[];
    untracked: string[];
    ahead: number;
    behind: number;
}

export interface CommitSuggestion {
    message: string;
    type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore';
    scope?: string;
    breaking: boolean;
}

export class GitOperations {
    constructor(
        private terminalOps: TerminalOperations,
        private aiService: AIService
    ) {}

    async getStatus(): Promise<GitStatus> {
        try {
            const branchOutput = await this.terminalOps.runCommandWithOutput('git branch --show-current');
            const statusOutput = await this.terminalOps.runCommandWithOutput('git status --porcelain');
            const aheadBehind = await this.terminalOps.runCommandWithOutput('git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0 0"');

            const lines = statusOutput.trim().split('\n').filter(l => l);
            const staged: string[] = [];
            const modified: string[] = [];
            const untracked: string[] = [];

            for (const line of lines) {
                const status = line.substring(0, 2);
                const file = line.substring(3);

                if (status[0] !== ' ' && status[0] !== '?') {
                    staged.push(file);
                }
                if (status[1] === 'M') {
                    modified.push(file);
                }
                if (status === '??') {
                    untracked.push(file);
                }
            }

            const [ahead, behind] = aheadBehind.trim().split(/\s+/).map(n => parseInt(n) || 0);

            return {
                branch: branchOutput.trim(),
                staged,
                modified,
                untracked,
                ahead,
                behind
            };
        } catch (error) {
            return {
                branch: 'unknown',
                staged: [],
                modified: [],
                untracked: [],
                ahead: 0,
                behind: 0
            };
        }
    }

    async getDiff(staged: boolean = false): Promise<string> {
        try {
            const cmd = staged ? 'git diff --cached' : 'git diff';
            return await this.terminalOps.runCommandWithOutput(cmd);
        } catch {
            return '';
        }
    }

    async suggestCommitMessage(): Promise<CommitSuggestion> {
        const diff = await this.getDiff(true);
        const status = await this.getStatus();

        if (diff.length === 0 && status.staged.length === 0) {
            const unstagedDiff = await this.getDiff(false);
            if (unstagedDiff.length === 0) {
                return {
                    message: 'No changes to commit',
                    type: 'chore',
                    breaking: false
                };
            }
        }

        const prompt = `Analyze this git diff and suggest a commit message following Conventional Commits format.

STAGED FILES: ${status.staged.join(', ') || 'None'}
MODIFIED FILES: ${status.modified.join(', ') || 'None'}

DIFF:
${diff.substring(0, 3000)}

Respond with ONLY valid JSON:
{
    "message": "feat(scope): concise description",
    "type": "feat",
    "scope": "component-name",
    "breaking": false
}

Types: feat, fix, docs, style, refactor, test, chore
Keep message under 72 characters.`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as CommitSuggestion;
            }
        } catch (error) {
            console.error('Failed to generate commit message:', error);
        }

        const type = status.staged.some(f => f.includes('test')) ? 'test' :
                     status.staged.some(f => f.endsWith('.md')) ? 'docs' :
                     status.staged.some(f => f.includes('fix')) ? 'fix' : 'feat';

        return {
            message: `${type}: update ${status.staged[0] || 'files'}`,
            type: type as CommitSuggestion['type'],
            breaking: false
        };
    }

    async commit(message: string): Promise<{ success: boolean; message: string }> {
        try {
            const result = await this.terminalOps.runCommandWithOutput(`git commit -m "${message.replace(/"/g, '\\"')}"`);
            return { success: true, message: result };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async stageFiles(files: string[]): Promise<void> {
        if (files.length === 0) {
            await this.terminalOps.runCommand('git add -A');
        } else {
            await this.terminalOps.runCommand(`git add ${files.map(f => `"${f}"`).join(' ')}`);
        }
    }

    async unstageFiles(files: string[]): Promise<void> {
        await this.terminalOps.runCommand(`git reset HEAD ${files.map(f => `"${f}"`).join(' ')}`);
    }

    async createBranch(name: string, checkout: boolean = true): Promise<{ success: boolean; message: string }> {
        try {
            const sanitized = name.replace(/[^a-zA-Z0-9-_/]/g, '-').toLowerCase();
            const cmd = checkout ? `git checkout -b ${sanitized}` : `git branch ${sanitized}`;
            await this.terminalOps.runCommand(cmd);
            return { success: true, message: `Branch "${sanitized}" created${checkout ? ' and checked out' : ''}` };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async suggestBranchName(description: string): Promise<string> {
        const prompt = `Suggest a git branch name for this feature/task:
"${description}"

Rules:
- Use kebab-case
- Start with type: feature/, fix/, docs/, refactor/
- Keep under 50 characters
- Be descriptive but concise

Respond with ONLY the branch name, nothing else.`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );
            return response.content.trim().replace(/[^a-zA-Z0-9-_/]/g, '-');
        } catch {
            return `feature/${description.substring(0, 30).replace(/\s+/g, '-').toLowerCase()}`;
        }
    }

    async generatePRDescription(): Promise<string> {
        const status = await this.getStatus();
        const diff = await this.getDiff(false);
        const log = await this.getRecentCommits(10);

        const prompt = `Generate a Pull Request description for these changes.

BRANCH: ${status.branch}
RECENT COMMITS:
${log}

CHANGES SUMMARY:
${diff.substring(0, 4000)}

Create a professional PR description with:
1. Summary of changes
2. Type of change (feature/bugfix/refactor)
3. How to test
4. Checklist

Use markdown formatting.`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o'
            );
            return response.content;
        } catch {
            return `## Changes\n\nBranch: ${status.branch}\n\n## Summary\n\nUpdates to the codebase.\n\n## Testing\n\n- [ ] Tested locally\n- [ ] No breaking changes`;
        }
    }

    async getRecentCommits(count: number = 5): Promise<string> {
        try {
            return await this.terminalOps.runCommandWithOutput(`git log --oneline -${count}`);
        } catch {
            return '';
        }
    }

    async checkForConflicts(): Promise<string[]> {
        try {
            const output = await this.terminalOps.runCommandWithOutput('git diff --name-only --diff-filter=U');
            return output.trim().split('\n').filter(f => f);
        } catch {
            return [];
        }
    }

    async getFilesChangedSince(ref: string): Promise<string[]> {
        try {
            const output = await this.terminalOps.runCommandWithOutput(`git diff --name-only ${ref}`);
            return output.trim().split('\n').filter(f => f);
        } catch {
            return [];
        }
    }

    async isGitRepo(): Promise<boolean> {
        try {
            await this.terminalOps.runCommandWithOutput('git rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }

    async initRepo(): Promise<{ success: boolean; message: string }> {
        try {
            await this.terminalOps.runCommand('git init');
            return { success: true, message: 'Git repository initialized' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }
}
