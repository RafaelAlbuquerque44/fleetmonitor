@echo off
title Inicializando Sistema...
chcp 65001 >nul

echo ================================================
echo       INICIALIZANDO SISTEMA - FRONTEND
echo ================================================
echo.

:: Navegar para a pasta do projeto
cd /d "%~dp0"

:: Verificar se node_modules existe
if not exist "node_modules\" (
    echo [*] Instalando dependencias, aguarde...
    npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas com sucesso!
    echo.
) else (
    echo [OK] Dependencias ja instaladas.
    echo.
)

:: Iniciar o servidor de desenvolvimento
echo [*] Iniciando servidor de desenvolvimento...
echo [*] Acesse: http://localhost:5173
echo.
echo ================================================
echo  Pressione CTRL+C para encerrar o servidor
echo ================================================
echo.

npm run dev
