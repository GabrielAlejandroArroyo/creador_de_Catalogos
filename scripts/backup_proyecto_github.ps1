# Resguarda un proyecto en D:\proyectos github ANTES de controlarlo con Git / subirlo.
# Uso:
#   .\backup_proyecto_github.ps1
#   .\backup_proyecto_github.ps1 -SourcePath "D:\mi_proyecto"

param(
  [string]$SourcePath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$BackupRoot = "D:\proyectos github"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourcePath)) {
  throw "No existe el proyecto: $SourcePath"
}

$projectName = Split-Path $SourcePath -Leaf
$dest = Join-Path $BackupRoot $projectName

Write-Host "========================================"
Write-Host " Resguardo previo a GitHub"
Write-Host "========================================"
Write-Host " Origen : $SourcePath"
Write-Host " Destino: $dest"
Write-Host ""

New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

robocopy $SourcePath $dest /E `
  /XD node_modules .venv .angular dist __pycache__ .git `
  /XF *.pyc `
  /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

$code = $LASTEXITCODE
if ($code -ge 8) {
  throw "Falló el resguardo (robocopy exit $code)"
}

Write-Host "Resguardo listo en: $dest"
Write-Host "Ahora podés inicializar Git y subir a GitHub desde el proyecto."
exit 0
