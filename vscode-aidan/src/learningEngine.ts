import * as vscode from 'vscode';
import { MemoryManager, LearnedPattern, UserPreferences } from './memoryManager';
import { FileOperations } from './fileOperations';

export interface CodeAnalysis {
    language: string;
    patterns: DetectedPattern[];
    style: CodeStyleAnalysis;
    frameworks: string[];
    libraries: string[];
}

export interface DetectedPattern {
    type: 'naming' | 'structure' | 'style' | 'import' | 'export';
    pattern: string;
    occurrences: number;
    examples: string[];
}

export interface CodeStyleAnalysis {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    quotes: 'single' | 'double' | 'mixed';
    semicolons: 'always' | 'never' | 'mixed';
    trailingComma: boolean;
    maxLineLength: number;
    braceStyle: 'same-line' | 'new-line';
}

export class LearningEngine {
    constructor(
        private memoryManager: MemoryManager,
        private fileOps: FileOperations
    ) {}

    async analyzeWorkspace(): Promise<CodeAnalysis> {
        const files = await this.fileOps.findFiles('**/*.{ts,tsx,js,jsx,py,cs,java}');
        const analysis: CodeAnalysis = {
            language: '',
            patterns: [],
            style: {
                indentation: 'spaces',
                indentSize: 2,
                quotes: 'single',
                semicolons: 'always',
                trailingComma: true,
                maxLineLength: 80,
                braceStyle: 'same-line'
            },
            frameworks: [],
            libraries: []
        };

        const languageCount: Record<string, number> = {};
        const styleStats = {
            tabs: 0,
            spaces: 0,
            indentSizes: [] as number[],
            singleQuotes: 0,
            doubleQuotes: 0,
            withSemicolons: 0,
            withoutSemicolons: 0
        };

        const namingPatterns: Record<string, number> = {
            camelCase: 0,
            snake_case: 0,
            PascalCase: 0,
            'kebab-case': 0
        };

        for (const file of files.slice(0, 20)) {
            try {
                const content = await this.fileOps.readFile(file);
                const ext = file.split('.').pop() || '';

                languageCount[ext] = (languageCount[ext] || 0) + 1;

                this.analyzeStyle(content, styleStats);
                this.analyzeNaming(content, namingPatterns);
                this.detectFrameworks(content, file, analysis);
            } catch {
            }
        }

        const topLanguage = Object.entries(languageCount)
            .sort(([, a], [, b]) => b - a)[0];
        if (topLanguage) {
            analysis.language = this.extToLanguage(topLanguage[0]);
        }

        analysis.style.indentation = styleStats.tabs > styleStats.spaces ? 'tabs' : 'spaces';
        analysis.style.indentSize = this.mostCommon(styleStats.indentSizes) || 2;
        analysis.style.quotes = styleStats.singleQuotes > styleStats.doubleQuotes ? 'single' : 'double';
        analysis.style.semicolons = styleStats.withSemicolons > styleStats.withoutSemicolons ? 'always' : 'never';

        const topNaming = Object.entries(namingPatterns)
            .sort(([, a], [, b]) => b - a)[0];
        if (topNaming && topNaming[1] > 0) {
            analysis.patterns.push({
                type: 'naming',
                pattern: topNaming[0],
                occurrences: topNaming[1],
                examples: []
            });
        }

        this.learnFromAnalysis(analysis);

        return analysis;
    }

    private analyzeStyle(content: string, stats: any): void {
        const lines = content.split('\n');

        for (const line of lines) {
            if (line.startsWith('\t')) {
                stats.tabs++;
            } else if (line.match(/^( +)/)) {
                stats.spaces++;
                const match = line.match(/^( +)/);
                if (match) {
                    const spaces = match[1].length;
                    if (spaces <= 8) {
                        stats.indentSizes.push(spaces);
                    }
                }
            }

            const singleQuotes = (line.match(/'/g) || []).length;
            const doubleQuotes = (line.match(/"/g) || []).length;
            stats.singleQuotes += singleQuotes;
            stats.doubleQuotes += doubleQuotes;

            if (line.trim().endsWith(';')) {
                stats.withSemicolons++;
            } else if (line.trim().length > 0 && !line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
                stats.withoutSemicolons++;
            }
        }
    }

    private analyzeNaming(content: string, patterns: Record<string, number>): void {
        const variablePattern = /(?:const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;

        while ((match = variablePattern.exec(content)) !== null) {
            const name = match[1];
            if (name.includes('_') && name === name.toLowerCase()) {
                patterns['snake_case']++;
            } else if (name.includes('-')) {
                patterns['kebab-case']++;
            } else if (name[0] === name[0].toUpperCase() && name.length > 1) {
                patterns['PascalCase']++;
            } else if (name[0] === name[0].toLowerCase()) {
                patterns['camelCase']++;
            }
        }
    }

    private detectFrameworks(content: string, filePath: string, analysis: CodeAnalysis): void {
        const frameworkPatterns: Record<string, RegExp[]> = {
            'React': [/import.*from ['"]react['"]/, /React\./, /<[A-Z][a-zA-Z]*[\s/>]/],
            'Vue': [/import.*from ['"]vue['"]/, /createApp/, /defineComponent/],
            'Angular': [/@Component/, /@Injectable/, /import.*@angular/],
            'Express': [/import.*express/, /require\(['"]express['"]\)/, /app\.get\(/],
            'Next.js': [/import.*next/, /getServerSideProps/, /getStaticProps/],
            'Three.js': [/import.*three/, /THREE\./, /WebGLRenderer/],
            'Unity': [/using UnityEngine/, /MonoBehaviour/, /GameObject/],
            'TailwindCSS': [/className=.*"[^"]*(?:flex|grid|p-|m-|text-|bg-)/],
            'Jest': [/describe\(/, /it\(.*=>/, /expect\(/],
            'TypeScript': [/: string/, /: number/, /interface\s+\w+/, /type\s+\w+\s*=/]
        };

        for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    if (!analysis.frameworks.includes(framework)) {
                        analysis.frameworks.push(framework);
                    }
                    break;
                }
            }
        }

        const importPattern = /import.*from ['"]([^'"./][^'"]*)['"]/g;
        let importMatch;
        while ((importMatch = importPattern.exec(content)) !== null) {
            const lib = importMatch[1].split('/')[0];
            if (!analysis.libraries.includes(lib) && !analysis.frameworks.includes(lib)) {
                analysis.libraries.push(lib);
            }
        }
    }

    private learnFromAnalysis(analysis: CodeAnalysis): void {
        if (analysis.language) {
            this.memoryManager.addPreferredLanguage(analysis.language);
        }

        for (const framework of analysis.frameworks) {
            this.memoryManager.addPreferredFramework(framework);
            this.memoryManager.learnPattern('framework', framework, `Detected in workspace`);
        }

        for (const lib of analysis.libraries.slice(0, 10)) {
            this.memoryManager.learnPattern('library', lib, `Imported in workspace`);
        }

        for (const pattern of analysis.patterns) {
            if (pattern.type === 'naming') {
                this.memoryManager.learnPattern('naming', pattern.pattern, `${pattern.occurrences} occurrences`);
            }
        }

        this.memoryManager.updateCodeStyle({
            indentation: analysis.style.indentation,
            indentSize: analysis.style.indentSize,
            quotes: analysis.style.quotes,
            semicolons: analysis.style.semicolons === 'always'
        });
    }

    async analyzeFile(filePath: string): Promise<DetectedPattern[]> {
        const patterns: DetectedPattern[] = [];

        try {
            const content = await this.fileOps.readFile(filePath);

            const functionPattern = /(?:function|const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=\s*(?:async\s*)?\(|(?:async\s*)?\()/g;
            const functions: string[] = [];
            let match;
            while ((match = functionPattern.exec(content)) !== null) {
                functions.push(match[1]);
            }

            if (functions.length > 0) {
                const naming = this.detectNamingConvention(functions);
                patterns.push({
                    type: 'naming',
                    pattern: naming,
                    occurrences: functions.length,
                    examples: functions.slice(0, 3)
                });
            }

            const importStyle = content.includes('import ') ? 'ES modules' : 
                               content.includes('require(') ? 'CommonJS' : 'Unknown';
            patterns.push({
                type: 'import',
                pattern: importStyle,
                occurrences: 1,
                examples: []
            });

        } catch (error) {
            console.error('Failed to analyze file:', error);
        }

        return patterns;
    }

    private detectNamingConvention(names: string[]): string {
        const counts = { camelCase: 0, snake_case: 0, PascalCase: 0 };

        for (const name of names) {
            if (name.includes('_')) {
                counts.snake_case++;
            } else if (name[0] === name[0].toUpperCase()) {
                counts.PascalCase++;
            } else {
                counts.camelCase++;
            }
        }

        return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
    }

    generateCodeWithStyle(baseCode: string): string {
        const prefs = this.memoryManager.getPreferences();
        let code = baseCode;

        if (prefs.codeStyle.quotes === 'single') {
            code = code.replace(/"/g, "'");
        } else {
            code = code.replace(/'/g, '"');
        }

        if (!prefs.codeStyle.semicolons) {
            code = code.replace(/;(\s*\n)/g, '$1');
        }

        if (prefs.codeStyle.indentation === 'tabs') {
            code = code.replace(/^( {2,})/gm, (match) => {
                return '\t'.repeat(Math.floor(match.length / prefs.codeStyle.indentSize));
            });
        }

        return code;
    }

    getStylePromptAddition(): string {
        const prefs = this.memoryManager.getPreferences();
        const topPatterns = this.memoryManager.getTopPatterns(5);

        let prompt = `\n\nCODE STYLE REQUIREMENTS:
- Use ${prefs.codeStyle.indentation} with ${prefs.codeStyle.indentSize} spaces for indentation
- Use ${prefs.codeStyle.quotes} quotes for strings
- ${prefs.codeStyle.semicolons ? 'Always use' : 'Do not use'} semicolons
- Variable naming: ${prefs.namingConventions.variables}
- Function naming: ${prefs.namingConventions.functions}
- File naming: ${prefs.namingConventions.files}`;

        if (prefs.preferredFrameworks.length > 0) {
            prompt += `\n- Preferred frameworks: ${prefs.preferredFrameworks.join(', ')}`;
        }

        if (topPatterns.length > 0) {
            prompt += `\n\nUSER'S COMMON PATTERNS:`;
            for (const pattern of topPatterns) {
                prompt += `\n- ${pattern.type}: ${pattern.pattern}`;
            }
        }

        return prompt;
    }

    private extToLanguage(ext: string): string {
        const map: Record<string, string> = {
            'ts': 'TypeScript',
            'tsx': 'TypeScript',
            'js': 'JavaScript',
            'jsx': 'JavaScript',
            'py': 'Python',
            'cs': 'C#',
            'java': 'Java',
            'go': 'Go',
            'rs': 'Rust',
            'rb': 'Ruby',
            'php': 'PHP'
        };
        return map[ext] || ext;
    }

    private mostCommon(arr: number[]): number | undefined {
        if (arr.length === 0) return undefined;
        const counts = new Map<number, number>();
        for (const n of arr) {
            counts.set(n, (counts.get(n) || 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
}
