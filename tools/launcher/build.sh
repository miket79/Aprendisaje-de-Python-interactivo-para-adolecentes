#!/usr/bin/env bash
# Builds the standalone executables for students (nothing to install):
#   release/PythonQuest-Mac            macOS 11+ (Apple Silicon + Intel), double-click to run
#   release/PythonQuest-Windows.exe    Windows 10/11 (x64, also runs on ARM)
# Needs Node.js (for the web build) and Go (brew install go).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

command -v go >/dev/null || { echo "Go is required to package the app:  brew install go"; exit 1; }
VERSION="$(node -p "require('./package.json').version")"

echo "→ Building the web app"
npm run build
node tools/launcher/pack-web.mjs dist tools/launcher/web

echo "→ Compiling executables (v$VERSION)"
mkdir -p release tools/launcher/build
cd tools/launcher
export CGO_ENABLED=0
LDFLAGS="-s -w -X main.version=$VERSION"
GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "$LDFLAGS" -o build/mac-arm64 .
GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags "$LDFLAGS" -o build/mac-x64 .
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "$LDFLAGS" -o "$ROOT/release/PythonQuest-Windows.exe" .

if command -v lipo >/dev/null; then
  lipo -create -output "$ROOT/release/PythonQuest-Mac" build/mac-x64 build/mac-arm64
else
  node make-universal.mjs "$ROOT/release/PythonQuest-Mac" build/mac-x64 build/mac-arm64
fi
chmod +x "$ROOT/release/PythonQuest-Mac"
# On a Mac, (re)apply an ad-hoc signature to the universal binary.
if command -v codesign >/dev/null; then codesign --force --sign - "$ROOT/release/PythonQuest-Mac"; fi

ls -lh "$ROOT/release"
echo "✓ Done. Executables are in release/"
