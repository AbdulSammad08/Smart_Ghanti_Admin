@echo off
echo ============================================================
echo  Starting Face Recognition API with Supabase Integration
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python environment...
where python >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH
    echo Please install Python or activate your virtual environment
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
python -c "import supabase; import cv2; import flask" >nul 2>&1
if errorlevel 1 (
    echo Installing missing dependencies...
    pip install -q supabase python-dotenv flask flask-cors opencv-python numpy pillow
)

echo [3/3] Starting API server...
echo.
echo ============================================================
echo  API will start on http://localhost:5000
echo  Press Ctrl+C to stop
echo ============================================================
echo.

python api.py

pause
