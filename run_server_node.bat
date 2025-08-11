@echo off
echo Iniciando servidor local con Node.js...
echo Abre tu navegador y ve a: http://localhost:8000
echo Para detener el servidor presiona Ctrl+C
echo.
npx http-server . -p 8000 --cors
pause