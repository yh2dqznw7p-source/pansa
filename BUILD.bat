@echo off
REM =====================================================================
REM  OffMessenger - one-click Windows build
REM  Double-click this file. On success you will find the .exe installers
REM  under src-tauri\target\release\bundle\ and the portable .exe at
REM  src-tauri\target\release\OffMessenger.exe
REM =====================================================================

setlocal

echo.
echo === OffMessenger build ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo Install Node 20 LTS from https://nodejs.org/  then re-run this file.
  pause
  exit /b 1
)

where cargo >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Rust not found.
  echo Install from https://rustup.rs/  then re-run this file.
  pause
  exit /b 1
)

where link >nul 2>&1
if errorlevel 1 (
  echo [WARN] MSVC linker not on PATH.
  echo Install "Visual Studio 2022 Build Tools" with the
  echo   "Desktop development with C++" workload, then reopen the terminal.
  echo Attempting build anyway in case your shell already configured MSVC...
)

echo.
echo --- Installing frontend dependencies (npm ci) ---
call npm ci
if errorlevel 1 (
  echo [ERROR] npm ci failed.
  pause
  exit /b 1
)

echo.
echo --- Building frontend (vite) ---
call npm run build
if errorlevel 1 (
  echo [ERROR] frontend build failed.
  pause
  exit /b 1
)

echo.
echo --- Building Tauri (Rust release + MSI + NSIS installer) ---
echo This may take 5 to 15 minutes on the first run (compiling Rust deps).
call npx --yes @tauri-apps/cli@^2 build --bundles msi nsis
if errorlevel 1 (
  echo [ERROR] tauri build failed. See output above.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Build finished.
echo.
echo  Installers:
echo    src-tauri\target\release\bundle\msi\*.msi
echo    src-tauri\target\release\bundle\nsis\*-setup.exe
echo.
echo  Portable executable:
echo    src-tauri\target\release\OffMessenger.exe
echo ============================================================
pause
endlocal
