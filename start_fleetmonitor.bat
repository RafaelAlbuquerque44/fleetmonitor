@echo off
chcp 65001 >nul
title FleetMonitor - Sistema Central
color 0B
mode con: cols=90 lines=40

echo.
echo    FFFFFF L      EEEEEE EEEEEE TTTTTT
echo    F      L      E      E        TT  
echo    FFFF   L      EEEE   EEEE     TT  
echo    F      L      E      E        TT  
echo    F      LLLLLL EEEEEE EEEEEE   TT  
echo.
echo    M    M  OOOO  N    N IIII TTTTTT  OOOO  RRRR  
echo    MM  MM O    O NN   N  II    TT   O    O R   R 
echo    M MM M O    O N N  N  II    TT   O    O RRRR  
echo    M    M O    O N  N N  II    TT   O    O R  R  
echo    M    M  OOOO  N   NN IIII   TT    OOOO  R   R 
echo.
echo ============================================================================
echo                        Iniciando todos os servicos...
echo ============================================================================
echo.

echo [1/4] Verificando dependencias do Backend...
if not exist "%~dp0backend\venv_django" (
    echo [*] Criando ambiente virtual do backend...
    cd /d "%~dp0backend"
    python -m venv venv_django
    call venv_django\Scripts\activate.bat
    pip install -r requirements.txt
    cd /d "%~dp0"
)

echo [2/4] Verificando dependencias do Frontend...
if not exist "%~dp0frontend\node_modules" (
    echo [*] Instalando modulos do frontend...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)

echo.
echo ============================================================================
echo                 LANCANDO PROCESSOS EM SEGUNDO PLANO
echo ============================================================================
echo.

echo [3/4] Iniciando Backend (Django API) e Simulador IoT...
start /b "" cmd /c "cd /d "%~dp0backend" && call venv_django\Scripts\activate.bat && python manage.py runserver 8000"
timeout /t 3 /nobreak >nul
start /b "" cmd /c "cd /d "%~dp0backend" && call venv_django\Scripts\activate.bat && python simulator.py"

echo [4/4] Iniciando Frontend (React/Vite)...
start /b "" cmd /c "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo [*] Aguardando o Vite abrir o navegador automaticamente...

echo.
echo ============================================================================
echo.
echo    [ SUCESSO ] O sistema esta operante nesta mesma janela!
echo.
echo    Frontend Acessivel em: http://localhost:5173
echo    Backend  Acessivel em: http://localhost:8000
echo.
echo    Aviso: Fechar esta janela encerrara TODOS os processos do FleetMonitor.
echo    Pressione [CTRL + C] se desejar desligar os servidores manualmente.
echo.
echo ============================================================================
pause >nul
