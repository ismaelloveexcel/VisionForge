import * as vscode from 'vscode';
import { AIService } from './aiService';

export interface ProjectVision {
    title: string;
    description: string;
    architecture: {
        frontend: string[];
        backend: string[];
        database: string[];
        deployment: string[];
    };
    techStack: {
        languages: string[];
        frameworks: string[];
        tools: string[];
        assets: string[];
    };
    milestones: Milestone[];
    potentialRisks: Risk[];
    timeline: TimelinePhase[];
    futureEnhancements: string[];
}

export interface Milestone {
    id: string;
    title: string;
    description: string;
    tasks: string[];
    dependencies: string[];
    estimatedHours: number;
    completed: boolean;
}

export interface Risk {
    description: string;
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
    probability: number;
}

export interface TimelinePhase {
    phase: string;
    duration: string;
    deliverables: string[];
}

export interface HealthReport {
    score: number;
    issues: HealthIssue[];
    recommendations: string[];
    metrics: {
        codeQuality: number;
        security: number;
        performance: number;
        maintainability: number;
    };
}

export interface HealthIssue {
    severity: 'info' | 'warning' | 'error';
    category: string;
    message: string;
    file?: string;
    line?: number;
    fix?: string;
}

const VISION_SYSTEM_PROMPT = `You are a visionary technical architect with expertise in software design, project planning, and risk assessment. Your role is to create comprehensive, actionable project plans.

When analyzing a project request, consider:
1. User experience and core functionality
2. Technical architecture and scalability
3. Development phases and dependencies
4. Potential risks and mitigation strategies
5. Future extensibility

Always provide realistic time estimates and identify critical path items.`;

export class VisionPlanner {
    private currentVision: ProjectVision | null = null;

    constructor(private aiService: AIService) {}

    async createProjectVision(userPrompt: string, workspaceContext?: string): Promise<ProjectVision> {
        const visionPrompt = `Analyze this project request and create a comprehensive development plan.

USER REQUEST: ${userPrompt}
${workspaceContext ? `\nWORKSPACE CONTEXT:\n${workspaceContext}` : ''}

Create a detailed project vision. Respond with ONLY valid JSON (no markdown, no explanation):

{
    "title": "Project Name",
    "description": "Detailed description of the project and its goals",
    "architecture": {
        "frontend": ["Technology 1", "Technology 2"],
        "backend": ["Technology 1"],
        "database": ["Database choice"],
        "deployment": ["Deployment platform"]
    },
    "techStack": {
        "languages": ["Language 1", "Language 2"],
        "frameworks": ["Framework 1"],
        "tools": ["Tool 1", "Tool 2"],
        "assets": ["Asset source 1"]
    },
    "milestones": [
        {
            "id": "m1",
            "title": "Milestone Title",
            "description": "What this milestone achieves",
            "tasks": ["Task 1", "Task 2"],
            "dependencies": [],
            "estimatedHours": 4,
            "completed": false
        }
    ],
    "potentialRisks": [
        {
            "description": "Risk description",
            "impact": "high",
            "mitigation": "How to mitigate",
            "probability": 0.5
        }
    ],
    "timeline": [
        {
            "phase": "Phase Name",
            "duration": "1 week",
            "deliverables": ["Deliverable 1"]
        }
    ],
    "futureEnhancements": ["Enhancement 1", "Enhancement 2"]
}`;

        try {
            const response = await this.aiService.chat(
                [
                    { role: 'system', content: VISION_SYSTEM_PROMPT },
                    { role: 'user', content: visionPrompt }
                ],
                'gpt-4o'
            );

            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                this.currentVision = JSON.parse(jsonMatch[0]) as ProjectVision;
                return this.currentVision;
            }
            throw new Error('Could not parse vision plan');
        } catch (error) {
            console.error('Vision planning failed:', error);
            return this.createFallbackVision(userPrompt);
        }
    }

    private createFallbackVision(prompt: string): ProjectVision {
        const vision: ProjectVision = {
            title: `Project: ${prompt.substring(0, 50)}...`,
            description: `Implementation of: ${prompt}`,
            architecture: {
                frontend: ['HTML5', 'JavaScript', 'CSS3'],
                backend: ['Node.js'],
                database: ['SQLite'],
                deployment: ['Local development']
            },
            techStack: {
                languages: ['JavaScript', 'TypeScript'],
                frameworks: [],
                tools: ['VS Code'],
                assets: []
            },
            milestones: [
                {
                    id: 'm1',
                    title: 'Project Setup',
                    description: 'Initialize project structure',
                    tasks: ['Create main files', 'Set up development environment'],
                    dependencies: [],
                    estimatedHours: 2,
                    completed: false
                },
                {
                    id: 'm2',
                    title: 'Core Implementation',
                    description: 'Build main functionality',
                    tasks: ['Implement core features', 'Add basic styling'],
                    dependencies: ['m1'],
                    estimatedHours: 4,
                    completed: false
                }
            ],
            potentialRisks: [
                {
                    description: 'Scope may expand beyond initial requirements',
                    impact: 'medium',
                    mitigation: 'Define clear MVP boundaries',
                    probability: 0.6
                }
            ],
            timeline: [
                {
                    phase: 'Initial Implementation',
                    duration: '1-2 days',
                    deliverables: ['Working prototype']
                }
            ],
            futureEnhancements: ['Performance optimization', 'Additional features based on feedback']
        };
        this.currentVision = vision;
        return vision;
    }

    async analyzeProjectHealth(workspaceStructure: string, fileContents?: Map<string, string>): Promise<HealthReport> {
        const analysisPrompt = `Analyze this project for quality, security, and best practices.

PROJECT STRUCTURE:
${workspaceStructure}

${fileContents ? `\nKEY FILES:\n${Array.from(fileContents.entries()).map(([path, content]) => `--- ${path} ---\n${content.substring(0, 1000)}`).join('\n\n')}` : ''}

Evaluate and respond with ONLY valid JSON:

{
    "score": 75,
    "issues": [
        {
            "severity": "warning",
            "category": "security",
            "message": "Issue description",
            "file": "path/to/file.js",
            "fix": "How to fix"
        }
    ],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "metrics": {
        "codeQuality": 80,
        "security": 70,
        "performance": 75,
        "maintainability": 85
    }
}

Categories: security, performance, structure, dependencies, testing, documentation
Severities: info, warning, error`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: analysisPrompt }],
                'gpt-4o'
            );

            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as HealthReport;
            }
            throw new Error('Could not parse health report');
        } catch (error) {
            return this.createFallbackHealthReport();
        }
    }

    private createFallbackHealthReport(): HealthReport {
        return {
            score: 70,
            issues: [
                {
                    severity: 'info',
                    category: 'documentation',
                    message: 'Consider adding more documentation',
                    fix: 'Add JSDoc comments and README updates'
                }
            ],
            recommendations: [
                'Add unit tests for critical functions',
                'Consider implementing error boundaries',
                'Review dependencies for updates'
            ],
            metrics: {
                codeQuality: 70,
                security: 75,
                performance: 70,
                maintainability: 70
            }
        };
    }

    getCurrentVision(): ProjectVision | null {
        return this.currentVision;
    }

    updateMilestoneStatus(milestoneId: string, completed: boolean): void {
        if (this.currentVision) {
            const milestone = this.currentVision.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.completed = completed;
            }
        }
    }

    getProgress(): { completed: number; total: number; percentage: number } {
        if (!this.currentVision) {
            return { completed: 0, total: 0, percentage: 0 };
        }

        const total = this.currentVision.milestones.length;
        const completed = this.currentVision.milestones.filter(m => m.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage };
    }

    async suggestNextSteps(): Promise<string[]> {
        if (!this.currentVision) {
            return ['Create a project vision first'];
        }

        const incompleteMilestones = this.currentVision.milestones.filter(m => !m.completed);
        const availableMilestones = incompleteMilestones.filter(m => {
            return m.dependencies.every(depId => {
                const dep = this.currentVision!.milestones.find(ms => ms.id === depId);
                return dep?.completed;
            });
        });

        if (availableMilestones.length === 0) {
            return ['All milestones completed! Consider future enhancements.'];
        }

        return availableMilestones.flatMap(m => m.tasks);
    }

    exportVisionToMarkdown(): string {
        if (!this.currentVision) {
            return '# No Project Vision\n\nCreate a vision first using the "Plan Project" command.';
        }

        const v = this.currentVision;
        const progress = this.getProgress();

        return `# ${v.title}

## Overview
${v.description}

## Progress: ${progress.percentage}% (${progress.completed}/${progress.total} milestones)

## Architecture

### Frontend
${v.architecture.frontend.map(t => `- ${t}`).join('\n')}

### Backend
${v.architecture.backend.map(t => `- ${t}`).join('\n')}

### Database
${v.architecture.database.map(t => `- ${t}`).join('\n')}

### Deployment
${v.architecture.deployment.map(t => `- ${t}`).join('\n')}

## Tech Stack

**Languages:** ${v.techStack.languages.join(', ')}
**Frameworks:** ${v.techStack.frameworks.join(', ')}
**Tools:** ${v.techStack.tools.join(', ')}
${v.techStack.assets.length > 0 ? `**Assets:** ${v.techStack.assets.join(', ')}` : ''}

## Milestones

${v.milestones.map(m => `### ${m.completed ? '✅' : '⬜'} ${m.title}
${m.description}
- Estimated: ${m.estimatedHours} hours
- Tasks:
${m.tasks.map(t => `  - ${t}`).join('\n')}
${m.dependencies.length > 0 ? `- Dependencies: ${m.dependencies.join(', ')}` : ''}`).join('\n\n')}

## Risks

${v.potentialRisks.map(r => `### ${r.impact.toUpperCase()} Impact (${Math.round(r.probability * 100)}% probability)
${r.description}
**Mitigation:** ${r.mitigation}`).join('\n\n')}

## Timeline

${v.timeline.map(t => `### ${t.phase} (${t.duration})
${t.deliverables.map(d => `- ${d}`).join('\n')}`).join('\n\n')}

## Future Enhancements

${v.futureEnhancements.map(e => `- ${e}`).join('\n')}
`;
    }
}
