# AI Voiceover

## Scripts

# from the repo root (study-audio/)
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
mkdir -p audio

## Bash edge-tts
# batch all CSVs in csv/ with UK voice, slower answers; outputs to audio/
EDGE_VOICE="en-GB-SoniaNeural" EDGE_RATE="-10%" OUT_DIR="audio" \
for f in csv/*.csv; do
  echo "Rendering $f ..."
  python scripts/set_to_mp3_edge.py "$f"
done

## Say (offline)
brew install ffmpeg
mkdir -p audio
MAC_VOICE="Ava (Enhanced)" MAC_RATE="170" OUT_DIR="audio" \
for f in csv/*.csv; do
  echo "Rendering $f ..."
  python scripts/set_to_mp3_mac.py "$f"
done


## Voice Options

### Free (Edge TTS)
```bash
# UK voices (natural sounding)
EDGE_VOICE="en-GB-LibbyNeural" ./scripts/batch_generate.sh
EDGE_VOICE="en-GB-SoniaNeural" ./scripts/batch_generate.sh

# US voices  
EDGE_VOICE="en-US-JennyNeural" ./scripts/batch_generate.sh
EDGE_VOICE="en-US-GuyNeural" ./scripts/batch_generate.sh
```

### Premium (OpenAI TTS) - More Natural
```bash
# Set up API key first
export OPENAI_API_KEY="your-api-key-here"

# Generate with premium voices (very natural sounding)
./scripts/batch_generate_openai.sh

# Or customize voice:
OPENAI_VOICE="nova" ./scripts/batch_generate_openai.sh    # Young female
OPENAI_VOICE="fable" ./scripts/batch_generate_openai.sh   # British accent
OPENAI_VOICE="onyx" ./scripts/batch_generate_openai.sh    # Deep male
```

### Compare Voices
```bash
# Generate samples of all voices for comparison
python scripts/voice_comparison.py
# Then listen to files in ./voice_samples/ folder
```

**Voice Recommendations:**
- **Most Natural**: OpenAI "nova" or "fable" (premium, ~$15/1M characters)
- **Best Free**: Edge TTS "en-GB-LibbyNeural" 
- **Not Too Conversational**: OpenAI "alloy" or Edge "en-GB-SoniaNeural"

## 🌐 Web App

### Quick Start
```bash
# 1. Add your OpenAI API key to .env file
echo "OPENAI_API_KEY=your-api-key-here" >> .env

# 2. Run the web app
./run.sh

# 3. Open http://localhost:5000
```

### Features
- 🎨 **Clean, Modern UI** - Apple-inspired design
- 📁 **Drag & Drop Upload** - Easy CSV file handling  
- 🎙️ **Voice Selection** - Choose between free and premium voices
- ⚡ **Temporary Files** - No storage needed, files cleaned up automatically
- 📱 **Responsive** - Works on desktop and mobile

### Deployment

**Docker:**
```bash
# Build and run with Docker
docker-compose up --build

# Or build manually
docker build -t ai-voiceover .
docker run -p 5000:5000 --env-file .env ai-voiceover
```

**Environment Variables:**
```bash
OPENAI_API_KEY=your-api-key-here  # Required for premium voices
FLASK_ENV=production              # For deployment
SECRET_KEY=your-secret-key        # For session security
```