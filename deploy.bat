@echo off
REM FlavorVerse - Windows Deployment Script
REM This script builds and deploys the application

echo ====================================
echo FlavorVerse Deployment Script
echo ====================================
echo.

REM Check if Java is installed
echo [1/5] Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)
echo Java found!
echo.

REM Check if Maven is installed
echo [2/5] Checking Maven installation...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven
    pause
    exit /b 1
)
echo Maven found!
echo.

REM Build the application
echo [3/5] Building application...
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo Build successful!
echo.

REM Check if JAR was created
echo [4/5] Verifying JAR file...
if not exist "target\flavorverse-0.0.1-SNAPSHOT.jar" (
    echo ERROR: JAR file not found in target directory
    pause
    exit /b 1
)
echo JAR file created successfully!
echo.

REM Deploy (run the application)
echo [5/5] Starting application...
echo.
echo ====================================
echo Application is starting...
echo Access at: http://localhost:8080
echo Press Ctrl+C to stop
echo ====================================
echo.

java -jar target\flavorverse-0.0.1-SNAPSHOT.jar

pause
