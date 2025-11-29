# AI-DAN VS Code Extension v2.0

An **autonomous AI development partner** that goes beyond simple code generation. AI-DAN v2.0 plans your projects, learns your coding style, generates tests, reviews code, assists with Git, helps with deployment, and integrates with Unity/Unreal.

## What's New in v2.0

- **Project Vision Planning**: Creates comprehensive project plans with architecture, milestones, risks, and timelines
- **Persistent Memory**: Remembers your projects, preferences, and patterns across sessions
- **Learning Engine**: Adapts to your coding style, naming conventions, and framework preferences
- **Smart Git**: AI-generated commit messages, branch suggestions, and PR descriptions
- **Test Generation**: Auto-generates Jest/Mocha/Vitest tests for your code
- **Code Review**: Security checks, best practices, and quality scoring before commits
- **Refactoring Tools**: Multi-file rename, dead code detection, import path updates
- **Error Recovery**: Parses errors and suggests fixes automatically
- **Resource Finder**: Find npm packages, free assets, and APIs for your project
- **Progress Tracking**: Burndown charts, completion estimates, productivity metrics
- **Deployment Guides**: Step-by-step deployment to Vercel, Netlify, Railway, Heroku, and more
- **Project Templates**: Start fast with React, Three.js VR, Express API, Unity, Electron starters

## Features

### Core Capabilities
- **Multi-Model Support**: GPT-4o, Claude Sonnet/Opus, DeepSeek, Grok
- **Autonomous Actions**: Creates, edits, and deletes files without manual intervention
- **Terminal Execution**: Runs commands directly in the terminal
- **Workspace Awareness**: Scans your project structure and learns patterns

### Development Partner Features
- **Vision Planner**: Describe an idea, get a complete project plan with milestones
- **Memory System**: AI-DAN remembers your preferences and past projects
- **Style Learning**: Generates code that matches your existing style
- **Test Generator**: One-click test generation for any file
- **Code Reviewer**: Pre-commit quality checks with scoring
- **Git Assistant**: Smart commits, branch names, and PR descriptions
- **Deployment Helper**: Guided deployment with config file generation

### Unity Integration (Optional)
- Create GameObjects directly in your scene
- Add components to objects
- Generate and attach C# scripts
- Run Unity menu items

## Installation

### Option 1: Install from VSIX
1. Download `aidan-vscode-2.0.0.vsix`
2. In VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Select the downloaded file
4. Reload VS Code

### Option 2: Build from Source
```bash
cd vscode-aidan
npm install
npm run package
# Install: code --install-extension aidan-vscode-2.0.0.vsix
```

## Quick Start

### 1. Set Your API Keys
`Ctrl+Shift+P` → "AI-DAN: Set API Key"

Choose your provider:
- **OpenAI**: For GPT-4o, GPT-4o-mini
- **Anthropic**: For Claude models
- **OpenRouter**: For DeepSeek, Grok

### 2. Open AI-DAN
- Click the AI-DAN icon in the sidebar, OR
- Press `Ctrl+Shift+A`

### 3. Scan Your Workspace
Click "Scan" in the toolbar. AI-DAN will:
- Learn your project structure
- Detect frameworks and languages used
- Learn your coding style and patterns

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Open Chat | `Ctrl+Shift+A` | Open AI-DAN sidebar |
| Plan Project | `Ctrl+Shift+P` | Create project vision |
| Smart Commit | `Ctrl+Shift+G` | AI-generated commit |
| Generate Tests | `Ctrl+Shift+T` | Generate tests for current file |
| Code Review | `Ctrl+Shift+R` | Review staged changes |

### All Commands
- **AI-DAN: Open Chat** - Main chat interface
- **AI-DAN: Plan Project** - Create project vision with milestones
- **AI-DAN: Use Template** - Start from a project template
- **AI-DAN: Analyze Health** - Check project quality metrics
- **AI-DAN: Smart Git Commit** - AI-generated commit message
- **AI-DAN: Generate Tests** - Auto-generate tests
- **AI-DAN: Refactoring Tools** - Rename, find unused code
- **AI-DAN: Code Review** - Quality and security review
- **AI-DAN: Find Resources** - Find packages, assets, APIs
- **AI-DAN: Deployment Guide** - Deploy to cloud platforms
- **AI-DAN: Show Progress** - View project progress
- **AI-DAN: View Memory** - Manage learned preferences

## Usage Examples

### Project Planning
```
"I want to build a VR game where players explore underwater caves"
```
AI-DAN creates a vision with:
- Architecture (Three.js/Unity, WebXR)
- Tech stack recommendations
- Milestones with time estimates
- Potential risks and mitigations
- Future enhancement ideas

### Smart Git Commits
```
> AI-DAN: Smart Git Commit
```
AI-DAN analyzes your staged changes and suggests:
```
feat(auth): implement JWT token refresh

- Add automatic token refresh on 401 responses
- Store refresh token securely in httpOnly cookie
- Add tests for token expiration scenarios
```

### Test Generation
```
> AI-DAN: Generate Tests for Current File
```
AI-DAN reads your code and creates:
- Happy path tests
- Edge case tests
- Error handling tests
- Appropriate mocking

### Code Review
```
> AI-DAN: Code Review
```
Get a score and feedback on:
- Security vulnerabilities
- Performance issues
- Best practice violations
- Suggestions for improvement

### Find Resources
```
"I need a library for handling dates in JavaScript"
```
AI-DAN suggests: date-fns, dayjs, luxon with pros/cons

```
"Find free 3D models for my game"
```
AI-DAN lists: Sketchfab, Poly Pizza, Kenney, OpenGameArt

### Deployment
```
> AI-DAN: Deployment Guide
```
AI-DAN detects your project type and offers:
- Vercel (recommended for React/Next.js)
- Netlify, Railway, Render, Fly.io
- Step-by-step guide
- Config file generation

## Project Templates

Start quickly with pre-built templates:

| Template | Description |
|----------|-------------|
| Three.js VR | WebXR-ready VR experience |
| React App | React + TypeScript + Tailwind + Router |
| Express API | REST API with auth and validation |
| Full Stack | React frontend + Express backend |
| Unity Game | Player controller, camera, game manager |
| Electron | Cross-platform desktop app |

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `aidan.defaultModel` | Default AI model | gpt-4o-mini |
| `aidan.autoExecute` | Auto-execute actions | false |
| `aidan.learnFromCode` | Learn coding patterns | true |
| `aidan.adaptCodeStyle` | Match your code style | true |
| `aidan.autoReview` | Review before commits | false |
| `aidan.unityMcpEnabled` | Enable Unity integration | false |
| `aidan.unityMcpPort` | Unity MCP server port | 8080 |

## How Memory Works

AI-DAN stores information locally in your VS Code profile:

**Preferences**:
- Preferred languages and frameworks
- Naming conventions (camelCase, snake_case)
- Code style (tabs/spaces, quotes, semicolons)

**Projects**:
- Project names and tech stacks
- Key files and notes
- Last accessed dates

**Learned Patterns**:
- Common patterns you use
- Framework choices
- Import styles

View or clear memory: `AI-DAN: View/Manage Memory`

## Unity Integration

### Setup
1. Install Unity MCP Plugin in your Unity project
2. Enable: Set `aidan.unityMcpEnabled` to `true`
3. Match ports in settings
4. Run "AI-DAN: Check Unity Connection"

### Example
```
"Create a player with WASD movement and a camera that follows it"
```
AI-DAN will:
1. Create PlayerController.cs with movement logic
2. Create CameraFollow.cs with smooth follow
3. Create Player GameObject in scene
4. Add components to objects
5. Connect camera to player

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open AI-DAN chat |
| `Ctrl+Shift+P` | Plan new project |
| `Ctrl+Shift+G` | Smart Git commit |
| `Ctrl+Shift+T` | Generate tests |
| `Ctrl+Shift+R` | Code review |

## Context Menu

Right-click in editor to access:
- Generate Tests for This File
- Review This Code
- Refactoring Tools

## Troubleshooting

### "API key not set"
Run `AI-DAN: Set API Key` command.

### Actions not executing
Check if `aidan.autoExecute` is `false` (default). Click "Execute" for each action.

### Memory not persisting
Check VS Code's globalStorage folder permissions.

### Tests not generating correctly
Try scanning the workspace first to give AI-DAN context.

### Unity connection failed
1. Ensure Unity MCP server is running
2. Check port matches settings
3. Verify firewall isn't blocking

## Privacy

- API keys stored locally in VS Code settings
- Memory data stored locally in VS Code globalStorage
- Code is sent to your selected AI provider
- No data collected by the extension itself

## Contributing

Pull requests welcome! Key areas for contribution:
- Additional project templates
- More deployment targets
- Language-specific test generation
- Asset source integrations

## License

MIT

---

**AI-DAN v2.0** - Your Autonomous Development Partner
