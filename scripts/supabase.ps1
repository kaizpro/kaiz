$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $PSScriptRoot
$env:SUPABASE_HOME = Join-Path $workspace "work\supabase-home"
New-Item -ItemType Directory -Force -Path $env:SUPABASE_HOME | Out-Null
$supabaseArguments = @($args)

& npx.cmd --no-install supabase @supabaseArguments
exit $LASTEXITCODE
