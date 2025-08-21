@echo off
echo ==========================================
echo    SISTEMA DE FINANZAS - INICIO RAPIDO
echo ==========================================
echo.

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Verificando Node.js... OK
echo.

:: Verificar si npm está disponible
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no esta disponible
    pause
    exit /b 1
)

echo Verificando npm... OK
echo.

:: Instalar dependencias del backend si no existen
if not exist "back\node_modules" (
    echo Instalando dependencias del backend...
    cd back
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo al instalar dependencias del backend
        pause
        exit /b 1
    )
    cd ..
    echo Backend configurado correctamente
    echo.
)

:: Instalar dependencias del frontend si no existen
if not exist "front\node_modules" (
    echo Instalando dependencias del frontend...
    cd front
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo al instalar dependencias del frontend
        pause
        exit /b 1
    )
    cd ..
    echo Frontend configurado correctamente
    echo.
)

echo ==========================================
echo      INICIANDO SERVIDORES...
echo ==========================================
echo.
echo Backend corriendo en: http://localhost:3001
echo Frontend corriendo en: http://localhost:3000
echo.

:: Iniciar backend en segundo plano
echo Iniciando backend...
start "Backend Server" cmd /c "cd back && npm run dev && pause"

:: Esperar un momento para que el backend inicie
timeout /t 3 /nobreak >nul

:: Iniciar frontend en segundo plano
echo Iniciando frontend...
start "Frontend Server" cmd /c "cd front && npm run dev && pause"

:: Esperar un momento más
timeout /t 5 /nobreak >nul

:: Abrir el navegador automáticamente
echo Abriendo navegador...
start http://localhost:3000

echo.
echo ==========================================
echo     APLICACION INICIADA CORRECTAMENTE
echo ==========================================
echo.
echo El sistema se ha iniciado exitosamente:
echo - Backend API: http://localhost:3001
echo - Frontend Web: http://localhost:3000
echo.
echo El navegador se abrira automaticamente.
echo.
echo Para DETENER la aplicacion:
echo - Ejecuta: stop.bat
echo - O cierra todas las ventanas de terminal
echo.
echo Presiona cualquier tecla para continuar...
pause
