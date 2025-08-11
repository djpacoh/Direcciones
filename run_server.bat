@echo off
echo Iniciando servidor local...
echo Abre tu navegador y ve a: http://localhost:8000
echo Para detener el servidor presiona Ctrl+C
echo.
python -m http.server 8000
pause