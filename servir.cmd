@echo off
setlocal
rem Sobe o app com o servidor embutido do PHP (sem Apache/XAMPP).
rem uso: servir.cmd [porta]      padrao: 8080
set PORTA=%1
if "%PORTA%"=="" set PORTA=8080
cd /d "%~dp0"
echo painel .... http://127.0.0.1:%PORTA%/controle.php
echo overlay ... http://127.0.0.1:%PORTA%/placar.php?dev=1
php -S 127.0.0.1:%PORTA% -t "%~dp0"
