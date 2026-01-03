# Firebase Realtime Database Setup for Sauti Darasa

## 🚀 STEP-BY-STEP: Create and Configure Firebase Realtime Database

Your app is showing "Disconnected" because the Firebase Realtime Database hasn't been created yet.

---

## STEP 1: Create the Realtime Database

1. **Open Firebase Console**: https://console.firebase.google.com/project/sautidarasa/database

2. **Click "Create Database"** button (you should see this on the Realtime Database page)

3. **Choose Database Location**:
   - Select **`united-states (us-central1)`** 
   - ⚠️ **IMPORTANT**: The location CANNOT be changed later
   - This matches your Cloud Run services in `africa-south1` (they can communicate globally)

4. **Set Security Rules** (on the next screen):
   - Select **"Start in test mode"** for now
   - We'll configure proper rules in Step 2

5. **Click "Enable"**

6. **Wait 10-30 seconds** for database creation to complete

7. **Verify Database URL**: After creation, you should see:
   ```
   https://sautidarasa-default-rtdb.firebaseio.com
   ```
   ⚠️ **NOTE**: Your URL has the `-default-rtdb` suffix. This is normal for newer Firebase projects!
   
   ✅ Configuration has been updated to use this URL!

---

## STEP 2: Configure Security Rules

After the database is created:

1. **Click on the "Rules" tab** at the top of the Firebase Database page

2. **You'll see the default test mode rules**:
   ```json
   {
     "rules": {
       ".read": "now < 1748649600000",
       ".write": "now < 1748649600000"
   }
   ```

3. **Replace them with these production-ready rules**:

```json
{
  "rules": {
    "captions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

4. **Click "Publish"** button (top right corner)

5. **Confirm the deployment** when prompted

6. **Wait 5-10 seconds** for rules to propagate globally

---

## STEP 3: Verify Database Structure

After publishing the rules, your database should accept data. Verify it's working:

1. **Stay in the Firebase Console** on the "Data" tab

2. **You should see an empty database** (that's normal!)

3. **The structure will look like this after your first session**:
   ```
   sautidarasa-default-rtdb
   ├── captions
   │   └── 2HPDAL3tPS          ← Session ID
   │       └── latest
   │           ├── text: "Hello students..."
   │           └── timestamp: 1735848234567
   └── sessions
       └── 2HPDAL3tPS          ← Session ID
           └── teacher
               ├── connected: true
               └── connectedAt: 1735848234567
   ```

---

## STEP 4: Test the Connection

1. **Open your deployed frontend**:
   ```
   https://sauti-darasa-pwa-512236104756.africa-south1.run.app/teacher
   ```

2. **Look for the connection indicator**:
   - 🟢 **Green dot** = Connected ✅
   - 🔴 **Red dot** = Disconnected ❌
   - 🟡 **Yellow dot** = Reconnecting...

3. **If still disconnected**:
   - Wait 15-30 seconds for Firebase rules to propagate
   - Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
   - Check browser console for any error messages

---

## What These Rules Do

- **Public Read/Write**: Allows anyone to read and write captions for any session
- **Session-Based**: Data is organized by `sessionId`, making it easy to manage
- **Backend Compatible**: Backend service account can write transcriptions
- **Frontend Compatible**: Students can read captions without authentication
- **No Expiration**: Unlike test mode, these rules don't expire after 30 days

---

## STEP 5: Test Backend Integration

After confirming frontend connection, test the full flow:

1. **In Firebase Console, go to "Data" tab**

2. **In another tab, open your teacher view**:
   ```
   https://sauti-darasa-pwa-512236104756.africa-south1.run.app/teacher
   ```

3. **Click "Start Recording"** and speak into your microphone

4. **Watch Firebase Console** - you should see data appear in real-time:
   - `captions/{sessionId}/latest` will update every 1.5 seconds
   - `sessions/{sessionId}/teacher` will show teacher presence

5. **Open student view** in another tab/device:
   - Copy the session link from teacher view
   - Paste in browser or share with another device
   - You should see captions appear as the teacher speaks

---

## Troubleshooting

### ❌ Still shows "Disconnected"

**Check these:**

1. **Database exists**: Go to Firebase Console → Realtime Database → Should see your database URL
2. **Rules published**: Click "Rules" tab → Should see the JSON rules above
3. **Correct project**: Make sure you're in the "SautiDarasa" project (check top-left dropdown)
4. **Browser cache**: Hard refresh (Cmd+Shift+R) or try incognito mode
5. **Browser console**: Open DevTools (F12) → Console tab → Look for Firebase errors

### ❌ Backend Can't Write to Firebase

If the backend shows errors in Cloud Run logs:

```bash
gcloud run services logs read sauti-darasa-backend --region africa-south1 --limit 50
```

**Common issues:**
- Service account doesn't have Firebase permissions → Fixed (we already set this up)
- Database URL mismatch → Check `.env.gcloud` has `https://sautidarasa.firebaseio.com`
- Security rules too restrictive → Use the rules above

### ❌ Audio Recording Fails

**Check browser console for errors:**

1. **Microphone permission denied**: Click the 🔒 lock icon in browser address bar → Allow microphone
2. **HTTPS required**: MediaRecorder requires HTTPS (Cloud Run URLs use HTTPS ✅)
3. **WebM not supported**: The code has fallback to audio/mp4

---

## Testing Commands (Optional)

After database is created, test Firebase read/write from terminal:

**Write a test caption**:
```bash
curl -X PUT \
  -d '{"text": "Test caption from terminal", "timestamp": 1735848234567}' \
  "https://sautidarasa.firebaseio.com/captions/test123/latest.json"
```

**Read the test caption**:
```bash
curl "https://sautidarasa.firebaseio.com/captions/test123/latest.json"
```

**Expected response**:
```json
{
  "text": "Test caption from terminal",
  "timestamp": 1735848234567
}
```

**Delete test data**:
```bash
curl -X DELETE "https://sautidarasa.firebaseio.com/captions/test123.json"
```

---

## Production Security (Future Enhancement)

For production, implement Firebase Authentication and update rules:

```json
{
  "rules": {
    "captions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null || root.child('sessions').child($sessionId).child('teacher').child('serviceAccount').val() == true"
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": true,
        "teacher": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```

This allows:
- Students to read captions without auth (public access)
- Only authenticated teachers can create sessions
- Backend service account can write (via custom token)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEACHER DEVICE (Browser)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Teacher View                                              │ │
│  │  - MediaRecorder captures audio (WebM/Opus, 16kHz)        │ │
│  │  - Sends 1.5s chunks as base64 to backend                 │ │
│  │  - Monitors Firebase connection status                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS POST /api/transcribe
                          │ {audioChunk: "base64..."}
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND (Cloud Run - africa-south1)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FastAPI Service                                           │ │
│  │  - Receives base64 audio chunks                           │ │
│  │  - Calls Google Speech-to-Text API                        │ │
│  │  - Writes transcription to Firebase                       │ │
│  │  URL: sauti-darasa-backend-*.run.app                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────┬───────────────────────────┘
                  │                   │
      ┌───────────┘                   └───────────┐
      │ Speech-to-Text API                        │ Firebase Write
      │ (Service Account)                         │ (Service Account)
      ▼                                           ▼
┌──────────────────────┐           ┌──────────────────────────────┐
│  Google Cloud        │           │  Firebase Realtime Database  │
│  Speech-to-Text API  │           │  https://sautidarasa         │
│  - Model: en-KE      │           │         .firebaseio.com      │
│  - 16kHz audio       │           │                              │
│  - WebM/Opus support │           │  /captions/{sessionId}/      │
└──────────────────────┘           │    latest/                   │
                                   │      text: "..."             │
                                   │      timestamp: {...}        │
                                   └────────┬─────────────────────┘
                                            │ Real-time sync
                                            │ (Firebase SDK)
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STUDENT DEVICE (Browser)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Student View                                              │ │
│  │  - Subscribes to Firebase captions/{sessionId}/latest     │ │
│  │  - Displays captions in real-time                         │ │
│  │  - No backend calls needed (direct Firebase connection)   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current System Status

✅ **Frontend**: Deployed at https://sauti-darasa-pwa-512236104756.africa-south1.run.app  
✅ **Backend**: Running at https://sauti-darasa-backend-512236104756.africa-south1.run.app  
✅ **Backend Health**: `/health` endpoint returns `{"status":"healthy"}`  
✅ **Transcription API**: `/api/transcribe` tested and working  
✅ **CORS**: Configured to allow frontend requests  
✅ **Service Account**: Has Speech-to-Text and Firebase permissions  
✅ **Frontend Config**: All Firebase credentials in `.env.gcloud`  
🔧 **Firebase Database**: **NEEDS TO BE CREATED** (see Step 1 above)

---

## Quick Checklist

After following all steps, verify:

- [ ] Firebase Realtime Database created
- [ ] Security rules published (JSON from Step 2)
- [ ] Frontend shows green "Connected" dot
- [ ] Teacher can start recording (microphone permission granted)
- [ ] Firebase Console shows data appearing in real-time
- [ ] Student view displays captions when teacher speaks
- [ ] No errors in browser console (F12 → Console tab)
- [ ] No errors in backend logs (`gcloud run services logs read`)

---
