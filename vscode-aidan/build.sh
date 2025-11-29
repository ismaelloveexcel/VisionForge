#!/bin/bash

echo "Building AI-DAN VS Code Extension v2.0.0..."
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npm run compile

# Package extension
echo "Packaging extension..."
npm run package

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
echo ""
echo "Install the extension with one of these methods:"
echo ""
echo "1. From terminal:"
echo "   code --install-extension aidan-vscode-2.0.0.vsix"
echo ""
echo "2. From VS Code:"
echo "   - Press Ctrl+Shift+P"
echo "   - Type 'Install from VSIX'"
echo "   - Select aidan-vscode-2.0.0.vsix"
echo ""
echo "3. Drag and drop the .vsix file into VS Code Extensions panel"
echo ""
