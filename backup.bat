@echo off
REM Backup script for ExvoRed database
REM Creates a timestamped backup in ../backups directory

echo Creating database backup...

REM Create backups directory if it doesn't exist
if not exist "..\backups" mkdir "..\backups"

REM Generate timestamp (YYYYMMDD_HHMMSS format)
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set mytime=%mytime: =0%
set timestamp=%mydate%_%mytime%

REM Create backup filename
set backup_file=..\backups\exvored_backup_%timestamp%.db

REM Copy database file
if exist "api\db\database.db" (
    copy "api\db\database.db" "%backup_file%"
    echo Backup created successfully: %backup_file%
) else (
    echo ERROR: Database file not found at api\db\database.db
    exit /b 1
)

echo Backup completed!
