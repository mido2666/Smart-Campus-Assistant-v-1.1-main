$extensions = @(".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".html", ".json", ".md", ".yml", ".yaml", ".prisma", ".sql")
$excludeDirs = @("node_modules", "dist", ".git", ".agent", "uploads", "coverage", "build", ".gemini")
$excludeFiles = @("package-lock.json", "yarn.lock", "pnpm-lock.yaml", "test_output.txt", "project-export.json")

$files = Get-ChildItem -Recurse -File | Where-Object { 
    $ext = $_.Extension.ToLower();
    $path = $_.FullName;
    $name = $_.Name;
    
    # Check excluded directories
    $shouldExclude = $false;
    foreach ($dir in $excludeDirs) {
        if ($path -match "[\\/]$([Regex]::Escape($dir))[\\/]") { $shouldExclude = $true; break }
    }
    if ($shouldExclude) { return $false }

    # Check excluded files
    if ($excludeFiles -contains $name) { return $false }
    
    # Check extension
    return $extensions -contains $ext
}

$stats = @{}
$totalLines = 0
$fileCount = 0

foreach ($file in $files) {
    try {
        $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        if ($null -eq $lines) { $lines = 0 }
        $ext = $file.Extension.ToLower()
        if (-not $stats.ContainsKey($ext)) { $stats[$ext] = 0 }
        $stats[$ext] += $lines
        $totalLines += $lines
        $fileCount++
    } catch {
        Write-Host "Error reading $($file.FullName)"
    }
}

Write-Output "----------------------------------------"
Write-Output "Codebase Line Count Breakdown"
Write-Output "----------------------------------------"
$stats.GetEnumerator() | Sort-Object Value -Descending | Format-Table -AutoSize

Write-Output "----------------------------------------"
Write-Output "Total Files: $fileCount"
Write-Output "Total Lines: $totalLines"
Write-Output "----------------------------------------"
