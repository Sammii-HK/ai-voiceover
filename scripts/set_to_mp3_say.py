# import csv, subprocess, tempfile, os, sys

# INPUT = sys.argv[1] if len(sys.argv) > 1 else "YourSet.csv"
# VOICE = os.environ.get("MAC_VOICE", "Samantha")  # e.g. "Ava (Enhanced)"
# RATE  = os.environ.get("MAC_RATE", "180")        # words per minute
# AIFF  = "study_set.aiff"
# MP3   = os.path.splitext(INPUT)[0] + ".mp3"

# def build_script(csv_path):
#     parts = []
#     with open(csv_path, newline="", encoding="utf-8") as f:
#         reader = csv.DictReader(f)
#         for i, row in enumerate(reader, start=1):
#             q = (row.get("Front","") or "").strip()
#             a = (row.get("Back","") or "").strip()
#             if not q or not a: 
#                 continue
#             parts.append(f"Question {i}: {q}.")
#             parts.append("[[slnc 900]]")   # pause before answer
#             parts.append(f"Answer: {a}.")
#             parts.append("[[slnc 1200]]")  # longer pause between cards
#     return " ".join(parts)

# script_text = build_script(INPUT)
# with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as tmp:
#     tmp.write(script_text)
#     txt = tmp.name

# # Generate AIFF with macOS 'say'
# subprocess.check_call(["say", "-v", VOICE, "-r", RATE, "-f", txt, "-o", AIFF])

# # Convert to MP3
# subprocess.check_call(["ffmpeg", "-y", "-i", AIFF, "-codec:a", "libmp3lame", "-qscale:a", "2", MP3])

# os.remove(AIFF)
# os.remove(txt)
# print(f"Done → {MP3}")
# print("Tip: set env vars e.g. MAC_VOICE='Ava (Enhanced)' MAC_RATE=170")


import csv, asyncio, tempfile, os, sys, shutil
from pydub import AudioSegment
import edge_tts

# USAGE: python scripts/set_to_mp3_edge.py csv/Set14_Systems_Thinking.csv
INPUT = sys.argv[1]
VOICE = os.environ.get("EDGE_VOICE", "en-GB-SoniaNeural")
RATE  = os.environ.get("EDGE_RATE", "-10%")  # slower answers
OUT_DIR = os.environ.get("OUT_DIR", "audio")

os.makedirs(OUT_DIR, exist_ok=True)
BASE = os.path.splitext(os.path.basename(INPUT))[0]
OUT_MP3 = os.path.join(OUT_DIR, f"{BASE}.mp3")

def ssml_card(i, q, a):
    return f"""
<speak version="1.0" xml:lang="en-US">
  <s>Question {i}: {q}</s>
  <break time="900ms"/>
  <prosody rate="{RATE}">
    <s>Answer: {a}</s>
  </prosody>
  <break time="1200ms"/>
</speak>
"""

async def synth_ssml(ssml, path):
    com = edge_tts.Communicate(ssml, VOICE)
    with open(path, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])

async def main():
    tmpdir = tempfile.mkdtemp()
    parts = []
    with open(INPUT, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            q = (row.get("Front","") or "").strip()
            a = (row.get("Back","") or "").strip()
            if not q or not a: continue
            mp3_part = os.path.join(tmpdir, f"part_{i:03d}.mp3")
            await synth_ssml(ssml_card(i, q, a), mp3_part)
            parts.append(mp3_part)

    # merge into a single mp3
    merged = AudioSegment.silent(duration=250)
    for p in parts:
        merged += AudioSegment.from_file(p)
    merged.export(OUT_MP3, format="mp3", bitrate="192k")
    shutil.rmtree(tmpdir)
    print(f"Done → {OUT_MP3}")

if __name__ == "__main__":
    asyncio.run(main())
  