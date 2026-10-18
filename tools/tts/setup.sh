#!/usr/bin/env bash
# Creates the Python environment for voice-overs and downloads the Kokoro models.
set -euo pipefail
cd "$(dirname "$0")"

PY=""
for candidate in python3.12 python3.13 python3.11 python3.10 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info[:2] <= (3, 13) else 1)'; then
      PY="$candidate"; break
    fi
  fi
done
if [ -z "$PY" ]; then
  echo "Python 3.10–3.13 is required for the voice-over tool."
  echo "On a Mac:  brew install python@3.12"
  exit 1
fi

echo "→ Using $($PY --version)"
[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt
.venv/bin/python generate_voiceovers.py --download-models
echo "✓ Voice-over tool ready. Generate audio with:  npm run voice"
