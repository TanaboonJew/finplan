param(
  [int]$DelaySeconds,
  [string]$Dir,
  [string]$PromptFile,
  [string]$OutLog,
  [string]$ErrLog,
  [string]$Title,
  [string]$PidFile
)
Start-Sleep -Seconds $DelaySeconds
$raw = (Get-Content $PromptFile -Raw).Trim()
$p = Start-Process -FilePath "C:\Users\root\AppData\Roaming\npm\opencode.cmd" `
  -ArgumentList @('run', ('"' + $raw + '"'), '--dir', $Dir, '--title', ('"' + $Title + '"'), '--auto') `
  -WorkingDirectory $Dir `
  -RedirectStandardOutput $OutLog `
  -RedirectStandardError $ErrLog `
  -PassThru -WindowStyle Hidden
$p.Id | Set-Content $PidFile
