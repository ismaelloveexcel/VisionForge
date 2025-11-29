import * as vscode from 'vscode';
import * as http from 'http';

export interface UnityAction {
    type: 'create_gameobject' | 'add_component' | 'create_script' | 'run_menu_item' | 'get_scene_info';
    name?: string;
    componentType?: string;
    scriptPath?: string;
    scriptContent?: string;
    menuItem?: string;
}

export class UnityMcpBridge {
    private baseUrl: string;
    private enabled: boolean = false;

    constructor() {
        const config = vscode.workspace.getConfiguration('aidan');
        const port = config.get<number>('unityMcpPort') || 8080;
        this.baseUrl = `http://localhost:${port}`;
        this.enabled = config.get<boolean>('unityMcpEnabled') || false;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    async checkConnection(): Promise<boolean> {
        if (!this.enabled) return false;

        return new Promise((resolve) => {
            const req = http.get(`${this.baseUrl}/health`, (res) => {
                resolve(res.statusCode === 200);
            });

            req.on('error', () => {
                resolve(false);
            });

            req.setTimeout(2000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    async executeAction(action: UnityAction): Promise<{ success: boolean; message: string; data?: any }> {
        if (!this.enabled) {
            return { success: false, message: 'Unity MCP is not enabled' };
        }

        return new Promise((resolve) => {
            const data = JSON.stringify(action);

            const options = {
                hostname: 'localhost',
                port: vscode.workspace.getConfiguration('aidan').get<number>('unityMcpPort') || 8080,
                path: '/execute',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        resolve({
                            success: result.success || false,
                            message: result.message || 'Action completed',
                            data: result.data
                        });
                    } catch {
                        resolve({
                            success: res.statusCode === 200,
                            message: body
                        });
                    }
                });
            });

            req.on('error', (err) => {
                resolve({
                    success: false,
                    message: `Unity connection error: ${err.message}`
                });
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    success: false,
                    message: 'Unity request timed out'
                });
            });

            req.write(data);
            req.end();
        });
    }

    async createGameObject(name: string): Promise<{ success: boolean; message: string }> {
        return this.executeAction({ type: 'create_gameobject', name });
    }

    async addComponent(objectName: string, componentType: string): Promise<{ success: boolean; message: string }> {
        return this.executeAction({
            type: 'add_component',
            name: objectName,
            componentType
        });
    }

    async createScript(path: string, content: string): Promise<{ success: boolean; message: string }> {
        return this.executeAction({
            type: 'create_script',
            scriptPath: path,
            scriptContent: content
        });
    }

    async runMenuItem(menuItem: string): Promise<{ success: boolean; message: string }> {
        return this.executeAction({
            type: 'run_menu_item',
            menuItem
        });
    }

    async getSceneInfo(): Promise<{ success: boolean; message: string; data?: any }> {
        return this.executeAction({ type: 'get_scene_info' });
    }
}
