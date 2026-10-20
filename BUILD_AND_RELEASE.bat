@echo off
:: ============================================================================
•  SCRIPT DE BUILD E RELEASE - KONEXUS ERP 1.2.1
•  Execute este script no WINDOWS para gerar o .exe e subir para o GitHub
• ============================================================================

echo ========================================================
echo   Konexus ERP - Build e Release 1.2.1
echo ========================================================
echo.

:: Verificar se está no diretório correto
if not exist "package.json" (
    echo ERRO: Execute este script dentro da pasta konexus/
    pause
    exit /b 1
)

:: Verificar se o GitHub Token está configurado
if not defined GITHUB_TOKEN (
    echo ATENCAO: Defina seu token do GitHub com escopo 'repo':
    echo   set GITHUB_TOKEN=ghp_seu_token_aqui
    echo.
    echo Vo pode continuar, mas nao conseguira subir o .exe via API.
    echo.
    pause
)

:: -----------------------------------------------------------
echo [1/5] Gerando build de producao do React...
:: -----------------------------------------------------------
npm run build
if errorlevel 1 (
    echo ERRO: Falha no build do React
    pause
    exit /b 1
)
echo Build concluido com sucesso.
echo.

:: -----------------------------------------------------------
echo [2/5] Gerando instalador com electron-builder...
:: -----------------------------------------------------------
npm run electron:build
if errorlevel 1 (
    echo ERRO: Falha no electron:build
    pause
    exit /b 1
)
echo Instalador gerado com sucesso.
echo.

:: -----------------------------------------------------------
echo [3/5] Listando arquivos gerados...
:: -----------------------------------------------------------
echo Arquivos em dist/ e release/:
dir /b dist\* 2>nul
dir /b release\* 2>nul
echo.

:: -----------------------------------------------------------
echo [4/5] Verificando se o .exe existe...
:: -----------------------------------------------------------
set EXE_FILE=
for %%f in (dist\*.exe release\*.exe) do (
    if exist "%%f" set EXE_FILE=%%f
)

if not defined EXE_FILE (
    echo AVISO: Nenhum .exe encontrado automaticamente.
    echo Informe o caminho completo do .exe gerado:
    set /p EXE_FILE=Caminho do .exe:
)

if not exist "%EXE_FILE%" (
    echo ERRO: Arquivo nao encontrado: %EXE_FILE%
    pause
    exit /b 1
)

echo Arquivo encontrado: %EXE_FILE%
echo.

:: -----------------------------------------------------------
echo [5/5] Anexando .exe à release 1.2.1 no GitHub...
:: -----------------------------------------------------------
if not defined GITHUB_TOKEN (
    echo ERRO: GITHUB_TOKEN nao definido. Nao e possivel subir via API.
    echo Suba manualmente em: https://github.com/mafaldo-dev/konexus/releases/tag/1.2.1
    pause
    exit /b 0
)

:: Obter o ID da release 1.2.1
echo Buscando ID da release 1.2.1...
curl -s -H "Authorization: Bearer %GITHUB_TOKEN%" ^
  -H "Accept: application/vnd.github+json" ^
  "https://api.github.com/repos/mafaldo-dev/konexus/releases/tags/1.2.1" > "%TEMP%\release_info.json"

if errorlevel 1 (
    echo ERRO: Falha ao consultar a release no GitHub
    pause
    exit /b 1
)

:: Extrair o ID da release (simples)
for /f "tokens=*" %%a in ('type "%TEMP%\release_info.json" ^| findstr /C:""id"":') do (
    set "RELEASE_ID_LINE=%%a"
)

echo.
echo Linha bruta do ID: %RELEASE_ID_LINE%

:: Tentar extrair numericamente
for /f "tokens=2 delims=: " %%a in ("%RELEASE_ID_LINE%") do (
    set "RELEASE_ID=%%a"
)

if not defined RELEASE_ID (
    echo AVISO: Nao foi possivel extrair o ID automaticamente.
    echo Verifique manualmente em: https://github.com/mafaldo-dev/konexus/releases/tag/1.2.1
    echo.
    echo Para subir manualmente o .exe:
    echo   1. Acesse a pagina da release acima
    echo   2. Clique em "Edit release"
    echo   3. Arraste o arquivo: %EXE_FILE%
    echo   4. Salve a release
    pause
    exit /b 0
)

echo ID da release: %RELEASE_ID%
echo.

:: Fazer upload do .exe como asset
echo Enviando .exe para a release...
set "FILE_NAME=%~nxEXE_FILE%"
set "UPLOAD_URL=https://uploads.github.com/repos/mafaldo-dev/konexus/releases/%RELEASE_ID%/assets?name=%FILE_NAME%"

curl -s -w "\nHTTP_CODE: %{http_code}\n" ^
  -X POST "%UPLOAD_URL%" ^
  -H "Authorization: Bearer %GITHUB_TOKEN%" ^
  -H "Accept: application/vnd.github+json" ^
  -H "Content-Type: application/octet-stream" ^
  --data-binary @"%EXE_FILE%" > "%TEMP%\upload_result.txt"

type "%TEMP%\upload_result.txt"

echo.
echo ========================================================
echo   PROCESSO CONCLUIDO
echo ========================================================
echo.
echo Se o upload foi bem-sucedido, o .exe esta disponível em:
echo   https://github.com/mafaldo-dev/konexus/releases/tag/1.2.1
echo.
echo O auto-update do Electron agora funcionara para os usuarios.
echo.
pause
