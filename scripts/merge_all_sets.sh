#!/bin/bash
set -euo pipefail
AUDIO_DIR="audio"
OUT="${AUDIO_DIR}/All_Sets_Playlist.mp3"

# natural sort by "Set NN – ..." if you used the rename script
# otherwise falls back to lexicographic
mapfile -t FILES < <(ls -1 "${AUDIO_DIR}"/*.mp3 | sort -V)

TMP_LIST="$(mktemp)"
for f in "${FILES[@]}"; do
  echo "file '$PWD/$f'" >> "$TMP_LIST"
done

ffmpeg -y -f concat -safe 0 -i "$TMP_LIST" -c copy "$OUT"
rm -f "$TMP_LIST"
echo "✅ Merged → $OUT"
