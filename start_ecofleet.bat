@echo off
title FleetMonitor - Gerenciador de Inicializacao
color 0A

echo =======================================================
echo        Inicializando FleetMonitor - Gestao Web
echo =======================================================
echo.

echo [1/4] Iniciando Servidor Backend (Django API)...
if not exist "%~dp0backend\venv_django" (
    echo Criando ambiente virtual e instalando dependencias do backend...
    cd /d "%~dp0backend"
    python -m venv venv_django
    call venv_django\Scripts\activate.bat
    pip install -r requirements.txt
    cd /d "%~dp0"
)
start "FleetMonitor API (Django)" cmd /k "cd /d "%~dp0backend" && venv_django\Scripts\activate.bat && python manage.py runserver 8000"

timeout /t 4 /nobreak >nul

echo [2/4] Iniciando Simulador IoT de Telemetria...
start "FleetMonitor Telemetry Simulator" cmd /k "cd /d "%~dp0backend" && venv_django\Scripts\activate.bat && python simulator.py"

timeout /t 2 /nobreak >nul

echo [3/4] Iniciando o Frontend (Vite)...
if not exist "%~dp0frontend\node_modules" (
    echo Instalando dependencias do frontend...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)
start "FleetMonitor Web UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul

echo [4/4] Abrindo o navegador...
start http://localhost:5173

echo.
echo =======================================================
echo   Tudo Pronto! FleetMonitor esta rodando em:
echo   Frontend  -> http://localhost:5173
echo   Backend   -> http://localhost:8000
echo =======================================================
echo.
pause
