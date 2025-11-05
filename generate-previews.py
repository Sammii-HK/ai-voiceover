#!/usr/bin/env python3
"""
Generate voice preview samples for all available voices.
Run this once to create cached preview files.
"""

import asyncio
import os
from pathlib import Path
import edge_tts
from openai import OpenAI

# Preview text
PREVIEW_TEXT = "This is a preview of this voice. Clear, natural speech perfect for learning."

# Voice configurations
EDGE_VOICES = {
    'en-GB-LibbyNeural': 'UK Female - Libby (Natural)',
    'en-GB-SoniaNeural': 'UK Female - Sonia (Professional)',
    'en-GB-RyanNeural': 'UK Male - Ryan',
    'en-US-JennyNeural': 'US Female - Jenny',
    'en-US-GuyNeural': 'US Male - Guy'
}

OPENAI_VOICES = {
    'alloy': 'Neutral - Alloy (Clean, Apple-like)',
    'echo': 'Male - Echo',
    'fable': 'British Accent - Fable',
    'onyx': 'Deep Male - Onyx',
    'nova': 'Young Female - Nova (Most Natural)',
    'shimmer': 'Soft Female - Shimmer'
}

async def generate_edge_preview(voice_id: str, output_path: str):
    """Generate Edge TTS preview"""
    try:
        communicate = edge_tts.Communicate(PREVIEW_TEXT, voice_id, rate="+0%")
        with open(output_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
        print(f"✅ Generated Edge TTS preview: {voice_id}")
    except Exception as e:
        print(f"❌ Failed Edge TTS preview {voice_id}: {e}")

def generate_openai_preview(voice_id: str, output_path: str):
    """Generate OpenAI TTS preview"""
    try:
        client = OpenAI()
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice_id,
            input=PREVIEW_TEXT,
            speed=1.0
        )
        
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"✅ Generated OpenAI preview: {voice_id}")
    except Exception as e:
        print(f"❌ Failed OpenAI preview {voice_id}: {e}")

async def main():
    """Generate all voice previews"""
    
    # Create preview directory
    preview_dir = Path("voice_previews")
    preview_dir.mkdir(exist_ok=True)
    
    print("🎵 Generating voice previews...")
    print(f"📁 Output directory: {preview_dir.absolute()}")
    print(f"📝 Sample text: {PREVIEW_TEXT}")
    print()
    
    # Generate Edge TTS previews
    print("🔄 Generating Edge TTS previews...")
    edge_tasks = []
    for voice_id in EDGE_VOICES.keys():
        output_path = preview_dir / f"edge_{voice_id}.mp3"
        edge_tasks.append(generate_edge_preview(voice_id, str(output_path)))
    
    await asyncio.gather(*edge_tasks, return_exceptions=True)
    print()
    
    # Generate OpenAI previews
    if os.getenv('OPENAI_API_KEY'):
        print("🔄 Generating OpenAI previews...")
        for voice_id in OPENAI_VOICES.keys():
            output_path = preview_dir / f"openai_{voice_id}.mp3"
            generate_openai_preview(voice_id, str(output_path))
    else:
        print("⚠️  OPENAI_API_KEY not set, skipping OpenAI previews")
    
    print()
    print("🎉 Preview generation complete!")
    print(f"📂 Files saved to: {preview_dir.absolute()}")
    print()
    print("📤 Next steps:")
    print("1. Upload these files to your R2 bucket")
    print("2. Update preview URLs to point to R2")
    print("3. Enjoy instant voice previews!")

if __name__ == "__main__":
    asyncio.run(main())
