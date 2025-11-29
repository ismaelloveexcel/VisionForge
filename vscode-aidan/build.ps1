# Build script for Windows PowerShell
Write-Host "Building AI-DAN VS Code Extension..."

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm run package

Write-Host ""
Write-Host "Build complete!"
Write-Host "Install with: code --install-extension aidan-vscode-1.0.0.vsix"
