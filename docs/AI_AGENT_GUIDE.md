# GitHub Copilot & AI Agent Quick Start Guide

**For**: Developers using GitHub Copilot, Claude, ChatGPT, or other AI coding assistants  
**Purpose**: Optimal prompts to get AI agents up to speed on Sauti Darasa  
**Last Updated**: January 1, 2026  

---

## 🎯 TL;DR - Copy This First

```
You are a senior full-stack engineer working on Sauti Darasa, a real-time classroom captioning PWA for Kenyan students.

PROJECT CONTEXT:
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Status: Post-hackathon MVP (December 5, 2025)
- Frontend: ✅ Complete (React + TypeScript + Firebase + PWA)
- Backend: ❌ Missing (Speech-to-Text service needed)
- Docs: Read docs/PROJECT_STATUS.md for full context

IMMEDIATE NEED:
Build backend service: Teacher audio → Google Cloud Speech-to-Text → Firebase → Student captions

MY TASK TODAY:
[Describe what you want to work on]

Please review docs/PROJECT_STATUS.md first, then help me implement this. Ask questions if needed.
```

---

## 📚 Table of Contents

1. [Backend Development Prompts](#backend-development-prompts) - **START HERE** (Priority #1)
2. [Frontend Enhancement Prompts](#frontend-enhancement-prompts)
3. [Testing & QA Prompts](#testing--qa-prompts)
4. [Deployment Prompts](#deployment-prompts)
5. [Documentation Prompts](#documentation-prompts)
6. [Bug Fixing Prompts](#bug-fixing-prompts)
7. [New Contributor Prompts](#new-contributor-prompts)
8. [Code Review Prompts](#code-review-prompts)

---

## 🚀 Backend Development Prompts

### Prompt 1: Initial Backend Setup (Python + FastAPI)

```
You are a senior backend engineer setting up the Sauti Darasa transcription service.

CONTEXT:
- Project: Real-time classroom captioning PWA
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Frontend: 100% complete, waiting for backend
- Task: Build speech-to-text API service

ARCHITECTURE:
Teacher records audio → POST /api/transcribe → Backend converts speech to text → Writes to Firebase → Student sees captions

TECHNICAL REQUIREMENTS:
- Framework: Python 3.11+ with FastAPI
- STT Provider: Google Cloud Speech-to-Text API
- Audio Format: Receives base64-encoded WAV (16kHz, mono)
- Request: POST /api/transcribe?sessionId=abc123
- Body: { "audioChunk": "data:audio/webm;base64,..." }
- Response: { "success": true, "text": "transcribed caption" }
- Firebase Write: /captions/{sessionId}/latest { text: "...", timestamp: serverTimestamp() }
- Deployment: Docker + Google Cloud Run

BEFORE YOU START:
1. Read docs/PROJECT_STATUS.md (Backend section)
2. Review src/hooks/useAudioRecorder.ts (frontend audio upload logic)
3. Check src/services/firebase.ts (Firebase schema)

TASK:
Create the complete backend service with:
- FastAPI application structure
- /api/transcribe endpoint
- Google Cloud Speech-to-Text integration
- Firebase Admin SDK integration
- Error handling and logging
- Health check endpoint
- Dockerfile for deployment

Ask me any questions about the requirements before proposing the implementation plan.
```

---

### Prompt 2: Backend Setup (Node.js + Express Alternative)

```
You are a Node.js backend engineer building the Sauti Darasa transcription API.

CONTEXT:
- Real-time classroom captioning PWA
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Frontend complete, backend missing

ARCHITECTURE:
Teacher audio → POST /api/transcribe → Convert to text → Write to Firebase

TECHNICAL STACK:
- Runtime: Node.js 18+ with TypeScript
- Framework: Express.js
- STT: Google Cloud Speech-to-Text API
- Database: Firebase Realtime Database (Admin SDK)

API SPECIFICATION:
Endpoint: POST /api/transcribe
Query: sessionId (string, required)
Body: { audioChunk: string } // base64-encoded audio
Response: { success: boolean, text: string, error?: string }

Firebase Write Target:
/captions/{sessionId}/latest
{
  text: "transcribed caption",
  timestamp: Date.now()
}

AUDIO DETAILS:
- Format: WAV or WebM
- Sample Rate: 16kHz
- Channels: Mono
- Encoding: Linear PCM
- Chunk Size: ~1.5 seconds

BEFORE CODING:
1. Review docs/PROJECT_STATUS.md (Backend Not Implemented section)
2. Check src/hooks/useAudioRecorder.ts (line 85-100) for upload format
3. Understand Firebase schema in src/services/firebase.ts

DELIVERABLES:
- Express server with TypeScript
- Transcription endpoint with proper error handling
- Firebase Admin SDK integration
- Google Cloud credentials handling
- Docker configuration
- README for backend setup

Propose your implementation approach first, then we'll build it step by step.
```

---

### Prompt 3: Audio Processing & Format Conversion

```
You are an audio processing specialist helping with Sauti Darasa backend.

PROBLEM:
Frontend sends WebM audio chunks, but Google Cloud Speech-to-Text prefers WAV/FLAC.

CONTEXT:
- Frontend: useAudioRecorder.ts records with MediaRecorder API
- Output: WebM or WAV (browser-dependent)
- Backend: Needs consistent format for STT API

REQUIREMENTS:
1. Accept audio in multiple formats (WebM, WAV, MP3)
2. Convert to optimal format for Google STT (LINEAR16, 16kHz, mono)
3. Handle base64 decoding
4. Stream processing (don't buffer entire audio)
5. Error handling for corrupt/invalid audio

TOOLS AVAILABLE:
- FFmpeg (via subprocess or fluent-ffmpeg)
- Sox (alternative audio tool)
- Python: pydub, wave, audioop
- Node.js: fluent-ffmpeg, wav

CURRENT FRONTEND CODE:
// src/hooks/useAudioRecorder.ts (line 92-96)
const reader = new FileReader();
reader.onloadend = () => {
  const base64Audio = reader.result as string;
  uploadAudioChunk(base64Audio, currentSessionId);
};

TASK:
Design audio processing pipeline:
1. Receive base64 audio from frontend
2. Detect audio format
3. Convert to LINEAR16 WAV 16kHz mono
4. Pass to Google Cloud Speech-to-Text
5. Handle errors gracefully

Provide code for the audio conversion layer with proper error handling.
```

---

### Prompt 4: Testing Backend Locally

```
You are setting up local development environment for Sauti Darasa backend.

SETUP NEEDED:
1. Google Cloud Speech-to-Text API credentials
2. Firebase Admin SDK credentials
3. Local backend server
4. Connection to frontend dev server

CURRENT STATE:
- Frontend runs on: http://localhost:5173
- Backend should run on: http://localhost:8000
- Frontend expects: VITE_BACKEND_API_URL environment variable

CREDENTIALS SETUP:
Google Cloud:
1. Create service account with Speech-to-Text API access
2. Download JSON key file
3. Set GOOGLE_APPLICATION_CREDENTIALS env var

Firebase:
1. Go to Project Settings → Service Accounts
2. Generate new private key
3. Save as firebase-admin-key.json
4. Set FIREBASE_DATABASE_URL env var

TESTING FLOW:
1. Start backend: python main.py (or npm run dev)
2. Start frontend: npm run dev (in frontend folder)
3. Set frontend env: VITE_BACKEND_API_URL=http://localhost:8000
4. Open: http://localhost:5173/teacher
5. Click "Start Recording", speak
6. Backend should log received audio
7. Open student view with session ID
8. Verify captions appear

TASK:
Guide me through:
- Setting up Google Cloud credentials
- Configuring Firebase Admin SDK
- Testing the transcription endpoint
- Debugging common issues

Provide step-by-step commands and troubleshooting tips.
```

---

## 🎨 Frontend Enhancement Prompts

### Prompt 5: Add Authentication (Firebase Auth)

```
You are a frontend engineer adding authentication to Sauti Darasa.

CONTEXT:
- React + TypeScript PWA
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Currently: No authentication (security risk)
- Goal: Teacher/Student login with Firebase Auth

REQUIREMENTS:
1. Firebase Authentication integration
2. User roles: Teacher, Student, Admin
3. Protected routes (require auth)
4. Session ownership (only creator can stop recording)
5. UI: Login/Signup pages with proper UX

EXISTING CODE:
- src/services/firebase.ts - Firebase config (extend this)
- src/pages/TeacherView.tsx - Add auth checks
- src/pages/StudentView.tsx - Optional auth for students

AUTH FLOW:
Teacher:
- Must sign in to create sessions
- Can only control their own sessions
- See history of past sessions

Student:
- Optional anonymous access OR sign in
- Signed in: Join sessions, see history
- Anonymous: One-time session access

IMPLEMENTATION NEEDS:
1. AuthContext provider (src/contexts/AuthContext.tsx)
2. useAuth hook (src/hooks/useAuth.ts)
3. Login page (src/pages/Login.tsx)
4. ProtectedRoute component
5. Update TeacherView/StudentView with auth
6. Firebase Security Rules for authenticated access

BEFORE STARTING:
Read docs/PROJECT_STATUS.md (Security Considerations section)

TASK:
Implement Firebase Authentication with role-based access control. Provide implementation plan first.
```

---

### Prompt 6: Add Accessibility Features

```
You are a frontend accessibility specialist improving Sauti Darasa.

CONTEXT:
- Real-time captioning PWA for students with hearing disabilities
- Current: Basic accessibility, needs WCAG 2.1 AA compliance
- Repository: https://github.com/ViggenKorir/SautiDarasa

ACCESSIBILITY GAPS (from docs/PROJECT_STATUS.md):
1. ❌ No keyboard shortcuts
2. ❌ Screen reader not optimized
3. ⚠️ Focus indicators basic
4. ⚠️ ARIA labels incomplete
5. ❌ No high contrast mode

WCAG 2.1 AA REQUIREMENTS:
- Keyboard Navigation: All functionality via keyboard
- Screen Reader Support: Proper ARIA labels, live regions
- Color Contrast: 4.5:1 for text, 3:1 for UI components
- Focus Visible: Clear focus indicators
- Semantic HTML: Proper heading hierarchy

PRIORITY FEATURES:
1. Keyboard Shortcuts:
   - Space: Toggle recording (teacher)
   - Escape: Stop recording
   - Ctrl+C: Copy session link
   - F11: Fullscreen (student)

2. Screen Reader:
   - Live region for captions (aria-live="polite")
   - Status announcements
   - Button labels

3. Caption Customization:
   - Font size control
   - High contrast mode
   - Background color options

FILES TO UPDATE:
- src/pages/TeacherView.tsx (keyboard shortcuts)
- src/pages/StudentView.tsx (caption customization)
- src/components/WaveformVisualizer.tsx (ARIA labels)

TASK:
Implement accessibility improvements to achieve WCAG 2.1 AA compliance. Start with keyboard navigation.
```

---

## 🧪 Testing & QA Prompts

### Prompt 7: Write Unit Tests (Vitest)

```
You are a test engineer writing unit tests for Sauti Darasa.

CONTEXT:
- React + TypeScript + Vite
- Testing Framework: Vitest (already installed)
- Current: 0% test coverage
- Goal: 80% coverage for critical paths

PRIORITY TEST FILES:
1. src/hooks/useAudioRecorder.ts (audio recording logic)
2. src/hooks/useFirebaseConnection.ts (reconnection logic)
3. src/hooks/useWakeLock.ts (wake lock API)
4. src/components/WaveformVisualizer.tsx (canvas rendering)
5. src/utils/audioUtils.ts (audio encoding)
6. src/utils/sessionUtils.ts (session ID generation)

TESTING REQUIREMENTS:
- Mock browser APIs (MediaRecorder, Canvas, Wake Lock)
- Mock Firebase (use firebase-mock or manual mocks)
- Test error handling
- Test edge cases
- Async operations properly awaited

EXAMPLE TEST STRUCTURE:
```typescript
// src/hooks/__tests__/useAudioRecorder.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAudioRecorder } from '../useAudioRecorder';

describe('useAudioRecorder', () => {
  beforeEach(() => {
    // Mock MediaRecorder
    global.MediaRecorder = vi.fn();
  });

  it('should start recording when startRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder('session123'));
    // Test implementation
  });
});
```

TASK:
Write comprehensive unit tests for the hooks and utilities. Start with useAudioRecorder.ts. Show me the test file structure first.
```

---

### Prompt 8: E2E Tests (Playwright)

```
You are setting up end-to-end tests for Sauti Darasa using Playwright.

CONTEXT:
- PWA with real-time features
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Playwright: Not yet installed
- Goal: Test full user journeys

CRITICAL USER FLOWS TO TEST:
1. Teacher creates session → Student joins → Sees captions
2. PWA installation flow
3. Offline functionality
4. Multi-device sync
5. Mobile responsive design

TEST SCENARIO 1: Teacher-Student Flow
```typescript
test('teacher creates session and student receives captions', async ({ page, context }) => {
  // 1. Open teacher view
  await page.goto('http://localhost:5173/teacher');
  
  // 2. Grant microphone permission (mock)
  await context.grantPermissions(['microphone']);
  
  // 3. Start recording
  await page.click('button:has-text("Start Recording")');
  
  // 4. Get session URL
  const sessionUrl = await page.locator('[data-testid="session-link"]').textContent();
  
  // 5. Open student view in new page
  const studentPage = await context.newPage();
  await studentPage.goto(sessionUrl);
  
  // 6. Verify caption appears (wait for Firebase update)
  await studentPage.waitForSelector('[data-testid="caption-text"]', { timeout: 5000 });
  
  // 7. Verify caption updates in real-time
  const caption = await studentPage.locator('[data-testid="caption-text"]').textContent();
  expect(caption).toBeTruthy();
});
```

SETUP REQUIREMENTS:
- Install Playwright: npm install -D @playwright/test
- Configure: playwright.config.ts
- Add test scripts to package.json
- Mock backend API responses
- Handle browser permissions

TASK:
Set up Playwright and write E2E tests for critical user journeys. Provide setup instructions and test files.
```

---

## 🚀 Deployment Prompts

### Prompt 9: Deploy to Google Cloud Run

```
You are a DevOps engineer deploying Sauti Darasa to Google Cloud Platform.

CONTEXT:
- Frontend: React PWA (dockerized)
- Backend: Python/Node.js API (needs dockerization)
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Deployment: Google Cloud Run

EXISTING SETUP:
✅ Frontend Dockerfile (multi-stage build)
✅ nginx.conf (production config)
✅ deploy-cloud-run.sh (deployment script)
✅ docs/DEPLOYMENT_GOOGLE_CLOUD.md (guide)

MISSING:
❌ Backend Dockerfile
❌ Backend deployment script
❌ CI/CD pipeline (Cloud Build)

DEPLOYMENT ARCHITECTURE:
Frontend Service:
- Container: sauti-darasa-frontend
- Port: 8080
- Region: us-central1
- Min instances: 0, Max: 10
- Memory: 512Mi

Backend Service:
- Container: sauti-darasa-backend
- Port: 8000
- Region: us-central1
- Min instances: 1 (for low latency)
- Memory: 1Gi
- Environment: GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_DATABASE_URL

TASK 1: Create Backend Dockerfile
Requirements:
- Python 3.11 or Node.js 18
- Multi-stage build
- Health check endpoint
- Secrets via env vars
- Optimized size (<500MB)

TASK 2: Deploy Both Services
Steps:
1. Build and push images to GCR
2. Deploy frontend to Cloud Run
3. Deploy backend to Cloud Run
4. Configure frontend env: VITE_BACKEND_API_URL
5. Set up custom domain
6. Enable Cloud CDN

BEFORE STARTING:
Read docs/DEPLOYMENT_GOOGLE_CLOUD.md for complete context

Guide me through backend deployment step-by-step.
```

---

### Prompt 10: Set Up CI/CD Pipeline

```
You are setting up CI/CD for Sauti Darasa using GitHub Actions and Google Cloud Build.

CONTEXT:
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Hosting: Google Cloud Run
- Goal: Automated testing and deployment on push to main

CI/CD PIPELINE REQUIREMENTS:
1. Trigger: Push to main branch
2. Stages:
   - Lint (ESLint)
   - Type check (TypeScript)
   - Unit tests (Vitest)
   - Build (npm run build)
   - E2E tests (Playwright)
   - Build Docker image
   - Push to GCR
   - Deploy to Cloud Run (staging)
   - Manual approval for production

GITHUB ACTIONS WORKFLOW:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # Build and deploy to Cloud Run staging
```

CLOUD BUILD CONFIG:
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    args: ['ci']
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/sauti-darasa:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sauti-darasa:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sauti-darasa-staging'
      - '--image=gcr.io/$PROJECT_ID/sauti-darasa:$COMMIT_SHA'
      - '--region=us-central1'
```

TASK:
Set up complete CI/CD pipeline with automated testing and deployment to staging/production environments.
```

---

## 📝 Documentation Prompts

### Prompt 11: API Documentation

```
You are a technical writer creating API documentation for Sauti Darasa backend.

CONTEXT:
- Backend API: Speech-to-text transcription service
- Consumers: React frontend, potential mobile apps
- Documentation: OpenAPI 3.0 spec + user guide

API ENDPOINTS TO DOCUMENT:
1. POST /api/transcribe - Transcribe audio chunk
2. GET /health - Health check
3. GET /api/sessions/:id - Get session info
4. DELETE /api/sessions/:id - End session

EXAMPLE DOCUMENTATION NEEDED:
```markdown
## POST /api/transcribe

Transcribes an audio chunk and writes the caption to Firebase.

### Request

**URL**: `/api/transcribe?sessionId={sessionId}`

**Method**: `POST`

**Query Parameters**:
- `sessionId` (string, required): Unique session identifier

**Body**:
```json
{
  "audioChunk": "data:audio/wav;base64,UklGRiQAAABXQVZF..."
}
```

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (if auth enabled)

### Response

**Success (200)**:
```json
{
  "success": true,
  "text": "Hello world",
  "confidence": 0.95,
  "timestamp": 1609459200000
}
```

**Error (400)**:
```json
{
  "success": false,
  "error": "Invalid audio format",
  "code": "INVALID_AUDIO"
}
```

### Rate Limits
- 100 requests per minute per session
- 1000 requests per hour per user

### Example
```bash
curl -X POST \
  'https://api.sautidarasa.com/api/transcribe?sessionId=abc123' \
  -H 'Content-Type: application/json' \
  -d '{"audioChunk": "data:audio/wav;base64,..."}'
```
```

TASK:
Create complete API documentation with examples, error codes, and integration guide.
```

---

## 🐛 Bug Fixing Prompts

### Prompt 12: Debug Audio Upload Issues

```
You are debugging audio upload failures in Sauti Darasa.

CONTEXT:
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Issue: Audio chunks not reaching backend
- File: src/hooks/useAudioRecorder.ts

SYMPTOMS:
- Teacher starts recording
- Waveform shows audio input
- No captions appear in student view
- Console shows: "Failed to upload audio chunk"

DEBUGGING CHECKLIST:
1. ✅ Microphone permission granted
2. ✅ MediaRecorder starts successfully
3. ❓ Audio chunks created (check ondataavailable)
4. ❓ Base64 encoding successful
5. ❓ POST request sent to backend
6. ❓ Backend receives request
7. ❓ Backend processes audio
8. ❓ Firebase receives caption

RELEVANT CODE:
```typescript
// src/hooks/useAudioRecorder.ts (line 85-105)
const handleDataAvailable = async (event: BlobEvent) => {
  if (event.data.size > 0) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      uploadAudioChunk(base64Audio, currentSessionId);
    };
    reader.readAsDataURL(event.data);
  }
};

const uploadAudioChunk = async (audioData: string, sessionId: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/api/transcribe?sessionId=${sessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioChunk: audioData }),
      }
    );
    if (!response.ok) throw new Error('Upload failed');
  } catch (error) {
    console.error('Failed to upload audio chunk:', error);
  }
};
```

WHAT I'VE TRIED:
1. Checked VITE_BACKEND_API_URL env var: ✅ Set correctly
2. Verified backend is running: ✅ Health check responds
3. Tested with curl: ❓ Need to test

TASK:
Help me systematically debug this issue. Provide:
1. Diagnostic code to add
2. Testing steps
3. Common failure points
4. Fix recommendations
```

---

## 👋 New Contributor Prompts

### Prompt 13: Project Onboarding

```
You are onboarding me to Sauti Darasa, an open-source classroom captioning PWA.

I'M NEW TO:
- [Specify: React/TypeScript/Firebase/Web Audio/PWAs/etc.]

CONTEXT:
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Purpose: Real-time speech-to-text captions for deaf/hard-of-hearing students
- Status: Frontend complete, backend needed

MY BACKGROUND:
- Experience: [Junior/Mid/Senior]
- Familiar with: [List technologies]
- Time available: [Hours per week]

WHAT I WANT TO LEARN:
1. How the project works (architecture)
2. What's already built vs. what needs work
3. Where I can contribute based on my skills
4. How to set up development environment

YOUR TASK:
1. Read docs/PROJECT_STATUS.md
2. Explain the system in simple terms (5 bullet points)
3. Show me how to run the project locally
4. Recommend starter tasks based on my skill level
5. Point me to learning resources if needed

Let's start step-by-step. Explain the project architecture first.
```

---

## 🔍 Code Review Prompts

### Prompt 14: Review Pull Request

```
You are reviewing a pull request for Sauti Darasa.

CONTEXT:
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Project: Real-time classroom captioning PWA
- Standards: React best practices, TypeScript strict mode, accessibility-first

PR DETAILS:
Title: [PR Title]
Author: [Author name]
Files changed: [List files]
Description: [PR description]

REVIEW CHECKLIST:
Code Quality:
- [ ] Follows TypeScript best practices
- [ ] Proper error handling
- [ ] No console.logs in production code
- [ ] Meaningful variable names
- [ ] Comments explain "why", not "what"

Testing:
- [ ] Unit tests added/updated
- [ ] Tests cover edge cases
- [ ] Manual testing performed

Performance:
- [ ] No unnecessary re-renders
- [ ] Proper use of useMemo/useCallback
- [ ] Images optimized
- [ ] Bundle size impact minimal

Accessibility:
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader friendly

Security:
- [ ] No hardcoded secrets
- [ ] Input validation
- [ ] XSS prevention
- [ ] CSRF protection (if needed)

Documentation:
- [ ] README updated if needed
- [ ] API changes documented
- [ ] Comments added for complex logic

TASK:
Review the PR code and provide:
1. Overall assessment (Approve/Request Changes/Comment)
2. Specific issues found (with line numbers)
3. Suggestions for improvement
4. Praise for good practices
5. Questions for clarification
```

---

## 💡 Pro Tips for Best Results

### 1. Always Provide Context
```
❌ Bad: "How do I fix this error?"
✅ Good: "I'm working on Sauti Darasa backend (https://github.com/ViggenKorir/SautiDarasa). Getting error 'CORS blocked' when frontend calls /api/transcribe. Here's my Express setup: [code]. How do I fix this?"
```

### 2. Reference Documentation
```
"Before we start, please review:
- docs/PROJECT_STATUS.md (complete project context)
- docs/DEPLOYMENT_GOOGLE_CLOUD.md (deployment info)
- src/hooks/useAudioRecorder.ts (current implementation)"
```

### 3. Be Specific About Your Task
```
❌ Vague: "Help me with the project"
✅ Specific: "I need to implement the POST /api/transcribe endpoint using Python FastAPI and Google Cloud Speech-to-Text API. Guide me through the setup."
```

### 4. State Your Experience Level
```
"I'm a senior React developer but new to Python. Please explain backend concepts as you go."
```

### 5. Request Step-by-Step Guidance
```
"Don't give me all the code at once. Let's do this step-by-step:
1. First, show me the project structure
2. Then, set up dependencies
3. Then, implement the endpoint
4. Finally, test it"
```

### 6. Ask for Explanation + Code
```
"Provide the implementation AND explain:
- Why this approach?
- What are the trade-offs?
- What could go wrong?
- How to test it?"
```

### 7. Iterate and Refine
```
First prompt: "Create a basic transcription endpoint"
Follow-up: "Now add error handling"
Follow-up: "Now optimize for latency"
Follow-up: "Now add retry logic"
```

---

## 🎓 Learning Resources

If AI suggests concepts you don't understand:

**React Concepts**:
- "Explain React hooks in the context of this project"
- "Show me useEffect examples from our codebase"

**TypeScript**:
- "What does this type signature mean: [paste type]"
- "How do I type this Firebase callback?"

**Firebase**:
- "Explain our Firebase schema and security rules"
- "How does real-time sync work in this project?"

**Audio APIs**:
- "Explain MediaRecorder API used in useAudioRecorder.ts"
- "How does base64 audio encoding work?"

**Google Cloud**:
- "Explain Cloud Run vs App Engine for our use case"
- "What are Cloud Build triggers and why do we need them?"

---

## 📞 When AI Gets Stuck

If the AI agent can't help or seems confused:

1. **Clarify the Context**:
   ```
   "Let me provide more context. This is a React PWA that..."
   ```

2. **Break Down the Problem**:
   ```
   "Let's focus on just the audio upload part first, ignore transcription for now."
   ```

3. **Provide More Code**:
   ```
   "Here's the full file content: [paste code]"
   ```

4. **Ask for Alternatives**:
   ```
   "That approach didn't work. What are 2-3 alternative solutions?"
   ```

5. **Request Debugging Steps**:
   ```
   "I can't get this working. Give me a step-by-step debugging checklist."
   ```

6. **Consult Human Documentation**:
   - Read docs/PROJECT_STATUS.md
   - Check docs/TROUBLESHOOTING.md
   - Review docs/DEPLOYMENT_GOOGLE_CLOUD.md
   - Ask in GitHub Discussions

---

## ✅ Quick Reference: Common Tasks

| Task | Recommended Prompt |
|------|-------------------|
| Set up backend | Use Prompt 1 (FastAPI) or 2 (Express) |
| Add authentication | Use Prompt 5 |
| Write tests | Use Prompt 7 (unit) or 8 (E2E) |
| Deploy to GCP | Use Prompt 9 |
| Fix audio bug | Use Prompt 12 |
| Onboard new dev | Use Prompt 13 |
| Improve accessibility | Use Prompt 6 |
| Set up CI/CD | Use Prompt 10 |

---

## 🚀 Ready to Start?

1. **Copy the TL;DR prompt** at the top of this document
2. **Customize** it for your specific task
3. **Paste** into GitHub Copilot, Claude, or ChatGPT
4. **Iterate** based on responses
5. **Refer back** to this guide for specialized prompts

---

## 📝 Feedback & Improvements

This guide evolves with the project. If you find:
- Prompts that work particularly well
- Missing scenarios
- Better approaches

**Please contribute**:
1. Fork the repository
2. Update this file
3. Submit a pull request

---

## 🤖 Meta Prompt (For AI Agents Reading This)

If you're an AI agent helping a developer with Sauti Darasa:

**Priority Order**:
1. Read docs/PROJECT_STATUS.md FIRST for complete context
2. Understand which development phase they're in (backend/testing/deployment)
3. Check relevant existing code before suggesting implementations
4. Reference specific files and line numbers
5. Propose implementation plans before writing code
6. Ask clarifying questions instead of making assumptions
7. Explain trade-offs and alternatives
8. Provide testing instructions with every code change

**Key Context**:
- Frontend: 100% complete, production-ready
- Backend: 0% complete, highest priority
- Last worked: December 5, 2025
- Repository: https://github.com/ViggenKorir/SautiDarasa
- Deployment: Google Cloud Run

**Common Pitfalls**:
- Don't suggest rewriting existing frontend (it works!)
- Backend must write to Firebase (not REST response only)
- Audio format conversion is critical
- Latency matters (target <2s end-to-end)
- Security rules must be auth-based before production

---

**Document Version**: 1.0  
**Last Updated**: January 1, 2026  
**Maintained By**: Sauti Darasa Team  
**Related Docs**: PROJECT_STATUS.md, TROUBLESHOOTING.md, DEPLOYMENT_GOOGLE_CLOUD.md

---

*Happy coding! Let's make education accessible to everyone.* 🎓✨
