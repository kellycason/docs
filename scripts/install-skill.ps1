[CmdletBinding()]
param(
    [ValidateSet('Workspace', 'Global')]
    [string]$Scope = 'Workspace',

    [string]$WorkspacePath = (Get-Location).Path,

    [string]$Version = 'latest',

    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$skillName = 'power-pages-code-site'
$assetName = "$skillName.zip"

if ($Version -eq 'latest') {
    $downloadUrl = "https://github.com/kellycason/docs/releases/latest/download/$assetName"
} elseif ($Version -match '^power-pages-code-site-v\d+\.\d+\.\d+$') {
    $downloadUrl = "https://github.com/kellycason/docs/releases/download/$Version/$assetName"
} else {
    throw "Version must be 'latest' or a tag such as power-pages-code-site-v1.0.0."
}

$skillsRoot = if ($Scope -eq 'Global') {
    Join-Path $HOME '.copilot\skills'
} else {
    Join-Path ([System.IO.Path]::GetFullPath($WorkspacePath)) '.github\skills'
}
$target = Join-Path $skillsRoot $skillName

if ((Test-Path $target) -and -not $Force) {
    throw "The skill already exists at '$target'. Rerun with -Force to update it."
}

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("power-pages-skill-" + [guid]::NewGuid())
$archivePath = Join-Path $temporaryRoot $assetName
$extractPath = Join-Path $temporaryRoot 'extract'
$stagingPath = "$target.installing-$PID"

try {
    New-Item -ItemType Directory -Path $temporaryRoot, $extractPath -Force | Out-Null
    Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath
    Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force

    $source = Join-Path $extractPath $skillName
    if (-not (Test-Path (Join-Path $source 'SKILL.md'))) {
        $skillFile = Get-ChildItem $extractPath -Filter SKILL.md -Recurse |
            Where-Object { $_.Directory.Name -eq $skillName } |
            Select-Object -First 1
        if (-not $skillFile) {
            throw 'The release archive does not contain the expected skill package.'
        }
        $source = $skillFile.Directory.FullName
    }

    New-Item -ItemType Directory -Path $skillsRoot -Force | Out-Null
    if (Test-Path $stagingPath) {
        Remove-Item $stagingPath -Recurse -Force
    }
    Copy-Item $source $stagingPath -Recurse -Force

    if (-not (Test-Path (Join-Path $stagingPath 'SKILL.md')) -or
        -not (Test-Path (Join-Path $stagingPath 'references\power-pages-code-site-scaffolding-guide.md'))) {
        throw 'The staged skill failed package validation.'
    }

    if (Test-Path $target) {
        Remove-Item $target -Recurse -Force
    }
    Move-Item $stagingPath $target

    $installedVersion = (Get-Content (Join-Path $target 'VERSION') -Raw).Trim()
    Write-Host "Installed $skillName $installedVersion to $target"
} finally {
    if (Test-Path $stagingPath) {
        Remove-Item $stagingPath -Recurse -Force
    }
    if (Test-Path $temporaryRoot) {
        Remove-Item $temporaryRoot -Recurse -Force
    }
}
