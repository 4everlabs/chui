#!/usr/bin/env sh
set -eu

REPO="${REPO:-4everlabs/chui}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
BIN_NAME="${BIN_NAME:-chui}"

detect_arch() {
  machine="$(uname -m)"
  case "$machine" in
    arm64|aarch64) echo "arm64" ;;
    x86_64|amd64) echo "x64" ;;
    *)
      echo "Unsupported macOS architecture: $machine" >&2
      exit 1
      ;;
  esac
}

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This installer currently supports macOS only." >&2
  exit 1
fi

ARCH="$(detect_arch)"
ASSET="chui-macos-${ARCH}.gz"
CHECKSUM_ASSET="checksums.txt"
BASE_URL="https://github.com/${REPO}/releases/latest/download"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

if ! mkdir -p "$INSTALL_DIR" 2>/dev/null || [ ! -w "$INSTALL_DIR" ]; then
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

echo "Downloading ${ASSET}..."
curl -fsSL "${BASE_URL}/${ASSET}" -o "${TMP_DIR}/${ASSET}"
curl -fsSL "${BASE_URL}/${CHECKSUM_ASSET}" -o "${TMP_DIR}/${CHECKSUM_ASSET}"

expected="$(awk -v file="$ASSET" '$2 == file { print $1 }' "${TMP_DIR}/${CHECKSUM_ASSET}")"
if [ -z "$expected" ]; then
  echo "Could not find checksum for ${ASSET} in ${CHECKSUM_ASSET}." >&2
  exit 1
fi

actual="$(shasum -a 256 "${TMP_DIR}/${ASSET}" | awk '{print $1}')"
if [ "$expected" != "$actual" ]; then
  echo "Checksum mismatch for ${ASSET}." >&2
  echo "Expected: $expected" >&2
  echo "Actual:   $actual" >&2
  exit 1
fi

gzip -dc "${TMP_DIR}/${ASSET}" > "${TMP_DIR}/${BIN_NAME}"
chmod +x "${TMP_DIR}/${BIN_NAME}"
cp "${TMP_DIR}/${BIN_NAME}" "${INSTALL_DIR}/${BIN_NAME}"

echo "Installed ${BIN_NAME} to ${INSTALL_DIR}/${BIN_NAME}"
case ":$PATH:" in
  *":${INSTALL_DIR}:"*) ;;
  *)
    echo "Note: ${INSTALL_DIR} is not on your PATH."
    echo "Add this to your shell config:"
    echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    ;;
esac
