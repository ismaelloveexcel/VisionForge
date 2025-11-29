# Build script for Windows PowerShell
Write-Host "Building AI-DAN VS Code Extension v2.0.0..." -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Compile TypeScript
Write-Host "Compiling TypeScript..." -ForegroundColor Cyan
npm run compile

# Package extension
Write-Host "Packaging extension..." -ForegroundColor Cyan
npm run package

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Install the extension with one of these methods:" -ForegroundColor White
Write-Host ""
Write-Host "1. From terminal:" -ForegroundColor Yellow
Write-Host "   code --install-extension aidan-vscode-2.0.0.vsix"
Write-Host ""
Write-Host "2. From VS Code:" -ForegroundColor Yellow
Write-Host "   - Press Ctrl+Shift+P"
Write-Host "   - Type 'Install from VSIX'"
Write-Host "   - Select aidan-vscode-2.0.0.vsix"
Write-Host ""
Write-Host "3. Drag and drop the .vsix file into VS Code Extensions panel" -ForegroundColor Yellow
Write-Host ""
