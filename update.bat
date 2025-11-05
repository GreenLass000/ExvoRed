@echo off
REM Update script for ExvoRed project
REM 1. Creates database backup
REM 2. Pulls latest changes from GitHub
REM 3. Updates dependencies
REM 4. Applies database migrations

echo ========================================
echo ExvoRed Update Script
echo ========================================
echo.

REM Step 1: Create database backup
echo [Step 1/4] Creating database backup...
call backup.bat
if errorlevel 1 (
    echo ERROR: Backup failed. Aborting update.
    pause
    exit /b 1
)
echo.

REM Step 2: Pull latest changes from GitHub
echo [Step 2/4] Pulling latest changes from GitHub...
git pull origin main
if errorlevel 1 (
    echo ERROR: Git pull failed. Please resolve conflicts manually.
    pause
    exit /b 1
)
echo.

REM Step 3: Update dependencies
echo [Step 3/4] Updating dependencies...
echo Cleaning up node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Installing dependencies...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)
echo.

REM Step 4: Apply database migrations
echo [Step 4/4] Applying database migrations...
npm run db:migrate
if errorlevel 1 (
    echo WARNING: Database migration had issues. Check output above.
    echo You may need to run "npm run db:push" manually.
)
echo.

echo ========================================
echo Update completed successfully!
echo ========================================
pause