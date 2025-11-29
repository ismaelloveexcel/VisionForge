# AI-DAN VS Code Extension

An **autonomous AI development assistant** that can create files, execute commands, and integrate with Unity/Unreal directly from VS Code.

## Features

- **Multi-Model Support**: GPT-4o, Claude Sonnet/Opus, DeepSeek, Grok
- **Autonomous Actions**: Creates, edits, and deletes files without manual intervention
- **Terminal Execution**: Runs commands directly in the terminal
- **Workspace Awareness**: Scans your project structure for context
- **Unity MCP Bridge**: Direct integration with Unity Editor (optional)

## Installation (No Admin Required)

### Option 1: Install from VSIX
1. Download `aidan-vscode-1.0.0.vsix` from the releases
2. Open VS Code
3. Press `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
4. Select the downloaded file
5. Reload VS Code

### Option 2: Build from Source
```bash
cd vscode-aidan
npm install
npm run compile
npm run package
```

Then install the generated `.vsix` file.

## Setup

### 1. Set Your API Keys
Press `Ctrl+Shift+P` → "AI-DAN: Set API Key"

Choose your provider:
- **OpenAI**: For GPT-4o, GPT-4o-mini
- **Anthropic**: For Claude models
- **OpenRouter**: For DeepSeek, Grok (get key from openrouter.ai)

### 2. Open AI-DAN
- Click the AI-DAN icon in the sidebar, OR
- Press `Ctrl+Shift+A`

## Usage

### Basic Chat
Just type what you want to build:
- "Create a React component called Button"
- "Set up an Express server with CORS"
- "Create a Unity player controller script"

### Autonomous Actions
AI-DAN can:
- **Create files**: Generates and saves code directly to your project
- **Edit files**: Modifies existing files
- **Run commands**: Executes npm install, git commands, etc.
- **Read files**: Understands your existing code

### Workspace Scanning
Click "Scan Workspace" to give AI-DAN context about your project structure.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `aidan.defaultModel` | Default AI model | gpt-4o-mini |
| `aidan.autoExecute` | Auto-execute actions without confirmation | false |
| `aidan.unityMcpEnabled` | Enable Unity MCP integration | false |
| `aidan.unityMcpPort` | Unity MCP server port | 8080 |

## Unity Integration (Optional)

To control Unity directly from AI-DAN:

1. Install [Unity MCP Plugin](https://github.com/CoplayDev/unity-mcp) in your Unity project
2. Enable in VS Code: Set `aidan.unityMcpEnabled` to `true`
3. Start the MCP server in Unity
4. Run "AI-DAN: Check Unity Connection" to verify connection
5. Now you can say things like "Create a player with a Rigidbody and movement script"

### Unity Commands
When working with Unity, AI-DAN can:
- Create GameObjects in your scene
- Add components to objects
- Generate C# scripts and place them in your Assets folder
- Run Unity menu items

Example prompts:
- "Create a player controller with WASD movement"
- "Add a Rigidbody and BoxCollider to the Player object"
- "Create an enemy AI script that follows the player"

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open AI-DAN chat |

## Examples

### Create a Full Stack App
```
"Create a todo app with Express backend and React frontend"
```

AI-DAN will:
1. Create `server.js` with Express routes
2. Create React components
3. Run `npm install` for dependencies

### Unity Game Development
```
"Create a player movement script for Unity with WASD controls"
```

AI-DAN will:
1. Generate `PlayerController.cs`
2. Add proper Unity attributes
3. (If MCP enabled) Add it to your scene

## Troubleshooting

### "API key not set"
Run `AI-DAN: Set API Key` command and enter your key.

### Actions not executing
Check if `aidan.autoExecute` is `false` (default). You'll need to click "Execute" for each action.

### Unity connection failed
Ensure the Unity MCP server is running and the port matches your settings.

## Privacy

- API keys are stored locally in VS Code settings
- Your code is sent to the AI provider you select
- No data is collected by the extension itself

## License

MIT
