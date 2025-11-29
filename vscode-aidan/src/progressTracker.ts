import * as vscode from 'vscode';
import { VisionPlanner, ProjectVision, Milestone } from './visionPlanner';
import { MemoryManager } from './memoryManager';
import { GitOperations } from './gitOperations';

export interface ProgressSnapshot {
    timestamp: string;
    percentage: number;
    milestonesCompleted: number;
    milestonesTotal: number;
    activeTask?: string;
    hoursSpent: number;
    hoursEstimated: number;
}

export interface BurndownData {
    dates: string[];
    planned: number[];
    actual: number[];
}

export interface ProductivityMetrics {
    tasksCompletedToday: number;
    averageTaskDuration: number;
    mostProductiveHour: number;
    streakDays: number;
}

export class ProgressTracker {
    private snapshots: ProgressSnapshot[] = [];
    private sessionStart: Date = new Date();
    private taskTimes: Map<string, { start: Date; end?: Date }> = new Map();

    constructor(
        private visionPlanner: VisionPlanner,
        private memoryManager: MemoryManager,
        private gitOps: GitOperations
    ) {}

    getProgress(): {
        percentage: number;
        completed: number;
        total: number;
        currentPhase: string;
        nextMilestone?: Milestone;
    } {
        const vision = this.visionPlanner.getCurrentVision();
        if (!vision) {
            return {
                percentage: 0,
                completed: 0,
                total: 0,
                currentPhase: 'No project vision'
            };
        }

        const total = vision.milestones.length;
        const completed = vision.milestones.filter(m => m.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        const incompleteMilestones = vision.milestones.filter(m => !m.completed);
        const availableMilestones = incompleteMilestones.filter(m => {
            return m.dependencies.every(depId => {
                const dep = vision.milestones.find(ms => ms.id === depId);
                return dep?.completed;
            });
        });

        const currentPhaseIndex = vision.timeline.findIndex((phase, i) => {
            const phaseMilestones = Math.ceil(total / vision.timeline.length);
            const phaseStart = i * phaseMilestones;
            const phaseEnd = phaseStart + phaseMilestones;
            return completed < phaseEnd;
        });

        return {
            percentage,
            completed,
            total,
            currentPhase: vision.timeline[currentPhaseIndex]?.phase || 'In Progress',
            nextMilestone: availableMilestones[0]
        };
    }

    startTask(taskId: string): void {
        this.taskTimes.set(taskId, { start: new Date() });
    }

    completeTask(taskId: string): number {
        const task = this.taskTimes.get(taskId);
        if (task) {
            task.end = new Date();
            const durationMs = task.end.getTime() - task.start.getTime();
            return Math.round(durationMs / 1000 / 60);
        }
        return 0;
    }

    takeSnapshot(): ProgressSnapshot {
        const progress = this.getProgress();
        const vision = this.visionPlanner.getCurrentVision();

        const hoursSpent = this.calculateHoursSpent();
        const hoursEstimated = vision?.milestones.reduce((sum, m) => sum + m.estimatedHours, 0) || 0;

        const snapshot: ProgressSnapshot = {
            timestamp: new Date().toISOString(),
            percentage: progress.percentage,
            milestonesCompleted: progress.completed,
            milestonesTotal: progress.total,
            activeTask: progress.nextMilestone?.title,
            hoursSpent,
            hoursEstimated
        };

        this.snapshots.push(snapshot);
        return snapshot;
    }

    private calculateHoursSpent(): number {
        let totalMinutes = 0;
        for (const [, times] of this.taskTimes) {
            if (times.end) {
                totalMinutes += (times.end.getTime() - times.start.getTime()) / 1000 / 60;
            }
        }
        return Math.round(totalMinutes / 60 * 10) / 10;
    }

    getBurndownData(): BurndownData {
        const vision = this.visionPlanner.getCurrentVision();
        if (!vision || this.snapshots.length === 0) {
            return { dates: [], planned: [], actual: [] };
        }

        const total = vision.milestones.length;
        const dates: string[] = [];
        const planned: number[] = [];
        const actual: number[] = [];

        for (let i = 0; i < this.snapshots.length; i++) {
            const snapshot = this.snapshots[i];
            const date = new Date(snapshot.timestamp).toLocaleDateString();

            if (!dates.includes(date)) {
                dates.push(date);
                const expectedProgress = Math.round((i / this.snapshots.length) * total);
                planned.push(total - expectedProgress);
                actual.push(total - snapshot.milestonesCompleted);
            }
        }

        return { dates, planned, actual };
    }

    getProductivityMetrics(): ProductivityMetrics {
        const today = new Date().toDateString();
        let tasksToday = 0;
        let totalDuration = 0;
        let taskCount = 0;
        const hourCounts = new Array(24).fill(0);

        for (const [, times] of this.taskTimes) {
            if (times.end) {
                if (times.end.toDateString() === today) {
                    tasksToday++;
                }
                const duration = (times.end.getTime() - times.start.getTime()) / 1000 / 60;
                totalDuration += duration;
                taskCount++;
                hourCounts[times.start.getHours()]++;
            }
        }

        const mostProductiveHour = hourCounts.indexOf(Math.max(...hourCounts));

        return {
            tasksCompletedToday: tasksToday,
            averageTaskDuration: taskCount > 0 ? Math.round(totalDuration / taskCount) : 0,
            mostProductiveHour,
            streakDays: this.calculateStreak()
        };
    }

    private calculateStreak(): number {
        if (this.snapshots.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();

        const snapshotDates = new Set(
            this.snapshots.map(s => new Date(s.timestamp).toDateString())
        );

        while (snapshotDates.has(currentDate.toDateString())) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    async estimateCompletion(): Promise<{
        estimatedDate: Date;
        confidence: number;
        factors: string[];
    }> {
        const progress = this.getProgress();
        const vision = this.visionPlanner.getCurrentVision();

        if (!vision || progress.completed === 0) {
            return {
                estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                confidence: 0.3,
                factors: ['Not enough data - estimate based on project size']
            };
        }

        const remainingMilestones = vision.milestones.filter(m => !m.completed);
        const remainingHours = remainingMilestones.reduce((sum, m) => sum + m.estimatedHours, 0);

        const hoursSpent = this.calculateHoursSpent();
        const completedHours = vision.milestones
            .filter(m => m.completed)
            .reduce((sum, m) => sum + m.estimatedHours, 0);

        const velocityRatio = completedHours > 0 ? hoursSpent / completedHours : 1;
        const adjustedHours = remainingHours * velocityRatio;

        const hoursPerDay = 4;
        const daysRemaining = Math.ceil(adjustedHours / hoursPerDay);

        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

        const factors: string[] = [];
        if (velocityRatio > 1.2) {
            factors.push('Tasks taking longer than estimated');
        } else if (velocityRatio < 0.8) {
            factors.push('Ahead of schedule');
        }

        const confidence = Math.min(0.9, 0.5 + (this.snapshots.length * 0.05));

        return {
            estimatedDate,
            confidence,
            factors
        };
    }

    generateProgressReport(): string {
        const progress = this.getProgress();
        const vision = this.visionPlanner.getCurrentVision();
        const metrics = this.getProductivityMetrics();

        let report = `# Progress Report\n\n`;
        report += `**Generated:** ${new Date().toLocaleString()}\n\n`;

        report += `## Overall Progress\n\n`;
        report += `- **Completion:** ${progress.percentage}%\n`;
        report += `- **Milestones:** ${progress.completed}/${progress.total}\n`;
        report += `- **Current Phase:** ${progress.currentPhase}\n`;

        if (progress.nextMilestone) {
            report += `- **Next Up:** ${progress.nextMilestone.title}\n`;
        }

        report += `\n## Productivity\n\n`;
        report += `- **Tasks Today:** ${metrics.tasksCompletedToday}\n`;
        report += `- **Avg Task Duration:** ${metrics.averageTaskDuration} minutes\n`;
        report += `- **Most Productive Hour:** ${metrics.mostProductiveHour}:00\n`;
        report += `- **Streak:** ${metrics.streakDays} days\n`;

        if (vision) {
            report += `\n## Milestones\n\n`;
            for (const m of vision.milestones) {
                const status = m.completed ? '✅' : '⬜';
                report += `${status} **${m.title}** (${m.estimatedHours}h)\n`;
                report += `   ${m.description}\n\n`;
            }

            if (vision.potentialRisks.length > 0) {
                report += `\n## Active Risks\n\n`;
                for (const r of vision.potentialRisks) {
                    const emoji = r.impact === 'high' ? '🔴' : r.impact === 'medium' ? '🟡' : '🟢';
                    report += `${emoji} ${r.description}\n`;
                    report += `   Mitigation: ${r.mitigation}\n\n`;
                }
            }
        }

        return report;
    }

    getProgressBar(width: number = 20): string {
        const progress = this.getProgress();
        const filled = Math.round((progress.percentage / 100) * width);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progress.percentage}%`;
    }

    reset(): void {
        this.snapshots = [];
        this.taskTimes.clear();
        this.sessionStart = new Date();
    }
}
