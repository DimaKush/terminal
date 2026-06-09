#!/bin/bash
set -e

if [ "${DEBUG:-0}" = "1" ]; then
    set -x
fi

if [ -f ".env" ]; then
    while IFS= read -r line; do
        line="${line%%$'\r'}"
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        [[ "$line" != *=* ]] && continue
        key="${line%%=*}"
        value="${line#*=}"
        key="$(echo "$key" | xargs)"
        value="$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        if [[ "$value" =~ ^\".*\"$ || "$value" =~ ^\'.*\'$ ]]; then
            value="${value:1:${#value}-2}"
        fi
        export "$key=$value"
    done < ".env"
fi

EXTRA_PINS=()
REMOVE_IPFS=0
while [[ $# -gt 0 ]]; do
    case "$1" in
        --remove-ipfs)
            REMOVE_IPFS=1
            shift
            ;;
        --pin|-p)
            if [[ -z "${2:-}" ]]; then
                echo "Error: $1 requires a CID"
                exit 1
            fi
            EXTRA_PINS+=("$2")
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--remove-ipfs] [--pin|-p CID ...]"
            echo "  Env: BUILD=1, IPFS_SERVER, SSH_USER, SSH_KEY_PATH, IPFS_REMOTE_PATH, SYSTEMD_NAME, ..."
            echo "  --remove-ipfs  Stop Kubo, drop systemd unit, remove /usr/local/bin/ipfs and IPFS_REMOTE_PATH."
            echo "  --pin / -p     Pin extra CID(s) on the VPS after publishing dist (repeatable)."
            exit 0
            ;;
        *)
            echo "Unknown option: $1 (try --help)"
            exit 1
            ;;
    esac
done

EXTRA_PIN_CIDS=""
for c in "${EXTRA_PINS[@]}"; do
    EXTRA_PIN_CIDS+="${EXTRA_PIN_CIDS:+ }$c"
done

SERVER_IP=${IPFS_SERVER:-${RU_SERVER:-}}
if [ -z "$SERVER_IP" ]; then
    echo "Error: set IPFS_SERVER (or RU_SERVER) in .env or the environment"
    exit 1
fi

SSH_USER=${SSH_USER:-root}
SSH_KEY_PATH=${SSH_KEY_PATH:-}
KNOWN_HOSTS_PATH=${KNOWN_HOSTS_PATH:-$HOME/.ssh/known_hosts}
IPFS_REMOTE_PATH=${IPFS_REMOTE_PATH:-/var/lib/ipfs}
STAGING_DIR=${STAGING_DIR:-/var/www/terminal-ipfs/staging}
KUBO_VERSION=${KUBO_VERSION:-0.32.1}
SYSTEMD_NAME=${SYSTEMD_NAME:-ipfs-kubo}

SSH_OPTS=(
    -i "$SSH_KEY_PATH"
    -o ServerAliveInterval=30
    -o ServerAliveCountMax=120
    -o TCPKeepAlive=yes
    -o StrictHostKeyChecking=yes
    -o UserKnownHostsFile="$KNOWN_HOSTS_PATH"
)

if [ "$REMOVE_IPFS" = "1" ]; then
    if [ "${#EXTRA_PINS[@]}" -gt 0 ]; then
        echo "Error: --remove-ipfs cannot be used with --pin"
        exit 1
    fi
    echo "Removing Kubo (service, binary, repo ${IPFS_REMOTE_PATH}) on ${SERVER_IP}..."
    ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SERVER_IP}" \
        env IPFS_PATH="$IPFS_REMOTE_PATH" SYSTEMD_NAME="$SYSTEMD_NAME" bash -s << 'REMOTE'
set -e
export IPFS_PATH
systemctl stop "${SYSTEMD_NAME}.service" 2>/dev/null || true
systemctl disable "${SYSTEMD_NAME}.service" 2>/dev/null || true
rm -f "/etc/systemd/system/${SYSTEMD_NAME}.service"
systemctl daemon-reload
rm -f /usr/local/bin/ipfs
rm -rf "$IPFS_PATH"
echo "Removed ${SYSTEMD_NAME}, /usr/local/bin/ipfs, and $IPFS_PATH" >&2
REMOTE
    echo "Done."
    exit 0
fi

if [ "${BUILD:-0}" = "1" ]; then
    echo "Running production build..."
    if command -v yarn >/dev/null 2>&1; then
        yarn build
    else
        npm run build
    fi
fi

if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "Error: dist/ is missing or empty. Run BUILD=1 ./upload_ipfs_vps.sh or yarn build"
    exit 1
fi

echo "Ensuring staging dir on ${SERVER_IP}..."
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SERVER_IP}" "mkdir -p '${STAGING_DIR}'"

echo "Syncing dist/ -> ${STAGING_DIR}..."
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" ./dist/ "${SSH_USER}@${SERVER_IP}:${STAGING_DIR}/"

echo "Installing / starting Kubo, pinning..."
CID="$(
    ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SERVER_IP}" \
        env IPFS_PATH="$IPFS_REMOTE_PATH" STAGING_DIR="$STAGING_DIR" KUBO_VER="$KUBO_VERSION" SYSTEMD_NAME="$SYSTEMD_NAME" EXTRA_PIN_CIDS="${EXTRA_PIN_CIDS}" bash -s << 'REMOTE'
set -e
case $(uname -m) in
    x86_64) ARCH=amd64 ;;
    aarch64) ARCH=arm64 ;;
    arm64) ARCH=arm64 ;;
    *)
        echo "Unsupported machine: $(uname -m)" >&2
        exit 1
        ;;
esac

if ! command -v ipfs >/dev/null 2>&1; then
    echo "Installing Kubo v${KUBO_VER} (${ARCH})..." >&2
    TMP=$(mktemp -d)
    trap 'rm -rf "$TMP"' EXIT
    cd "$TMP"
    PKG="kubo_v${KUBO_VER}_linux-${ARCH}.tar.gz"
    wget -q "https://dist.ipfs.tech/kubo/v${KUBO_VER}/${PKG}"
    tar xzf "$PKG"
    install -m 0755 kubo/ipfs /usr/local/bin/ipfs
    cd /
    rm -rf "$TMP"
    trap - EXIT
fi

export IPFS_PATH
mkdir -p "$IPFS_PATH"

if [ ! -f "$IPFS_PATH/config" ]; then
    ipfs init --profile=server >&2
fi

cat > "/etc/systemd/system/${SYSTEMD_NAME}.service" << UNIT
[Unit]
Description=IPFS Kubo daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=IPFS_PATH=${IPFS_PATH}
ExecStart=/usr/local/bin/ipfs daemon
Restart=on-failure
RestartSec=10
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload >&2
systemctl enable --now "${SYSTEMD_NAME}.service" >&2

for i in $(seq 1 60); do
    if ipfs id >/dev/null 2>&1; then
        break
    fi
    sleep 1
done
if ! ipfs id >/dev/null 2>&1; then
    echo "IPFS API did not become ready (journalctl -u ${SYSTEMD_NAME} -n 50)" >&2
    exit 1
fi

echo "Adding dist to IPFS (this may take a while)..." >&2
ROOT_CID=$(ipfs add -r -Q "$STAGING_DIR")
ipfs pin add "$ROOT_CID" >/dev/null
if [ -n "${EXTRA_PIN_CIDS}" ]; then
    for extra in ${EXTRA_PIN_CIDS}; do
        echo "Pinning extra CID (may fetch from network): ${extra}" >&2
        ipfs pin add "$extra" >/dev/null
    done
fi
printf '%s\n' "$ROOT_CID"
REMOTE
)"

echo ""
echo "Root CID (pinned on VPS): $CID"
echo "https://ipfs.io/ipfs/${CID}/"
echo "https://dweb.link/ipfs/${CID}/"
if [ "${#EXTRA_PINS[@]}" -gt 0 ]; then
    echo ""
    echo "Also pinned on VPS:"
    for c in "${EXTRA_PINS[@]}"; do
        echo "  $c"
    done
fi
echo ""
echo "Update ENS contenthash to this CID. Ensure TCP 4001 (swarm) is open on the VPS so gateways find you."
