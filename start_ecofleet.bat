@echo off
title FleetMonitor - Gerenciador de Inicializacao
color 0A

echo =======================================================
echo        Inicializando FleetMonitor - Gestao Web
echo =======================================================
echo.

echo [1/4] Iniciando Servidor Backend (Django API)...
start "FleetMonitor API (Django)" cmd /k "cd /d "%~dp0backend" && venv_django\Scripts\activate.bat && python manage.py runserver 8000"

timeout /t 4 /nobreak >nul

echo [2/4] Iniciando Simulador IoT de Telemetria...
start "FleetMonitor Telemetry Simulator" cmd /k "cd /d "%~dp0backend" && venv_django\Scripts\activate.bat && python simulator.py"

timeout /t 2 /nobreak >nul

echo [3/4] Iniciando o Frontend (Vite)...
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
