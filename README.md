# OffMessenger

Desktop messenger with a **liquid glass** UI (Tauri 2 + React + Framer Motion)
backed by a **self-hosted server** (Rust + axum + SQLite).

Two parts, two binaries:

- **Desktop client** — Windows `.exe` / `.msi` / Microsoft Store MSIX. Pure UI,
  no persistent data on the device. Connects to your server over HTTPS + WS.
- **Server** — runs on your dedicated machine (дедик). Stores users, chats,
  messages, complaints, roles in an embedded SQLite. Auth via JWT.

## Quick start

1. **Deploy the server** — see [`DEPLOY.md`](./DEPLOY.md). One `docker compose up -d --build` on your VPS.
2. **Build the client** — push to GitHub, the *Build Windows* workflow produces
   MSI + NSIS installers as artifacts. Or build locally: see [`BUILD.md`](./BUILD.md).
3. **Point the client at the server** — open **Settings → Сервер**, paste
   `https://api.your-domain.com` (or `http://YOUR-IP:5005` during testing),
   click **Проверить**. After the health check passes, register / log in.

## Architecture

```
┌──────────────────────────┐            ┌───────────────────────────┐
│  OffMessenger.exe        │  HTTPS +   │  offmessenger-server      │
│  (Windows, WinUI-like    │  WebSocket │  (Linux dedik or Windows) │
│   liquid-glass UI)       │ ─────────▶ │  axum + SQLite + JWT      │
│                          │            │  port 5005                │
│  OffMessenger Support    │            └───────────────────────────┘
│  (role management UI,    │
│   same binary second     │
│   window)                │
└──────────────────────────┘
```

## Why separate server?

- **Microsoft Store** rejects apps that bind sockets or accept connections —
  the server must run elsewhere.
- **Real chat** needs a single source of truth so users on different machines
  see each other's messages.
- **Moderation** (complaints / role assignment) needs a persistent backend.

## Features

- Auth: email + password, verification code (currently logged / exposed in dev;
  plug SMTP via `lettre` for real email).
- Roles: `user · helper · supporter · creator · admin · owner · title`. Enforced
  server-side on complaints and role assignment endpoints.
- Token top-up: presets 50/100/500/1000/2000/5000 ₽, custom amount with live
  validation (< 50 ₽ shows a red hint).
- Chats with real-time delivery over WebSocket; history in SQLite.
- Support console: complaints list, user search, role assignment — opens as a
  second window via `Settings → Открыть консоль поддержки`.
- Light / dark / system themes. Mica on Win11, Acrylic on Win10.

## Dev

```bash
# server
cargo run -p offmessenger-server
# in another terminal — frontend (talks to 127.0.0.1:5005 by default)
npm install
npm run dev
# or the full desktop shell
npx tauri dev
```

## Repo layout

```
Cargo.toml                 # workspace root
server/                    # offmessenger-server crate (Rust, axum, SQLite)
  Dockerfile
  docker-compose.yml
  offmessenger-server.service
src-tauri/                 # desktop client (Tauri 2)
src/                       # React/TS frontend
.github/workflows/
  build-windows.yml        # desktop MSI + NSIS + portable .exe
  build-server.yml         # server Linux x64 + Windows x64 binaries
DEPLOY.md                  # how to run server on a dedicated machine
BUILD.md                   # how to build the desktop .exe
```
