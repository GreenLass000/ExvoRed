@echo off
REM Backup script for ExvoRed database
REM Creates a timestamped backup in ../backups directory
REM Keeps backups from the last 30 days; older ones are deleted

echo Creating database backup...

REM Check database exists before doing anything
if not exist "api\db\database.db" (
    echo ERROR: Database file not found at api\db\database.db
    exit /b 1
)

REM Create backups directory if it doesn't exist
if not exist "..\backups" mkdir "..\backups"

REM Generate timestamp using wmic (locale-independent)
for /f "skip=1 tokens=1-6 delims=-T:. " %%a in ('wmic os get LocalDateTime /value ^| find "="') do (
    set dt=%%a%%b%%c_%%d%%e%%f
)

REM Fallback: if wmic failed, use a simpler format
if not defined dt (
    set dt=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set dt=%dt: =0%
)

REM Create backup
set backup_file=..\backups\exvored_backup_%dt%.db
copy "api\db\database.db" "%backup_file%"
if errorlevel 1 (
    echo ERROR: Failed to copy database to %backup_file%
    exit /b 1
)
echo Backup created: %backup_file%

REM Delete backups older than 30 days
echo Cleaning up backups older than 30 days...
forfiles /p "..\backups" /m "exvored_backup_*.db" /d -30 /c "cmd /c del @path" 2>nul

echo Backup completed!
