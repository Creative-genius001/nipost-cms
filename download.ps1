##############################################################################
# Blackbox CLI v2 Install Script for Windows PowerShell
#
# This script downloads and installs the Blackbox CLI v2 (Node.js-based)
# from the Extension Upload Service. Ready to run on any Windows system!
#
##############################################################################

# Unblock the script if it was downloaded from the internet to prevent "Run / Suspend" prompts
if (Get-Command Unblock-File -ErrorAction SilentlyContinue) {
    Unblock-File -Path $PSCommandPath -ErrorAction SilentlyContinue
}

$ErrorActionPreference = "Stop"

# --- 1) Check for Node.js and npm ---
Write-Host "Checking for Node.js..." -ForegroundColor Gray
try {
    $nodeVersion = node --version
    $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
   
    if ($nodeMajorVersion -lt 20) {
        Write-Error "Node.js version 20 or higher is required. Current version: $nodeVersion"
        exit 1
    }
    Write-Host "Found Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Host "Found npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# --- 2) Variables ---
$PRODUCT_SLUG = "blackbox-cli-v2"
$EXTENSION_SERVICE_URL = if ($env:EXTENSION_SERVICE_URL) { $env:EXTENSION_SERVICE_URL } else { "https://releases.blackbox.ai" }
$NPM_REGISTRY = if ($env:BLACKBOX_NPM_REGISTRY) { $env:BLACKBOX_NPM_REGISTRY } else { "https://registry.npmjs.org" }

if (-not $env:BLACKBOX_INSTALL_DIR) {
    $env:BLACKBOX_INSTALL_DIR = Join-Path $env:USERPROFILE ".blackbox-cli-v2"
}
$env:BLACKBOX_INSTALL_DIR = $env:BLACKBOX_INSTALL_DIR.Trim()

if (-not $env:BLACKBOX_BIN_DIR) {
    $env:BLACKBOX_BIN_DIR = Join-Path $env:USERPROFILE ".local\bin"
}
$env:BLACKBOX_BIN_DIR = $env:BLACKBOX_BIN_DIR.Trim()

# --- 3) Detect Architecture ---
$ARCH = $env:PROCESSOR_ARCHITECTURE
if ($ARCH -eq "AMD64") {
    $PLATFORM = "windows-x64"
} else {
    Write-Error "Unsupported architecture '$ARCH'."
    exit 1
}

# --- 4) Get latest release information ---
Write-Host "Fetching latest release information..." -ForegroundColor Gray
$RELEASE_API_URL = "$EXTENSION_SERVICE_URL/api/v0/latest?product=$PRODUCT_SLUG&platform=$PLATFORM"

try {
    $RELEASE_INFO = Invoke-WebRequest -Uri $RELEASE_API_URL -UseBasicParsing | ConvertFrom-Json
} catch {
    Write-Error "Failed to fetch release info."
    exit 1
}

$DOWNLOAD_URL = $RELEASE_INFO.url
$VERSION = $RELEASE_INFO.version

if (-not $DOWNLOAD_URL.StartsWith("http")) {
    $DOWNLOAD_URL = "$EXTENSION_SERVICE_URL$DOWNLOAD_URL"
}

# --- 5) Download ---
$FILENAME = "blackbox-cli-v2.zip"
Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $FILENAME -UseBasicParsing

# --- 6) Extract ---
# Note: On Windows, we cannot delete files that are currently in use (like DLLs loaded by running processes).
# We use -ErrorAction SilentlyContinue to ignore file lock errors and continue with the update.
# The extraction will overwrite existing files, so this is safe.
if (Test-Path $env:BLACKBOX_INSTALL_DIR) {
    Write-Host "Removing existing installation at $env:BLACKBOX_INSTALL_DIR..." -ForegroundColor DarkYellow
    Remove-Item -Path $env:BLACKBOX_INSTALL_DIR -Recurse -Force -ErrorAction SilentlyContinue
    
    # If the directory still exists (due to locked files), that's okay - extraction will overwrite
    if (Test-Path $env:BLACKBOX_INSTALL_DIR) {
        Write-Host "Note: Some files could not be removed (may be in use). They will be overwritten during extraction." -ForegroundColor Gray
    }
}
# Remove old blackbox executables from bin directory
if (Test-Path $env:BLACKBOX_BIN_DIR) {
    Write-Host "Removing old blackbox executables from $env:BLACKBOX_BIN_DIR..." -ForegroundColor DarkYellow
    Remove-Item -Path (Join-Path $env:BLACKBOX_BIN_DIR "blackbox.cmd") -Force -ErrorAction SilentlyContinue
    Remove-Item -Path (Join-Path $env:BLACKBOX_BIN_DIR "blackbox.mjs") -Force -ErrorAction SilentlyContinue
    Remove-Item -Path (Join-Path $env:BLACKBOX_BIN_DIR "blackbox") -Force -ErrorAction SilentlyContinue
}

# Remove npm-installed blackbox CLI if present
Write-Host "Checking for npm-installed blackbox CLI..." -ForegroundColor DarkYellow
try {
    $npmList = npm list -g @blackbox_ai/blackbox-cli 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removing npm-installed @blackbox_ai/blackbox-cli..." -ForegroundColor DarkYellow
        npm uninstall -g @blackbox_ai/blackbox-cli
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully removed npm-installed blackbox CLI." -ForegroundColor Green
        } else {
            Write-Host "Warning: Failed to remove npm-installed blackbox CLI." -ForegroundColor Yellow
        }
    } else {
        Write-Host "No npm-installed blackbox CLI found." -ForegroundColor Gray
    }
} catch {
    Write-Host "Warning: Could not check for npm-installed blackbox CLI. $($_.Exception.Message)" -ForegroundColor Yellow
}

# --- 7) Create installation directory and extract ---
Write-Host "Creating installation directory: $env:BLACKBOX_INSTALL_DIR" -ForegroundColor DarkYellow
New-Item -ItemType Directory -Path $env:BLACKBOX_INSTALL_DIR -Force | Out-Null
Expand-Archive -Path $FILENAME -DestinationPath $env:BLACKBOX_INSTALL_DIR -Force
Remove-Item -Path $FILENAME -Force

# --- 8) Write VERSION file ---
Write-Host "Writing version information..." -ForegroundColor Gray
$VERSION_FILE = Join-Path $env:BLACKBOX_INSTALL_DIR "VERSION"
$VERSION | Out-File -FilePath $VERSION_FILE -Encoding UTF8
if (Test-Path $VERSION_FILE) {
    Write-Host "  Version $VERSION written to $VERSION_FILE" -ForegroundColor Gray
} else {
    Write-Host "  Warning: Failed to write VERSION file" -ForegroundColor Yellow
}

# --- 7) Patch package.json and Install Dependencies ---
$CLI_DIST = Join-Path $env:BLACKBOX_INSTALL_DIR "packages\cli\dist"
if (Test-Path (Join-Path $CLI_DIST "package.json")) {
    Write-Host "Patching dependencies..." -ForegroundColor Gray
    $PKG_PATH = Join-Path $CLI_DIST "package.json"
    $pkg = Get-Content $PKG_PATH | ConvertFrom-Json
    
    # Fix paths
    if ($pkg.dependencies.'@blackbox_ai/blackbox-cli-core') { $pkg.dependencies.'@blackbox_ai/blackbox-cli-core' = "file:../../core" }
    if ($pkg.devDependencies.'@blackbox_ai/blackbox-cli-test-utils') { $pkg.devDependencies.'@blackbox_ai/blackbox-cli-test-utils' = "file:../../test-utils" }
    
    # Add missing deps
    $deps = @{
        "mnemonist" = "^0.40.3"; "express" = "^4.21.2"; "openai" = "5.11.0"; "ajv" = "^8.17.1";
        "ajv-formats" = "^3.0.0"; "chardet" = "^2.1.0"; "fast-uri" = "^3.0.6"; "fastest-levenshtein" = "^1.0.16";
        "fdir" = "^6.4.6"; "form-data" = "^4.0.4"; "html-to-text" = "^9.0.5"; "https-proxy-agent" = "^7.0.6";
        "ignore" = "^7.0.0"; "jose" = "^5.10.0"; "jsonrepair" = "^3.13.0"; "marked" = "^15.0.12";
        "playwright" = "^1.56.0"; "sharp" = "^0.33.5"; "tiktoken" = "^1.0.21"; "uuid" = "^9.0.1";
        "ws" = "^8.18.0"; "xlsx" = "^0.18.5"; "mammoth" = "^1.8.0"; "yaml" = "^2.6.1";
        "picomatch" = "^4.0.1"; "glob" = "^10.4.5"; "react" = "^19.1.0"; "react-dom" = "^19.1.0";
        "undici" = "^7.10.0"; "@lvce-editor/ripgrep" = "^1.6.0"; "@xterm/headless" = "5.5.0";
        "@opentelemetry/api" = "^1.9.0"; "@opentelemetry/api-logs" = "^0.208.0"; "@opentelemetry/core" = "^2.2.0";
        "@opentelemetry/exporter-logs-otlp-grpc" = "^0.208.0"; "@opentelemetry/exporter-logs-otlp-http" = "^0.208.0";
        "@opentelemetry/exporter-metrics-otlp-grpc" = "^0.208.0"; "@opentelemetry/exporter-metrics-otlp-http" = "^0.208.0";
        "@opentelemetry/exporter-trace-otlp-grpc" = "^0.208.0"; "@opentelemetry/exporter-trace-otlp-http" = "^0.208.0";
        "@opentelemetry/instrumentation-http" = "^0.208.0"; "@opentelemetry/otlp-exporter-base" = "^0.208.0";
        "@opentelemetry/resources" = "^2.2.0"; "@opentelemetry/sdk-logs" = "^0.208.0";
        "@opentelemetry/sdk-metrics" = "^2.2.0"; "@opentelemetry/sdk-node" = "^0.208.0";
        "@opentelemetry/sdk-trace-base" = "^2.2.0"; "@opentelemetry/sdk-trace-node" = "^2.2.0";
        "@opentelemetry/semantic-conventions" = "^1.38.0"; "pg" = "^8.13.1"; "mongodb" = "^6.12.0";
        "redis" = "^4.7.0"; "mysql2" = "^3.11.5"
    }

    foreach ($d in $deps.Keys) {
        if (-not $pkg.dependencies.PSObject.Properties[$d]) {
            if (-not $pkg.dependencies) { $pkg | Add-Member -MemberType NoteProperty -Name "dependencies" -Value (New-Object PSObject) }
            $pkg.dependencies | Add-Member -MemberType NoteProperty -Name $d -Value $deps[$d]
        }
    }
    
    $pkg | ConvertTo-Json -Depth 10 | Set-Content $PKG_PATH
    
    Push-Location $CLI_DIST
    if (Test-Path "node_modules") { 
        Write-Host "Removing old node_modules..." -ForegroundColor Gray
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue 
    }
    npm install --registry=$NPM_REGISTRY
    Pop-Location
}

# --- 8) Setup Local Packages ---
Write-Host "Setting up package resolution..." -ForegroundColor Gray
$PKG_MAP = @{ "cli" = "blackbox-cli"; "core" = "blackbox-cli-core"; "test-utils" = "blackbox-cli-test-utils"; "vscode-ide-companion" = "blackbox-cli-vscode-ide-companion" }

foreach ($p in @("core", "test-utils", "vscode-ide-companion")) {
    $PKG_ROOT = Join-Path $env:BLACKBOX_INSTALL_DIR "packages\$p"
    $PKG_DIST = Join-Path $PKG_ROOT "dist"
    
    # Create package.json for core/dist etc if missing
    if ((Test-Path $PKG_DIST) -and (-not (Test-Path (Join-Path $PKG_DIST "package.json")))) {
        $json = @{ name = "@blackbox_ai/" + $PKG_MAP[$p]; version = $VERSION; type = "module"; main = "index.js" } | ConvertTo-Json
        Set-Content -Path (Join-Path $PKG_DIST "package.json") -Value $json -Encoding UTF8
    }
    
    # Link package node_modules to CLI node_modules
    foreach ($dir in @($PKG_ROOT, $PKG_DIST)) {
        if (Test-Path $dir) {
            $NM = Join-Path $dir "node_modules"
            if (Test-Path $NM) { Remove-Item -Path $NM -Recurse -Force -ErrorAction SilentlyContinue }
            try { New-Item -ItemType SymbolicLink -Path $NM -Target (Join-Path $CLI_DIST "node_modules") -Force -ErrorAction Stop | Out-Null }
            catch { try { cmd /c mklink /J "$NM" "$(Join-Path $CLI_DIST "node_modules")" 2>&1 | Out-Null } catch {} }
        }
    }
}

# --- 9) Setup Bin ---
if (-not (Test-Path $env:BLACKBOX_BIN_DIR)) { New-Item -ItemType Directory -Path $env:BLACKBOX_BIN_DIR -Force | Out-Null }
$WRAPPER_CMD = Join-Path $env:BLACKBOX_BIN_DIR "blackbox.cmd"
$WRAPPER_MJS = Join-Path $env:BLACKBOX_BIN_DIR "blackbox.mjs"

$cmdContent = "@echo off`r`nsetlocal`r`nset `"BLACKBOX_INSTALL_DIR=" + $env:BLACKBOX_INSTALL_DIR + "`"`r`nset `"BLACKBOX_CLI_V2_ROOT=%BLACKBOX_INSTALL_DIR%`"`r`nnode `"%~dp0blackbox.mjs`" %*"
Set-Content -Path $WRAPPER_CMD -Value $cmdContent -Encoding ASCII

$mjsLines = @(
    '#!/usr/bin/env node', 'import { pathToFileURL } from "url";', 'import { join } from "path";', 'import { existsSync } from "fs";',
    'const installDir = process.env.BLACKBOX_INSTALL_DIR || join(process.env.USERPROFILE || process.env.HOME, ".blackbox-cli-v2");',
    'const cliEntry = join(installDir, "packages", "cli", "dist", "index.js");',
    'if (!existsSync(cliEntry)) { console.error("Not found"); process.exit(1); }',
    'process.env.BLACKBOX_CLI_V2_ROOT = installDir;',
    'try { await import(pathToFileURL(cliEntry).href); } catch (e) { console.error(e.message); process.exit(1); }'
)
Set-Content -Path $WRAPPER_MJS -Value ($mjsLines -join "`n") -Encoding UTF8

# --- 13) Check PATH and add to environment if needed ---
$CURRENT_PATH = $env:PATH
Write-Host ""
Write-Host "Ensuring $env:BLACKBOX_BIN_DIR is at the top of your PATH (highest priority)..." -ForegroundColor Green

try {
    # Get current user PATH
    $currentUserPath = [Environment]::GetEnvironmentVariable('PATH', 'User')

    # Remove the bin directory from user PATH if it exists anywhere
    if ($currentUserPath -like "*$env:BLACKBOX_BIN_DIR*") {
        $pathEntries = $currentUserPath -split ';' | Where-Object { $_ -and $_ -ne $env:BLACKBOX_BIN_DIR }
        $currentUserPath = $pathEntries -join ';'
    }

    # Prepend to user PATH (highest priority)
    $newUserPath = "$env:BLACKBOX_BIN_DIR;$currentUserPath"
    [Environment]::SetEnvironmentVariable('PATH', $newUserPath, 'User')

    # Add BLACKBOX_INSTALL_DIR to user environment
    [Environment]::SetEnvironmentVariable('BLACKBOX_INSTALL_DIR', $env:BLACKBOX_INSTALL_DIR, 'User')

    # Remove from current session PATH if present, then prepend (highest priority)
    $sessionPathEntries = $env:PATH -split ';' | Where-Object { $_ -and $_ -ne $env:BLACKBOX_BIN_DIR }
    $env:PATH = "$env:BLACKBOX_BIN_DIR;" + ($sessionPathEntries -join ';')

    Write-Host "PATH successfully updated!" -ForegroundColor Green
    Write-Host "- Updated user environment variables" -ForegroundColor Green
    Write-Host "- Updated current session PATH" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Error: Failed to update PATH automatically. $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add manually using one of these methods:" -ForegroundColor DarkYellow
    Write-Host "For user PATH (no admin required):" -ForegroundColor DarkYellow
    Write-Host "    `$userPath = [Environment]::GetEnvironmentVariable('PATH', 'User')" -ForegroundColor Cyan
    Write-Host "    `$userPath = `$userPath -replace ';$env:BLACKBOX_BIN_DIR', '' -replace '$env:BLACKBOX_BIN_DIR;', ''" -ForegroundColor Cyan
    Write-Host "    [Environment]::SetEnvironmentVariable('PATH', '$env:BLACKBOX_BIN_DIR;' + `$userPath, 'User')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "For this session only:" -ForegroundColor DarkYellow
    Write-Host "    `$env:PATH = '$env:BLACKBOX_BIN_DIR;' + (`$env:PATH -split ';' | Where-Object { `$_ -ne '$env:BLACKBOX_BIN_DIR' }) -join ';'" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "[OK] Installed successfully! Please run 'blackbox' to get started." -ForegroundColor Green