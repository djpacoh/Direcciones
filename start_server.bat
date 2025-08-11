@echo off
title Servidor Local - Ordenar Direcciones
color 0A

echo ===============================================
echo     INICIANDO SERVIDOR LOCAL
echo ===============================================
echo.

:: Verificar si Python está disponible
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Python detectado - Usando Python servidor
    echo.
    echo Servidor iniciado en: http://localhost:8000
    echo.
    echo INSTRUCCIONES:
    echo 1. Abre tu navegador
    echo 2. Ve a: http://localhost:8000
    echo 3. Haz clic en index.html
    echo.
    echo Para detener el servidor: Ctrl+C
    echo.
    python -m http.server 8000
    goto :end
)

:: Si Python no está disponible, intentar con Node.js
echo Python no encontrado, intentando con Node.js...
echo.

node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Node.js detectado - Instalando http-server si es necesario
    echo.
    npx http-server . -p 8000 --cors
    goto :end
)

:: Si ninguno está disponible
echo.
echo ❌ ERROR: No se encontró Python ni Node.js
echo.
echo SOLUCIONES:
echo.
echo 1. INSTALAR PYTHON (Recomendado):
echo    - Ve a: https://python.org/downloads
echo    - Descarga e instala Python
echo    - Asegúrate de marcar "Add to PATH" durante la instalación
echo    - Reinicia la terminal y ejecuta este script nuevamente
echo.
echo 2. INSTALAR NODE.JS:
echo    - Ve a: https://nodejs.org
echo    - Descarga e instala Node.js LTS
echo    - Reinicia la terminal y ejecuta este script nuevamente
echo.
echo 3. USAR VISUAL STUDIO CODE:
echo    - Instala la extensión "Live Server"
echo    - Click derecho en index.html ^> "Open with Live Server"
echo.
echo 4. USAR CHROME CON CORS DESHABILITADO (NO RECOMENDADO):
echo    - Cierra todas las instancias de Chrome
echo    - Ejecuta: chrome.exe --user-data-dir=temp --disable-web-security --disable-features=VizDisplayCompositor
echo.

:end
pause