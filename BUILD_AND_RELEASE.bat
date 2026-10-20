@echo off
:: ============================================================================
::  KONEXUS ERP - BUILD MANUAL (LEGADO)
::
::  O processo oficial de release agora e o GitHub Actions:
::    .github/workflows/release.yml
::
::  Consulte docs/RELEASES.md. Este arquivo nao publica mais nada
::  automaticamente e existe apenas como fallback de build local.
:: ============================================================================

echo ========================================================
echo   Konexus ERP - Build manual (fallback)
echo ========================================================
echo.
echo O processo oficial e publicado pelo GitHub Actions ao
echo criar uma release com tag vX.Y.Z.
echo.
echo Para gerar o instalador localmente:
echo   1. npm ci --legacy-peer-deps --no-audit --no-fund
echo   2. set CI=false
echo   3. npm run electron:build -- --win nsis --publish never
echo   4. node scripts/verify-release-artifacts.mjs --version vX.Y.Z --dist dist
echo.
echo Os arquivos ficarao em dist\.
echo.
pause
