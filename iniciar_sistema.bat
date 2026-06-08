@echo off
chcp 65001 > nul
title Fleet Monitor - Inicializacao
echo ===================================================
echo     Inicializando o Sistema Fleet Monitor
echo ===================================================
echo.
echo Escolha o metodo de inicializacao:
echo [1] Usar Docker Compose (Recomendado, requer Docker)
echo [2] Rodar Localmente (Requer Python e Node.js instalados)
echo.

set /p opcao="Digite a opcao (1 ou 2): "

if "%opcao%"=="1" goto docker
if "%opcao%"=="2" goto local

echo Opcao invalida! Fechando em instantes...
timeout /t 3
exit

:docker
echo.
echo Iniciando com Docker Compose...
docker-compose up --build
pause
exit

:local
echo.
echo Iniciando servicos localmente em novas janelas...
echo.

echo - Iniciando Backend (Django)...
start "Fleet Monitor - Backend" cmd /k "cd backend && if not exist venv (python -m venv venv) && call venv\Scripts\activate && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver"

echo - Iniciando Frontend (Vite/Node)...
start "Fleet Monitor - Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Servicos iniciados em novas abas!
echo O backend deve rodar em: http://localhost:8000
echo O frontend deve rodar em: http://localhost:5173
echo.
pause
exit
