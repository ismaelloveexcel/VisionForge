import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';

export interface RefactorSuggestion {
    type: 'rename' | 'extract' | 'inline' | 'move' | 'simplify' | 'modernize';
    description: string;
    file: string;
    line?: number;
    before: string;
    after: string;
    impact: 'low' | 'medium' | 'high';
}

export interface RenameResult {
    success: boolean;
    filesChanged: string[];
    occurrences: number;
    message: string;
}

export class RefactorEngine {
    constructor(
        private aiService: AIService,
        private fileOps: FileOperations
    ) {}

    async renameSymbol(
        oldName: string,
        newName: string,
        scope: 'file' | 'project' = 'project'
    ): Promise<RenameResult> {
        const pattern = scope === 'project' ? '**/*.{ts,tsx,js,jsx}' : '';
        const files = await this.fileOps.findFiles(pattern);

        let totalOccurrences = 0;
        const changedFiles: string[] = [];

        const wordBoundary = new RegExp(`\\b${this.escapeRegex(oldName)}\\b`, 'g');

        for (const file of files) {
            try {
                const content = await this.fileOps.readFile(file);
                const matches = content.match(wordBoundary);

                if (matches && matches.length > 0) {
                    const newContent = content.replace(wordBoundary, newName);
                    await this.fileOps.editFile(file, newContent);
                    changedFiles.push(file);
                    totalOccurrences += matches.length;
                }
            } catch (error) {
                console.error(`Failed to process ${file}:`, error);
            }
        }

        return {
            success: changedFiles.length > 0,
            filesChanged: changedFiles,
            occurrences: totalOccurrences,
            message: `Renamed "${oldName}" to "${newName}" in ${changedFiles.length} files (${totalOccurrences} occurrences)`
        };
    }

    async findUnusedCode(directory: string = '.'): Promise<{
        unusedExports: Array<{ file: string; name: string }>;
        unusedVariables: Array<{ file: string; name: string; line: number }>;
        unusedImports: Array<{ file: string; import: string }>;
    }> {
        const files = await this.fileOps.findFiles(`${directory}/**/*.{ts,tsx,js,jsx}`);
        const exports: Map<string, Set<string>> = new Map();
        const imports: Map<string, Array<{ from: string; name: string }>> = new Map();

        for (const file of files) {
            try {
                const content = await this.fileOps.readFile(file);

                const exportMatches = content.matchAll(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
                for (const match of exportMatches) {
                    if (!exports.has(file)) exports.set(file, new Set());
                    exports.get(file)!.add(match[1]);
                }

                const importMatches = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);
                for (const match of importMatches) {
                    const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
                    for (const name of names) {
                        if (!imports.has(file)) imports.set(file, []);
                        imports.get(file)!.push({ from: match[2], name });
                    }
                }
            } catch (error) {
                console.error(`Failed to analyze ${file}:`, error);
            }
        }

        const usedExports = new Set<string>();
        for (const [, fileImports] of imports) {
            for (const imp of fileImports) {
                usedExports.add(imp.name);
            }
        }

        const unusedExports: Array<{ file: string; name: string }> = [];
        for (const [file, fileExports] of exports) {
            for (const exp of fileExports) {
                if (!usedExports.has(exp)) {
                    unusedExports.push({ file, name: exp });
                }
            }
        }

        return {
            unusedExports,
            unusedVariables: [],
            unusedImports: []
        };
    }

    async suggestRefactorings(file: string): Promise<RefactorSuggestion[]> {
        const content = await this.fileOps.readFile(file);

        const prompt = `Analyze this code and suggest refactorings.

FILE: ${file}
CODE:
\`\`\`
${content}
\`\`\`

Look for:
1. Long functions that should be split
2. Duplicate code that can be extracted
3. Complex conditionals that can be simplified
4. Outdated patterns that can be modernized
5. Variables/functions with unclear names

Respond with ONLY valid JSON array:
[
    {
        "type": "extract",
        "description": "Extract validation logic into separate function",
        "file": "${file}",
        "line": 42,
        "before": "original code snippet",
        "after": "refactored code snippet",
        "impact": "medium"
    }
]`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o'
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as RefactorSuggestion[];
            }
        } catch (error) {
            console.error('Failed to get refactoring suggestions:', error);
        }

        return [];
    }

    async extractFunction(
        file: string,
        startLine: number,
        endLine: number,
        newFunctionName: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const content = await this.fileOps.readFile(file);
            const lines = content.split('\n');

            if (startLine < 1 || endLine > lines.length || startLine > endLine) {
                return { success: false, message: 'Invalid line range' };
            }

            const extractedLines = lines.slice(startLine - 1, endLine);
            const extractedCode = extractedLines.join('\n');

            const variablePattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
            const variables = new Set<string>();
            let match;
            while ((match = variablePattern.exec(extractedCode)) !== null) {
                if (!['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while'].includes(match[1])) {
                    variables.add(match[1]);
                }
            }

            const params = Array.from(variables).slice(0, 5);
            const newFunction = `function ${newFunctionName}(${params.join(', ')}) {\n  ${extractedCode.split('\n').join('\n  ')}\n}`;

            const newLines = [
                ...lines.slice(0, startLine - 1),
                `${newFunctionName}(${params.join(', ')});`,
                ...lines.slice(endLine)
            ];

            newLines.unshift(newFunction + '\n');

            await this.fileOps.editFile(file, newLines.join('\n'));

            return {
                success: true,
                message: `Extracted lines ${startLine}-${endLine} into function "${newFunctionName}"`
            };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async updateImports(
        oldPath: string,
        newPath: string
    ): Promise<{ filesUpdated: number; message: string }> {
        const files = await this.fileOps.findFiles('**/*.{ts,tsx,js,jsx}');
        let updated = 0;

        const oldImportPath = oldPath.replace(/\.(ts|tsx|js|jsx)$/, '');
        const newImportPath = newPath.replace(/\.(ts|tsx|js|jsx)$/, '');

        for (const file of files) {
            try {
                const content = await this.fileOps.readFile(file);
                const importPattern = new RegExp(
                    `(from\\s+['"])${this.escapeRegex(oldImportPath)}(['"])`,
                    'g'
                );

                if (importPattern.test(content)) {
                    const newContent = content.replace(importPattern, `$1${newImportPath}$2`);
                    await this.fileOps.editFile(file, newContent);
                    updated++;
                }
            } catch (error) {
                console.error(`Failed to update imports in ${file}:`, error);
            }
        }

        return {
            filesUpdated: updated,
            message: `Updated import paths in ${updated} files`
        };
    }

    async simplifyConditionals(file: string): Promise<RefactorSuggestion[]> {
        const content = await this.fileOps.readFile(file);
        const suggestions: RefactorSuggestion[] = [];

        const nestedIfPattern = /if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)/g;
        let match;
        while ((match = nestedIfPattern.exec(content)) !== null) {
            suggestions.push({
                type: 'simplify',
                description: 'Consider combining nested if statements or using early return',
                file,
                before: match[0].substring(0, 100) + '...',
                after: '// Combined condition or early return pattern',
                impact: 'medium'
            });
        }

        const ternaryPattern = /\?\s*true\s*:\s*false|\?\s*false\s*:\s*true/g;
        while ((match = ternaryPattern.exec(content)) !== null) {
            suggestions.push({
                type: 'simplify',
                description: 'Unnecessary ternary - can be simplified',
                file,
                before: match[0],
                after: match[0].includes('true : false') ? 'condition' : '!condition',
                impact: 'low'
            });
        }

        return suggestions;
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
