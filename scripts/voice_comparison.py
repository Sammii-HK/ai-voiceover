#!/usr/bin/env python3
"""
Generate sample audio with different voices to compare quality.
Creates short test files with Edge TTS and OpenAI TTS for comparison.
"""

import os, sys, subprocess, tempfile, asyncio
import edge_tts
from openai import OpenAI

# Sample text for testing
SAMPLE_TEXT = "Question 1: What is the capital of France? Answer: The capital of France is Paris, located in the north-central part of the country."

def test_edge_voices():
    """Test Edge TTS voices"""
    print("🔄 Testing Edge TTS voices...")
    
    voices = [
        ("en-GB-LibbyNeural", "UK Female - Libby"),
        ("en-GB-SoniaNeural", "UK Female - Sonia"), 
        ("en-GB-RyanNeural", "UK Male - Ryan"),
        ("en-US-JennyNeural", "US Female - Jenny"),
        ("en-US-GuyNeural", "US Male - Guy")
    ]
    
    async def generate_edge_sample(voice_id, description):
        output_path = f"voice_samples/edge_{voice_id.replace('-', '_').lower()}.mp3"
        os.makedirs("voice_samples", exist_ok=True)
        
        com = edge_tts.Communicate(SAMPLE_TEXT, voice_id, rate="-5%")
        with open(output_path, "wb") as f:
            async for chunk in com.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
        
        print(f"  ✅ {description}: {output_path}")
    
    async def main_edge():
        tasks = []
        for voice_id, description in voices:
            tasks.append(generate_edge_sample(voice_id, description))
        await asyncio.gather(*tasks)
    
    asyncio.run(main_edge())

def test_openai_voices():
    """Test OpenAI TTS voices"""
    print("🔄 Testing OpenAI TTS voices...")
    
    if not os.environ.get("OPENAI_API_KEY"):
        print("❌ Skipping OpenAI voices - OPENAI_API_KEY not set")
        return
    
    client = OpenAI()
    
    voices = [
        ("alloy", "Neutral - Alloy"),
        ("echo", "Male - Echo"),
        ("fable", "British Accent - Fable"),
        ("onyx", "Deep Male - Onyx"),
        ("nova", "Young Female - Nova"),
        ("shimmer", "Soft Female - Shimmer")
    ]
    
    os.makedirs("voice_samples", exist_ok=True)
    
    for voice_id, description in voices:
        try:
            output_path = f"voice_samples/openai_{voice_id}.mp3"
            
            response = client.audio.speech.create(
                model="tts-1-hd",
                voice=voice_id,
                input=SAMPLE_TEXT,
                speed=0.95
            )
            
            with open(output_path, "wb") as f:
                f.write(response.content)
            
            print(f"  ✅ {description}: {output_path}")
            
        except Exception as e:
            print(f"  ❌ Failed to generate {description}: {e}")

def main():
    print("🎙️  Voice Comparison Tool")
    print("=" * 50)
    
    # Clean up old samples
    if os.path.exists("voice_samples"):
        subprocess.run(["rm", "-rf", "voice_samples"])
    
    test_edge_voices()
    print()
    test_openai_voices()
    
    print()
    print("🎧 Voice samples generated in ./voice_samples/")
    print("   Listen to compare quality and choose your preferred voice.")
    print()
    print("💡 Recommendations:")
    print("   • Edge TTS: Free, good quality - try en-GB-LibbyNeural")
    print("   • OpenAI: Premium, very natural - try 'nova' or 'fable'")

if __name__ == "__main__":
    main()
