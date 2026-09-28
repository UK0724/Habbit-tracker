param(
    [string]$SdkPath = $env:ANDROID_HOME,
    [string]$JavaPath = $env:JAVA_HOME,
    [ValidateSet('preview', 'production')][string]$Profile = 'preview',
    # Production APK for sideloading on a test phone; Play uploads still use the .aab.
    [switch]$Apk
)

$ErrorActionPreference = 'Stop'
$mobileRoot = Split-Path $PSScriptRoot -Parent
if (-not $SdkPath -or -not (Test-Path -LiteralPath $SdkPath)) {
    throw 'Set ANDROID_HOME or pass -SdkPath with an installed Android SDK.'
}
if (-not $JavaPath -or -not (Test-Path -LiteralPath (Join-Path $JavaPath 'bin/java.exe'))) {
    throw 'Set JAVA_HOME or pass -JavaPath with a JDK 17 installation.'
}
if (-not (Test-Path -LiteralPath (Join-Path $mobileRoot 'credentials.json'))) {
    throw 'Download the Android signing credentials with eas credentials first. Never commit credentials.json or the keystore.'
}

$env:JAVA_HOME = (Resolve-Path -LiteralPath $JavaPath).Path
$env:ANDROID_HOME = (Resolve-Path -LiteralPath $SdkPath).Path
$env:EAS_BUILD_PROFILE = $Profile
$env:NODE_ENV = 'production'
$env:CI = '1'
$buildProfile = (Get-Content (Join-Path $mobileRoot 'eas.json') -Raw | ConvertFrom-Json).build.$Profile
if ($buildProfile.env) {
    foreach ($entry in $buildProfile.env.PSObject.Properties) {
        [Environment]::SetEnvironmentVariable($entry.Name, [string]$entry.Value, 'Process')
    }
}
if ($Profile -eq 'production') {
    $env:EXPO_PUBLIC_ALLOW_LAN_HTTP = 'false'
    if ($env:EXPO_PUBLIC_API_URL -notmatch '^https://') {
        throw 'Production builds require EXPO_PUBLIC_API_URL with the deployed HTTPS API URL.'
    }
}

# Metro caches transforms with EXPO_PUBLIC_* values inlined, so an unchanged
# file would keep the previous profile's API URL. Expo ignores --reset-cache
# when CI is set, so clear the cache directory itself.
$metroCache = Join-Path ([IO.Path]::GetTempPath()) 'metro-cache'
if (Test-Path -LiteralPath $metroCache) { Remove-Item -LiteralPath $metroCache -Recurse -Force }

Push-Location $mobileRoot
try {
    & node scripts/expo.cjs prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Android prebuild failed.' }

    $gradlePath = Join-Path $mobileRoot 'android/app/build.gradle'
    $gradle = Get-Content -LiteralPath $gradlePath -Raw
    # React Native makes the entry relative to mobile/, while Expo's Metro
    # server root is the workspace. An absolute entry works for either root.
    $packagerArgs = "    extraPackagerArgs = ['--max-workers', '1', '--entry-file', entryFile.get().asFile.absolutePath]"
    if ($gradle -match '(?m)^\s*extraPackagerArgs\s*=') {
        $gradle = $gradle -replace '(?m)^\s*extraPackagerArgs\s*=.*$', $packagerArgs
    } else {
        $gradle = $gradle.Replace('bundleCommand = "export:embed"', 'bundleCommand = "export:embed"' + "`n$packagerArgs")
    }
    if ($gradle -notmatch 'def pulseSigning =') {
        $signing = 'def pulseSigning = new groovy.json.JsonSlurper().parse(rootProject.file("../credentials.json")).android.keystore'
        $gradle = $gradle.Replace('android {', "$signing`n`nandroid {")
        $releaseSigning = @'
signingConfigs {
        release {
            storeFile rootProject.file('../' + pulseSigning.keystorePath)
            storePassword pulseSigning.keystorePassword
            keyAlias pulseSigning.keyAlias
            keyPassword pulseSigning.keyPassword
        }
'@
        $gradle = $gradle.Replace('signingConfigs {', $releaseSigning)
    }
    $gradle = $gradle -replace 'signingConfig signingConfigs.debug(\s+shrinkResources)', 'signingConfig signingConfigs.release$1'
    if ($gradle -notmatch 'signingConfig signingConfigs.release') {
        throw 'Could not configure release signing. Review the generated Gradle template.'
    }
    if ($gradle -notmatch 'pulseWorkspaceBundleInputs') {
        # Gradle normally excludes node_modules and workspace siblings. A patch
        # or shared-code change must invalidate the JS bundle in the next APK.
        $gradle += @'

// pulseWorkspaceBundleInputs
tasks.configureEach { task ->
    if (task.name == 'createBundleReleaseJsAndAssets') {
        task.inputs.files(rootProject.fileTree('../../patches') { include '**/*.patch' })
        task.inputs.files(rootProject.fileTree('../../shared/src') { include '**/*' })
        task.inputs.file(rootProject.file('../../package-lock.json'))
    }
}
'@
    }
    Set-Content -LiteralPath $gradlePath -Value $gradle
    $sdkForJava = $env:ANDROID_HOME.Replace('\', '/')
    Set-Content -LiteralPath 'android/local.properties' -Value "sdk.dir=$sdkForJava"

    # Google Play accepts only app bundles; preview builds stay sideloadable APKs.
    $bundle = $Profile -eq 'production' -and -not $Apk
    $task = if ($bundle) { ':app:bundleRelease' } else { ':app:assembleRelease' }
    & ./android/gradlew.bat -p android $task --max-workers=2 '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m' --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
    $bundleFile = Join-Path $mobileRoot 'android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle'
    $bundleText = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($bundleFile))
    if ($env:EXPO_PUBLIC_API_URL -and -not $bundleText.Contains($env:EXPO_PUBLIC_API_URL)) {
        throw "Bundle does not contain EXPO_PUBLIC_API_URL ($env:EXPO_PUBLIC_API_URL); a stale Metro cache was used."
    }
    & node scripts/verify-bundled-decoder.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Android bundle verification failed.' }
    $artifactPath = if ($bundle) {
        Join-Path $mobileRoot 'android/app/build/outputs/bundle/release/app-release.aab'
    } else {
        Join-Path $mobileRoot 'android/app/build/outputs/apk/release/app-release.apk'
    }
    & (Join-Path $PSScriptRoot 'verify-apk.ps1') -ApkPath $artifactPath
    Write-Output $artifactPath
} finally {
    Pop-Location
}
