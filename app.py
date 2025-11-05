#!/usr/bin/env python3
"""
AI Voiceover Web App
Simple Flask app for generating study audio from CSV files
"""

import os, csv, tempfile, subprocess, shutil, atexit, time
from flask import Flask, render_template, request, jsonify, send_file, flash, redirect, url_for, after_this_request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from openai import OpenAI
import asyncio
import edge_tts
import threading
from datetime import datetime
import uuid
import glob

# Load environment variables (Railway provides them directly)
load_dotenv()  # For local development
# Railway environment variables are automatically available via os.environ

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# Enable CORS for production
CORS(app, origins=['https://ai-voiceover-three.vercel.app', 'http://localhost:3000', 'http://localhost:4173'])

# Configuration
TEMP_FOLDER = tempfile.gettempdir()
UPLOAD_TEMP_FOLDER = 'temp_uploads'  # Temporary CSV storage during processing
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'csv'}

# Ensure temp upload directory exists
os.makedirs(UPLOAD_TEMP_FOLDER, exist_ok=True)

app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Keep track of temporary files for cleanup
temp_files = set()
processing_jobs = {}  # Track active processing jobs

def cleanup_temp_files():
    """Clean up any remaining temp files on app shutdown"""
    for temp_file in temp_files.copy():
        try:
            if os.path.exists(temp_file):
                os.remove(temp_file)
            temp_files.discard(temp_file)
        except:
            pass
    
    # Clean up temp uploads folder
    try:
        if os.path.exists(UPLOAD_TEMP_FOLDER):
            shutil.rmtree(UPLOAD_TEMP_FOLDER)
            os.makedirs(UPLOAD_TEMP_FOLDER, exist_ok=True)
    except:
        pass

def get_uploaded_files():
    """Get list of temporarily uploaded CSV files"""
    try:
        files = []
        for filepath in glob.glob(os.path.join(UPLOAD_TEMP_FOLDER, "*.csv")):
            filename = os.path.basename(filepath)
            stat = os.stat(filepath)
            files.append({
                'name': filename,
                'size': stat.st_size,
                'uploaded': datetime.fromtimestamp(stat.st_mtime).strftime('%H:%M:%S'),
                'path': filepath,
                'status': processing_jobs.get(filename, 'ready')
            })
        return sorted(files, key=lambda x: x['uploaded'], reverse=True)
    except:
        return []

def cleanup_old_uploads():
    """Clean up uploads older than 1 hour"""
    try:
        current_time = time.time()
        for filepath in glob.glob(os.path.join(UPLOAD_TEMP_FOLDER, "*.csv")):
            if current_time - os.path.getmtime(filepath) > 3600:  # 1 hour
                filename = os.path.basename(filepath)
                if filename not in processing_jobs:  # Don't delete if still processing
                    os.remove(filepath)
    except:
        pass

# Register cleanup function
atexit.register(cleanup_temp_files)

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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_csv(filepath):
    """Validate CSV has Front and Back columns"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            if not fieldnames or 'Front' not in fieldnames or 'Back' not in fieldnames:
                return False, "CSV must have 'Front' and 'Back' columns"
            
            # Check if there's at least one valid row
            for row in reader:
                if row.get('Front', '').strip() and row.get('Back', '').strip():
                    return True, "Valid CSV"
            return False, "No valid Q&A pairs found"
    except Exception as e:
        return False, f"Error reading CSV: {str(e)}"

def silence_mp3(path: str, seconds: float):
    """Generate silent MP3"""
    subprocess.check_call([
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-t", str(seconds), "-acodec", "libmp3lame", "-b:a", "192k", path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

async def generate_edge_tts(csv_path, voice, output_path):
    """Generate audio using Edge TTS"""
    tmp = tempfile.mkdtemp(prefix="edge_parts_")
    parts = []
    
    # Create silence files
    s_gap_qa = os.path.join(tmp, "silence_qa.mp3")
    s_gap_card = os.path.join(tmp, "silence_card.mp3")
    silence_mp3(s_gap_qa, 1.5)
    silence_mp3(s_gap_card, 2.0)
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        idx = 0
        for row in reader:
            q = (row.get("Front", "") or "").strip()
            a = (row.get("Back", "") or "").strip()
            if not q or not a:
                continue
            idx += 1
            
            q_path = os.path.join(tmp, f"q_{idx:03d}.mp3")
            a_path = os.path.join(tmp, f"a_{idx:03d}.mp3")
            
            # Generate TTS
            com_q = edge_tts.Communicate(f"Question {idx}: {q}", voice, rate="+0%")
            with open(q_path, "wb") as f:
                async for chunk in com_q.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
            
            com_a = edge_tts.Communicate(f"Answer: {a}", voice, rate="-5%")
            with open(a_path, "wb") as f:
                async for chunk in com_a.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
            
            parts.extend([q_path, s_gap_qa, a_path, s_gap_card])
    
    if not parts:
        shutil.rmtree(tmp)
        raise Exception("No valid Q&A pairs found")
    
    # Concatenate
    list_path = os.path.join(tmp, "concat.txt")
    with open(list_path, "w", encoding="utf-8") as lf:
        for p in parts:
            lf.write(f"file '{os.path.abspath(p)}'\n")
    
    subprocess.check_call([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
        "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-ac", "2", "-b:a", "192k",
        output_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    shutil.rmtree(tmp)

def generate_openai_tts(csv_path, voice, output_path):
    """Generate audio using OpenAI TTS"""
    client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    
    tmp = tempfile.mkdtemp(prefix="openai_parts_")
    parts = []
    
    # Create silence files
    s_gap_qa = os.path.join(tmp, "silence_qa.mp3")
    s_gap_card = os.path.join(tmp, "silence_card.mp3")
    silence_mp3(s_gap_qa, 1.5)
    silence_mp3(s_gap_card, 2.0)
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        idx = 0
        for row in reader:
            q = (row.get("Front", "") or "").strip()
            a = (row.get("Back", "") or "").strip()
            if not q or not a:
                continue
            idx += 1
            
            q_path = os.path.join(tmp, f"q_{idx:03d}.mp3")
            a_path = os.path.join(tmp, f"a_{idx:03d}.mp3")
            
            # Generate TTS
            response_q = client.audio.speech.create(
                model="tts-1-hd", voice=voice, 
                input=f"Question {idx}: {q}", speed=1.0
            )
            with open(q_path, "wb") as f:
                f.write(response_q.content)
            
            response_a = client.audio.speech.create(
                model="tts-1-hd", voice=voice,
                input=f"Answer: {a}", speed=0.9
            )
            with open(a_path, "wb") as f:
                f.write(response_a.content)
            
            parts.extend([q_path, s_gap_qa, a_path, s_gap_card])
    
    if not parts:
        shutil.rmtree(tmp)
        raise Exception("No valid Q&A pairs found")
    
    # Concatenate
    list_path = os.path.join(tmp, "concat.txt")
    with open(list_path, "w", encoding="utf-8") as lf:
        for p in parts:
            lf.write(f"file '{os.path.abspath(p)}'\n")
    
    subprocess.check_call([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
        "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-ac", "2", "-b:a", "192k",
        output_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    shutil.rmtree(tmp)

@app.route('/')
def index():
    cleanup_old_uploads()  # Clean up old files
    uploaded_files = get_uploaded_files()
    return render_template('index.html', 
                         edge_voices=EDGE_VOICES,
                         openai_voices=OPENAI_VOICES,
                         has_openai_key=bool(os.environ.get('OPENAI_API_KEY')),
                         uploaded_files=uploaded_files)

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload CSV file temporarily for processing"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Please upload a CSV file'}), 400
        
        # Save to temp uploads folder
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_TEMP_FOLDER, safe_filename)
        file.save(filepath)
        
        # Validate CSV
        is_valid, message = validate_csv(filepath)
        if not is_valid:
            os.remove(filepath)
            return jsonify({'error': f'Invalid CSV: {message}'}), 400
        
        return jsonify({
            'success': True,
            'filename': safe_filename,
            'original_name': filename,
            'message': 'File uploaded successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/files')
def list_files():
    """Get list of uploaded files"""
    cleanup_old_uploads()
    return jsonify({'files': get_uploaded_files()})

@app.route('/delete/<filename>', methods=['POST'])
def delete_file(filename):
    """Delete uploaded file"""
    try:
        filepath = os.path.join(UPLOAD_TEMP_FOLDER, secure_filename(filename))
        if os.path.exists(filepath):
            # Don't delete if currently processing
            if filename in processing_jobs and processing_jobs[filename] == 'processing':
                return jsonify({'error': 'File is currently being processed'}), 400
            
            os.remove(filepath)
            # Clean up from processing jobs
            if filename in processing_jobs:
                del processing_jobs[filename]
            
            return jsonify({'success': True, 'message': 'File deleted'})
        else:
            return jsonify({'error': 'File not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate/<filename>', methods=['POST'])
def generate_audio(filename):
    """Generate audio from uploaded CSV file"""
    try:
        # Get the uploaded file
        filepath = os.path.join(UPLOAD_TEMP_FOLDER, secure_filename(filename))
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        # Check if already processing
        if filename in processing_jobs and processing_jobs[filename] == 'processing':
            return jsonify({'error': 'File is already being processed'}), 400
        
        # Get voice settings from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No voice settings provided'}), 400
            
        voice_type = data.get('voice_type', 'edge')
        voice = data.get('voice')
        
        if not voice:
            return jsonify({'error': 'Please select a voice'}), 400
        
        if voice_type == 'openai' and not os.environ.get('OPENAI_API_KEY'):
            return jsonify({'error': 'OpenAI API key not configured'}), 400
        
        # Mark as processing
        processing_jobs[filename] = 'processing'
        
        # Generate in background thread
        def generate_in_background():
            try:
                unique_id = str(uuid.uuid4())[:8]
                base_name = os.path.splitext(filename)[0]
                temp_output = os.path.join(TEMP_FOLDER, f"output_{unique_id}.mp3")
                temp_files.add(temp_output)
                
                # Generate audio
                if voice_type == 'edge':
                    asyncio.run(generate_edge_tts(filepath, voice, temp_output))
                elif voice_type == 'openai':
                    generate_openai_tts(filepath, voice, temp_output)
                
                # Mark as completed and store output path
                processing_jobs[filename] = {
                    'status': 'completed',
                    'output_path': temp_output,
                    'download_name': f"{base_name}_{voice}.mp3",
                    'completed_at': datetime.now()
                }
                
            except Exception as e:
                processing_jobs[filename] = f'error: {str(e)}'
                if 'temp_output' in locals() and os.path.exists(temp_output):
                    os.remove(temp_output)
                    temp_files.discard(temp_output)
        
        # Start background processing
        thread = threading.Thread(target=generate_in_background)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Audio generation started',
            'filename': filename
        })
        
    except Exception as e:
        if filename in processing_jobs:
            del processing_jobs[filename]
        return jsonify({'error': str(e)}), 500

@app.route('/status/<filename>')
def get_status(filename):
    """Get processing status of a file"""
    status = processing_jobs.get(filename, 'ready')
    if isinstance(status, dict) and status.get('status') == 'completed':
        return jsonify({
            'status': 'completed',
            'download_ready': True,
            'completed_at': status['completed_at'].strftime('%H:%M:%S')
        })
    elif isinstance(status, str) and status.startswith('error:'):
        return jsonify({
            'status': 'error',
            'error': status[7:]  # Remove 'error: ' prefix
        })
    else:
        return jsonify({'status': status})

@app.route('/download/<filename>')
def download_audio(filename):
    """Download generated audio file"""
    try:
        job = processing_jobs.get(filename)
        if not isinstance(job, dict) or job.get('status') != 'completed':
            return jsonify({'error': 'File not ready for download'}), 400
        
        output_path = job['output_path']
        download_name = job['download_name']
        
        if not os.path.exists(output_path):
            return jsonify({'error': 'Generated file not found'}), 404
        
        # Clean up after download
        @after_this_request
        def cleanup_after_download(response):
            try:
                # Remove the generated MP3
                if os.path.exists(output_path):
                    os.remove(output_path)
                temp_files.discard(output_path)
                
                # Remove the uploaded CSV
                csv_path = os.path.join(UPLOAD_TEMP_FOLDER, filename)
                if os.path.exists(csv_path):
                    os.remove(csv_path)
                
                # Clean up processing job
                if filename in processing_jobs:
                    del processing_jobs[filename]
                    
            except:
                pass
            return response
        
        return send_file(output_path, as_attachment=True, download_name=download_name)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
