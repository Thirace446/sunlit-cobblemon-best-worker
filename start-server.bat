@echo off
cd /d "%~dp0"
echo Starting Sunlit Cobblemon Best Worker server...
echo.
echo Open: http://localhost:4173/
echo Press Ctrl+C to stop.
echo.
node scripts\serve.mjs
pause
