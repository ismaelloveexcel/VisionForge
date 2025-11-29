# AI-DAN - Dual-Mode AI Development & HR Assistant

## Overview

AI-DAN is a dual-purpose AI assistant platform that operates in two distinct modes:

1. **Development Mode**: An autonomous AI coding assistant that helps users build and deploy full-stack applications. It can create GitHub repositories, deploy Discord bots, generate documentation in Notion, and provide real-time development guidance.

2. **HR Mode**: A UAE labor law compliance expert specializing in Federal Decree-Law No. 33/2021 and 2025 amendments. Provides gratuity calculations, Emiratisation compliance checks, contract reviews, and HR policy guidance.

The application features a chat-based interface with AI-DAN as the primary interaction point, complemented by project management tools, templates, calculators, and integration management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: 
- Built on Radix UI primitives for accessible, unstyled components
- Shadcn/ui design system with "new-york" style variant
- Tailwind CSS for styling with custom design tokens
- Dark mode support with manual theme toggling
- Custom CSS variables for consistent theming across light/dark modes

**State Management**:
- TanStack Query (React Query) for server state management and API interactions
- Local React state for UI-specific state
- Custom hooks pattern for reusable logic (e.g., `use-mobile`, `use-toast`)

**Routing**: 
- Wouter for lightweight client-side routing
- Routes: Home (chat), Projects, Templates, Calculators, Documents, History, Settings

**Design System**:
- Linear-inspired aesthetics with professional HR software standards
- Dual-mode visual treatment (Development vs HR) without color dependency
- Typography: Inter for UI, JetBrains Mono for code
- Split-panel layout (60/40) with collapsible sidebar navigation
- Card-based components for consistent information density

### Backend Architecture

**Server Framework**: Express.js with TypeScript, running on Node.js ESM modules.

**API Design**:
- RESTful endpoints under `/api` prefix
- Chat endpoint (`POST /api/chat`) with mode-aware system prompts
- JSON-based request/response format
- Custom logging middleware for request tracking

**AI Integration**:
- OpenAI GPT-5 via Replit AI Integrations (no API key management required)
- Mode-specific system prompts (DEV_SYSTEM_PROMPT vs HR_SYSTEM_PROMPT)
- Streaming responses capability for real-time chat experience

**Session Management**: 
- In-memory storage implementation (MemStorage class)
- Interface-based storage design (IStorage) for future database migration
- User authentication structure prepared (username/password schema)

**Build System**:
- ESBuild for server-side bundling with selective dependency bundling
- Allowlist approach for bundling critical dependencies to optimize cold starts
- Vite for client-side bundling with HMR in development

### Data Storage Solutions

**Current Implementation**: 
- In-memory storage using Map-based structures
- No persistent database currently active

**Prepared Schema** (Drizzle ORM ready):
- PostgreSQL dialect configuration
- User table schema defined with username/password fields
- UUID-based primary keys
- Drizzle Kit configured for migrations to `./migrations` directory

**Future Database**: 
- Neon Database serverless PostgreSQL (driver installed)
- Environment variable `DATABASE_URL` expected for connection
- Push-based schema deployment (`npm run db:push`)

**Rationale**: The application is architected to easily transition from in-memory storage to PostgreSQL by implementing the `IStorage` interface with a Drizzle-based implementation. This allows rapid prototyping while maintaining a clear migration path.

### Authentication and Authorization

**Prepared but Not Active**:
- User schema includes password field for future authentication
- No active session middleware or authentication routes
- Storage interface supports user lookup by username and ID

**Future Implementation**: Ready for Passport.js integration (dependency installed) with local strategy for username/password authentication.

### External Dependencies

**Third-Party Services**:
- **OpenAI GPT-5**: Primary AI model via Replit AI Integrations
- **GitHub**: Octokit REST client installed for repository management
- **Discord**: Discord.js v14 for bot creation and management
- **Notion**: Official Notion client for documentation generation
- **Neon Database**: Serverless PostgreSQL (configured but not connected)

**Key Libraries**:
- **UI Components**: Comprehensive Radix UI component suite
- **Forms**: React Hook Form with Zod validation resolvers
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Date Handling**: date-fns for formatting and calculations
- **Icons**: Lucide React for consistent iconography

**Development Tools**:
- TypeScript for type safety across full stack
- ESLint ready (configuration implied by tsconfig)
- Replit-specific plugins for development experience (runtime error overlay, cartographer, dev banner)

**Build & Deployment**:
- Production build creates `dist/` directory with bundled server and static client
- Static file serving from `dist/public`
- SPA fallback routing for client-side navigation

---

## VS Code Extension v2.0 (vscode-aidan/)

A comprehensive AI development partner VS Code extension that goes beyond simple code generation.

### What's New in v2.0

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
- **Deployment Guides**: Step-by-step deployment to Vercel, Netlify, Railway, Heroku
- **Project Templates**: Start fast with React, Three.js VR, Express API, Unity, Electron starters

### Extension Architecture

**Core Files**:
- `extension.ts` - Main entry point, registers 17+ commands and providers
- `aiService.ts` - Multi-model AI integration (OpenAI, Anthropic, OpenRouter)
- `fileOperations.ts` - File system operations (read, create, edit, delete)
- `terminalOperations.ts` - Terminal command execution
- `agentExecutor.ts` - Parses AI responses and executes actions
- `chatViewProvider.ts` - Webview panel with tabbed interface (Chat/Vision/Progress/Templates)
- `unityMcp.ts` - Unity MCP bridge for game engine integration

**Enhancement Modules** (New in v2.0):
- `visionPlanner.ts` - Project planning and health analysis
- `projectTemplates.ts` - Pre-built project starters
- `memoryManager.ts` - Persistent preferences and pattern storage
- `learningEngine.ts` - Code style analysis and adaptation
- `gitOperations.ts` - Smart Git operations with AI suggestions
- `testGenerator.ts` - Automated test generation
- `refactorEngine.ts` - Code refactoring tools
- `errorRecovery.ts` - Error parsing and fix suggestions
- `resourceFinder.ts` - Package, asset, and API discovery
- `progressTracker.ts` - Project progress metrics
- `codeReview.ts` - Pre-commit quality checks
- `deploymentHelper.ts` - Deployment configuration generation

**Features**:
- Tabbed sidebar interface (Chat, Vision, Progress, Templates)
- Autonomous file operations via XML action tags
- Terminal command execution
- Workspace context scanning with pattern learning
- Unity/Unreal integration via MCP protocol
- Multi-model support: GPT-4o, Claude Sonnet/Opus, DeepSeek, Grok
- Persistent memory across sessions
- Quick actions dashboard

**Build Instructions**:
```bash
cd vscode-aidan
npm install
npm run package
# Install: code --install-extension aidan-vscode-2.0.0.vsix
```

**Settings**:
- `aidan.defaultModel` - Default AI model
- `aidan.autoExecute` - Auto-execute actions without confirmation
- `aidan.learnFromCode` - Learn coding patterns (default: true)
- `aidan.adaptCodeStyle` - Match your code style (default: true)
- `aidan.autoReview` - Review before commits (default: false)
- `aidan.unityMcpEnabled` - Enable Unity MCP integration
- `aidan.unityMcpPort` - Unity MCP server port

**Commands** (17 total):
- `AI-DAN: Open Chat` (Ctrl+Shift+A)
- `AI-DAN: Plan Project` (Ctrl+Shift+P)
- `AI-DAN: Smart Git Commit` (Ctrl+Shift+G)
- `AI-DAN: Generate Tests` (Ctrl+Shift+T)
- `AI-DAN: Code Review` (Ctrl+Shift+R)
- `AI-DAN: Use Template`
- `AI-DAN: Analyze Health`
- `AI-DAN: Refactoring Tools`
- `AI-DAN: Find Resources`
- `AI-DAN: Deployment Guide`
- `AI-DAN: Show Progress`
- `AI-DAN: View/Manage Memory`
- `AI-DAN: Recover from Error`
- `AI-DAN: Set API Key`
- `AI-DAN: Scan Workspace`
- `AI-DAN: Execute Action`
- `AI-DAN: Check Unity Connection`