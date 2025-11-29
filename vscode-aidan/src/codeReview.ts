import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';
import { GitOperations } from './gitOperations';

export interface ReviewComment {
    file: string;
    line: number;
    severity: 'info' | 'warning' | 'error' | 'suggestion';
    category: 'security' | 'performance' | 'style' | 'logic' | 'best-practice' | 'readability';
    message: string;
    suggestion?: string;
}

export interface ReviewResult {
    score: number;
    summary: string;
    comments: ReviewComment[];
    passesChecks: boolean;
    blockers: ReviewComment[];
    recommendations: string[];
}

export interface ReviewChecklist {
    security: boolean;
    errorHandling: boolean;
    performance: boolean;
    codeStyle: boolean;
    documentation: boolean;
    testing: boolean;
}

export class CodeReview {
    private securityPatterns = [
        { pattern: /eval\s*\(/, message: 'Avoid using eval() - security risk', severity: 'error' as const },
        { pattern: /innerHTML\s*=/, message: 'innerHTML can lead to XSS - use textContent or sanitize', severity: 'warning' as const },
        { pattern: /document\.write/, message: 'document.write is a security risk', severity: 'warning' as const },
        { pattern: /password|secret|api_key|apikey/i, message: 'Potential hardcoded credential', severity: 'error' as const },
        { pattern: /\$\{.*\}.*sql|query.*\$\{/i, message: 'Potential SQL injection', severity: 'error' as const },
        { pattern: /dangerouslySetInnerHTML/, message: 'dangerouslySetInnerHTML can lead to XSS', severity: 'warning' as const }
    ];

    private performancePatterns = [
        { pattern: /\.forEach\(.*\.push\(/, message: 'Consider using .map() instead of forEach+push', severity: 'suggestion' as const },
        { pattern: /new RegExp\(.*\)/g, message: 'Consider using regex literal for better performance', severity: 'info' as const },
        { pattern: /JSON\.parse\(JSON\.stringify/, message: 'Inefficient deep clone - consider structuredClone or lodash', severity: 'suggestion' as const }
    ];

    constructor(
        private aiService: AIService,
        private fileOps: FileOperations,
        private gitOps: GitOperations
    ) {}

    async reviewFile(filePath: string): Promise<ReviewResult> {
        const content = await this.fileOps.readFile(filePath);
        const comments: ReviewComment[] = [];

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const { pattern, message, severity } of this.securityPatterns) {
                if (pattern.test(line)) {
                    comments.push({
                        file: filePath,
                        line: i + 1,
                        severity,
                        category: 'security',
                        message
                    });
                }
            }

            for (const { pattern, message, severity } of this.performancePatterns) {
                if (pattern.test(line)) {
                    comments.push({
                        file: filePath,
                        line: i + 1,
                        severity,
                        category: 'performance',
                        message
                    });
                }
            }
        }

        const aiReview = await this.getAIReview(filePath, content);
        comments.push(...aiReview);

        const blockers = comments.filter(c => c.severity === 'error');
        const score = this.calculateScore(comments);

        return {
            score,
            summary: this.generateSummary(comments, score),
            comments,
            passesChecks: blockers.length === 0,
            blockers,
            recommendations: this.getRecommendations(comments)
        };
    }

    async reviewChanges(): Promise<ReviewResult> {
        const diff = await this.gitOps.getDiff(true);
        if (!diff) {
            return {
                score: 100,
                summary: 'No staged changes to review',
                comments: [],
                passesChecks: true,
                blockers: [],
                recommendations: []
            };
        }

        const status = await this.gitOps.getStatus();
        const allComments: ReviewComment[] = [];

        for (const file of status.staged) {
            try {
                const result = await this.reviewFile(file);
                allComments.push(...result.comments);
            } catch {
            }
        }

        const blockers = allComments.filter(c => c.severity === 'error');
        const score = this.calculateScore(allComments);

        return {
            score,
            summary: `Reviewed ${status.staged.length} staged files`,
            comments: allComments,
            passesChecks: blockers.length === 0,
            blockers,
            recommendations: this.getRecommendations(allComments)
        };
    }

    private async getAIReview(filePath: string, content: string): Promise<ReviewComment[]> {
        const prompt = `Review this code for quality issues.

FILE: ${filePath}
CODE:
\`\`\`
${content.substring(0, 4000)}
\`\`\`

Look for:
1. Security vulnerabilities
2. Performance issues
3. Logic errors
4. Best practice violations
5. Readability problems

Respond with ONLY valid JSON array:
[
    {
        "line": 10,
        "severity": "warning",
        "category": "security",
        "message": "Issue description",
        "suggestion": "How to fix"
    }
]

Limit to 5 most important issues. Use severity: error, warning, info, or suggestion.
Categories: security, performance, style, logic, best-practice, readability.`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const issues = JSON.parse(jsonMatch[0]);
                return issues.map((issue: any) => ({
                    file: filePath,
                    ...issue
                }));
            }
        } catch (error) {
            console.error('AI review failed:', error);
        }

        return [];
    }

    private calculateScore(comments: ReviewComment[]): number {
        let score = 100;

        for (const comment of comments) {
            switch (comment.severity) {
                case 'error':
                    score -= 15;
                    break;
                case 'warning':
                    score -= 5;
                    break;
                case 'suggestion':
                    score -= 2;
                    break;
                case 'info':
                    score -= 1;
                    break;
            }
        }

        return Math.max(0, score);
    }

    private generateSummary(comments: ReviewComment[], score: number): string {
        const errors = comments.filter(c => c.severity === 'error').length;
        const warnings = comments.filter(c => c.severity === 'warning').length;
        const suggestions = comments.filter(c => c.severity === 'suggestion').length;

        let rating: string;
        if (score >= 90) rating = 'Excellent';
        else if (score >= 75) rating = 'Good';
        else if (score >= 60) rating = 'Acceptable';
        else if (score >= 40) rating = 'Needs Work';
        else rating = 'Critical Issues';

        return `Score: ${score}/100 (${rating}) - ${errors} errors, ${warnings} warnings, ${suggestions} suggestions`;
    }

    private getRecommendations(comments: ReviewComment[]): string[] {
        const recommendations: string[] = [];
        const categories = new Set(comments.map(c => c.category));

        if (categories.has('security')) {
            recommendations.push('Run a security audit: npm audit');
        }
        if (categories.has('performance')) {
            recommendations.push('Consider running performance profiling');
        }
        if (comments.some(c => c.message.includes('test'))) {
            recommendations.push('Add unit tests for critical paths');
        }

        return recommendations;
    }

    async preCommitCheck(): Promise<{
        canCommit: boolean;
        message: string;
        issues: ReviewComment[];
    }> {
        const result = await this.reviewChanges();

        if (!result.passesChecks) {
            return {
                canCommit: false,
                message: `Commit blocked: ${result.blockers.length} critical issues found`,
                issues: result.blockers
            };
        }

        if (result.score < 60) {
            return {
                canCommit: true,
                message: `Warning: Code quality score is ${result.score}/100. Consider addressing issues before committing.`,
                issues: result.comments.filter(c => c.severity !== 'info')
            };
        }

        return {
            canCommit: true,
            message: `Review passed with score ${result.score}/100`,
            issues: []
        };
    }

    getChecklist(content: string): ReviewChecklist {
        return {
            security: !this.securityPatterns.some(p => p.pattern.test(content)),
            errorHandling: /try\s*\{|catch\s*\(|\.catch\(/.test(content),
            performance: !this.performancePatterns.some(p => p.pattern.test(content)),
            codeStyle: !/\t/.test(content),
            documentation: /\/\*\*|\/\//.test(content),
            testing: /test\(|describe\(|it\(/.test(content)
        };
    }

    formatReviewAsMarkdown(result: ReviewResult): string {
        let md = `# Code Review Report\n\n`;
        md += `## Summary\n\n${result.summary}\n\n`;

        if (result.blockers.length > 0) {
            md += `## ⛔ Blockers (Must Fix)\n\n`;
            for (const b of result.blockers) {
                md += `- **${b.file}:${b.line}** - ${b.message}\n`;
                if (b.suggestion) md += `  - Fix: ${b.suggestion}\n`;
            }
            md += '\n';
        }

        const warnings = result.comments.filter(c => c.severity === 'warning');
        if (warnings.length > 0) {
            md += `## ⚠️ Warnings\n\n`;
            for (const w of warnings) {
                md += `- **${w.file}:${w.line}** [${w.category}] ${w.message}\n`;
            }
            md += '\n';
        }

        if (result.recommendations.length > 0) {
            md += `## 💡 Recommendations\n\n`;
            for (const r of result.recommendations) {
                md += `- ${r}\n`;
            }
        }

        return md;
    }
}
