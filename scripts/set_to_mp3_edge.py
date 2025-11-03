#!/usr/bin/env python3
"""
Render ONE MP3 per study set CSV using edge-tts + ffmpeg concat.
- No SSML (prevents tags being read aloud)
- Adds natural pauses between Q and A (0.9s) and between cards (1.2s)
- Questions at +0% (normal), Answers slightly slower (-10%) for clarity
"""

import csv, asyncio, tempfile, os, sys, subprocess, shutil
import edge_tts
import re

INPUT = sys.argv[1]
VOICE = os.environ.get("EDGE_VOICE", "en-GB-SoniaNeural")
Q_RATE = os.environ.get("EDGE_QUESTION_RATE", "+0%")   # <- always a string
A_RATE = os.environ.get("EDGE_ANSWER_RATE",  "0%")   # <- always a string
OUT_DIR = os.environ.get("OUT_DIR", "audio")

os.makedirs(OUT_DIR, exist_ok=True)
BASE = os.path.splitext(os.path.basename(INPUT))[0]
OUT_MP3 = os.path.join(OUT_DIR, f"{BASE}.mp3")

async def tts_to_file(text: str, out_path: str, rate: str):
    """Synthesize plain text (no SSML). Rate must be like '+0%' or '-10%'."""
    com = edge_tts.Communicate(text, VOICE, rate=rate)
    with open(out_path, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])

def silence_mp3(path: str, seconds: float):
    subprocess.check_call([
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-t", str(seconds),
        "-acodec", "libmp3lame",
        "-b:a", "192k",
        path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def split_sentences(text: str) -> list[str]:
    # simple sentence split – good enough for TTS pacing
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p for p in parts if p]


async def main():
    tmp = tempfile.mkdtemp(prefix="edge_parts_")
    parts = []

     # silences
    s_gap_qa   = os.path.join(tmp, "silence_0_9.mp3")  # Q -> A
    s_gap_card = os.path.join(tmp, "silence_1_2.mp3")  # between cards
    s_gap_sent = os.path.join(tmp, "silence_0_3.mp3")  # between sentences
    silence_mp3(s_gap_qa,   1.5)
    silence_mp3(s_gap_card, 2.0)
    silence_mp3(s_gap_sent, 0.3)

    with open(INPUT, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        idx = 0
        for row in reader:
            q = (row.get("Front","") or "").strip()
            a = (row.get("Back","")  or "").strip()
            if not q or not a:
                continue
            idx += 1
            q_path = os.path.join(tmp, f"q_{idx:03d}.mp3")
            a_path = os.path.join(tmp, f"a_{idx:03d}.mp3")
            await tts_to_file(f"Question {idx}: {q}", q_path, rate=Q_RATE)
            await tts_to_file(f"Answer: {a}",       a_path, rate=A_RATE)
            parts.extend([q_path, s_gap_qa, a_path, s_gap_card])

    if not parts:
        print(f"⚠️  No Q/A pairs found in {INPUT}")
        shutil.rmtree(tmp); sys.exit(0)

    list_path = os.path.join(tmp, "concat.txt")
    with open(list_path, "w", encoding="utf-8") as lf:
        for p in parts:
            lf.write(f"file '{os.path.abspath(p)}'\n")

        # merge and RE-ENCODE to uniform MP3 (fixes players stopping after 1st chunk)
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
    ])

    shutil.rmtree(tmp)
    print(f"✅ Done → {OUT_MP3}")

if __name__ == "__main__":
    asyncio.run(main())
