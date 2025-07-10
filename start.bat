@echo off
title ExvoRed - Start

:: --- Verificar Node.js ---
where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js no está instalado. Instálalo desde https://nodejs.org/
  pause
  exit /b
)

:: --- Verificar NPM ---
where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm no está disponible. Revisa tu instalación de Node.js.
  pause
  exit /b
)

:: --- Instalar dependencias si faltan ---
IF NOT EXIST node_modules (
  echo Instalando dependencias...
  call npm install
)

:: --- Ejecutar migraciones (DrizzleORM) ---
echo Ejecutando migraciones...
call npx drizzle-kit push --config=drizzle.config.ts
IF %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Error ejecutando las migraciones.
  pause
  exit /b
)

:: --- Iniciar la API y el frontend ---
echo Iniciando la API y el frontend...
start cmd /k "npm run api:dev"
start cmd /k "npm run dev"

echo Todo lanzado correctamente.
