param(
  [string]$Destination = "postavka-alwaysdata.zip"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$archivePath = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Destination))
$outputPath = Join-Path $projectRoot ".output"
$starterPath = Join-Path $projectRoot "deploy/alwaysdata/start.mjs"

Push-Location $projectRoot
try {
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw "Production build failed" }
  if (-not (Test-Path (Join-Path $outputPath "server/index.mjs"))) { throw "Nitro server entry is missing" }

  $unexpected = Get-ChildItem $outputPath -Recurse -File | Where-Object {
    $_.Name -match '(^\.env|\.sqlite(?:-wal|-shm)?$|\.pem$|\.key$)'
  }
  if ($unexpected) { throw "Deployment output contains a local database or secret file" }

  $stagingPath = Join-Path ([IO.Path]::GetTempPath()) ("postavka-deploy-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $stagingPath | Out-Null
  try {
    Copy-Item -LiteralPath $outputPath -Destination (Join-Path $stagingPath ".output") -Recurse
    Copy-Item -LiteralPath $starterPath -Destination (Join-Path $stagingPath "start.mjs")
    New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($archivePath)) -Force | Out-Null
    if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath }
    [IO.Compression.ZipFile]::CreateFromDirectory($stagingPath, $archivePath)
  } finally {
    $resolvedStaging = [IO.Path]::GetFullPath($stagingPath)
    $resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($resolvedStaging.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolvedStaging)) {
      Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
    }
  }
  Write-Output "Package: $archivePath"
} finally {
  Pop-Location
}
