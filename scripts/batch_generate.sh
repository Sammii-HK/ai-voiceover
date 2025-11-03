#!/bin/bash
# batch_generate.sh — create 1 MP3 per CSV using edge-tts
set -euo pipefail

SETS_DIR="study_sets"                  # <-- matches your actual folder name
OUT_DIR="audio"
# export EDGE_VOICE="en-GB-SoniaNeural"
export EDGE_VOICE="en-GB-LibbyNeural"
export EDGE_QUESTION_RATE="+0%"
export EDGE_ANSWER_RATE="-10%"
export OUT_DIR

echo "📁 Using SETS_DIR=$SETS_DIR"
echo "📁 Using OUT_DIR=$OUT_DIR"
mkdir -p "$OUT_DIR"

which python3 || { echo "python3 not found"; exit 1; }
shopt -s nullglob

count=0
for f in "$SETS_DIR"/*.csv; do
  echo "🎧 Rendering: $f"
  python3 scripts/set_to_mp3_edge.py "$f"
  ((count++))
done

echo "ℹ️ Processed files: $count"
if [[ $count -eq 0 ]]; then
  echo "⚠️  No CSVs found in '$SETS_DIR'. Check the folder name or move your files there."
fi

echo "✅ Done! MP3s should be in: $OUT_DIR/"
ls -al "$OUT_DIR" || true
