$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$bundleDir = Join-Path $repoRoot 'output/aws-api'
$zipPath = Join-Path $repoRoot 'output/pulse-api.zip'
New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null
Push-Location $repoRoot
try {
    & node 'node_modules/esbuild/bin/esbuild' 'server/src/lambda.ts' --bundle --platform=node --target=node24 --format=cjs --outfile=output/aws-api/index.cjs
    if ($LASTEXITCODE -ne 0) { throw 'API bundle failed' }
    Compress-Archive -LiteralPath (Join-Path $bundleDir 'index.cjs') -DestinationPath $zipPath -Force
    $sha = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Output "ZIP: $zipPath"
    Write-Output "S3 key: api/$sha.zip"
    Write-Output 'Upload under this immutable key, then update ApiCodeKey through a CloudFormation change set.'
} finally {
    Pop-Location
}
