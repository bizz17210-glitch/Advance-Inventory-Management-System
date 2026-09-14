<#
.SYNOPSIS
    Detects and removes unused imports/variables (TS6133) using `tsc --noEmit`.

.DESCRIPTION
    1. Runs `npx tsc --noEmit` in the current directory.
    2. Parses TS6133 ("declared but its value is never read") errors.
    3. For each unused identifier found in an import statement, removes just
       that identifier from the import (or the whole line if it becomes empty).
    4. For unused local variables/consts, it does NOT auto-delete the line
       (too risky to guess intent) — it just prints them in a report for you
       to review manually.
    5. Creates a timestamped backup of every file it touches before editing.

.NOTES
    - Run this from your project root (e.g. app/client).
    - Requires Node/npm + typescript installed (npx tsc must work).
    - ALWAYS commit/backup your code before running this.
#>

param(
    [string]$ProjectPath = ".",
    [switch]$DryRun   # if set, only shows what WOULD be changed, doesn't edit files
)

Set-Location $ProjectPath

Write-Host "Running tsc --noEmit ... (this may take a bit)" -ForegroundColor Cyan
$tscOutput = npx tsc --noEmit 2>&1 | Out-String

# Regex to capture TS6133 lines:
# Example: src/pages/Foo.tsx:12:34 - error TS6133: 'Bar' is declared but its value is never read.
$pattern = "([^\s:]+\.tsx?):(\d+):(\d+) - error TS6133: '([^']+)' is declared but its value is never read\."
$matches = [regex]::Matches($tscOutput, $pattern)

if ($matches.Count -eq 0) {
    Write-Host "No TS6133 (unused) errors found. Nothing to do." -ForegroundColor Green
    return
}

Write-Host "Found $($matches.Count) unused-identifier errors." -ForegroundColor Yellow

# Group by file so we can process each file once, safely, from bottom to top (avoid line-shift issues)
$byFile = @{}
foreach ($m in $matches) {
    $file = $m.Groups[1].Value
    $line = [int]$m.Groups[2].Value
    $name = $m.Groups[4].Value
    if (-not $byFile.ContainsKey($file)) { $byFile[$file] = @() }
    $byFile[$file] += [PSCustomObject]@{ Line = $line; Name = $name }
}

$backupDir = "unused-code-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$reportLines = @()
$reportLines += "=== Unused Code Report ($(Get-Date)) ==="
$reportLines += ""

foreach ($file in $byFile.Keys) {
    if (-not (Test-Path $file)) {
        Write-Host "  Skipping (not found): $file" -ForegroundColor DarkYellow
        continue
    }

    $content = Get-Content $file
    $entries = $byFile[$file] | Sort-Object Line -Descending  # bottom-to-top to keep line numbers valid
    $fileChanged = $false
    $manualReview = @()

    foreach ($entry in $entries) {
        $idx = $entry.Line - 1
        if ($idx -lt 0 -or $idx -ge $content.Count) { continue }

        $lineText = $content[$idx]
        $name = $entry.Name

        # Case 1: Line is part of an import statement (single-line or destructured)
        if ($lineText -match "^\s*import\s") {
            $newLine = Remove-ImportIdentifier -Line $lineText -Identifier $name
            if ($newLine -ne $lineText) {
                if ($newLine.Trim() -eq "" -or $newLine -match "^\s*import\s*\{\s*\}\s*from") {
                    Write-Host "  [$file] Removing empty import line at $($entry.Line): $lineText" -ForegroundColor Gray
                    $content = $content[0..($idx-1)] + $content[($idx+1)..($content.Count-1)]
                } else {
                    Write-Host "  [$file] Line $($entry.Line): removed '$name' from import" -ForegroundColor Green
                    $content[$idx] = $newLine
                }
                $fileChanged = $true
                continue
            }
        }

        # Case 2: multi-line destructured import — identifier on its own line, e.g. "  Foo,"
        if ($lineText -match "^\s*$([regex]::Escape($name))\s*,?\s*$") {
            Write-Host "  [$file] Removing destructured import line $($entry.Line): $lineText" -ForegroundColor Green
            $content = $content[0..($idx-1)] + $content[($idx+1)..($content.Count-1)]
            $fileChanged = $true
            continue
        }

        # Case 3: everything else (local const/let/function/param) — too risky to auto-delete
        $manualReview += "  Line $($entry.Line): '$name' -> $($lineText.Trim())"
    }

    if ($manualReview.Count -gt 0) {
        $reportLines += "FILE: $file (manual review needed)"
        $reportLines += $manualReview
        $reportLines += ""
    }

    if ($fileChanged -and -not $DryRun) {
        # backup original before overwrite
        $backupPath = Join-Path $backupDir ($file -replace '[\\/]', '_')
        Copy-Item $file $backupPath -Force
        Set-Content -Path $file -Value $content
    }
}

$reportPath = "unused-code-report.txt"
$reportLines | Set-Content $reportPath
Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host "  - Auto-removed unused imports where safe." -ForegroundColor Cyan
Write-Host "  - Manual-review items (unused local vars/functions/params) saved to: $reportPath" -ForegroundColor Cyan
if (-not $DryRun) {
    Write-Host "  - Backups of edited files saved to: $backupDir" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Now run 'npx tsc --noEmit' again to confirm and catch anything remaining." -ForegroundColor Yellow

function Remove-ImportIdentifier {
    param([string]$Line, [string]$Identifier)

    # default import: import Foo from "..."; -> can't safely strip without breaking, skip
    if ($Line -match "^\s*import\s+$([regex]::Escape($Identifier))\s+from") {
        return $Line  # leave default imports alone, needs manual check
    }

    # named import inside braces on same line: import { A, B, C } from "..."
    if ($Line -match "\{([^}]*)\}") {
        $inner = $Matches[1]
        $parts = $inner -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
        $newParts = $parts | Where-Object { $_ -ne $Identifier -and $_ -notmatch "^$([regex]::Escape($Identifier))\s+as\s+" }
        if ($newParts.Count -eq $parts.Count) {
            return $Line  # identifier not found in this brace group, leave unchanged
        }
        $newInner = " " + ($newParts -join ", ") + " "
        if ($newParts.Count -eq 0) { $newInner = "" }
        return ($Line -replace "\{[^}]*\}", "{$newInner}")
    }

    return $Line
}