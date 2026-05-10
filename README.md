# OffMessenger

Desktop messenger with a **liquid glass** UI, token balance / top-up, chats,
privacy settings, themes, and a companion **OffMessenger Support** console for
complaint handling and role management.

Built with **Tauri 2 + React 18 + TypeScript + Framer Motion**. Ships as a
single Windows installer that contains both windows and an in-process local
HTTP server on `127.0.0.1:5005`.

---

## Two applications, one binary

| Window | Purpose |
| --- | --- |
| **OffMessenger** (`main`) | End-user messenger: auth, balance, chats, settings |
| **OffMessenger Support** (`support`) | Hidden by default; opens from Settings → "Открыть консоль поддержки" |

Both are WebView2 windows with **Mica (Windows 11)** or **Acrylic (Windows 10)**
enabled, plus an in-app CSS liquid-glass layer (backdrop-filter + SVG
displacement map + animated specular highlights).

---

## Features

- **Auth:** email / password, plus OAuth stubs for Google / VK / Apple
  (wired to buttons; supply your `client_id` to make them live).
- **Registration with local code** sent to the bundled server at
  `127.0.0.1:5005/send-code`.
- **Top-up sheet** with presets 50 / 100 / 500 / 1000 / 2000 / 5000 ₽ and a
  custom amount. Values below 50 ₽ show a red inline hint.
- **Chats** with per-message spring animations.
- **Settings:** themes (light / dark / system), notifications, privacy (read
  receipts, last-seen), chat management. Wide **Logout** button is always
  visible at the bottom thanks to a `grid-template-rows: 1fr auto` layout.
- **Support console:** live list of complaints (auto-refresh every 3.5 s),
  user search, and role assignment across
  `user · helper · supporter · creator · admin · owner · title`.
- **Local server:** `axum` on `127.0.0.1:5005` exposing
  `/health`, `/send-code`, `/verify-code`, `/complaints`, `/users`,
  `/roles/assign`.

---

## How to get a `.exe`

**Option A — GitHub Actions (recommended, no Windows needed locally):**

1. Push this repo to GitHub.
2. Open the **Actions** tab — the `Build Windows (MSI / NSIS EXE)` workflow
   triggers automatically on every push.
3. When it finishes (~15 min on first run), open the workflow run and download
   the artifact **`offmessenger-windows-installers`**. It contains:
   - `OffMessenger_0.1.0_x64_en-US.msi` — MSI installer
   - `OffMessenger_0.1.0_x64-setup.exe` — NSIS installer
   The portable `OffMessenger.exe` is under **`offmessenger-portable-exe`**.

**Option B — local Windows build:** see [`BUILD.md`](./BUILD.md).

---

## Microsoft Store submission

The app builds as an MSIX-compatible binary, but Store submission requires:

1. A **Microsoft Partner Center** developer account.
2. Your own code-signing certificate (or Partner Center trust).
3. Package identity fields (`Publisher`, `PublisherDisplayName`) injected by
   Partner Center into your `appxmanifest`.

See `BUILD.md` → "Microsoft Store" for the exact steps.

---

## Dev quickstart

```bash
npm install
npm run dev            # plain vite, UI works with in-memory fallback store
npm run tauri dev      # full Tauri shell with Rust backend + local server
```

Requires: Node 20+, Rust stable, and (on Windows) the WebView2 runtime.

## Licence

Proprietary — all rights reserved. Change before shipping publicly.
