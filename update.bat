@echo off
title ExvoRed - Actualizar Proyecto

echo ================================
echo   ACTUALIZANDO EXVORED
echo ================================

:: Verifica que Git esté disponible
where git >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Git no está instalado o no está en el PATH.
  pause
  exit /b
)

:: Cambia a la ruta del proyecto si hace falta (opcional)
:: cd /d C:\ruta\al\proyecto

:: Verifica que sea un repositorio git
IF NOT EXIST .git (
  echo [ERROR] Esta carpeta no parece un repositorio Git.
  pause
  exit /b
)

:: Recupera cambios del repositorio
echo Haciendo pull desde rama 'main'...
git pull origin main

IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Fallo al hacer git pull.
  pause
  exit /b
)

:: Verifica si hay cambios en package.json y reinstala si es necesario
echo Verificando si hay cambios en dependencias...
git diff --name-only HEAD@{1} HEAD | findstr /i "package.json package-lock.json" >nul
IF %ERRORLEVEL% EQU 0 (
  echo Se han actualizado dependencias. Ejecutando npm install...
  call npm install
)

echo Proyecto actualizado correctamente.
pause
