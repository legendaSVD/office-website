#!/usr/bin/env bash
set -euo pipefail
DS_VERSION="${1:-9.3.1}"
HASH="${2:-1}"
shift 2 2>/dev/null || true
echo "→ DocumentServer version : ${DS_VERSION}"
echo "→ Hash / revision        : ${HASH}"
echo "→ Asset directory        : /v${DS_VERSION}-${HASH}"
docker build \
  --build-arg "DS_VERSION=${DS_VERSION}" \
  --build-arg "HASH=${HASH}" \
  --tag "office-website:latest" \
  --tag "office-website:${DS_VERSION}-${HASH}" \
  "$@" \
  .
echo ""
echo "✓ Build complete."
echo "  Image tags:"
echo "    office-website:latest"
echo "    office-website:${DS_VERSION}-${HASH}"
echo ""
echo "  Run with:"
echo "    docker run -p 80:80 office-website:latest"