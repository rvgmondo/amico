# Starts the project-local (portable) PostgreSQL server.
# Usage: pwsh scripts/db-start.ps1 [-Port 5433]
param([int]$Port = 5433)
$ErrorActionPreference = 'Stop'
$proj = Split-Path -Parent $PSScriptRoot
$bin  = Join-Path $proj 'vendor\pgsql\bin'
$data = Join-Path $proj '.pgdata'
$log  = Join-Path $data 'server.log'

if (-not (Test-Path (Join-Path $bin 'pg_ctl.exe'))) {
  throw "Postgres binaries not found at $bin. Run scripts/db-setup.ps1 first."
}

# Already running?
& (Join-Path $bin 'pg_ctl.exe') -D $data status *> $null
if ($LASTEXITCODE -eq 0) { Write-Host "PostgreSQL already running (data: $data)."; return }

Write-Host "Starting PostgreSQL on port $Port ..."
& (Join-Path $bin 'pg_ctl.exe') -D $data -o ("-p {0}" -f $Port) -l $log -w start
Write-Host "Started. Log: $log"
