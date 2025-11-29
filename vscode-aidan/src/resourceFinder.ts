import * as vscode from 'vscode';
import { AIService } from './aiService';

export interface PackageInfo {
    name: string;
    description: string;
    version: string;
    weeklyDownloads: number;
    repository?: string;
    homepage?: string;
    keywords: string[];
    relevanceScore: number;
}

export interface AssetResource {
    name: string;
    source: string;
    type: '3d-model' | 'texture' | 'audio' | 'font' | 'icon' | 'image';
    url: string;
    license: string;
    description: string;
}

export interface APIResource {
    name: string;
    description: string;
    category: string;
    url: string;
    free: boolean;
    authRequired: boolean;
}

export class ResourceFinder {
    private assetSources: Record<string, AssetResource[]> = {
        '3d-models': [
            { name: 'Sketchfab', source: 'sketchfab.com', type: '3d-model', url: 'https://sketchfab.com', license: 'Various (check each)', description: 'Huge library of 3D models, many free' },
            { name: 'Poly Pizza', source: 'poly.pizza', type: '3d-model', url: 'https://poly.pizza', license: 'CC0', description: 'Low-poly 3D assets, all free' },
            { name: 'Kenney', source: 'kenney.nl', type: '3d-model', url: 'https://kenney.nl', license: 'CC0', description: 'Game assets - 3D models, sprites, audio' },
            { name: 'OpenGameArt', source: 'opengameart.org', type: '3d-model', url: 'https://opengameart.org', license: 'Various', description: 'Community game assets' },
            { name: 'Quaternius', source: 'quaternius.com', type: '3d-model', url: 'https://quaternius.com', license: 'CC0', description: 'Free low-poly animated models' }
        ],
        'textures': [
            { name: 'Poliigon', source: 'poliigon.com', type: 'texture', url: 'https://poliigon.com', license: 'Commercial', description: 'High-quality PBR textures' },
            { name: 'ambientCG', source: 'ambientcg.com', type: 'texture', url: 'https://ambientcg.com', license: 'CC0', description: 'Free PBR materials' },
            { name: 'Poly Haven', source: 'polyhaven.com', type: 'texture', url: 'https://polyhaven.com', license: 'CC0', description: 'Free HDRIs, textures, and models' },
            { name: 'Texture Ninja', source: 'texture.ninja', type: 'texture', url: 'https://texture.ninja', license: 'CC0', description: 'Free CC0 textures' }
        ],
        'audio': [
            { name: 'Freesound', source: 'freesound.org', type: 'audio', url: 'https://freesound.org', license: 'Various', description: 'Massive sound effects library' },
            { name: 'OpenGameArt Audio', source: 'opengameart.org', type: 'audio', url: 'https://opengameart.org', license: 'Various', description: 'Game music and sfx' },
            { name: 'Incompetech', source: 'incompetech.com', type: 'audio', url: 'https://incompetech.com', license: 'Royalty-free', description: 'Royalty-free music' },
            { name: 'Mixkit', source: 'mixkit.co', type: 'audio', url: 'https://mixkit.co/free-sound-effects/', license: 'Free', description: 'Free sound effects' }
        ],
        'icons': [
            { name: 'Lucide', source: 'lucide.dev', type: 'icon', url: 'https://lucide.dev', license: 'ISC', description: 'Beautiful open-source icons' },
            { name: 'Heroicons', source: 'heroicons.com', type: 'icon', url: 'https://heroicons.com', license: 'MIT', description: 'Tailwind CSS icons' },
            { name: 'Feather', source: 'feathericons.com', type: 'icon', url: 'https://feathericons.com', license: 'MIT', description: 'Simple, beautiful icons' },
            { name: 'Phosphor', source: 'phosphoricons.com', type: 'icon', url: 'https://phosphoricons.com', license: 'MIT', description: 'Flexible icon family' },
            { name: 'Tabler Icons', source: 'tabler-icons.io', type: 'icon', url: 'https://tabler-icons.io', license: 'MIT', description: '4000+ free icons' }
        ],
        'fonts': [
            { name: 'Google Fonts', source: 'fonts.google.com', type: 'font', url: 'https://fonts.google.com', license: 'Open Font License', description: 'Huge collection of free fonts' },
            { name: 'Font Squirrel', source: 'fontsquirrel.com', type: 'font', url: 'https://fontsquirrel.com', license: 'Various', description: 'Free fonts for commercial use' },
            { name: 'DaFont', source: 'dafont.com', type: 'font', url: 'https://dafont.com', license: 'Various', description: 'Large font collection' }
        ]
    };

    private freeAPIs: APIResource[] = [
        { name: 'OpenWeather', description: 'Weather data and forecasts', category: 'weather', url: 'https://openweathermap.org/api', free: true, authRequired: true },
        { name: 'REST Countries', description: 'Country information', category: 'data', url: 'https://restcountries.com', free: true, authRequired: false },
        { name: 'JSONPlaceholder', description: 'Fake API for testing', category: 'testing', url: 'https://jsonplaceholder.typicode.com', free: true, authRequired: false },
        { name: 'PokeAPI', description: 'Pokemon data', category: 'games', url: 'https://pokeapi.co', free: true, authRequired: false },
        { name: 'NASA APIs', description: 'Space data and images', category: 'science', url: 'https://api.nasa.gov', free: true, authRequired: true },
        { name: 'The Movie DB', description: 'Movies and TV shows', category: 'entertainment', url: 'https://developers.themoviedb.org', free: true, authRequired: true },
        { name: 'News API', description: 'News articles', category: 'news', url: 'https://newsapi.org', free: true, authRequired: true },
        { name: 'Random User', description: 'Random user data', category: 'testing', url: 'https://randomuser.me', free: true, authRequired: false },
        { name: 'Dog CEO', description: 'Dog images', category: 'images', url: 'https://dog.ceo/dog-api/', free: true, authRequired: false },
        { name: 'Unsplash', description: 'High-quality photos', category: 'images', url: 'https://unsplash.com/developers', free: true, authRequired: true }
    ];

    constructor(private aiService: AIService) {}

    async findPackages(query: string, limit: number = 5): Promise<PackageInfo[]> {
        const prompt = `Suggest ${limit} npm packages for: "${query}"

For each package, provide:
1. Package name (must be a real npm package)
2. Brief description
3. Approximate weekly downloads
4. Key features/keywords

Respond with ONLY valid JSON array:
[
    {
        "name": "package-name",
        "description": "What it does",
        "version": "latest",
        "weeklyDownloads": 100000,
        "keywords": ["keyword1", "keyword2"],
        "relevanceScore": 0.95
    }
]`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as PackageInfo[];
            }
        } catch (error) {
            console.error('Failed to find packages:', error);
        }

        return this.getFallbackPackages(query);
    }

    private getFallbackPackages(query: string): PackageInfo[] {
        const commonPackages: Record<string, PackageInfo[]> = {
            'http': [
                { name: 'axios', description: 'Promise-based HTTP client', version: 'latest', weeklyDownloads: 40000000, keywords: ['http', 'ajax'], relevanceScore: 0.95 },
                { name: 'node-fetch', description: 'Fetch API for Node.js', version: 'latest', weeklyDownloads: 30000000, keywords: ['fetch', 'http'], relevanceScore: 0.9 }
            ],
            'database': [
                { name: 'mongoose', description: 'MongoDB ODM', version: 'latest', weeklyDownloads: 3000000, keywords: ['mongodb', 'database'], relevanceScore: 0.9 },
                { name: 'prisma', description: 'Next-gen ORM', version: 'latest', weeklyDownloads: 2000000, keywords: ['database', 'orm'], relevanceScore: 0.95 }
            ],
            'auth': [
                { name: 'jsonwebtoken', description: 'JWT implementation', version: 'latest', weeklyDownloads: 20000000, keywords: ['jwt', 'auth'], relevanceScore: 0.95 },
                { name: 'bcrypt', description: 'Password hashing', version: 'latest', weeklyDownloads: 5000000, keywords: ['password', 'security'], relevanceScore: 0.9 }
            ],
            'ui': [
                { name: 'react', description: 'UI library', version: 'latest', weeklyDownloads: 20000000, keywords: ['ui', 'frontend'], relevanceScore: 0.95 },
                { name: 'tailwindcss', description: 'Utility-first CSS', version: 'latest', weeklyDownloads: 10000000, keywords: ['css', 'styling'], relevanceScore: 0.9 }
            ]
        };

        const queryLower = query.toLowerCase();
        for (const [key, packages] of Object.entries(commonPackages)) {
            if (queryLower.includes(key)) {
                return packages;
            }
        }

        return [];
    }

    findAssets(type: AssetResource['type']): AssetResource[] {
        const typeMap: Record<AssetResource['type'], string> = {
            '3d-model': '3d-models',
            'texture': 'textures',
            'audio': 'audio',
            'font': 'fonts',
            'icon': 'icons',
            'image': 'textures'
        };

        return this.assetSources[typeMap[type]] || [];
    }

    findAllAssetSources(): Record<string, AssetResource[]> {
        return this.assetSources;
    }

    findAPIs(category?: string): APIResource[] {
        if (category) {
            return this.freeAPIs.filter(api => 
                api.category.toLowerCase() === category.toLowerCase()
            );
        }
        return this.freeAPIs;
    }

    async suggestResourcesForProject(projectDescription: string): Promise<{
        packages: PackageInfo[];
        assets: AssetResource[];
        apis: APIResource[];
    }> {
        const prompt = `Analyze this project and suggest resources needed.

PROJECT: ${projectDescription}

Identify:
1. npm packages needed (list names)
2. Types of assets needed (3d-models, textures, audio, icons, fonts)
3. APIs that might be useful

Respond with ONLY valid JSON:
{
    "packageNeeds": ["package1", "package2"],
    "assetTypes": ["3d-model", "audio"],
    "apiCategories": ["weather", "data"]
}`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const needs = JSON.parse(jsonMatch[0]);

                const packages: PackageInfo[] = [];
                for (const pkg of needs.packageNeeds || []) {
                    const found = await this.findPackages(pkg, 1);
                    packages.push(...found);
                }

                const assets: AssetResource[] = [];
                for (const type of needs.assetTypes || []) {
                    assets.push(...this.findAssets(type as AssetResource['type']));
                }

                const apis: APIResource[] = [];
                for (const cat of needs.apiCategories || []) {
                    apis.push(...this.findAPIs(cat));
                }

                return { packages, assets, apis };
            }
        } catch (error) {
            console.error('Failed to suggest resources:', error);
        }

        return { packages: [], assets: [], apis: [] };
    }

    formatResourcesAsMarkdown(resources: {
        packages: PackageInfo[];
        assets: AssetResource[];
        apis: APIResource[];
    }): string {
        let md = '# Suggested Resources\n\n';

        if (resources.packages.length > 0) {
            md += '## NPM Packages\n\n';
            for (const pkg of resources.packages) {
                md += `### ${pkg.name}\n`;
                md += `${pkg.description}\n`;
                md += `- Downloads: ~${(pkg.weeklyDownloads / 1000000).toFixed(1)}M/week\n`;
                md += `- Install: \`npm install ${pkg.name}\`\n\n`;
            }
        }

        if (resources.assets.length > 0) {
            md += '## Asset Sources\n\n';
            for (const asset of resources.assets) {
                md += `### ${asset.name}\n`;
                md += `${asset.description}\n`;
                md += `- Type: ${asset.type}\n`;
                md += `- License: ${asset.license}\n`;
                md += `- URL: ${asset.url}\n\n`;
            }
        }

        if (resources.apis.length > 0) {
            md += '## Free APIs\n\n';
            for (const api of resources.apis) {
                md += `### ${api.name}\n`;
                md += `${api.description}\n`;
                md += `- Category: ${api.category}\n`;
                md += `- Auth Required: ${api.authRequired ? 'Yes' : 'No'}\n`;
                md += `- URL: ${api.url}\n\n`;
            }
        }

        return md;
    }
}
