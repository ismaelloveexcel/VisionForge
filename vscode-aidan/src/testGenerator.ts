import * as vscode from 'vscode';
import { AIService } from './aiService';
import { FileOperations } from './fileOperations';

export interface TestCase {
    name: string;
    description: string;
    code: string;
    type: 'unit' | 'integration' | 'e2e';
}

export interface TestSuite {
    framework: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'nunit';
    testFile: string;
    cases: TestCase[];
    setupCode?: string;
    teardownCode?: string;
}

export class TestGenerator {
    constructor(
        private aiService: AIService,
        private fileOps: FileOperations
    ) {}

    async generateTests(sourceFile: string): Promise<TestSuite> {
        const content = await this.fileOps.readFile(sourceFile);
        const framework = this.detectTestFramework(sourceFile);
        const language = this.detectLanguage(sourceFile);

        const prompt = `Generate comprehensive unit tests for this code.

SOURCE FILE: ${sourceFile}
LANGUAGE: ${language}
TEST FRAMEWORK: ${framework}

CODE:
\`\`\`
${content}
\`\`\`

Generate tests that cover:
1. Happy path scenarios
2. Edge cases
3. Error handling
4. Boundary conditions

Respond with ONLY valid JSON:
{
    "framework": "${framework}",
    "testFile": "${this.getTestFilePath(sourceFile)}",
    "cases": [
        {
            "name": "should do something",
            "description": "Test description",
            "code": "test code here",
            "type": "unit"
        }
    ],
    "setupCode": "beforeEach/setup code if needed",
    "teardownCode": "afterEach/cleanup code if needed"
}`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o'
            );

            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as TestSuite;
            }
        } catch (error) {
            console.error('Failed to generate tests:', error);
        }

        return this.createFallbackTestSuite(sourceFile, framework);
    }

    async generateTestsForFunction(sourceFile: string, functionName: string): Promise<TestCase[]> {
        const content = await this.fileOps.readFile(sourceFile);
        const framework = this.detectTestFramework(sourceFile);

        const functionMatch = content.match(
            new RegExp(`(function\\s+${functionName}|const\\s+${functionName}\\s*=)[^]*?(?=\\n(?:function|const|export|$))`, 's')
        );

        if (!functionMatch) {
            return [{
                name: `should test ${functionName}`,
                description: 'Function not found - manual test needed',
                code: `test('${functionName} works', () => {\n  // TODO: implement test\n});`,
                type: 'unit'
            }];
        }

        const prompt = `Generate unit tests for this function using ${framework}.

FUNCTION:
\`\`\`
${functionMatch[0]}
\`\`\`

Cover happy path, edge cases, and error handling.
Respond with ONLY a JSON array of test cases:
[
    {
        "name": "should do X when Y",
        "description": "Description",
        "code": "complete test code",
        "type": "unit"
    }
]`;

        try {
            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as TestCase[];
            }
        } catch (error) {
            console.error('Failed to generate function tests:', error);
        }

        return [{
            name: `should test ${functionName}`,
            description: 'Auto-generation failed - manual test needed',
            code: `test('${functionName} works', () => {\n  // TODO: implement test\n});`,
            type: 'unit'
        }];
    }

    async createTestFile(suite: TestSuite): Promise<void> {
        let testCode = this.generateTestFileContent(suite);
        await this.fileOps.createFile(suite.testFile, testCode);
    }

    private generateTestFileContent(suite: TestSuite): string {
        switch (suite.framework) {
            case 'jest':
            case 'vitest':
                return this.generateJestContent(suite);
            case 'mocha':
                return this.generateMochaContent(suite);
            case 'pytest':
                return this.generatePytestContent(suite);
            case 'nunit':
                return this.generateNUnitContent(suite);
            default:
                return this.generateJestContent(suite);
        }
    }

    private generateJestContent(suite: TestSuite): string {
        let content = '';

        if (suite.setupCode) {
            content += `beforeEach(() => {\n  ${suite.setupCode}\n});\n\n`;
        }

        if (suite.teardownCode) {
            content += `afterEach(() => {\n  ${suite.teardownCode}\n});\n\n`;
        }

        content += `describe('Test Suite', () => {\n`;

        for (const testCase of suite.cases) {
            content += `  test('${testCase.name}', () => {\n`;
            content += `    ${testCase.code.split('\n').join('\n    ')}\n`;
            content += `  });\n\n`;
        }

        content += `});\n`;

        return content;
    }

    private generateMochaContent(suite: TestSuite): string {
        let content = `const { expect } = require('chai');\n\n`;

        content += `describe('Test Suite', function() {\n`;

        if (suite.setupCode) {
            content += `  beforeEach(function() {\n    ${suite.setupCode}\n  });\n\n`;
        }

        for (const testCase of suite.cases) {
            content += `  it('${testCase.name}', function() {\n`;
            content += `    ${testCase.code.split('\n').join('\n    ')}\n`;
            content += `  });\n\n`;
        }

        content += `});\n`;

        return content;
    }

    private generatePytestContent(suite: TestSuite): string {
        let content = `import pytest\n\n`;

        if (suite.setupCode) {
            content += `@pytest.fixture\ndef setup():\n    ${suite.setupCode}\n\n`;
        }

        for (const testCase of suite.cases) {
            const funcName = testCase.name.replace(/\s+/g, '_').toLowerCase();
            content += `def test_${funcName}():\n`;
            content += `    """${testCase.description}"""\n`;
            content += `    ${testCase.code.split('\n').join('\n    ')}\n\n`;
        }

        return content;
    }

    private generateNUnitContent(suite: TestSuite): string {
        let content = `using NUnit.Framework;\n\n`;
        content += `[TestFixture]\npublic class TestSuite\n{\n`;

        if (suite.setupCode) {
            content += `    [SetUp]\n    public void Setup()\n    {\n        ${suite.setupCode}\n    }\n\n`;
        }

        for (const testCase of suite.cases) {
            const methodName = testCase.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            content += `    [Test]\n`;
            content += `    public void ${methodName}()\n    {\n`;
            content += `        ${testCase.code.split('\n').join('\n        ')}\n`;
            content += `    }\n\n`;
        }

        content += `}\n`;

        return content;
    }

    private detectTestFramework(filePath: string): TestSuite['framework'] {
        const ext = filePath.split('.').pop()?.toLowerCase();

        if (ext === 'py') return 'pytest';
        if (ext === 'cs') return 'nunit';

        return 'jest';
    }

    private detectLanguage(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const map: Record<string, string> = {
            'ts': 'TypeScript',
            'tsx': 'TypeScript React',
            'js': 'JavaScript',
            'jsx': 'JavaScript React',
            'py': 'Python',
            'cs': 'C#',
            'java': 'Java'
        };
        return map[ext || ''] || 'Unknown';
    }

    private getTestFilePath(sourceFile: string): string {
        const parts = sourceFile.split('/');
        const fileName = parts.pop() || '';
        const ext = fileName.split('.').pop();
        const baseName = fileName.replace(`.${ext}`, '');

        if (ext === 'py') {
            return `tests/test_${baseName}.py`;
        } else if (ext === 'cs') {
            return `Tests/${baseName}Tests.cs`;
        } else {
            return `__tests__/${baseName}.test.${ext}`;
        }
    }

    private createFallbackTestSuite(sourceFile: string, framework: TestSuite['framework']): TestSuite {
        return {
            framework,
            testFile: this.getTestFilePath(sourceFile),
            cases: [{
                name: 'should pass basic test',
                description: 'Placeholder test - implement actual tests',
                code: 'expect(true).toBe(true);',
                type: 'unit'
            }]
        };
    }

    async suggestTestImprovements(testFile: string): Promise<string[]> {
        try {
            const content = await this.fileOps.readFile(testFile);

            const prompt = `Analyze this test file and suggest improvements.

TEST FILE:
\`\`\`
${content}
\`\`\`

Identify:
1. Missing edge cases
2. Untested error scenarios
3. Code coverage gaps
4. Test quality issues

Respond with a JSON array of suggestions:
["suggestion 1", "suggestion 2"]`;

            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                'gpt-4o-mini'
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as string[];
            }
        } catch (error) {
            console.error('Failed to analyze tests:', error);
        }

        return ['Add more edge case tests', 'Consider testing error scenarios'];
    }
}
