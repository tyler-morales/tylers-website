#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMG="${DIR}/images"
mkdir -p "${IMG}"
BASE="https://raw.githubusercontent.com/copy/v86/master/bios"
echo "Fetching SeaBIOS and VGA BIOS into ${IMG} ..."
curl -fsSL "${BASE}/seabios.bin" -o "${IMG}/seabios.bin"
curl -fsSL "${BASE}/vgabios.bin" -o "${IMG}/vgabios.bin"
echo "OK: seabios.bin, vgabios.bin"
