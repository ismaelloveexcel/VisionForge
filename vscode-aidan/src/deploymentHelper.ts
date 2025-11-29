import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';
import { TerminalOperations } from './terminalOperations';

export interface DeploymentTarget {
    id: string;
    name: string;
    description: string;
    type: 'static' | 'serverless' | 'container' | 'server';
    requiredFiles: string[];
    supportedFrameworks: string[];
}

export interface DeploymentConfig {
    target: string;
    files: Array<{ path: string; content: string }>;
    commands: string[];
    envVars: Record<string, string>;
    postDeploySteps: string[];
}

export interface DeploymentGuide {
    steps: Array<{
        order: number;
        title: string;
        description: string;
        command?: string;
        manual?: boolean;
    }>;
    estimatedTime: string;
    prerequisites: string[];
    warnings: string[];
}

export class DeploymentHelper {
    private targets: DeploymentTarget[] = [
        {
            id: 'vercel',
            name: 'Vercel',
            description: 'Best for Next.js, React, and static sites',
            type: 'serverless',
            requiredFiles: ['vercel.json'],
            supportedFrameworks: ['next', 'react', 'vue', 'svelte', 'static']
        },
        {
            id: 'netlify',
            name: 'Netlify',
            description: 'Great for static sites and serverless functions',
            type: 'serverless',
            requiredFiles: ['netlify.toml'],
            supportedFrameworks: ['react', 'vue', 'gatsby', 'static']
        },
        {
            id: 'railway',
            name: 'Railway',
            description: 'Full-stack apps with databases',
            type: 'container',
            requiredFiles: ['railway.json'],
            supportedFrameworks: ['node', 'python', 'go', 'rust']
        },
        {
            id: 'render',
            name: 'Render',
            description: 'Static sites to complex applications',
            type: 'container',
            requiredFiles: ['render.yaml'],
            supportedFrameworks: ['node', 'python', 'go', 'docker']
        },
        {
            id: 'fly',
            name: 'Fly.io',
            description: 'Global edge deployment',
            type: 'container',
            requiredFiles: ['fly.toml'],
            supportedFrameworks: ['node', 'python', 'go', 'rust', 'docker']
        },
        {
            id: 'heroku',
            name: 'Heroku',
            description: 'Traditional PaaS for web apps',
            type: 'server',
            requiredFiles: ['Procfile'],
            supportedFrameworks: ['node', 'python', 'ruby', 'java', 'go']
        },
        {
            id: 'github-pages',
            name: 'GitHub Pages',
            description: 'Free hosting for static sites',
            type: 'static',
            requiredFiles: [],
            supportedFrameworks: ['static', 'react', 'vue']
        }
    ];

    constructor(
        private aiService: AIService,
        private fileOps: FileOperations,
        private terminalOps: TerminalOperations
    ) {}

    getTargets(): DeploymentTarget[] {
        return this.targets;
    }

    async detectProjectType(): Promise<{
        framework: string;
        recommendedTargets: DeploymentTarget[];
    }> {
        const packageJsonExists = await this.fileOps.fileExists('package.json');

        if (packageJsonExists) {
            try {
                const content = await this.fileOps.readFile('package.json');
                const pkg = JSON.parse(content);
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };

                let framework = 'node';
                if (deps['next']) framework = 'next';
                else if (deps['react']) framework = 'react';
                else if (deps['vue']) framework = 'vue';
                else if (deps['svelte']) framework = 'svelte';
                else if (deps['express'] || deps['fastify']) framework = 'node';

                const recommended = this.targets.filter(t =>
                    t.supportedFrameworks.includes(framework)
                );

                return { framework, recommendedTargets: recommended };
            } catch {
            }
        }

        const requirementsExists = await this.fileOps.fileExists('requirements.txt');
        if (requirementsExists) {
            return {
                framework: 'python',
                recommendedTargets: this.targets.filter(t =>
                    t.supportedFrameworks.includes('python')
                )
            };
        }

        const indexHtmlExists = await this.fileOps.fileExists('index.html');
        if (indexHtmlExists) {
            return {
                framework: 'static',
                recommendedTargets: this.targets.filter(t =>
                    t.supportedFrameworks.includes('static')
                )
            };
        }

        return {
            framework: 'unknown',
            recommendedTargets: this.targets
        };
    }

    async generateConfig(targetId: string): Promise<DeploymentConfig> {
        const target = this.targets.find(t => t.id === targetId);
        if (!target) {
            throw new Error(`Unknown deployment target: ${targetId}`);
        }

        const { framework } = await this.detectProjectType();

        switch (targetId) {
            case 'vercel':
                return this.generateVercelConfig(framework);
            case 'netlify':
                return this.generateNetlifyConfig(framework);
            case 'railway':
                return this.generateRailwayConfig(framework);
            case 'render':
                return this.generateRenderConfig(framework);
            case 'fly':
                return this.generateFlyConfig(framework);
            case 'heroku':
                return this.generateHerokuConfig(framework);
            case 'github-pages':
                return this.generateGitHubPagesConfig(framework);
            default:
                throw new Error(`No config generator for: ${targetId}`);
        }
    }

    private generateVercelConfig(framework: string): DeploymentConfig {
        const config: any = {
            version: 2
        };

        if (framework === 'node') {
            config.builds = [{ src: 'package.json', use: '@vercel/node' }];
        }

        return {
            target: 'vercel',
            files: [
                { path: 'vercel.json', content: JSON.stringify(config, null, 2) }
            ],
            commands: [
                'npm i -g vercel',
                'vercel login',
                'vercel --prod'
            ],
            envVars: {},
            postDeploySteps: ['Set environment variables in Vercel dashboard']
        };
    }

    private generateNetlifyConfig(framework: string): DeploymentConfig {
        let buildCommand = 'npm run build';
        let publishDir = 'dist';

        if (framework === 'react') {
            publishDir = 'build';
        } else if (framework === 'next') {
            publishDir = '.next';
        }

        const config = `[build]
  command = "${buildCommand}"
  publish = "${publishDir}"

[dev]
  command = "npm run dev"
  port = 3000

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

        return {
            target: 'netlify',
            files: [{ path: 'netlify.toml', content: config }],
            commands: [
                'npm i -g netlify-cli',
                'netlify login',
                'netlify init',
                'netlify deploy --prod'
            ],
            envVars: {},
            postDeploySteps: ['Configure custom domain in Netlify dashboard']
        };
    }

    private generateRailwayConfig(framework: string): DeploymentConfig {
        const config = {
            build: { builder: 'NIXPACKS' },
            deploy: {
                startCommand: 'npm start',
                healthcheckPath: '/health'
            }
        };

        return {
            target: 'railway',
            files: [{ path: 'railway.json', content: JSON.stringify(config, null, 2) }],
            commands: [
                'npm i -g @railway/cli',
                'railway login',
                'railway init',
                'railway up'
            ],
            envVars: {},
            postDeploySteps: ['Add database if needed', 'Set environment variables']
        };
    }

    private generateRenderConfig(framework: string): DeploymentConfig {
        const config = `services:
  - type: web
    name: my-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health`;

        return {
            target: 'render',
            files: [{ path: 'render.yaml', content: config }],
            commands: [],
            envVars: {},
            postDeploySteps: [
                'Connect GitHub repository to Render',
                'Configure environment variables',
                'Deploy from Render dashboard'
            ]
        };
    }

    private generateFlyConfig(framework: string): DeploymentConfig {
        const config = `app = "my-app"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[http_service]
  internal_port = 3000
  force_https = true

[http_service.concurrency]
  type = "connections"
  hard_limit = 25
  soft_limit = 20`;

        return {
            target: 'fly',
            files: [{ path: 'fly.toml', content: config }],
            commands: [
                'curl -L https://fly.io/install.sh | sh',
                'fly auth login',
                'fly launch',
                'fly deploy'
            ],
            envVars: {},
            postDeploySteps: ['Scale as needed with fly scale']
        };
    }

    private generateHerokuConfig(framework: string): DeploymentConfig {
        return {
            target: 'heroku',
            files: [{ path: 'Procfile', content: 'web: npm start' }],
            commands: [
                'heroku login',
                'heroku create',
                'git push heroku main'
            ],
            envVars: {},
            postDeploySteps: ['Add addons for database if needed']
        };
    }

    private generateGitHubPagesConfig(framework: string): DeploymentConfig {
        const workflow = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`;

        return {
            target: 'github-pages',
            files: [{ path: '.github/workflows/deploy.yml', content: workflow }],
            commands: [],
            envVars: {},
            postDeploySteps: [
                'Enable GitHub Pages in repository settings',
                'Set source to gh-pages branch'
            ]
        };
    }

    async createDeploymentGuide(targetId: string): Promise<DeploymentGuide> {
        const config = await this.generateConfig(targetId);
        const target = this.targets.find(t => t.id === targetId)!;

        const steps: DeploymentGuide['steps'] = [];
        let order = 1;

        steps.push({
            order: order++,
            title: 'Create configuration files',
            description: `Create ${config.files.map(f => f.path).join(', ')}`,
            manual: false
        });

        for (const cmd of config.commands) {
            steps.push({
                order: order++,
                title: `Run: ${cmd.split(' ').slice(0, 3).join(' ')}...`,
                description: cmd.includes('login') ? 'Authenticate with the platform' : 'Execute deployment command',
                command: cmd
            });
        }

        for (const step of config.postDeploySteps) {
            steps.push({
                order: order++,
                title: step,
                description: 'Complete this step in the platform dashboard',
                manual: true
            });
        }

        return {
            steps,
            estimatedTime: target.type === 'static' ? '5 minutes' : '10-15 minutes',
            prerequisites: [
                `${target.name} account`,
                'Git repository initialized',
                target.type !== 'static' ? 'Project builds successfully locally' : ''
            ].filter(Boolean),
            warnings: [
                'Ensure all environment variables are configured',
                'Review security settings before deploying'
            ]
        };
    }

    async deploy(targetId: string): Promise<{ success: boolean; message: string }> {
        try {
            const config = await this.generateConfig(targetId);

            for (const file of config.files) {
                await this.fileOps.createFile(file.path, file.content);
            }

            vscode.window.showInformationMessage(
                `Created deployment config for ${targetId}. Run the deployment commands in terminal.`
            );

            return {
                success: true,
                message: `Configuration created. Follow the deployment guide to complete deployment.`
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Deployment setup failed: ${error.message}`
            };
        }
    }

    formatGuideAsMarkdown(guide: DeploymentGuide): string {
        let md = `# Deployment Guide\n\n`;

        md += `**Estimated Time:** ${guide.estimatedTime}\n\n`;

        md += `## Prerequisites\n\n`;
        for (const prereq of guide.prerequisites) {
            md += `- ${prereq}\n`;
        }

        md += `\n## Steps\n\n`;
        for (const step of guide.steps) {
            md += `### ${step.order}. ${step.title}\n\n`;
            md += `${step.description}\n\n`;
            if (step.command) {
                md += `\`\`\`bash\n${step.command}\n\`\`\`\n\n`;
            }
            if (step.manual) {
                md += `*This step requires manual action in the platform dashboard.*\n\n`;
            }
        }

        if (guide.warnings.length > 0) {
            md += `## ⚠️ Warnings\n\n`;
            for (const warning of guide.warnings) {
                md += `- ${warning}\n`;
            }
        }

        return md;
    }
}
