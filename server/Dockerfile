# syntax=docker/dockerfile:1.6
# Build stage -------------------------------------------------------------
FROM rust:1.82-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy the workspace manifest + server manifest first to leverage Docker cache
COPY Cargo.toml ./
COPY server/Cargo.toml server/
COPY src-tauri/Cargo.toml src-tauri/

# Placeholder dummy sources to pre-fetch deps
RUN mkdir -p server/src src-tauri/src \
 && echo "fn main(){}" > server/src/main.rs \
 && echo "" > src-tauri/src/lib.rs \
 && echo "fn main(){}" > src-tauri/src/main.rs \
 && echo "fn main(){}" > src-tauri/build.rs

RUN cargo fetch -p offmessenger-server || true

# Now copy the actual source and build
COPY server/ server/
RUN cargo build --release -p offmessenger-server

# Runtime stage -----------------------------------------------------------
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -u 10001 -r -s /usr/sbin/nologin offmsg \
 && mkdir -p /data && chown offmsg /data

COPY --from=builder /build/target/release/offmessenger-server /usr/local/bin/offmessenger-server

USER offmsg
WORKDIR /data
ENV BIND=0.0.0.0:5005 DATA_DIR=/data RUST_LOG=offmessenger_server=info,tower_http=info

EXPOSE 5005
VOLUME ["/data"]

ENTRYPOINT ["/usr/local/bin/offmessenger-server"]
