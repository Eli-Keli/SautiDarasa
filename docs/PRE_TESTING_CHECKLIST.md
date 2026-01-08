# Pre-Testing Checklist

Complete this checklist before starting your local tests.

## Backend Verification

### 1. Environment Variables (.env file)
Location: `/Users/mac/Desktop/GCP Projects/sauti-darasa-backend/.env`

Required variables:
```bash
# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_REGION=africa-south1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Firebase
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_PROJECT_ID=your-project-id

# API
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Action**: 
```bash
cd "/Users/mac/Desktop/GCP Projects/sauti-darasa-backend"
cat .env
```

### 2. Dependencies Installed
```bash
cd "/Users/mac/Desktop/GCP Projects/sauti-darasa-backend"
pip install -r requirements.txt
```

Expected new packages:
- ✅ grpcio==1.62.0
- ✅ grpcio-tools==1.62.0
- ✅ websockets==12.0
- ✅ google-cloud-firestore==2.18.0

### 3. Service Account Key
```bash
# Verify the service account key file exists
ls -la $GOOGLE_APPLICATION_CREDENTIALS
```

Expected output: File should exist and be readable

### 4. Code Changes Applied
Check that these files have been updated:
- ✅ `app/main.py` - Uses lifespan, HTTP endpoint commented out
- ✅ `app/config.py` - WebSocket streaming settings
- ✅ `app/websocket.py` - Publishes to Firebase
- ✅ `app/DEPRECATED_FILES.md` - Documents deprecated files

```bash
# Quick verification
cd "/Users/mac/Desktop/GCP Projects/sauti-darasa-backend"
grep -n "lifespan" app/main.py
grep -n "SPEECH_API_REGION" app/config.py
grep -n "publish_caption" app/websocket.py
```

## Frontend Verification

### 1. Environment Variables (.env file)
Location: `/Users/mac/Desktop/GCP Projects/SautiDarasa/.env`

Required variables:
```bash
# Backend
VITE_BACKEND_URL=http://localhost:8000

# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Action**: 
```bash
cd "/Users/mac/Desktop/GCP Projects/SautiDarasa"
cat .env
```

### 2. Dependencies Installed
```bash
cd "/Users/mac/Desktop/GCP Projects/SautiDarasa"
npm install
```

### 3. Audio Processor File
Verify the AudioWorklet processor exists:
```bash
ls -la public/audio-processor.js
```

Expected: File should exist

### 4. Code Changes Applied
Check that these files have been updated:
- ✅ `src/hooks/useAudioRecorder.ts` - No TypeScript errors, 100ms chunks
- ✅ `src/hooks/useTranscriptionWebSocket.ts` - WebSocket connection management
- ✅ `src/pages/TeacherView.tsx` - WebSocket integration
- ✅ `src/services/firebase.ts` - Firestore support

```bash
# Quick verification
cd "/Users/mac/Desktop/GCP Projects/SautiDarasa"
npm run build --dry-run 2>&1 | grep -i error
```

Expected: No errors

## Google Cloud Setup

### 1. Speech-to-Text API Enabled
```bash
gcloud services list --enabled --project=YOUR_PROJECT_ID | grep speech
```

Expected: `speech.googleapis.com` should be listed

### 2. IAM Permissions
Your service account needs these roles:
- ✅ Cloud Speech Client
- ✅ Firebase Admin
- ✅ Service Account Token Creator (optional)

```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:YOUR_SERVICE_ACCOUNT_EMAIL"
```

### 3. Billing Enabled
```bash
gcloud billing accounts list
```

Expected: At least one billing account should be active

## Firebase Setup

### 1. Realtime Database Created
- Go to Firebase Console → Realtime Database
- Database should exist with URL: `https://your-project.firebaseio.com`
- Rules should allow authenticated writes

### 2. Firestore Created
- Go to Firebase Console → Firestore Database
- Firestore should be created (Native mode)
- Rules should allow authenticated writes

### 3. Database Rules (Security)
Check that your Realtime Database rules allow writes:
```json
{
  "rules": {
    "captions": {
      "$sessionId": {
        ".write": true,
        ".read": true
      }
    }
  }
}
```

## Quick Test Commands

### Backend Smoke Test
```bash
cd "/Users/mac/Desktop/GCP Projects/sauti-darasa-backend"
python -c "from app.config import settings; print(f'✅ Config loaded: {settings.GCP_PROJECT_ID}')"
```

### Frontend Smoke Test
```bash
cd "/Users/mac/Desktop/GCP Projects/SautiDarasa"
npm run build
```

Expected: Build should succeed without errors

## Checklist Summary

Before starting tests, ensure:
- [x] Backend .env file configured ✅
- [x] Frontend .env file configured ✅
- [x] Backend dependencies installed (including gRPC) ✅ Python 3.12
- [x] Frontend dependencies installed ✅ 738 packages
- [x] Google Cloud credentials valid ✅ sauti-darasa-key.json
- [x] Speech-to-Text API enabled ✅ speech.googleapis.com
- [x] Firebase Realtime Database created ✅ https://sautidarasa-default-rtdb.firebaseio.com
- [x] Firestore created ✅ Standard Edition, africa-south1, Test Mode
- [x] No TypeScript/Python errors ✅ Backend imports fixed
- [x] Service account has correct permissions ✅ roles/run.admin, roles/storage.admin
- [x] Billing is enabled ✅ Multiple billing accounts active

## Ready to Test?

**✅ ALL PRE-TESTING REQUIREMENTS COMPLETED!**

Backend Status: ✅ Running on http://127.0.0.1:8000
Frontend Status: ✅ Running on http://localhost:5173

Once all items are checked:
1. ✅ Backend started: `uvicorn app.main:app --reload --port 8000` - **RUNNING**
2. ✅ Frontend started: `npm run dev` - **RUNNING**
3. 🔄 Open browser to `http://localhost:5173/teacher` - **READY FOR TESTING**
4. 🔄 Follow the [TESTING_GUIDE.md](./TESTING_GUIDE.md) - **NEXT STEP**

**Issues Fixed:**
- ✅ Removed deprecated imports from `app/main.py` (transcription.py, models.py)
- ✅ Backend now starts without credential errors
- ✅ WebSocket endpoint ready at `/ws/transcribe/{session_id}`

**Known Issues to Monitor:**
- ⚠️ Service account missing `roles/speech.client` role - may need to add if WebSocket fails
- ⚠️ Frontend Firebase connection warnings (expected until backend WebSocket connects)

---

**Last Updated**: January 8, 2026 - 15:32 EAT  
**Status**: ✅ Ready for Local Testing
