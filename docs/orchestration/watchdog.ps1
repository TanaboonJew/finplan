param(
  [string]$Dir,
  [string]$PromptFile,
  [string]$OutLog,
  [string]$ErrLog,
  [string]$Title,
  [string]$PidFile,
  [string]$MarkerFile
)
$maxAttempts = 2
$attempts = 0
while ($attempts -lt $maxAttempts) {
  $attempts++
  $deadline = (Get-Date).AddMinutes(120)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 600
    $pidVal = Get-Content $PidFile -ErrorAction SilentlyContinue
    $alive = $false
    if ($pidVal) {
      $p = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
      if ($p) { $alive = $true }
    }
    if (-not $alive) { break }
    if ((Test-Path $OutLog) -and ((Get-Item $OutLog).Length -gt 0)) {
      return
    }
  }
  $outLen = 0
  if (Test-Path $OutLog) { $outLen = (Get-Item $OutLog).Length }
  if ($outLen -gt 0) { return }
  if ($attempts -ge $maxAttempts) { break }
  Start-Sleep -Seconds 3600
  $raw = (Get-Content $PromptFile -Raw).Trim()
  $p = Start-Process -FilePath "C:\Users\root\AppData\Roaming\npm\opencode.cmd" `
    -ArgumentList @('run', ('"' + $raw + '"'), '--dir', $Dir, '--title', ('"' + $Title + '"'), '--auto') `
    -WorkingDirectory $Dir `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -PassThru -WindowStyle Hidden
  $p.Id | Set-Content $PidFile
}
if (Test-Path $MarkerFile) { Remove-Item $MarkerFile -Force }
New-Item -ItemType File -Path $MarkerFile -Force | Out-Null
