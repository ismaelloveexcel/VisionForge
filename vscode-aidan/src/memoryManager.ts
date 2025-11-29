import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface UserPreferences {
    defaultModel: string;
    autoExecute: boolean;
    preferredLanguages: string[];
    preferredFrameworks: string[];
    namingConventions: {
        variables: 'camelCase' | 'snake_case' | 'PascalCase';
        functions: 'camelCase' | 'snake_case' | 'PascalCase';
        files: 'kebab-case' | 'camelCase' | 'snake_case' | 'PascalCase';
    };
    codeStyle: {
        indentation: 'tabs' | 'spaces';
        indentSize: number;
        quotes: 'single' | 'double';
        semicolons: boolean;
        trailingComma: boolean;
    };
}

export interface ProjectMemory {
    id: string;
    name: string;
    path: string;
    lastAccessed: string;
    techStack: string[];
    keyFiles: string[];
    notes: string[];
    visionId?: string;
}

export interface ConversationMemory {
    id: string;
    timestamp: string;
    summary: string;
    keyDecisions: string[];
    codePatterns: string[];
}

export interface MemoryStore {
    version: string;
    preferences: UserPreferences;
    projects: ProjectMemory[];
    conversations: ConversationMemory[];
    learnedPatterns: LearnedPattern[];
    lastUpdated: string;
}

export interface LearnedPattern {
    id: string;
    type: 'naming' | 'structure' | 'style' | 'framework' | 'library';
    pattern: string;
    frequency: number;
    examples: string[];
    lastSeen: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    defaultModel: 'gpt-4o-mini',
    autoExecute: false,
    preferredLanguages: ['TypeScript', 'JavaScript'],
    preferredFrameworks: [],
    namingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        files: 'kebab-case'
    },
    codeStyle: {
        indentation: 'spaces',
        indentSize: 2,
        quotes: 'single',
        semicolons: true,
        trailingComma: true
    }
};

export class MemoryManager {
    private memoryPath: string;
    private store: MemoryStore;

    constructor(context: vscode.ExtensionContext) {
        this.memoryPath = path.join(context.globalStorageUri.fsPath, 'aidan-memory.json');
        this.store = this.loadMemory();
    }

    private loadMemory(): MemoryStore {
        try {
            if (fs.existsSync(this.memoryPath)) {
                const data = fs.readFileSync(this.memoryPath, 'utf8');
                return JSON.parse(data) as MemoryStore;
            }
        } catch (error) {
            console.error('Failed to load memory:', error);
        }

        return this.createDefaultStore();
    }

    private createDefaultStore(): MemoryStore {
        return {
            version: '1.0.0',
            preferences: { ...DEFAULT_PREFERENCES },
            projects: [],
            conversations: [],
            learnedPatterns: [],
            lastUpdated: new Date().toISOString()
        };
    }

    private saveMemory(): void {
        try {
            const dir = path.dirname(this.memoryPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.store.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.memoryPath, JSON.stringify(this.store, null, 2), 'utf8');
        } catch (error) {
            console.error('Failed to save memory:', error);
        }
    }

    getPreferences(): UserPreferences {
        return { ...this.store.preferences };
    }

    updatePreferences(updates: Partial<UserPreferences>): void {
        this.store.preferences = { ...this.store.preferences, ...updates };
        this.saveMemory();
    }

    updateNamingConvention(type: keyof UserPreferences['namingConventions'], convention: string): void {
        this.store.preferences.namingConventions[type] = convention as any;
        this.saveMemory();
    }

    updateCodeStyle(updates: Partial<UserPreferences['codeStyle']>): void {
        this.store.preferences.codeStyle = { ...this.store.preferences.codeStyle, ...updates };
        this.saveMemory();
    }

    addPreferredLanguage(language: string): void {
        if (!this.store.preferences.preferredLanguages.includes(language)) {
            this.store.preferences.preferredLanguages.push(language);
            this.saveMemory();
        }
    }

    addPreferredFramework(framework: string): void {
        if (!this.store.preferences.preferredFrameworks.includes(framework)) {
            this.store.preferences.preferredFrameworks.push(framework);
            this.saveMemory();
        }
    }

    getProjects(): ProjectMemory[] {
        return [...this.store.projects].sort(
            (a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        );
    }

    getProject(projectId: string): ProjectMemory | undefined {
        return this.store.projects.find(p => p.id === projectId);
    }

    addProject(project: Omit<ProjectMemory, 'id' | 'lastAccessed'>): ProjectMemory {
        const newProject: ProjectMemory = {
            ...project,
            id: this.generateId(),
            lastAccessed: new Date().toISOString()
        };
        this.store.projects.push(newProject);
        this.saveMemory();
        return newProject;
    }

    updateProject(projectId: string, updates: Partial<ProjectMemory>): void {
        const index = this.store.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            this.store.projects[index] = {
                ...this.store.projects[index],
                ...updates,
                lastAccessed: new Date().toISOString()
            };
            this.saveMemory();
        }
    }

    removeProject(projectId: string): void {
        this.store.projects = this.store.projects.filter(p => p.id !== projectId);
        this.saveMemory();
    }

    addConversation(summary: string, keyDecisions: string[], codePatterns: string[]): ConversationMemory {
        const conversation: ConversationMemory = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            summary,
            keyDecisions,
            codePatterns
        };

        this.store.conversations.push(conversation);

        if (this.store.conversations.length > 100) {
            this.store.conversations = this.store.conversations.slice(-100);
        }

        this.saveMemory();
        return conversation;
    }

    getRecentConversations(limit: number = 10): ConversationMemory[] {
        return this.store.conversations.slice(-limit).reverse();
    }

    learnPattern(type: LearnedPattern['type'], pattern: string, example: string): void {
        const existing = this.store.learnedPatterns.find(
            p => p.type === type && p.pattern === pattern
        );

        if (existing) {
            existing.frequency++;
            if (!existing.examples.includes(example)) {
                existing.examples.push(example);
                if (existing.examples.length > 5) {
                    existing.examples = existing.examples.slice(-5);
                }
            }
            existing.lastSeen = new Date().toISOString();
        } else {
            this.store.learnedPatterns.push({
                id: this.generateId(),
                type,
                pattern,
                frequency: 1,
                examples: [example],
                lastSeen: new Date().toISOString()
            });
        }

        this.saveMemory();
    }

    getLearnedPatterns(type?: LearnedPattern['type']): LearnedPattern[] {
        let patterns = [...this.store.learnedPatterns];
        if (type) {
            patterns = patterns.filter(p => p.type === type);
        }
        return patterns.sort((a, b) => b.frequency - a.frequency);
    }

    getTopPatterns(limit: number = 10): LearnedPattern[] {
        return this.store.learnedPatterns
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, limit);
    }

    getContextForPrompt(): string {
        const prefs = this.store.preferences;
        const topPatterns = this.getTopPatterns(5);
        const recentProjects = this.getProjects().slice(0, 3);

        let context = `USER PREFERENCES:
- Languages: ${prefs.preferredLanguages.join(', ')}
- Frameworks: ${prefs.preferredFrameworks.join(', ') || 'None specified'}
- Naming: variables=${prefs.namingConventions.variables}, functions=${prefs.namingConventions.functions}, files=${prefs.namingConventions.files}
- Code Style: ${prefs.codeStyle.indentation}(${prefs.codeStyle.indentSize}), ${prefs.codeStyle.quotes} quotes, semicolons=${prefs.codeStyle.semicolons}
`;

        if (topPatterns.length > 0) {
            context += `\nLEARNED PATTERNS:\n`;
            topPatterns.forEach(p => {
                context += `- ${p.type}: ${p.pattern} (used ${p.frequency}x)\n`;
            });
        }

        if (recentProjects.length > 0) {
            context += `\nRECENT PROJECTS:\n`;
            recentProjects.forEach(p => {
                context += `- ${p.name}: ${p.techStack.join(', ')}\n`;
            });
        }

        return context;
    }

    clearMemory(): void {
        this.store = this.createDefaultStore();
        this.saveMemory();
    }

    exportMemory(): string {
        return JSON.stringify(this.store, null, 2);
    }

    importMemory(jsonString: string): boolean {
        try {
            const imported = JSON.parse(jsonString) as MemoryStore;
            if (imported.version && imported.preferences) {
                this.store = imported;
                this.saveMemory();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
