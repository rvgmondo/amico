# One-time setup for the project-local (portable) PostgreSQL instance.
# Copies the Postgres binaries into vendor/pgsql (if needed), initializes the
# cluster in .pgdata, starts the server, and creates the application database.
#
# Usage:
#   pwsh scripts/db-setup.ps1 -BinariesSource "C:\path\to\extracted\pgsql" [-Port 5433] [-DbName amico]
#
# After first run the binaries live inside the project, so -BinariesSource is
# only required the very first time.
param(
  [string]$BinariesSource = '',
  [int]$Port = 5433,
  [string]$DbName = 'amico'
)
$ErrorActionPreference = 'Stop'
$proj   = Split-Path -Parent $PSScriptRoot
$vendor = Join-Path $proj 'vendor\pgsql'
$bin    = Join-Path $vendor 'bin'
$data   = Join-Path $proj '.pgdata'

# 1. Ensure binaries are present inside the project.
if (-not (Test-Path (Join-Path $bin 'initdb.exe'))) {
  if (-not $BinariesSource -or -not (Test-Path (Join-Path $BinariesSource 'bin\initdb.exe'))) {
    throw "Postgres binaries not in vendor/pgsql and no valid -BinariesSource given."
  }
  New-Item -ItemType Directory -Force (Join-Path $proj 'vendor') | Out-Null
  Write-Host "Copying PostgreSQL binaries into vendor/pgsql ..."
  robocopy $BinariesSource $vendor /E /NFL /NDL /NJH /NJS /NC /NS /NP > $null
  Write-Host ("  robocopy exit {0} (0-7 = ok)" -f $LASTEXITCODE)
}

# 2. Initialize the cluster if it does not exist yet.
if (-not (Test-Path (Join-Path $data 'PG_VERSION'))) {
  Write-Host "Initializing database cluster in .pgdata ..."
  $pwfile = Join-Path $env:TEMP ("pgpw_{0}.txt" -f $PID)
  Set-Content -Path $pwfile -Value 'postgres' -NoNewline -Encoding ascii
  & (Join-Path $bin 'initdb.exe') -D $data -U postgres -A trust -E UTF8 "--pwfile=$pwfile"
  Remove-Item -LiteralPath $pwfile -Force
} else {
  Write-Host "Cluster already initialized."
}

# 3. Start the server.
& (Join-Path $PSScriptRoot 'db-start.ps1') -Port $Port

# 4. Create the application database if missing.
$exists = ([string](& (Join-Path $bin 'psql.exe') -h 127.0.0.1 -p $Port -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'")).Trim()
if ($exists -ne '1') {
  Write-Host "Creating database '$DbName' ..."
  & (Join-Path $bin 'createdb.exe') -h 127.0.0.1 -p $Port -U postgres $DbName
} else {
  Write-Host "Database '$DbName' already exists."
}

Write-Host "=== Verification ==="
& (Join-Path $bin 'psql.exe') -h 127.0.0.1 -p $Port -U postgres -d $DbName -c "SELECT version();"
Write-Host "Done. Connection: postgresql://postgres:postgres@127.0.0.1:$Port/$DbName"
