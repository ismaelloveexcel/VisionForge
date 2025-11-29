import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';
import { TerminalOperations } from './terminalOperations';
import { UnityMcpBridge } from './unityMcp';
import { AgentExecutor } from './agentExecutor';
import { ChatViewProvider } from './chatViewProvider';
import { VisionPlanner } from './visionPlanner';
import { ProjectTemplateManager } from './projectTemplates';
import { MemoryManager } from './memoryManager';
import { LearningEngine } from './learningEngine';
import { GitOperations } from './gitOperations';
import { TestGenerator } from './testGenerator';
import { RefactorEngine } from './refactorEngine';
import { ErrorRecovery } from './errorRecovery';
import { ResourceFinder } from './resourceFinder';
import { ProgressTracker } from './progressTracker';
import { CodeReview } from './codeReview';
import { DeploymentHelper } from './deploymentHelper';

let chatViewProvider: ChatViewProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI-DAN Extension v2.0 is now active!');

    const aiService = new AIService();
    const fileOps = new FileOperations();
    const terminalOps = new TerminalOperations();
    const unityBridge = new UnityMcpBridge();
    const agentExecutor = new AgentExecutor(fileOps, terminalOps, unityBridge);

    const memoryManager = new MemoryManager(context);
    const visionPlanner = new VisionPlanner(aiService);
    const templateManager = new ProjectTemplateManager(fileOps, terminalOps);
    const learningEngine = new LearningEngine(memoryManager, fileOps);
    const gitOps = new GitOperations(terminalOps, aiService);
    const testGenerator = new TestGenerator(aiService, fileOps);
    const refactorEngine = new RefactorEngine(aiService, fileOps);
    const errorRecovery = new ErrorRecovery(aiService, fileOps, terminalOps);
    const resourceFinder = new ResourceFinder(aiService);
    const progressTracker = new ProgressTracker(visionPlanner, memoryManager, gitOps);
    const codeReview = new CodeReview(aiService, fileOps, gitOps);
    const deploymentHelper = new DeploymentHelper(aiService, fileOps, terminalOps);

    chatViewProvider = new ChatViewProvider(
        context.extensionUri,
        aiService,
        agentExecutor,
        fileOps,
        visionPlanner,
        templateManager,
        memoryManager,
        learningEngine,
        gitOps,
        testGenerator,
        refactorEngine,
        errorRecovery,
        resourceFinder,
        progressTracker,
        codeReview,
        deploymentHelper
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'aidan.chatView',
            chatViewProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.openChat', () => {
            vscode.commands.executeCommand('aidan.chatView.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.setApiKey', async () => {
            const provider = await vscode.window.showQuickPick(
                ['OpenAI', 'Anthropic', 'OpenRouter'],
                { placeHolder: 'Select AI provider' }
            );

            if (provider) {
                const key = await vscode.window.showInputBox({
                    prompt: `Enter your ${provider} API key`,
                    password: true,
                    placeHolder: 'sk-...'
                });

                if (key) {
                    const config = vscode.workspace.getConfiguration('aidan');
                    const keyName = provider.toLowerCase() + 'ApiKey';
                    await config.update(keyName, key, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`${provider} API key saved!`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.scanWorkspace', async () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'AI-DAN: Scanning workspace...',
                cancellable: false
            }, async () => {
                const structure = await fileOps.getWorkspaceStructure();
                const analysis = await learningEngine.analyzeWorkspace();
                
                memoryManager.addProject({
                    name: vscode.workspace.name || 'Unnamed Project',
                    path: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                    techStack: analysis.frameworks,
                    keyFiles: [],
                    notes: []
                });

                vscode.window.showInformationMessage(
                    `Scanned workspace: ${analysis.language}, ${analysis.frameworks.join(', ')}`
                );
                chatViewProvider.sendWorkspaceContext(structure);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.planProject', async () => {
            const description = await vscode.window.showInputBox({
                prompt: 'Describe your project idea',
                placeHolder: 'e.g., A VR game where players explore underwater caves'
            });

            if (description) {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'AI-DAN: Creating project vision...',
                    cancellable: false
                }, async () => {
                    const vision = await visionPlanner.createProjectVision(description);
                    const markdown = visionPlanner.exportVisionToMarkdown();
                    
                    const doc = await vscode.workspace.openTextDocument({
                        content: markdown,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc);
                    
                    vscode.window.showInformationMessage(`Project vision created: ${vision.title}`);
                });
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.useTemplate', async () => {
            const templates = templateManager.getTemplates();
            const selected = await vscode.window.showQuickPick(
                templates.map(t => ({
                    label: t.name,
                    description: t.category,
                    detail: t.description,
                    id: t.id
                })),
                { placeHolder: 'Select a project template' }
            );

            if (selected) {
                const result = await templateManager.applyTemplate((selected as any).id);
                if (result.success) {
                    vscode.window.showInformationMessage(result.message);
                } else {
                    vscode.window.showErrorMessage(result.message);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.analyzeHealth', async () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'AI-DAN: Analyzing project health...',
                cancellable: false
            }, async () => {
                const structure = await fileOps.getWorkspaceStructure();
                const health = await visionPlanner.analyzeProjectHealth(structure);
                
                let message = `Health Score: ${health.score}/100\n`;
                message += `Quality: ${health.metrics.codeQuality}/100 | `;
                message += `Security: ${health.metrics.security}/100 | `;
                message += `Performance: ${health.metrics.performance}/100`;
                
                if (health.issues.length > 0) {
                    const errors = health.issues.filter(i => i.severity === 'error').length;
                    const warnings = health.issues.filter(i => i.severity === 'warning').length;
                    message += `\n${errors} errors, ${warnings} warnings`;
                }

                vscode.window.showInformationMessage(message);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.gitCommit', async () => {
            const status = await gitOps.getStatus();
            if (status.staged.length === 0 && status.modified.length === 0) {
                vscode.window.showInformationMessage('No changes to commit');
                return;
            }

            if (status.staged.length === 0) {
                const stageAll = await vscode.window.showQuickPick(
                    ['Stage all changes', 'Cancel'],
                    { placeHolder: 'No staged files. Stage all changes?' }
                );
                if (stageAll === 'Stage all changes') {
                    await gitOps.stageFiles([]);
                } else {
                    return;
                }
            }

            const suggestion = await gitOps.suggestCommitMessage();
            const message = await vscode.window.showInputBox({
                prompt: 'Commit message (AI suggestion below)',
                value: suggestion.message,
                placeHolder: 'Enter commit message'
            });

            if (message) {
                const result = await gitOps.commit(message);
                if (result.success) {
                    vscode.window.showInformationMessage('Changes committed!');
                } else {
                    vscode.window.showErrorMessage(result.message);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.generateTests', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active file');
                return;
            }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'AI-DAN: Generating tests...',
                cancellable: false
            }, async () => {
                const filePath = vscode.workspace.asRelativePath(editor.document.uri);
                const suite = await testGenerator.generateTests(filePath);
                await testGenerator.createTestFile(suite);
                
                const testDoc = await vscode.workspace.openTextDocument(suite.testFile);
                await vscode.window.showTextDocument(testDoc);
                
                vscode.window.showInformationMessage(
                    `Generated ${suite.cases.length} tests in ${suite.testFile}`
                );
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.refactor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active file');
                return;
            }

            const refactorType = await vscode.window.showQuickPick(
                ['Rename Symbol', 'Get Suggestions', 'Find Unused Code'],
                { placeHolder: 'Select refactoring action' }
            );

            if (refactorType === 'Rename Symbol') {
                const oldName = await vscode.window.showInputBox({
                    prompt: 'Current symbol name'
                });
                const newName = await vscode.window.showInputBox({
                    prompt: 'New symbol name'
                });

                if (oldName && newName) {
                    const result = await refactorEngine.renameSymbol(oldName, newName);
                    vscode.window.showInformationMessage(result.message);
                }
            } else if (refactorType === 'Get Suggestions') {
                const filePath = vscode.workspace.asRelativePath(editor.document.uri);
                const suggestions = await refactorEngine.suggestRefactorings(filePath);
                
                if (suggestions.length === 0) {
                    vscode.window.showInformationMessage('No refactoring suggestions');
                } else {
                    const items = suggestions.map(s => ({
                        label: s.description,
                        detail: `${s.type} - ${s.impact} impact`
                    }));
                    await vscode.window.showQuickPick(items, {
                        placeHolder: 'Refactoring suggestions'
                    });
                }
            } else if (refactorType === 'Find Unused Code') {
                const unused = await refactorEngine.findUnusedCode();
                vscode.window.showInformationMessage(
                    `Found ${unused.unusedExports.length} unused exports`
                );
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.reviewCode', async () => {
            const reviewType = await vscode.window.showQuickPick(
                ['Review Current File', 'Review Staged Changes', 'Pre-Commit Check'],
                { placeHolder: 'Select review type' }
            );

            if (reviewType === 'Review Current File') {
                const editor = vscode.window.activeTextEditor;
                if (!editor) return;

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'AI-DAN: Reviewing code...',
                    cancellable: false
                }, async () => {
                    const filePath = vscode.workspace.asRelativePath(editor.document.uri);
                    const result = await codeReview.reviewFile(filePath);
                    
                    const markdown = codeReview.formatReviewAsMarkdown(result);
                    const doc = await vscode.workspace.openTextDocument({
                        content: markdown,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc);
                });
            } else if (reviewType === 'Review Staged Changes') {
                const result = await codeReview.reviewChanges();
                const markdown = codeReview.formatReviewAsMarkdown(result);
                const doc = await vscode.workspace.openTextDocument({
                    content: markdown,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);
            } else if (reviewType === 'Pre-Commit Check') {
                const check = await codeReview.preCommitCheck();
                if (check.canCommit) {
                    vscode.window.showInformationMessage(check.message);
                } else {
                    vscode.window.showWarningMessage(check.message);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.findResources', async () => {
            const searchType = await vscode.window.showQuickPick(
                ['Search NPM Packages', 'Find Free Assets', 'Find Free APIs', 'Suggest for Project'],
                { placeHolder: 'What are you looking for?' }
            );

            if (searchType === 'Search NPM Packages') {
                const query = await vscode.window.showInputBox({
                    prompt: 'What kind of package do you need?',
                    placeHolder: 'e.g., http client, date formatting, validation'
                });

                if (query) {
                    const packages = await resourceFinder.findPackages(query);
                    const items = packages.map(p => ({
                        label: p.name,
                        description: `${(p.weeklyDownloads / 1000000).toFixed(1)}M/week`,
                        detail: p.description
                    }));
                    await vscode.window.showQuickPick(items, {
                        placeHolder: 'Suggested packages'
                    });
                }
            } else if (searchType === 'Find Free Assets') {
                const assetType = await vscode.window.showQuickPick(
                    ['3D Models', 'Textures', 'Audio', 'Icons', 'Fonts'],
                    { placeHolder: 'Asset type' }
                );

                if (assetType) {
                    const typeMap: Record<string, any> = {
                        '3D Models': '3d-model',
                        'Textures': 'texture',
                        'Audio': 'audio',
                        'Icons': 'icon',
                        'Fonts': 'font'
                    };
                    const assets = resourceFinder.findAssets(typeMap[assetType]);
                    const items = assets.map(a => ({
                        label: a.name,
                        description: a.license,
                        detail: a.description
                    }));
                    await vscode.window.showQuickPick(items, {
                        placeHolder: 'Free asset sources'
                    });
                }
            } else if (searchType === 'Find Free APIs') {
                const apis = resourceFinder.findAPIs();
                const items = apis.map(a => ({
                    label: a.name,
                    description: a.category,
                    detail: `${a.description} ${a.authRequired ? '(auth required)' : ''}`
                }));
                await vscode.window.showQuickPick(items, {
                    placeHolder: 'Free APIs'
                });
            } else if (searchType === 'Suggest for Project') {
                const description = await vscode.window.showInputBox({
                    prompt: 'Describe your project briefly'
                });

                if (description) {
                    const resources = await resourceFinder.suggestResourcesForProject(description);
                    const markdown = resourceFinder.formatResourcesAsMarkdown(resources);
                    const doc = await vscode.workspace.openTextDocument({
                        content: markdown,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.deploy', async () => {
            const { recommendedTargets } = await deploymentHelper.detectProjectType();
            
            const target = await vscode.window.showQuickPick(
                recommendedTargets.map(t => ({
                    label: t.name,
                    description: t.type,
                    detail: t.description,
                    id: t.id
                })),
                { placeHolder: 'Select deployment target' }
            );

            if (target) {
                const guide = await deploymentHelper.createDeploymentGuide((target as any).id);
                const markdown = deploymentHelper.formatGuideAsMarkdown(guide);
                
                const doc = await vscode.workspace.openTextDocument({
                    content: markdown,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);

                const setup = await vscode.window.showQuickPick(
                    ['Create Config Files', 'Just Show Guide'],
                    { placeHolder: 'Create deployment configuration?' }
                );

                if (setup === 'Create Config Files') {
                    const result = await deploymentHelper.deploy((target as any).id);
                    vscode.window.showInformationMessage(result.message);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.showProgress', async () => {
            const progress = progressTracker.getProgress();
            const report = progressTracker.generateProgressReport();
            
            const doc = await vscode.workspace.openTextDocument({
                content: report,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.viewMemory', async () => {
            const action = await vscode.window.showQuickPick(
                ['View Preferences', 'View Projects', 'View Learned Patterns', 'Export Memory', 'Clear Memory'],
                { placeHolder: 'Memory options' }
            );

            if (action === 'View Preferences') {
                const prefs = memoryManager.getPreferences();
                vscode.window.showInformationMessage(
                    `Languages: ${prefs.preferredLanguages.join(', ')}, Frameworks: ${prefs.preferredFrameworks.join(', ')}`
                );
            } else if (action === 'View Projects') {
                const projects = memoryManager.getProjects();
                const items = projects.map(p => ({
                    label: p.name,
                    description: p.techStack.join(', '),
                    detail: `Last accessed: ${new Date(p.lastAccessed).toLocaleDateString()}`
                }));
                await vscode.window.showQuickPick(items, { placeHolder: 'Your projects' });
            } else if (action === 'View Learned Patterns') {
                const patterns = memoryManager.getTopPatterns(10);
                const items = patterns.map(p => ({
                    label: p.pattern,
                    description: p.type,
                    detail: `Used ${p.frequency} times`
                }));
                await vscode.window.showQuickPick(items, { placeHolder: 'Learned patterns' });
            } else if (action === 'Export Memory') {
                const json = memoryManager.exportMemory();
                const doc = await vscode.workspace.openTextDocument({
                    content: json,
                    language: 'json'
                });
                await vscode.window.showTextDocument(doc);
            } else if (action === 'Clear Memory') {
                const confirm = await vscode.window.showQuickPick(
                    ['Yes, clear all memory', 'Cancel'],
                    { placeHolder: 'This will delete all learned preferences and patterns' }
                );
                if (confirm?.startsWith('Yes')) {
                    memoryManager.clearMemory();
                    vscode.window.showInformationMessage('Memory cleared');
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.executeAction', async () => {
            const action = await vscode.window.showInputBox({
                prompt: 'Describe the action for AI-DAN to execute',
                placeHolder: 'e.g., Create a new React component called Button'
            });

            if (action) {
                chatViewProvider.executeAction(action);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.checkUnityConnection', async () => {
            const connected = await agentExecutor.checkUnityConnection();
            if (connected) {
                vscode.window.showInformationMessage('Unity MCP connection successful!');
            } else {
                vscode.window.showWarningMessage(
                    'Unity MCP not connected. Make sure Unity is running with the MCP plugin.'
                );
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aidan.recoverError', async () => {
            const errorOutput = await vscode.window.showInputBox({
                prompt: 'Paste the error message',
                placeHolder: 'Error: ...'
            });

            if (errorOutput) {
                const result = await errorRecovery.recover(errorOutput);
                
                if (result.fixes.length === 0) {
                    vscode.window.showInformationMessage('No automatic fixes found');
                    return;
                }

                const fixItems = result.fixes.map(f => ({
                    label: f.description,
                    description: `${Math.round(f.confidence * 100)}% confidence`,
                    detail: f.command || f.code || '',
                    fix: f
                }));

                const selected = await vscode.window.showQuickPick(fixItems, {
                    placeHolder: 'Select a fix to apply'
                });

                if (selected && (selected as any).fix.autoApplicable) {
                    await errorRecovery.applyFix((selected as any).fix);
                    vscode.window.showInformationMessage('Fix applied!');
                }
            }
        })
    );

    if (unityBridge.isEnabled()) {
        unityBridge.checkConnection().then(connected => {
            if (connected) {
                vscode.window.showInformationMessage('AI-DAN connected to Unity!');
            }
        });
    }

    vscode.window.showInformationMessage('AI-DAN v2.0 is ready! Press Ctrl+Shift+A to open chat.');
}

export function deactivate() {
    console.log('AI-DAN Extension deactivated');
}
