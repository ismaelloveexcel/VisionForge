import * as vscode from 'vscode';
import { FileOperations } from './fileOperations';
import { TerminalOperations } from './terminalOperations';

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'game' | 'web' | 'mobile' | 'vr' | 'desktop' | 'api' | 'fullstack';
    complexity: 'beginner' | 'intermediate' | 'advanced';
    files: TemplateFile[];
    dependencies: string[];
    devDependencies: string[];
    setupCommands: string[];
    postSetupMessage: string;
}

export interface TemplateFile {
    path: string;
    content: string;
    description: string;
}

export class ProjectTemplateManager {
    private templates: ProjectTemplate[] = [];

    constructor(
        private fileOps: FileOperations,
        private terminalOps: TerminalOperations
    ) {
        this.initializeTemplates();
    }

    private initializeTemplates(): void {
        this.templates = [
            this.createThreeJsVRTemplate(),
            this.createReactTemplate(),
            this.createExpressApiTemplate(),
            this.createFullStackTemplate(),
            this.createUnityGameTemplate(),
            this.createElectronTemplate()
        ];
    }

    private createThreeJsVRTemplate(): ProjectTemplate {
        return {
            id: 'threejs-vr',
            name: 'Three.js VR Starter',
            description: 'VR-ready Three.js application with WebXR support',
            category: 'vr',
            complexity: 'intermediate',
            dependencies: ['three'],
            devDependencies: ['vite', '@types/three'],
            setupCommands: ['npm install', 'npm run dev'],
            postSetupMessage: 'VR project ready! Run "npm run dev" and open in a VR-capable browser.',
            files: [
                {
                    path: 'index.html',
                    description: 'Main HTML with VR button',
                    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VR Experience</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #info { position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; font-family: sans-serif; }
    </style>
</head>
<body>
    <div id="info">Move: WASD | Look: Mouse | VR: Click button</div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>`
                },
                {
                    path: 'src/main.js',
                    description: 'Three.js VR application',
                    content: `import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();

// Lighting
scene.add(new THREE.AmbientLight(0x404040, 2));
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 10, 7);
scene.add(directional);

// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x333344 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Interactive cubes
const cubes = [];
const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7];
colors.forEach((color, i) => {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color })
    );
    cube.position.set((i - 2) * 1.5, 0.5, 0);
    scene.add(cube);
    cubes.push(cube);
});

// Animation
function animate() {
    renderer.setAnimationLoop(() => {
        cubes.forEach((cube, i) => {
            cube.rotation.y += 0.01 * (i + 1);
            cube.position.y = 0.5 + Math.sin(Date.now() * 0.002 + i) * 0.2;
        });
        renderer.render(scene, camera);
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();`
                },
                {
                    path: 'package.json',
                    description: 'Package configuration',
                    content: `{
  "name": "vr-experience",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`
                },
                {
                    path: 'vite.config.js',
                    description: 'Vite configuration',
                    content: `export default {
  server: { port: 3000, open: true }
}`
                }
            ]
        };
    }

    private createReactTemplate(): ProjectTemplate {
        return {
            id: 'react-app',
            name: 'React Application',
            description: 'Modern React app with TypeScript, Tailwind CSS, and routing',
            category: 'web',
            complexity: 'beginner',
            dependencies: ['react', 'react-dom', 'react-router-dom'],
            devDependencies: ['vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', 'tailwindcss', 'postcss', 'autoprefixer'],
            setupCommands: ['npm install', 'npx tailwindcss init -p', 'npm run dev'],
            postSetupMessage: 'React app ready! Run "npm run dev" to start development.',
            files: [
                {
                    path: 'index.html',
                    description: 'HTML entry point',
                    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
                },
                {
                    path: 'src/main.tsx',
                    description: 'React entry point',
                    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
                },
                {
                    path: 'src/App.tsx',
                    description: 'Main App component',
                    content: `import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">Welcome to React</h1>
        <p className="text-xl opacity-80">Your modern web app is ready!</p>
        <Link to="/about" className="mt-6 inline-block bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition">
          Learn More
        </Link>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link to="/" className="text-blue-400 hover:underline">← Back</Link>
      <h1 className="text-4xl font-bold mt-4">About</h1>
      <p className="mt-4 text-gray-300">Built with React, TypeScript, and Tailwind CSS.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}`
                },
                {
                    path: 'src/index.css',
                    description: 'Tailwind CSS imports',
                    content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
                },
                {
                    path: 'tailwind.config.js',
                    description: 'Tailwind configuration',
                    content: `export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: []
}`
                },
                {
                    path: 'tsconfig.json',
                    description: 'TypeScript configuration',
                    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}`
                },
                {
                    path: 'package.json',
                    description: 'Package configuration',
                    content: `{
  "name": "react-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}`
                }
            ]
        };
    }

    private createExpressApiTemplate(): ProjectTemplate {
        return {
            id: 'express-api',
            name: 'Express REST API',
            description: 'RESTful API with Express, TypeScript, and authentication',
            category: 'api',
            complexity: 'intermediate',
            dependencies: ['express', 'cors', 'helmet', 'morgan', 'jsonwebtoken', 'bcryptjs', 'dotenv'],
            devDependencies: ['typescript', '@types/node', '@types/express', '@types/cors', '@types/morgan', '@types/jsonwebtoken', '@types/bcryptjs', 'tsx', 'nodemon'],
            setupCommands: ['npm install', 'npm run dev'],
            postSetupMessage: 'API ready! Run "npm run dev" to start. Test at http://localhost:3000/api/health',
            files: [
                {
                    path: 'src/index.ts',
                    description: 'Express server entry',
                    content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', router);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});`
                },
                {
                    path: 'src/routes/index.ts',
                    description: 'API routes',
                    content: `import { Router } from 'express';
import { authRouter } from './auth';

export const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRouter);`
                },
                {
                    path: 'src/routes/auth.ts',
                    description: 'Authentication routes',
                    content: `import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

const users: Map<string, { password: string; name: string }> = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

authRouter.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (users.has(email)) {
        return res.status(400).json({ error: 'User exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    users.set(email, { password: hashed, name });
    res.status(201).json({ message: 'User created' });
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
});`
                },
                {
                    path: 'src/middleware/errorHandler.ts',
                    description: 'Error handling middleware',
                    content: `import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
}`
                },
                {
                    path: 'package.json',
                    description: 'Package configuration',
                    content: `{
  "name": "express-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}`
                },
                {
                    path: 'tsconfig.json',
                    description: 'TypeScript configuration',
                    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}`
                },
                {
                    path: '.env.example',
                    description: 'Environment variables template',
                    content: `PORT=3000
JWT_SECRET=your-super-secret-key-here`
                }
            ]
        };
    }

    private createFullStackTemplate(): ProjectTemplate {
        return {
            id: 'fullstack',
            name: 'Full Stack App',
            description: 'React frontend + Express backend with shared types',
            category: 'fullstack',
            complexity: 'advanced',
            dependencies: [],
            devDependencies: [],
            setupCommands: ['cd client && npm install', 'cd server && npm install', 'npm run dev'],
            postSetupMessage: 'Full stack app ready! Run "npm run dev" in both client and server folders.',
            files: [
                {
                    path: 'README.md',
                    description: 'Project documentation',
                    content: `# Full Stack Application

## Structure
- \`/client\` - React frontend
- \`/server\` - Express backend
- \`/shared\` - Shared types and utilities

## Getting Started
1. \`cd server && npm install && npm run dev\`
2. \`cd client && npm install && npm run dev\`

Client runs on :5173, Server on :3000`
                }
            ]
        };
    }

    private createUnityGameTemplate(): ProjectTemplate {
        return {
            id: 'unity-game',
            name: 'Unity Game Scripts',
            description: 'Common Unity C# scripts for game development',
            category: 'game',
            complexity: 'intermediate',
            dependencies: [],
            devDependencies: [],
            setupCommands: [],
            postSetupMessage: 'Unity scripts created! Import into your Unity project\'s Assets/Scripts folder.',
            files: [
                {
                    path: 'Assets/Scripts/PlayerController.cs',
                    description: 'Player movement controller',
                    content: `using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 5f;
    public float jumpForce = 10f;
    public float gravity = -20f;
    
    [Header("Ground Check")]
    public Transform groundCheck;
    public float groundDistance = 0.4f;
    public LayerMask groundMask;
    
    private CharacterController controller;
    private Vector3 velocity;
    private bool isGrounded;
    
    void Start()
    {
        controller = GetComponent<CharacterController>();
    }
    
    void Update()
    {
        isGrounded = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);
        
        if (isGrounded && velocity.y < 0)
            velocity.y = -2f;
        
        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");
        
        Vector3 move = transform.right * x + transform.forward * z;
        controller.Move(move * moveSpeed * Time.deltaTime);
        
        if (Input.GetButtonDown("Jump") && isGrounded)
            velocity.y = Mathf.Sqrt(jumpForce * -2f * gravity);
        
        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
}`
                },
                {
                    path: 'Assets/Scripts/CameraFollow.cs',
                    description: 'Smooth camera follow',
                    content: `using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    public Transform target;
    public Vector3 offset = new Vector3(0, 5, -10);
    public float smoothSpeed = 5f;
    public float rotationSpeed = 100f;
    
    private float currentRotation = 0f;
    
    void LateUpdate()
    {
        if (target == null) return;
        
        currentRotation += Input.GetAxis("Mouse X") * rotationSpeed * Time.deltaTime;
        
        Quaternion rotation = Quaternion.Euler(0, currentRotation, 0);
        Vector3 rotatedOffset = rotation * offset;
        Vector3 desiredPosition = target.position + rotatedOffset;
        
        transform.position = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed * Time.deltaTime);
        transform.LookAt(target);
    }
}`
                },
                {
                    path: 'Assets/Scripts/GameManager.cs',
                    description: 'Singleton game manager',
                    content: `using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }
    
    public int score = 0;
    public bool isPaused = false;
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    public void AddScore(int points)
    {
        score += points;
    }
    
    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0 : 1;
    }
    
    public void RestartGame()
    {
        score = 0;
        Time.timeScale = 1;
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }
    
    public void LoadScene(string sceneName)
    {
        SceneManager.LoadScene(sceneName);
    }
}`
                }
            ]
        };
    }

    private createElectronTemplate(): ProjectTemplate {
        return {
            id: 'electron-app',
            name: 'Electron Desktop App',
            description: 'Cross-platform desktop application with Electron',
            category: 'desktop',
            complexity: 'intermediate',
            dependencies: ['electron'],
            devDependencies: ['electron-builder'],
            setupCommands: ['npm install', 'npm start'],
            postSetupMessage: 'Electron app ready! Run "npm start" to launch the desktop application.',
            files: [
                {
                    path: 'main.js',
                    description: 'Electron main process',
                    content: `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('get-app-info', () => ({
    name: app.getName(),
    version: app.getVersion()
}));`
                },
                {
                    path: 'preload.js',
                    description: 'Preload script for IPC',
                    content: `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppInfo: () => ipcRenderer.invoke('get-app-info')
});`
                },
                {
                    path: 'index.html',
                    description: 'Main HTML file',
                    content: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
    <title>Electron App</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white; }
        h1 { margin-bottom: 10px; }
        #info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>Welcome to Electron</h1>
    <p>Your cross-platform desktop app is ready!</p>
    <div id="info"></div>
    <script src="renderer.js"></script>
</body>
</html>`
                },
                {
                    path: 'renderer.js',
                    description: 'Renderer process script',
                    content: `window.electronAPI.getAppInfo().then(info => {
    document.getElementById('info').innerHTML = \`
        <p><strong>App:</strong> \${info.name}</p>
        <p><strong>Version:</strong> \${info.version}</p>
    \`;
});`
                },
                {
                    path: 'package.json',
                    description: 'Package configuration',
                    content: `{
  "name": "electron-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.example.electronapp",
    "mac": { "category": "public.app-category.utilities" },
    "win": { "target": "nsis" },
    "linux": { "target": "AppImage" }
  }
}`
                }
            ]
        };
    }

    getTemplates(): ProjectTemplate[] {
        return this.templates;
    }

    getTemplateById(id: string): ProjectTemplate | undefined {
        return this.templates.find(t => t.id === id);
    }

    getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
        return this.templates.filter(t => t.category === category);
    }

    async applyTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
        const template = this.getTemplateById(templateId);
        if (!template) {
            return { success: false, message: `Template "${templateId}" not found` };
        }

        try {
            for (const file of template.files) {
                await this.fileOps.createFile(file.path, file.content);
            }

            if (template.setupCommands.length > 0) {
                const installCmd = template.setupCommands[0];
                await this.terminalOps.runCommand(installCmd);
            }

            return {
                success: true,
                message: `${template.name} created successfully!\n${template.postSetupMessage}`
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to apply template: ${error.message}`
            };
        }
    }

    getTemplatePreview(templateId: string): string {
        const template = this.getTemplateById(templateId);
        if (!template) return 'Template not found';

        return `# ${template.name}

**Category:** ${template.category}
**Complexity:** ${template.complexity}

${template.description}

## Files Created
${template.files.map(f => `- \`${f.path}\` - ${f.description}`).join('\n')}

## Dependencies
${template.dependencies.length > 0 ? template.dependencies.join(', ') : 'None'}

## Dev Dependencies
${template.devDependencies.length > 0 ? template.devDependencies.join(', ') : 'None'}

## Setup Commands
${template.setupCommands.map(c => `\`${c}\``).join('\n')}
`;
    }
}
