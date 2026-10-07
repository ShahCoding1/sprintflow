$schemaPath = Join-Path $PSScriptRoot "..\prisma\schema.prisma"

$lines = Get-Content -Path $schemaPath

$taskStarts = @()

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*model Task \{\s*$') {
        $taskStarts += $i
    }
}

if ($taskStarts.Count -lt 2) {
    Write-Host "No duplicate Task model found."
    exit 0
}

$duplicateStart = $taskStarts[1]

$depth = 0
$duplicateEnd = -1

for ($i = $duplicateStart; $i -lt $lines.Count; $i++) {
    $openCount = ([regex]::Matches($lines[$i], '\{')).Count
    $closeCount = ([regex]::Matches($lines[$i], '\}')).Count

    $depth += $openCount
    $depth -= $closeCount

    if ($depth -eq 0 -and $i -gt $duplicateStart) {
        $duplicateEnd = $i
        break
    }
}

if ($duplicateEnd -eq -1) {
    throw "Unable to safely determine the end of the duplicate Task model."
}

$newLines = @()

if ($duplicateStart -gt 0) {
    $newLines += $lines[0..($duplicateStart - 1)]
}

if ($duplicateEnd -lt ($lines.Count - 1)) {
    $newLines += $lines[($duplicateEnd + 1)..($lines.Count - 1)]
}

Set-Content -Path $schemaPath -Value $newLines -Encoding UTF8

Write-Host ""
Write-Host "Duplicate Task model removed successfully." -ForegroundColor Green
Write-Host "Remaining Task declarations:"

Select-String -Path $schemaPath -Pattern '^model Task \{' | ForEach-Object {
    Write-Host "  Line $($_.LineNumber)"
}