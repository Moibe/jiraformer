@echo off
cd /d "%~dp0"

:loop
set /p url="Pega la URL de Jira: "
node --env-file=.env src\jiraformer.mjs "%url%"
echo.
pause
echo.
goto loop
