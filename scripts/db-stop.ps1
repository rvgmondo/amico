# Stops the project-local (portable) PostgreSQL server.
# Usage: pwsh scripts/db-stop.ps1
$ErrorActionPreference = 'Stop'
$proj = Split-Path -Parent $PSScriptRoot
$bin  = Join-Path $proj 'vendor\pgsql\bin'
$data = Join-Path $proj '.pgdata'

if (-not (Test-Path (Join-Path $bin 'pg_ctl.exe'))) {
  throw "Postgres binaries not found at $bin."
}
& (Join-Path $bin 'pg_ctl.exe') -D $data -m fast stop
Write-Host "PostgreSQL stopped."
