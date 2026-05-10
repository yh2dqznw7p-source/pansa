# Build & Release Guide

## 0. Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 20 LTS+ | Vite / TypeScript build |
| Rust | stable (1.77+) | Tauri backend |
| Visual Studio Build Tools | 2022 with "Desktop development with C++" | MSVC linker for `*-pc-windows-msvc` |
| WebView2 Runtime | latest | Rendering (pre-installed on Win11) |
| WiX Toolset 3.11+ *(optional)* | only needed for MSI | Tauri downloads it automatically when bundling |

No Windows SDK tweaks needed — Tauri's CLI handles the rest.

---

## 1. Local build on Windows

```powershell
# From repo root, in a Developer PowerShell
npm ci
npm run build              # produces dist/
npm install -g @tauri-apps/cli@^2
npx tauri build            # builds Rust release + bundles MSI + NSIS
```

Artifacts land under:

```
src-tauri/target/release/OffMessenger.exe                              <- portable exe
src-tauri/target/release/bundle/msi/OffMessenger_0.1.0_x64_en-US.msi   <- MSI
src-tauri/target/release/bundle/nsis/OffMessenger_0.1.0_x64-setup.exe  <- NSIS installer
```

To build only one target:

```powershell
npx tauri build --bundles msi
npx tauri build --bundles nsis
```

---

## 2. CI build (no local Windows machine required)

The workflow at `.github/workflows/build-windows.yml` runs on every push.

```
GitHub → your repo → Actions tab → pick the latest run → Artifacts
```

Two artifacts are produced:

- `offmessenger-windows-installers` — MSI + NSIS EXE
- `offmessenger-portable-exe` — the raw `OffMessenger.exe`

These are retained for 30 days. Change `retention-days` in the workflow if you
want longer.

---

## 3. Sanity-check the installer

1. Run `OffMessenger_0.1.0_x64-setup.exe` on a clean Win10/Win11 machine.
2. Launch from Start Menu. You should see a translucent window with the
   ambient gradient background + glass cards (Mica on Win11, Acrylic on Win10).
3. Register an account. The dev code appears:
   - In the app UI under the code input (dev convenience).
   - In the console log if you run with `tauri dev`.
4. In **Settings → Управление чатами** click **"Открыть консоль поддержки"** —
   the second window appears with the complaints/roles console.
5. Test `curl http://127.0.0.1:5005/health` → should return
   `{"ok":true,"service":"offmessenger-local"}`.

---

## 4. Microsoft Store submission

Microsoft Store requires a signed **MSIX** package with a `publisher` that
matches your Partner Center identity.

### 4.1 Register with Partner Center

1. Go to <https://partner.microsoft.com/dashboard> and create a developer
   account (one-time fee).
2. In **Apps and games → New product → MSIX or PWA app**, reserve a name
   (e.g. `OffMessenger`).
3. Partner Center gives you three identity values:
   - `Package/Identity/Name` (e.g. `12345Publisher.OffMessenger`)
   - `Package/Identity/Publisher` (e.g. `CN=...`)
   - `Package/Properties/PublisherDisplayName`

### 4.2 Switch Tauri bundling to MSIX

Install the MSIX target for Tauri (community plugin) **or** convert the
NSIS/MSI installer with `MSIX Packaging Tool` from Microsoft Store:

```powershell
# Easiest path: convert the existing MSI to MSIX
winget install --id Microsoft.MsixPackagingTool
MsixPackagingTool.exe               # run GUI, point at OffMessenger_*.msi
```

In the tool, paste the three Partner Center identity values when prompted.
The tool produces `OffMessenger.msix`.

### 4.3 Sign the MSIX

- Use your Partner Center-provided code-signing certificate, or
- Let Partner Center sign during submission (recommended for first release).

```powershell
signtool sign /fd SHA256 /a /f cert.pfx /p <password> OffMessenger.msix
```

### 4.4 Submit

1. Partner Center → **Packages** → upload `OffMessenger.msix`.
2. Fill store listing (screenshots, description, 1:1 icon, privacy URL).
3. Submit for certification. Typical turnaround: 24–72 hours.

> **Privacy note:** Your app starts a local HTTP server on `127.0.0.1:5005`.
> This is allowed in Store, but declare it in your store listing as
> "local inter-process communication only" to avoid reviewer questions.

---

## 5. Signing for non-Store distribution

For direct distribution (outside the Store) sign the MSI/NSIS:

```powershell
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 `
  /a /f mycert.pfx /p <password> `
  OffMessenger_0.1.0_x64-setup.exe
```

Otherwise SmartScreen will warn users on first launch.

---

## 6. Updating the local server port

If `5005` clashes with another service, change it in two places:

- `src-tauri/src/server.rs` → `LOCAL_PORT`
- Any docs / `BUILD.md` references

Then rebuild.

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `error: linker 'link.exe' not found` | Install VS 2022 Build Tools with **Desktop development with C++** |
| Window is opaque, no glass | Check Windows version. Mica requires Win11; on Win10 you'll see Acrylic instead |
| `failed to bind 127.0.0.1:5005` | Another instance or another app is using the port |
| MSI build hangs on first run | First build downloads WiX 3.11 (~40 MB). Wait a minute |
| `tauri` CLI not found | `npm install -g @tauri-apps/cli@^2` |
