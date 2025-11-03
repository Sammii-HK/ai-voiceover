#!/bin/bash
# batch_generate_openai.sh — create 1 MP3 per CSV using OpenAI TTS
set -euo pipefail

SETS_DIR="study_sets"
OUT_DIR="audio"

# OpenAI TTS Configuration
# Voice options: alloy (neutral), echo (male), fable (British accent), onyx (deep male), nova (young female), shimmer (soft female)
export OPENAI_VOICE="nova"           # Natural, clear female voice
export OPENAI_MODEL="tts-1-hd"       # Higher quality model (costs more but sounds better)
export OPENAI_QUESTION_SPEED="1.0"   # Normal speed for questions
export OPENAI_ANSWER_SPEED="0.9"     # Slightly slower for answers
export OUT_DIR

echo "🎙️  Using OpenAI TTS with voice: $OPENAI_VOICE"
echo "📁 Using SETS_DIR=$SETS_DIR"
echo "📁 Using OUT_DIR=$OUT_DIR"

# Check for API key
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    echo "   Then set it with: export OPENAI_API_KEY='your-api-key-here'"
    exit 1
fi

mkdir -p "$OUT_DIR"

which python3 || { echo "python3 not found"; exit 1; }
shopt -s nullglob

count=0
for f in "$SETS_DIR"/*.csv; do
  echo "🎧 Rendering: $f"
  python3 scripts/set_to_mp3_openai.py "$f"
  ((count++))
done

echo "ℹ️ Processed files: $count"
if [[ $count -eq 0 ]]; then
  echo "⚠️  No CSVs found in '$SETS_DIR'. Check the folder name or move your files there."
fi

echo "✅ Done! MP3s should be in: $OUT_DIR/"
ls -al "$OUT_DIR" || true
