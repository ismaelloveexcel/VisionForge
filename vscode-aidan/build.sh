#!/bin/bash

echo "Building AI-DAN VS Code Extension..."

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package

echo ""
echo "Build complete!"
echo "Install with: code --install-extension aidan-vscode-1.0.0.vsix"
