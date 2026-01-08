# Testing Guide - WebSocket + gRPC Streaming

## Important Notes Before Testing

### Backend Changes
1. **Deprecated Endpoint Removed**: The HTTP `/api/transcribe` endpoint has been commented out
2. **Only WebSocket Endpoint Active**: `/ws/transcribe/{session_id}` is the only transcription endpoint
3. **Deprecated Files**: `transcription.py`, `transcription_streaming.py`, and `models.py` are no longer used
4. **Firebase Integration**: Final transcripts are automatically published to Firebase Realtime DB

### Configuration Updates
The backend now uses these settings for WebSocket streaming:
- **Cloud Run Region**: `africa-south1` (near Kenya, low latency)
- **Speech API Region**: `us` (guaranteed chirp_3 + sw-KE support)
- **Model**: `chirp_3` (best multilingual accuracy)
- **Languages**: `en-US` (primary) + `sw-KE` (Swahili Kenya)
- **Sample Rate**: 48kHz (browser standard)

## Prerequisites

1. **Backend Requirements**:
   - Python 3.12
   - Google Cloud credentials configured
   - All dependencies installed from requirements.txt

2. **Frontend Requirements**:
   - Node.js 18+
   - Firebase credentials in `.env`
   - npm dependencies installed

## Step-by-Step Testing

### 1. Backend Setup

```bash
# Navigate to backend directory
cd "/Users/mac/Desktop/GCP Projects/sauti-darasa-backend"

# Install dependencies (if not already done)
pip install -r requirements.txt

# Verify Google Cloud credentials
echo $GOOGLE_APPLICATION_CREDENTIALS
# Should point to your service account JSON file

# Start backend server
uvicorn app.main:app --reload --port 8000
```

**Expected Output**:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
🚀 Sauti Darasa Backend starting...
Project: <your-project-id>
Region: africa-south1
Allowed Origins: [...]
📡 WebSocket endpoint: /ws/transcribe/{session_id}
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Note**: If you see any import errors related to `transcription.py` or `models.py`, those files are deprecated and the imports have been removed.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd "/Users/mac/Desktop/GCP Projects/SautiDarasa"

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Test WebSocket Connection

1. Open browser to `http://localhost:5173/teacher`
2. Open browser console (F12 → Console tab)
3. Click "Start Recording"
4. Grant microphone permission if prompted

**Expected Console Output**:
```
🔌 Connecting to WebSocket: ws://localhost:8000/ws/transcribe/ABC123
✅ WebSocket connected
[AudioRecorder] Started recording with PCM LINEAR16...
[AudioRecorder] Audio chunk captured: X samples
[AudioRecorder] Sending PCM chunk: X bytes...
```

### 4. Test Audio Streaming

1. Speak into microphone: "Hello, this is a test"
2. Watch the console for:
   - Audio chunks being sent
   - Interim transcripts received
   - Final transcripts received

**Expected Backend Logs**:
```
🔌 WebSocket connected: ABC123
🎙️  Starting streaming for session: ABC123
⏳ Hello (confidence: 0.00%)
⏳ Hello this (confidence: 0.00%)
⏳ Hello this is (confidence: 0.00%)
✅ Hello this is a test (confidence: 0.95%)
✅ Published to Firebase: Hello this is a test
```

**Note**: You should see "Published to Firebase" logs for final transcripts. This means the transcript is being saved to Firebase Realtime Database at `/captions/{session_id}/latest`.

**Expected Frontend Logs**:
```
⏳ Interim: Hello
⏳ Interim: Hello this
⏳ Interim: Hello this is
✅ Final: Hello this is a test
✅ Saved final transcript to Firestore
```

### 5. Test Live Transcription Display

1. Watch the "Live Transcription" section on TeacherView
2. Interim transcripts should appear in gray, italic
3. Final transcripts should appear in white, normal
4. Display should auto-scroll as transcripts accumulate

### 6. Test Firebase Persistence

**Two places to check:**

1. **Firebase Realtime Database** (for live captions):
   ```bash
   # Check Firebase Console → Realtime Database
   # Navigate to: /captions/{session_id}/latest
   # Should see:
   # {
   #   "text": "Hello this is a test",
   #   "timestamp": 1704729600000
   # }
   ```

2. **Firestore** (for transcript history):
   ```bash
   # Check Firebase Console → Firestore
   # Navigate to: sessions/{session_id}/transcripts
   # Should see documents with:
   # - text: "Hello this is a test"
   # - timestamp: <server timestamp>
   # - isFinal: true
   ```

**Note**: 
- Realtime Database gets updated immediately for live captions (students see this)
- Firestore stores transcript history (for later review/analysis)

### 7. Test Connection Status

1. **Check dual status indicators**:
   - Firebase: Should show green "Connected"
   - WebSocket: Should show green "Connected"

2. **Test reconnection**:
   - Stop backend server
   - WebSocket status should turn red "Disconnected"
   - Restart backend server
   - Should auto-reconnect within 2 seconds

### 8. Test Stop Recording

1. Click "Stop Recording"
2. Audio streaming should stop
3. WebSocket should disconnect gracefully

**Expected Backend Logs**:
```
🛑 Stopped streaming for session: ABC123
🔚 WebSocket closed: ABC123
```

## Common Issues & Solutions

### Issue: "WebSocket connection error"
**Solution**: Check if backend is running on port 8000

### Issue: "No audio chunks being sent"
**Solution**: Check microphone permission in browser settings

### Issue: "No transcriptions received"
**Solution**: 
- Verify Google Cloud credentials
- Check Speech API is enabled
- Verify quota/billing is active

### Issue: "Firestore error"
**Solution**: Check Firebase credentials in `.env` file

## Performance Metrics to Verify

1. **Latency**: 
   - Time from speaking to interim result: Should be < 500ms
   - Time from speaking to final result: Should be < 2 seconds

2. **Audio Chunk Rate**:
   - Should send chunks every ~100ms
   - Each chunk should be ~4800 samples (100ms × 48kHz)

3. **Transcription Accuracy**:
   - English speech: Should be > 95% accurate
   - Swahili speech: Should be > 90% accurate (if sw-KE is detected)

## Success Criteria

✅ WebSocket connects successfully  
✅ Audio chunks stream every 100ms  
✅ Interim transcripts appear word-by-word  
✅ Final transcripts are accurate  
✅ Transcripts saved to Firestore  
✅ Connection status indicators work  
✅ Reconnection works automatically  
✅ Stop recording disconnects gracefully  
✅ Latency < 500ms for interim results  
✅ No errors in console or backend logs  

## Next Steps After Testing

Once all tests pass:
1. Report results to project lead
2. Get approval for deployment
3. Deploy to Cloud Run
4. Commit code to repository
5. Update documentation

---

**Testing Checklist**: Use this as a guide to ensure all features work correctly before deployment.
