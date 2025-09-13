# Script para reparar migrações do Supabase
$migrations = @(
    "20250116000001",
    "20250909102827",
    "20250909181305",
    "20250909203720",
    "20250911145104",
    "20250911200000",
    "20250912000001",
    "20250912100000",
    "20250912110000",
    "20250912120000"
)

foreach ($migration in $migrations) {
    Write-Host "Reparando migração: $migration"
    npx supabase migration repair --status applied $migration
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao reparar migração: $migration" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Todas as migrações foram reparadas com sucesso!" -ForegroundColor Green