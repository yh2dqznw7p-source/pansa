# How to build OffMessenger.exe from this folder

## 1. Install the three tools (one time)

| Tool | Download | Notes |
| --- | --- | --- |
| **Node.js 20 LTS** | <https://nodejs.org/> | Run installer, defaults are fine |
| **Rust** | <https://rustup.rs/> | Run `rustup-init.exe`, accept defaults |
| **Visual Studio 2022 Build Tools** | <https://visualstudio.microsoft.com/downloads/> → "Build Tools for Visual Studio 2022" | In the installer, tick **"Desktop development with C++"**. Needed for the `link.exe` linker |

After installing, **close and reopen** any PowerShell / CMD windows so `node`, `cargo` and `link` are on PATH.

## 2. Build (one click)

**Double-click `BUILD.bat`**. It will:

1. Check Node, Rust and MSVC are installed
2. Run `npm ci` (install frontend deps)
3. Run `npm run build` (compile React/TS)
4. Run `npx tauri build --bundles msi nsis` (compile Rust + bundle installers)

First build takes **5–15 minutes** (Rust compiles all dependencies). Subsequent builds are ~30 seconds.

## 3. Where are the .exe files

After `BUILD.bat` finishes:

```
src-tauri\target\release\OffMessenger.exe                                 <- portable, no install
src-tauri\target\release\bundle\nsis\OffMessenger_0.1.0_x64-setup.exe     <- NSIS installer
src-tauri\target\release\bundle\msi\OffMessenger_0.1.0_x64_en-US.msi      <- MSI
```

Double-click the `-setup.exe` to install, or run `OffMessenger.exe` directly.

## 4. For Microsoft Store

Install the free **MSIX Packaging Tool** from Microsoft Store and point it at the generated `.msi`. It will produce an `.msix` you can upload to Partner Center.

---

## Manual build (if BUILD.bat fails)

Open **Developer PowerShell for VS 2022** in this folder and run:

```powershell
npm ci
npm run build
npx @tauri-apps/cli@^2 build --bundles msi nsis
```

## Dev mode (hot-reload window)

```powershell
npm install
npx @tauri-apps/cli@^2 dev
```
