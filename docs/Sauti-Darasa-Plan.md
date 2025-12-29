# Plan: Sauti-Darasa PWA Frontend Implementation

Building a production-ready React PWA for real-time classroom captioning with Teacher recording view and Student display view. Uses Vite + React + TypeScript + TailwindCSS + Firebase Realtime Database. Mobile-first, high-contrast, accessible design for Kenyan classroom environments.

## Steps

1. **Initialize project foundation** — Create Vite + React + TypeScript project, install core dependencies (react-router-dom, firebase, tailwindcss, vite-plugin-pwa), configure build tools, establish folder structure (src/pages, src/components, src/hooks, src/services, src/types)

2. **Configure PWA infrastructure** — Set up manifest.json with app metadata and icons, configure vite-plugin-pwa with Workbox for service worker, implement offline shell and cache strategies, add PWA install prompt handling

3. **Build Firebase integration** — Create src/services/firebase.ts with Firebase SDK initialization, implement Realtime Database service for captions/<sessionId>/latest subscription, add connection state monitoring, implement auto-reconnection logic

4. **Implement Teacher page (/teacher)** — Build TeacherView component with MediaRecorder API integration in useAudioRecorder hook (1-2s chunks), convert audio to base64, POST to /api/transcribe?sessionId=<id>, display waveform animation using Canvas API or CSS, show connection status indicator, add Start/Stop recording controls

5. **Implement Student page (/student)** — Build StudentView component with Firebase Realtime Database listener for caption updates, display captions in large high-contrast text (min 24px), implement full-screen mobile-first layout, disable scroll with auto-update latest caption, add loading and error states

6. **Add routing and polish** — Configure React Router with /teacher and /student routes, add session ID management (URL params or localStorage), implement error handling with retry logic for API failures, add TypeScript types for all data structures, test on mobile devices

## Further Considerations

- **Session management strategy** — Should sessions be created on Teacher page load with auto-generated IDs, or do you want a landing page where teacher creates session and shares ID with students? Recommend auto-generation for speed.

- **Backend API details** — What's the full backend endpoint URL and expected audio format (base64 WAV/PCM, sample rate)? Is the backend already deployed or being built in parallel? This affects error handling and demo simulation strategy.

- **Demo fallback mechanism** — For hackathon reliability, should we add a mock mode that simulates captions locally without backend (useful if API fails during demo)? Could toggle via ?demo=true query param.

- **Color scheme and branding** — Need specifics for high-contrast theme: prefer dark mode (white text on dark) or light mode (dark text on white)? Any brand colors or should we use accessible defaults (e.g., #1a1a1a background, #ffffff text)?