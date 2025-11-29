import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileOperations {
    private getWorkspaceRoot(): string {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            throw new Error('No workspace folder open');
        }
        return folders[0].uri.fsPath;
    }

    async createFile(relativePath: string, content: string): Promise<void> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, 'utf8');

        const doc = await vscode.workspace.openTextDocument(fullPath);
        await vscode.window.showTextDocument(doc);
    }

    async editFile(relativePath: string, content: string): Promise<void> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);

        if (!fs.existsSync(fullPath)) {
            return this.createFile(relativePath, content);
        }

        fs.writeFileSync(fullPath, content, 'utf8');

        const doc = await vscode.workspace.openTextDocument(fullPath);
        await vscode.window.showTextDocument(doc);
    }

    async deleteFile(relativePath: string): Promise<void> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }

    async readFile(relativePath: string): Promise<string> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${relativePath}`);
        }

        return fs.readFileSync(fullPath, 'utf8');
    }

    async fileExists(relativePath: string): Promise<boolean> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);
        return fs.existsSync(fullPath);
    }

    async getWorkspaceStructure(maxDepth: number = 3): Promise<string> {
        const root = this.getWorkspaceRoot();
        const structure: string[] = [];

        const ignoreDirs = [
            'node_modules', '.git', 'dist', 'build', 'out', '.next',
            '__pycache__', '.vscode', '.idea', 'coverage', '.nyc_output'
        ];

        const walk = (dir: string, depth: number, prefix: string = '') => {
            if (depth > maxDepth) return;

            try {
                const items = fs.readdirSync(dir);
                const filteredItems = items.filter(item => {
                    if (item.startsWith('.') && item !== '.env.example') return false;
                    if (ignoreDirs.includes(item)) return false;
                    return true;
                });

                filteredItems.forEach((item, index) => {
                    const itemPath = path.join(dir, item);
                    const isLast = index === filteredItems.length - 1;
                    const connector = isLast ? '└── ' : '├── ';
                    const relativePath = path.relative(root, itemPath);

                    try {
                        const stat = fs.statSync(itemPath);
                        if (stat.isDirectory()) {
                            structure.push(`${prefix}${connector}${item}/`);
                            walk(itemPath, depth + 1, prefix + (isLast ? '    ' : '│   '));
                        } else {
                            structure.push(`${prefix}${connector}${item}`);
                        }
                    } catch {
                    }
                });
            } catch {
            }
        };

        structure.push(path.basename(root) + '/');
        walk(root, 0);

        return structure.join('\n');
    }

    async findFiles(pattern: string): Promise<string[]> {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
        return files.map(f => vscode.workspace.asRelativePath(f));
    }

    async getFileContent(relativePath: string): Promise<string> {
        return this.readFile(relativePath);
    }

    async appendToFile(relativePath: string, content: string): Promise<void> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);

        if (!fs.existsSync(fullPath)) {
            return this.createFile(relativePath, content);
        }

        const existing = fs.readFileSync(fullPath, 'utf8');
        fs.writeFileSync(fullPath, existing + '\n' + content, 'utf8');
    }

    async insertInFile(relativePath: string, content: string, afterLine: number): Promise<void> {
        const root = this.getWorkspaceRoot();
        const fullPath = path.join(root, relativePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${relativePath}`);
        }

        const existing = fs.readFileSync(fullPath, 'utf8');
        const lines = existing.split('\n');
        lines.splice(afterLine, 0, content);
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    }
}
