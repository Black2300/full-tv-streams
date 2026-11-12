@echo off
chcp 65001 > nul
title Instalador Full TV Streams - Smart TV Samsung (Tizen)
color 0A

echo ======================================================================
echo          FULL TV STREAMS - INSTALADOR SMART TV SAMSUNG (TIZEN)
echo ======================================================================
echo.
echo Este script ajuda voce a instalar o Full TV Streams como aplicativo
echo NATIVO na sua Smart TV Samsung.
echo.
echo REQUISITOS ANTES DE COMECAR:
echo 1. O Computador e a Smart TV Samsung devem estar no MESMO Wi-Fi.
echo 2. Na TV Samsung:
echo    - Abra o menu "Apps".
echo    - No controle remoto, digite: 1 2 3 4 5
echo    - Ative o "Developer Mode" para ON.
echo    - Digite o IP deste computador no campo Host PC IP.
echo    - Reinicie a TV (segure o botao liga/desliga por 5 segundos).
echo ======================================================================
echo.

set /p TV_IP="Digite o endereco IP da sua TV Samsung (ex: 192.168.1.50): "

if "%TV_IP%"=="" (
    echo [ERRO] O endereco IP da TV nao pode ficar em branco.
    pause
    exit /b
)

echo.
echo Conectando a TV Samsung em %TV_IP%...

REM Verifica se o sdb existe no PATH ou no Tizen Studio
set SDB_EXE=sdb.exe
if exist "C:\tizen-studio\tools\sdb.exe" set SDB_EXE=C:\tizen-studio\tools\sdb.exe

where %SDB_EXE% >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [INFO] O utilitario SDB da Samsung nao esta instalado globalmente.
    echo.
    echo Para instalar com 1 clique de forma automatica, recomendamos o TizenBrewInstaller:
    echo 1. Baixe o instalador oficial para Windows:
    echo    https://github.com/reisxd/TizenBrewInstaller/releases
    echo 2. Execute o instalador no PC e clique em "Install".
    echo 3. O aplicativo Full TV Streams e o Tizen aparecerao na sua TV!
    echo.
    echo Abrindo a pagina de download no seu navegador...
    start https://github.com/reisxd/TizenBrewInstaller/releases
    pause
    exit /b
)

echo Executando sdb connect %TV_IP%...
%SDB_EXE% connect %TV_IP%

echo.
echo Verificando dispositivos conectados:
%SDB_EXE% devices

echo.
echo Enviando e instalando o pacote FullTV.wgt na TV...
if exist "FullTV.wgt" (
    %SDB_EXE% install FullTV.wgt
    echo.
    echo [SUCESSO] Se o comando acima concluiu, o Full TV Streams foi instalado na sua TV!
) else if exist "public\tizen\FullTV.wgt" (
    %SDB_EXE% install public\tizen\FullTV.wgt
    echo.
    echo [SUCESSO] Se o comando acima concluiu, o Full TV Streams foi instalado na sua TV!
) else (
    echo [ERRO] O arquivo FullTV.wgt nao foi encontrado nesta pasta.
)

echo.
pause
