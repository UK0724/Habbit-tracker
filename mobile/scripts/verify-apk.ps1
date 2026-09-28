param([Parameter(Mandatory = $true)][string]$ApkPath)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ApkPath).Path)
try {
    $entries = @($archive.Entries | ForEach-Object { $_.FullName })
    # App bundles (.aab) keep native libraries under base/.
    $prefix = if ($entries -contains 'BundleConfig.pb') { 'base/' } else { '' }
    $architectures = @($entries | Where-Object { $_ -match "^$($prefix)lib/[^/]+/.+\.so$" } | ForEach-Object { $_.Substring($prefix.Length).Split('/')[1] } | Sort-Object -Unique)
    if (-not $architectures.Count) { throw 'APK has no native libraries.' }
    foreach ($architecture in $architectures) {
        foreach ($library in @('libreactnative.so', 'libhermes.so', 'libexpo-modules-core.so', 'libexpo-av.so')) {
            if ($entries -notcontains "$($prefix)lib/$architecture/$library") {
                throw "APK advertises $architecture but is missing $library. Build all packaged architectures."
            }
        }
    }
    Write-Output "APK native libraries are complete for: $($architectures -join ', ')"
} finally {
    $archive.Dispose()
}
