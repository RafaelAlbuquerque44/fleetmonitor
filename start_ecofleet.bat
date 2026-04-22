@echo off
title EcoFleet Gerenciador de Inicializacao
color 0A

echo =======================================================
echo          Inicializando EcoFleet - Gestao Web
echo =======================================================
echo.

echo [1/3] Iniciando Servidor Backend (API)...
start "EcoFleet API (Backend)" cmd /c "cd backend && venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Iniciando Simulador IoT de Telemetria...
start "EcoFleet Telemetry Simulator" cmd /c "cd backend && venv\Scripts\activate.bat && python simulator.py"

echo [3/3] Iniciando o Frontend e o Navegador...
:: O parametro --open fara o Vite abrir o seu navegador padrao automaticamente
start "EcoFleet Web UI" cmd /c "cd frontend && npm run dev -- --open"

echo.
echo =======================================================
echo     Tudo Pronto! O EcoFleet esta abrindo no navegador.
echo =======================================================
timeout /t 5 >nul
exit
