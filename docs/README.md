# Sauti Darasa Frontend - Phase 1 Documentation

## Project Overview

**Sauti Darasa** is a real-time captioning Progressive Web App (PWA) designed for Kenyan classrooms. This EdTech solution enables teachers to provide live transcriptions of their lectures, makhttp://localhost:5173/student?sessionId=gK5Cnfq_6aing education more accessible for students with hearing impairments or those who benefit from text-based learning.

### Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7.2
- **Styling**: TailwindCSS v4 with PostCSS
- **Routing**: React Router DOM
- **Real-time Database**: Firebase Realtime Database
- **Audio Processing**: Web Audio API + MediaRecorder API
- **PWA**: vite-plugin-pwa with Workbox
- **Session Management**: nanoid

---

## Phase 1 Completion Summary

### ✅ Completed Features

#### 1. **Project Infrastructure**
- Initialized Vite + React + TypeScript project
- Configured TailwindCSS v4 with custom dark theme
- Set up PWA with service worker and offline caching
- Configured ESLint and development environment
- Created modular folder structure

#### 2. **Teacher View** (`/teacher`)
**Features Implemented:**
- Auto-generated session IDs using nanoid (10-character unique IDs)
- Real-time audio recording with MediaRecorder API
- Audio chunking (1.5-second intervals)
- Canvas-based waveform visualization
- Firebase connection status monitoring
- Share link generation with copy-to-clipboard
- Upload progress tracking (chunks sent counter)
- Error handling and display (permission, upload, recording errors)
- Demo mode support (`?demo=true`)

**Technical Details:**
- Records audio at 16kHz sample rate (mono channel)
- Converts audio chunks to base64 encoding
- POSTs to `/api/transcribe?sessionId=<id>` endpoint
- Implements retry logic with exponential backoff (2 retries)
- Echo cancellation, noise suppression, and auto gain control enabled

#### 3. **Student View** (`/student?sessionId=<id>`)
**Features Implemented:**
- Firebase Realtime Database subscription to `captions/<sessionId>/latest`
- Large, high-contrast caption display (text-3xl to text-6xl responsive)
- Full-screen mobile-first layout
- Connection status indicator
- Session validation (error page for missing session ID)
- Auto-updating captions without scroll
- Demo mode with rotating mock captions

**Design Specifications:**
- Background: `#0A0A0A` (near black)
- Text: `#FFFFFF` (pure white)
- High contrast ratio for accessibility
- Responsive font sizing for different screen sizes

#### 4. **Custom Hooks**
- `useAudioRecorder`: MediaRecorder wrapper with chunk handling
  - Handles microphone permissions
  - Manages recording state
  - Provides pause/resume functionality
  - Automatic cleanup on unmount

#### 5. **Utilities & Services**
- **Session Management** (`utils/session.ts`):
  - `generateSessionId()`: Creates unique session IDs
  - `createStudentLink()`: Generates shareable URLs
  - `getSessionIdFromUrl()`: Extracts session ID from query params
  - `isDemoMode()`: Detects demo mode flag

- **Audio Processing** (`utils/audio.ts`):
  - `blobToBase64()`: Converts audio blobs to base64
  - `uploadAudioChunk()`: POSTs audio to backend
  - `uploadAudioChunkWithRetry()`: Retry wrapper with backoff
  - `retryWithBackoff()`: Generic retry utility

- **Firebase Service** (`services/firebase.ts`):
  - Connection monitoring
  - Caption subscription
  - Teacher presence tracking
  - Graceful degradation when unconfigured

#### 6. **PWA Configuration**
- Service worker with Workbox caching strategies
- Manifest file for app installation
- Offline asset precaching
- Runtime caching for Firebase Storage
- App icons (192x192, 512x512, maskable)

#### 7. **Demo Mode**
- Fully functional without backend or Firebase
- Teacher view: simulated waveform + status
- Student view: rotating captions every 2 seconds
- Activated via `?demo=true` query parameter

---

## Project Structure

```
sauti-darasa-frontend/
├── public/
│   ├── pwa-192x192.png          # PWA icon (192x192)
│   ├── pwa-512x512.png          # PWA icon (512x512)
│   └── apple-touch-icon.png     # iOS icon
├── src/
│   ├── components/
│   │   └── WaveformVisualizer.tsx   # Canvas-based audio visualizer
│   ├── hooks/
│   │   └── useAudioRecorder.ts      # MediaRecorder hook
│   ├── pages/
│   │   ├── TeacherView.tsx          # Teacher recording interface
│   │   └── StudentView.tsx          # Student caption display
│   ├── services/
│   │   └── firebase.ts              # Firebase Realtime DB service
│   ├── utils/
│   │   ├── audio.ts                 # Audio processing utilities
│   │   └── session.ts               # Session management helpers
│   ├── App.tsx                      # Main app with routing
│   ├── index.css                    # TailwindCSS imports
│   └── main.tsx                     # App entry point
├── .env.example                     # Environment variables template
├── .env                             # Local environment config (gitignored)
├── package.json                     # Dependencies
├── vite.config.ts                   # Vite + PWA config
├── tailwind.config.js               # Tailwind customization
├── postcss.config.js                # PostCSS plugins
└── tsconfig.json                    # TypeScript configuration
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API
VITE_BACKEND_API_URL=http://localhost:8000
```

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Navigate to Project Settings > General
4. Scroll to "Your apps" section
5. Click "Add app" > Web (</> icon)
6. Register app and copy the config object values
7. Enable Realtime Database in the console
8. Set database rules (development):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

---

## API Integration Specification

### Backend Endpoint: `/api/transcribe`

**Method**: `POST`

**Query Parameters**:
- `sessionId` (required): The unique session identifier

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "audioChunk": "<base64-encoded-audio-string>"
}
```

**Audio Specifications**:
- Format: WebM or MP4 (browser-dependent)
- Sample Rate: 16kHz
- Channels: Mono (1 channel)
- Chunk Duration: 1.5 seconds
- Encoding: Base64 string

**Expected Response** (Success):
```json
{
  "success": true,
  "transcription": "optional transcription text",
  "timestamp": 1234567890
}
```

**Expected Response** (Error):
```json
{
  "success": false,
  "error": "Error message"
}
```

**Response Codes**:
- `200`: Success
- `400`: Bad request (invalid session ID or audio)
- `500`: Server error

### Firebase Database Structure

```
/
├── captions/
│   └── {sessionId}/
│       └── latest/
│           ├── text: "Caption text"
│           └── timestamp: ServerValue.TIMESTAMP
├── sessions/
│   └── {sessionId}/
│       └── teacher/
│           ├── connected: true
│           ├── connectedAt: ServerValue.TIMESTAMP
│           └── disconnectedAt: ServerValue.TIMESTAMP
```

---

## Design System

### Color Palette

```css
/* Primary Colors */
--background: #0A0A0A;        /* Near black */
--text: #FFFFFF;              /* Pure white */
--accent: #3B82F6;            /* Blue-500 */

/* Status Colors */
--success: #10B981;           /* Green-500 */
--error: #EF4444;             /* Red-500 */
--warning: #F59E0B;           /* Amber-500 */
--gray: #6B7280;              /* Gray-500 */
```

### Typography

**Teacher View**:
- Headers: `text-2xl` (1.5rem / 24px)
- Buttons: `text-xl` (1.25rem / 20px)
- Body: `text-sm` (0.875rem / 14px)
- Labels: `text-sm` (0.875rem / 14px)

**Student View**:
- Captions: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
  - Mobile: 1.875rem (30px)
  - Tablet: 2.25rem (36px)
  - Desktop: 3rem (48px)
  - Large: 3.75rem (60px)

### Component Patterns

**Status Indicators**:
```tsx
<div className="flex items-center gap-2">
  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
  <span>Connected</span>
</div>
```

**Error Messages**:
```tsx
<div className="text-sm text-red-400 flex items-center gap-2">
  <span>⚠️</span>
  {errorMessage}
</div>
```

---

## Known Limitations & Issues

### Current Limitations

1. **Audio Format**: Currently uses browser's default MediaRecorder format (WebM or MP4). Backend must handle multiple formats.

2. **No Authentication**: No user authentication implemented. Session IDs are publicly accessible.

3. **No Session Management UI**: Teachers cannot view/manage past sessions or see active students.

4. **No Caption History**: Only displays the latest caption. No scrollback or history view.

5. **No Offline Queue**: Audio chunks are not queued when offline. They're lost if upload fails after retries.

6. **Single Caption Line**: Student view shows only one caption at a time. No multi-line or paragraph support.

7. **No Language Selection**: Hardcoded for single language (backend transcription language).

8. **No Volume Indicator**: Waveform visualization but no audio level meter for teachers.

### Browser Compatibility

**Tested**:
- ✅ Chrome 120+ (Desktop & Mobile)
- ✅ Safari 17+ (Desktop & iOS)
- ✅ Firefox 121+ (Desktop)

**Known Issues**:
- ⚠️ Safari requires HTTPS for getUserMedia (even localhost)
- ⚠️ Firefox may use different audio codecs
- ❌ Internet Explorer: Not supported (ES6+ required)

---

## Phase 2 Roadmap

### High Priority

1. **Backend Integration Testing**
   - [ ] Test with actual transcription API
   - [ ] Verify audio format compatibility
   - [ ] Load testing with multiple sessions
   - [ ] Latency measurements

2. **Caption Persistence**
   - [ ] Store caption history in Firebase
   - [ ] Add scrollable caption view
   - [ ] Implement caption search
   - [ ] Export session transcripts

3. **Session Management**
   - [ ] Teacher dashboard with active sessions
   - [ ] Student count per session
   - [ ] Session start/end timestamps
   - [ ] Session expiry (auto-cleanup old sessions)

4. **Error Recovery**
   - [ ] Offline queue for audio chunks
   - [ ] Background sync when connection restored
   - [ ] Better error messaging for users
   - [ ] Automatic reconnection handling

### Medium Priority

5. **Authentication & Authorization**
   - [ ] Firebase Auth integration
   - [ ] Teacher vs. Student roles
   - [ ] Protected sessions (password/code)
   - [ ] School/class organization

6. **Caption Improvements**
   - [ ] Multi-line caption display
   - [ ] Caption timing/speed control
   - [ ] Font size preferences
   - [ ] Color theme options

7. **Audio Enhancements**
   - [ ] Audio level meter
   - [ ] Microphone selection
   - [ ] Audio quality settings
   - [ ] Noise reduction toggle

8. **Mobile Optimization**
   - [ ] Prevent screen sleep during sessions
   - [ ] Better mobile keyboard handling
   - [ ] Haptic feedback
   - [ ] Battery optimization

### Low Priority

9. **Advanced Features**
   - [ ] Multiple language support
   - [ ] Translation mode
   - [ ] Caption formatting (bold, italic)
   - [ ] Keyword highlighting
   - [ ] Export to PDF/DOCX

10. **Analytics & Monitoring**
    - [ ] Session analytics dashboard
    - [ ] Usage statistics
    - [ ] Error tracking (Sentry)
    - [ ] Performance monitoring

---

## Testing Checklist

See [TESTING.md](./TESTING.md) for comprehensive testing procedures.

---

## Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Contributing

### Code Style

- Use TypeScript for all new files
- Follow existing naming conventions
- Use functional components with hooks
- Add JSDoc comments for complex functions
- Keep components under 300 lines

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format

```
<type>: <description>

[optional body]
[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## License

MIT License - Built for EdTech Hackathon

---

## Support

For issues and questions:
- GitHub Issues: [Create an issue](#)
- Email: support@sautidarasa.com
- Documentation: [docs/](./README.md)

---

**Last Updated**: December 5, 2025  
**Phase**: 1 (MVP Complete)  
**Status**: Ready for Testing
