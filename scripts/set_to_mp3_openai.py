#!/usr/bin/env python3
"""
Render ONE MP3 per study set CSV using OpenAI TTS API.
- Uses OpenAI's high-quality, natural-sounding voices
- Adds natural pauses between Q and A (1.5s) and between cards (2.0s)
- Questions at normal speed, Answers slightly slower for clarity
- Requires OPENAI_API_KEY environment variable
"""

import csv, tempfile, os, sys, subprocess, shutil
from openai import OpenAI
import io

INPUT = sys.argv[1]
VOICE = os.environ.get("OPENAI_VOICE", "alloy")  # alloy, echo, fable, onyx, nova, shimmer
MODEL = os.environ.get("OPENAI_MODEL", "tts-1")  # tts-1 or tts-1-hd (higher quality)
SPEED_Q = float(os.environ.get("OPENAI_QUESTION_SPEED", "1.0"))   # 0.25 to 4.0
SPEED_A = float(os.environ.get("OPENAI_ANSWER_SPEED", "0.9"))     # slightly slower for answers
OUT_DIR = os.environ.get("OUT_DIR", "audio")

# Initialize OpenAI client
client = OpenAI()

os.makedirs(OUT_DIR, exist_ok=True)
BASE = os.path.splitext(os.path.basename(INPUT))[0]
OUT_MP3 = os.path.join(OUT_DIR, f"{BASE}.mp3")

def tts_to_file(text: str, out_path: str, speed: float):
    """Synthesize text using OpenAI TTS and save to file."""
    try:
        response = client.audio.speech.create(
            model=MODEL,
            voice=VOICE,
            input=text,
            speed=speed
        )
        
        # Save the audio content to file
        with open(out_path, "wb") as f:
            f.write(response.content)
            
    except Exception as e:
        print(f"❌ Error generating TTS for text: {text[:50]}...")
        print(f"   Error: {e}")
        sys.exit(1)

def silence_mp3(path: str, seconds: float):
    """Generate a silent MP3 file of specified duration."""
    subprocess.check_call([
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-t", str(seconds),
        "-acodec", "libmp3lame",
        "-b:a", "192k",
        path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable is required")
        print("   Set it with: export OPENAI_API_KEY='your-api-key-here'")
        sys.exit(1)
    
    tmp = tempfile.mkdtemp(prefix="openai_parts_")
    parts = []

    # Create silence files
    s_gap_qa   = os.path.join(tmp, "silence_qa.mp3")    # Q -> A
    s_gap_card = os.path.join(tmp, "silence_card.mp3")  # between cards
    silence_mp3(s_gap_qa,   1.5)
    silence_mp3(s_gap_card, 2.0)

    # Process CSV
    with open(INPUT, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        idx = 0
        for row in reader:
            q = (row.get("Front","") or "").strip()
            a = (row.get("Back","")  or "").strip()
            if not q or not a:
                continue
            idx += 1
            
            print(f"🎧 Processing card {idx}: {q[:50]}...")
            
            q_path = os.path.join(tmp, f"q_{idx:03d}.mp3")
            a_path = os.path.join(tmp, f"a_{idx:03d}.mp3")
            
            # Generate TTS for question and answer
            tts_to_file(f"Question {idx}: {q}", q_path, speed=SPEED_Q)
            tts_to_file(f"Answer: {a}", a_path, speed=SPEED_A)
            
            parts.extend([q_path, s_gap_qa, a_path, s_gap_card])

    if not parts:
        print(f"⚠️  No Q/A pairs found in {INPUT}")
        shutil.rmtree(tmp)
        sys.exit(0)

    # Create concat file for ffmpeg
    list_path = os.path.join(tmp, "concat.txt")
    with open(list_path, "w", encoding="utf-8") as lf:
        for p in parts:
            lf.write(f"file '{os.path.abspath(p)}'\n")

    # Merge all parts into final MP3
    print("🔄 Combining audio parts...")
    subprocess.check_call([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_path,
        "-vn",
        "-acodec", "libmp3lame",
        "-ar", "44100",      # sample rate
        "-ac", "2",          # channels  
        "-b:a", "192k",      # bitrate
        OUT_MP3
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    shutil.rmtree(tmp)
    print(f"✅ Done → {OUT_MP3}")
    print(f"   Voice: {VOICE} | Model: {MODEL} | Q Speed: {SPEED_Q} | A Speed: {SPEED_A}")

if __name__ == "__main__":
    main()
