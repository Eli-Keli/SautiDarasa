# Sauti Darasa Real-Time Streaming Transcription Architecture

**Date**: January 7, 2026  
**Status**: Proposed - Ready for Implementation

## Executive Summary

After extensive research into Google Cloud Speech-to-Text V2 API, we need to **completely redesign** the transcription pipeline from HTTP-based request/response to **bidirectional streaming** using WebSocket and gRPC.

## Current Architecture (Problems)

```
Frontend AudioWorklet → HTTP POST (every 5s) → FastAPI → Speech.Recognize → Response
```

**Issues:**
- ❌ Using `Speech.Recognize` (designed for audio < 60s, not real-time)
- ❌ HTTP request/response adds latency (network roundtrip every 5s)
- ❌ Not truly "streaming" - just batching chunks
- ❌ Can't get interim results (word-by-word transcription)
- ❌ Higher cost (each chunk = separate API call)

## New Architecture (Optimal)

```
Frontend AudioWorklet → WebSocket → FastAPI WebSocket Handler → gRPC Stream → Speech.StreamingRecognize → Real-time results back via WebSocket
```

**Benefits:**
- ✅ True bidirectional streaming (continuous audio flow)
- ✅ Real-time interim results (words appear as spoken)
- ✅ Lower latency (~100-200ms vs 1-2s)
- ✅ Single gRPC connection (cost-effective)
- ✅ Designed specifically for live audio
- ✅ Can use Chirp 3 model (best accuracy)

---

## Implementation Plan

### Phase 1: Backend WebSocket + gRPC Streaming

#### 1.1 Install gRPC Dependencies
```bash
cd sauti-darasa-backend
pip install grpcio grpcio-tools
```

#### 1.2 Create WebSocket Endpoint (`app/websocket.py`)
```python
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech
from google.api_core.client_options import ClientOptions
import asyncio
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

REGION = "us"  # US region for guaranteed chirp_3 availability
PROJECT_ID = "sauti-darasa"

class TranscriptionStream:
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.client = SpeechClient(
            client_options=ClientOptions(
                api_endpoint=f"{REGION}-speech.googleapis.com"
            )
        )
        self.audio_queue = asyncio.Queue()
        self.is_streaming = False
    
    async def start(self):
        """Start bidirectional streaming"""
        self.is_streaming = True
        
        logger.info(f"🎙️  Starting streaming for session: {self.session_id}")
        
        # Create streaming config with chirp_3
        recognition_config = cloud_speech.RecognitionConfig(
            auto_decoding_config=cloud_speech.AutoDetectDecodingConfig(),
            language_codes=["en-US", "sw-KE"],  # English + Swahili Kenya
            model="chirp_3",
            features=cloud_speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
            ),
        )
        
        streaming_config = cloud_speech.StreamingRecognitionConfig(
            config=recognition_config,
            streaming_features=cloud_speech.StreamingRecognitionFeatures(
                interim_results=True  # Get word-by-word results
            ),
        )
        
        # Initial config request
        config_request = cloud_speech.StreamingRecognizeRequest(
            recognizer=f"projects/{PROJECT_ID}/locations/{REGION}/recognizers/_",
            streaming_config=streaming_config,
        )
        
        # Generator for audio requests
        async def audio_generator():
            yield config_request
            while self.is_streaming:
                try:
                    audio_data = await asyncio.wait_for(
                        self.audio_queue.get(), 
                        timeout=1.0
                    )
                    yield cloud_speech.StreamingRecognizeRequest(audio=audio_data)
                except asyncio.TimeoutError:
                    continue
        
        try:
            # Start gRPC streaming
            responses = self.client.streaming_recognize(
                requests=audio_generator()
            )
            
            # Process responses and send back via WebSocket
            for response in responses:
                for result in response.results:
                    transcript = result.alternatives[0].transcript
                    is_final = result.is_final
                    
                    logger.info(f"{'✅' if is_final else '⏳'} {transcript}")
                    
                    await self.websocket.send_json({
                        "type": "transcription",
                        "transcript": transcript,
                        "isFinal": is_final,
                        "sessionId": self.session_id,
                    })
        except Exception as e:
            logger.error(f"❌ Streaming error: {str(e)}", exc_info=True)
            await self.websocket.send_json({
                "type": "error",
                "message": str(e),
            })
    
    async def send_audio(self, audio_bytes: bytes):
        """Queue audio data for streaming"""
        await self.audio_queue.put(audio_bytes)
    
    async def stop(self):
        """Stop streaming"""
        self.is_streaming = False
        logger.info(f"🛑 Stopped streaming for session: {self.session_id}")


@router.websocket("/ws/transcribe/{session_id}")
async def websocket_transcribe(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    logger.info(f"🔌 WebSocket connected: {session_id}")
    
    stream = TranscriptionStream(websocket, session_id)
    
    try:
        # Start streaming in background
        streaming_task = asyncio.create_task(stream.start())
        
        # Receive audio from frontend
        while True:
            data = await websocket.receive()
            
            if "bytes" in data:
                # Received audio chunk
                await stream.send_audio(data["bytes"])
            elif "text" in data:
                message = json.loads(data["text"])
                if message.get("command") == "stop":
                    break
        
        await stream.stop()
        await streaming_task
        
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {session_id}")
        await stream.stop()
    except Exception as e:
        logger.error(f"❌ WebSocket error: {str(e)}", exc_info=True)
        await stream.stop()
```

#### 1.3 Update `app/main.py`
```python
from fastapi import FastAPI
from app.websocket import router as websocket_router

app = FastAPI()
app.include_router(websocket_router)
```

#### 1.4 Update `requirements.txt`
```
fastapi==0.115.5
uvicorn[standard]==0.32.1
google-cloud-speech==2.28.0
grpcio==1.62.0
grpcio-tools==1.62.0
websockets==12.0
python-multipart==0.0.20
google-cloud-firestore==2.18.0
pydantic==2.10.5
pydantic-settings==2.6.1
pytest==8.3.4
httpx==0.28.1
```

---

### Phase 2: Frontend WebSocket Client

#### 2.1 Create WebSocket Hook (`src/hooks/useTranscriptionWebSocket.ts`)
```typescript
import { useEffect, useRef, useState } from 'react';

interface UseTranscriptionWebSocketOptions {
  sessionId: string;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  enabled: boolean;
}

export const useTranscriptionWebSocket = ({
  sessionId,
  onTranscript,
  enabled,
}: UseTranscriptionWebSocketOptions) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    // Get WebSocket URL from environment
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://sauti-darasa-backend-512236104756.africa-south1.run.app';
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const url = `${wsUrl}/ws/transcribe/${sessionId}`;

    console.log('[TranscriptionWS] Connecting to:', url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[TranscriptionWS] Connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'transcription') {
          onTranscript(data.transcript, data.isFinal);
        }
      } catch (err) {
        console.error('[TranscriptionWS] Parse error:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('[TranscriptionWS] Error:', event);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('[TranscriptionWS] Disconnected');
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command: 'stop' }));
      }
      ws.close();
    };
  }, [enabled, sessionId, onTranscript]);

  const sendAudioChunk = (audioBlob: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioBlob);
    }
  };

  return {
    isConnected,
    error,
    sendAudioChunk,
  };
};
```

#### 2.2 Update `src/pages/TeacherView.tsx`
```typescript
import { useTranscriptionWebSocket } from '../hooks/useTranscriptionWebSocket';

// Inside component:
const [interimTranscript, setInterimTranscript] = useState('');
const [finalTranscript, setFinalTranscript] = useState('');

const { isConnected, sendAudioChunk } = useTranscriptionWebSocket({
  sessionId,
  enabled: isRecording,
  onTranscript: (transcript, isFinal) => {
    if (isFinal) {
      setFinalTranscript(prev => prev + ' ' + transcript);
      setInterimTranscript('');
      
      // Save to Firebase
      saveTranscriptionToFirebase(sessionId, transcript);
    } else {
      setInterimTranscript(transcript);
    }
  },
});

// Update audio recorder to use WebSocket
const { startRecording, stopRecording } = useAudioRecorder({
  onDataAvailable: sendAudioChunk,  // Send directly to WebSocket
  chunkDuration: 100,  // Stream every 100ms (very responsive)
  sampleRate: 48000,
});
```

---

### Phase 3: Testing & Optimization

#### 3.1 Test Locally
```bash
# Backend
cd sauti-darasa-backend
uvicorn app.main:app --reload

# Frontend  
cd SautiDarasa
npm run dev

# Test streaming with live microphone
```

#### 3.2 Monitor Performance
- Measure latency (speech → transcription display)
- Monitor gRPC connection stability
- Check Firebase write frequency (only on final results)
- Test with poor network conditions

#### 3.3 Optimize
- Add reconnection logic for WebSocket drops
- Implement exponential backoff
- Add audio buffering for network jitter
- Cache interim results to avoid redundant writes

---

## Cost Comparison

### Current (HTTP + Recognize)
- 5-second chunks = 12 API calls/minute
- Each call processed separately
- **Estimated**: $0.024/minute ($1.44/hour)

### New (gRPC Streaming)
- 1 streaming session/teacher
- Single API call for entire session
- **Estimated**: $0.016/minute ($0.96/hour)
- **Savings**: ~33% cost reduction

---

## Migration Strategy

### Step 1: Parallel Implementation (Week 1)
- Keep existing HTTP endpoint
- Add new WebSocket endpoint
- Frontend can use both (feature flag)

### Step 2: Testing (Week 1-2)
- Test with small group of teachers
- Compare accuracy and latency
- Fix bugs and optimize

### Step 3: Full Migration (Week 2)
- Switch all sessions to WebSocket
- Monitor for 48 hours
- Remove old HTTP endpoint if stable

### Step 4: Cleanup (Week 3)
- Remove HTTP transcription code
- Update documentation
- Archive old implementation

---

## Regional Considerations

### Africa-South1 Region
- Closest to Kenya
- Lower latency for teachers
- **However**: Chirp 3 may not be available in all regions

### US Region
- Guaranteed Chirp 3 availability
- Slightly higher latency (~50-100ms)
- **Recommendation**: Start with US, migrate to Africa-South1 when Chirp 3 available

---

## Success Metrics

- **Latency**: < 500ms (speech → student screen)
- **Accuracy**: > 95% (English), > 90% (Swahili)
- **Uptime**: > 99.5%
- **Cost**: < $1/hour per active session
- **User Satisfaction**: Teacher feedback rating > 4.5/5

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Implement WebSocket backend (4-6 hours)
3. ⏳ Implement WebSocket frontend (3-4 hours)
4. ⏳ Test locally (2-3 hours)
5. ⏳ Deploy to Cloud Run (1 hour)
6. ⏳ Production testing (1-2 days)
7. ⏳ Full migration (1 week monitoring)

**Total Implementation Time**: 2-3 days of focused development

---

## Final Decisions ✅

### 1. Region Architecture
**Decision**: Hybrid approach for optimal performance

- **Cloud Run Services** (Frontend + Backend): Deploy to `africa-south1`
  - Closest to Kenya
  - Low latency for WebSocket connections (~50-100ms)
  - Reduces network costs
  
- **Speech-to-Text API**: Use `us` region endpoint
  - Guaranteed `chirp_3` model availability
  - Supports both `en-US` (English) and `sw-KE` (Swahili Kenya) ✅
  - API call latency: ~100-150ms (acceptable for streaming)

**Implementation**: Backend connects to `us-speech.googleapis.com`, services stay in `africa-south1`

### 2. Language Support
**Decision**: English (primary) + Swahili Kenya (backup)

```python
language_codes=["en-US", "sw-KE"]  # Auto-detects between both
```

- Most Kenyan teachers use English as medium of instruction
- Swahili for code-switching scenarios (common in Kenyan classrooms)
- Both languages support `chirp_3` model in US region
- Future: Can add `kam-KE` (Kamba) and `luo-KE` (Luo) if needed

### 3. Interim Results
**Decision**: Show word-by-word transcription

```python
interim_results=True  # Real-time word appearance
```

- Better user experience (feels more responsive)
- Teachers can see transcription progress
- Only final results saved to Firebase (reduces writes)

### 4. HTTP Fallback
**Decision**: Keep HTTP endpoint for reference

- Useful for debugging/comparison
- Can serve as emergency fallback if WebSocket fails
- Mark as deprecated in documentation
- Remove after 3 months of stable WebSocket operation

### 5. Audio Format
**Decision**: Use `AutoDetectDecodingConfig`

```python
auto_decoding_config=cloud_speech.AutoDetectDecodingConfig()
```

- Most flexible (handles any browser format)
- No need to worry about PCM encoding issues
- Works with current AudioWorklet implementation
- Simplifies frontend code

---

## Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Kenya (Users)                         │
│                                                              │
│  Teacher Browser ←─────→ Student Browser                     │
│       ↓                        ↑                             │
└───────┼────────────────────────┼─────────────────────────────┘
        │                        │
        │ WebSocket              │ Realtime DB
        │ (50ms)                 │ (30ms)
        ↓                        │
┌─────────────────────────────────────────────────────────────┐
│               africa-south1 (Cloud Run)                      │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   Frontend PWA   │      │  Backend FastAPI │            │
│  │  (Nginx + React) │      │   + WebSocket    │            │
│  └──────────────────┘      └─────────┬────────┘            │
│                                       │                      │
└───────────────────────────────────────┼──────────────────────┘
                                        │
                                        │ gRPC Stream
                                        │ (150ms)
                                        ↓
                    ┌────────────────────────────────┐
                    │      us (Speech API)           │
                    │                                │
                    │  Speech.StreamingRecognize     │
                    │  - Model: chirp_3              │
                    │  - Languages: en-US, sw-KE     │
                    └────────────────────────────────┘
```

**Total Latency**: ~200-300ms (speech → student screen)

---

**Prepared by**: GitHub Copilot  
**For**: Sauti Darasa Development Team  
**Status**: ✅ **APPROVED** - Ready for Implementation  
**Approved by**: @Eli-Keli on January 7, 2026
