# Deploying OffMessenger server to a dedicated machine (дедик)

The server is one self-contained binary: **`offmessenger-server`**. It embeds
SQLite, an HTTP + WebSocket API, and JWT auth. One process per machine is
enough for small-to-medium installations.

## Choose one of three install paths

### A. Docker (easiest)

```bash
# On your VPS / dedicated server
git clone https://github.com/yh2dqznw7p-source/pansa.git
cd pansa/server
# edit docker-compose.yml and change JWT_SECRET to a long random string
docker compose up -d --build
```

Server listens on `0.0.0.0:5005`. Logs: `docker compose logs -f`.
Data lives in the named volume `offmessenger-data` (SQLite).

### B. Pre-built Linux binary

Every commit to GitHub produces a `offmessenger-server-linux-x64` artifact
under **Actions → Build Server → Artifacts**. Download and install:

```bash
# download via the GitHub Actions UI, then:
chmod +x offmessenger-server
sudo mv offmessenger-server /usr/local/bin/

sudo useradd -r -s /usr/sbin/nologin offmsg
sudo mkdir -p /var/lib/offmessenger && sudo chown offmsg /var/lib/offmessenger

sudo cp server/offmessenger-server.service /etc/systemd/system/
# edit the unit and set a strong JWT_SECRET
sudoedit /etc/systemd/system/offmessenger-server.service

sudo systemctl daemon-reload
sudo systemctl enable --now offmessenger-server
sudo systemctl status offmessenger-server
```

### C. Build from source on the server

```bash
sudo apt install -y build-essential pkg-config libssl-dev curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

git clone https://github.com/yh2dqznw7p-source/pansa.git
cd pansa
cargo build --release -p offmessenger-server
sudo cp target/release/offmessenger-server /usr/local/bin/
```

Then use the systemd unit from step B.

## Configuration (environment variables)

| Variable | Default | Purpose |
| --- | --- | --- |
| `BIND` | `0.0.0.0:5005` | Interface and port to listen on |
| `DATA_DIR` | `.` | Directory for `offmessenger.sqlite` |
| `JWT_SECRET` | *insecure default* | **MUST** set to a long random string |
| `SEND_CODE_EXPOSE` | `true` | `false` in production — hides verification codes from API responses |
| `RUST_LOG` | `info` | `offmessenger_server=debug` for verbose |

Generate a strong JWT secret:

```bash
openssl rand -base64 48
```

## Point the desktop client at the server

Open **OffMessenger → Settings → Сервер** and paste your server URL, e.g.:

- `http://<YOUR-SERVER-IP>:5005` — plain, for initial testing
- `https://api.your-domain.com` — after you set up a TLS proxy

Click **Проверить**. You should see `✓ offmessenger-server vX.Y.Z`.

## Reverse proxy with TLS (required for Microsoft Store)

Microsoft Store accepts apps that talk to HTTPS endpoints only. Put the server
behind Caddy or nginx:

### Caddy one-liner

```
api.your-domain.com {
    reverse_proxy 127.0.0.1:5005
}
```

Save to `/etc/caddy/Caddyfile`, run `sudo systemctl reload caddy`. Caddy fetches
a free Let's Encrypt certificate automatically.

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;   # WebSocket
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
    }
}
```

## Sending verification codes by real email (optional)

The current server prints codes to logs (and returns them in dev responses if
`SEND_CODE_EXPOSE=true`). To wire a real SMTP provider:

- Open an issue / PR, or
- Add `lettre = "0.11"` to `server/Cargo.toml`, create an SMTP transport in
  `server/src/routes.rs :: send_code`, and use env vars `SMTP_HOST`,
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. The structure is ready for it.

## Firewall

Allow inbound TCP on port 5005 (or 443 if behind the proxy):

```bash
sudo ufw allow 5005/tcp
sudo ufw reload
```

## Health check

```bash
curl http://127.0.0.1:5005/health
# {"ok":true,"service":"offmessenger-server","version":"0.1.0"}
```

## Upgrading

```bash
cd pansa
git pull
docker compose build && docker compose up -d     # docker install
# or
cargo build --release -p offmessenger-server && sudo systemctl restart offmessenger-server
```

SQLite database is preserved between restarts.

## Backup

```bash
# docker
docker run --rm -v pansa_offmessenger-data:/src -v $PWD:/dst alpine \
  cp /src/offmessenger.sqlite /dst/backup-$(date +%F).sqlite

# systemd
sudo cp /var/lib/offmessenger/offmessenger.sqlite ~/backup-$(date +%F).sqlite
```
