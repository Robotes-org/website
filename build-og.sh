#!/bin/sh
# Renders assets/og-card.html into assets/og.png (1200x630), the preview image
# link unfurlers show when someone shares robotes.org.
#
# Headless Chrome stops painting at roughly 552px when the window is 630 tall,
# so the card is shot in a taller window and cropped back to size.

set -eu
cd "$(dirname "$0")"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1200,900 --virtual-time-budget=2500 \
  --screenshot="$TMP/raw.png" "file://$PWD/assets/og-card.html" 2>/dev/null

python3 - "$TMP/raw.png" <<'PY'
import sys
from PIL import Image
Image.open(sys.argv[1]).crop((0, 0, 1200, 630)).save("assets/og.png")
PY

echo "assets/og.png actualizado"
