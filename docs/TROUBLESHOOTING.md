# Troubleshooting Guide - Sauti Darasa Frontend

## Overview

This guide helps diagnose and resolve common issues with the Sauti Darasa PWA. Issues are organized by category for quick reference.

---

## Quick Diagnostic Commands

```bash
# Check Node/npm versions
node --version   # Should be 18+
npm --version    # Should be 9+

# Verify installation
npm list react react-dom vite

# Check for errors
npm run build 2>&1 | tee build.log

# Test development server
npm run dev -- --host --port 5173

# Clear all caches
rm -rf node_modules dist .vite node_modules/.cache
npm install
```

---

## Build & Compilation Issues

### Issue: Build Fails with "Cannot find module"

**Symptoms**:
```
Error: Cannot find module 'react'
Error: Cannot find module '@firebase/database'
```

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify installations
npm list react @firebase/database
```

**Root Cause**: Missing or corrupted dependencies

---

### Issue: TypeScript Compilation Errors

**Symptoms**:
```
TS2307: Cannot find module './components/WaveformVisualizer'
TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution 1**: Check import paths
```typescript
// ❌ Wrong
import { Component } from 'components/Component';

// ✅ Correct
import { Component } from './components/Component';
import { Component } from '../components/Component';
```

**Solution 2**: Check tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Solution 3**: Type check only
```bash
npx tsc --noEmit --skipLibCheck
```

---

### Issue: Tailwind CSS Not Working

**Symptoms**:
- Styles not applying
- Classes like `text-white`, `bg-dark` not working
- Build warning: "Cannot apply unknown utility class"

**Solution 1**: Verify Tailwind v4 setup

Check `postcss.config.js`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // Must be @tailwindcss/postcss, not 'tailwindcss'
  },
};
```

Check `src/index.css`:
```css
/* Must use @import, not @tailwind directives */
@import "tailwindcss";

@layer base {
  body {
    @apply bg-dark text-white;
  }
}
```

**Solution 2**: Verify package installation
```bash
npm list @tailwindcss/postcss
# Should show @tailwindcss/postcss@4.x.x

# If missing:
npm install -D @tailwindcss/postcss@latest tailwindcss@latest
```

**Solution 3**: Check tailwind.config.js
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // Ensure correct glob patterns
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        dark: '#0A0A0A',
      },
    },
  },
};
```

---

### Issue: Vite Build Fails with Memory Error

**Symptoms**:
```
<--- Last few GCs --->
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution**:
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Or add to package.json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
  }
}
```

---

### Issue: PWA Plugin Build Warnings

**Symptoms**:
```
Workbox warning: ... is not being precached
Service worker registration failed
```

**Solution**: Check vite.config.ts
```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 3000000,
  },
  manifest: {
    // Ensure all required fields present
    name: 'Sauti Darasa',
    short_name: 'Sauti Darasa',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      }
    ]
  }
})
```

---

## Firebase Connection Issues

### Issue: "Can't determine Firebase Database URL"

**Symptoms**:
```
Firebase initialization error: Can't determine Firebase Database URL
```

**Solution 1**: Check .env file exists
```bash
# Verify file
ls -la .env

# Check contents
cat .env | grep VITE_FIREBASE
```

**Solution 2**: Verify all required variables
```bash
# .env must have ALL these:
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Solution 3**: Restart dev server after .env changes
```bash
# Stop server (Ctrl+C)
npm run dev
```

**Solution 4**: Check DATABASE_URL format
```bash
# ❌ Wrong
VITE_FIREBASE_DATABASE_URL=your-project

# ✅ Correct
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_DATABASE_URL=https://your-project.europe-west1.firebasedatabase.app
```

---

### Issue: Firebase Connection Stuck on "Connecting..."

**Symptoms**:
- Connection indicator stays yellow
- Captions don't sync
- Console shows no errors

**Solution 1**: Check Firebase project status
- Visit Firebase Console
- Verify Realtime Database is enabled
- Check database region matches URL

**Solution 2**: Check database rules
```json
{
  "rules": {
    "captions": {
      ".read": true,  // Must allow public read
      ".write": true  // Or: "auth != null"
    }
  }
}
```

**Solution 3**: Check network/firewall
```bash
# Test connectivity
curl https://your-project.firebaseio.com/.json

# Should return: {"error":"Permission denied"}
# (This confirms database is reachable)
```

**Solution 4**: Check browser console for CORS errors
```javascript
// If CORS error, add origin to Firebase Console:
// Firebase Console > Database > Settings > Authorized domains
```

---

### Issue: Firebase "Permission Denied"

**Symptoms**:
```
PERMISSION_DENIED: Permission denied at /captions/abc123
```

**Solution**: Update database rules
```json
{
  "rules": {
    "captions": {
      "$sessionId": {
        ".read": true,
        ".write": true  // Allow public write, or add auth
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

⚠️ **Note**: Public write access is convenient for demo but insecure for production. Implement authentication before production deployment.

---

## Audio Recording Issues

### Issue: Microphone Permission Denied

**Symptoms**:
- "Microphone access denied" error
- No waveform appears
- Recording button disabled

**Solution 1**: Check browser permissions
```
Chrome: chrome://settings/content/microphone
Firefox: about:preferences#privacy > Permissions > Microphone
Safari: System Preferences > Security & Privacy > Microphone
```

**Solution 2**: Verify HTTPS
```
Microphone API requires HTTPS in production
Use localhost for development (allowed over HTTP)
```

**Solution 3**: Check getUserMedia support
```javascript
// Open browser console and test:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✓ Microphone access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('✗ Error:', err.message));
```

**Solution 4**: Reset permissions
```
1. Click lock icon in address bar
2. Reset microphone permission
3. Refresh page
4. Grant permission when prompted
```

---

### Issue: No Audio Waveform Displayed

**Symptoms**:
- Recording starts but waveform is flat
- Console shows "AudioContext was not allowed to start"

**Solution 1**: User gesture required
```
AudioContext requires user interaction to start
Ensure recording is started by button click, not automatically
```

**Solution 2**: Check AudioContext state
```javascript
// In browser console:
const audioContext = new AudioContext();
console.log(audioContext.state);  // Should be "running"

// If "suspended":
audioContext.resume();
```

**Solution 3**: Verify microphone stream
```javascript
// Check if stream has active tracks
if (stream && stream.getAudioTracks().length > 0) {
  console.log('Audio tracks:', stream.getAudioTracks());
}
```

---

### Issue: Audio Chunks Not Uploading

**Symptoms**:
- Recording works but no uploads happen
- Console shows fetch errors
- Backend doesn't receive data

**Solution 1**: Check backend URL
```bash
# Verify .env
echo $VITE_BACKEND_API_URL

# Test endpoint
curl -X POST http://your-backend/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audioChunk":"test"}'
```

**Solution 2**: Check CORS headers on backend
```python
# Backend must allow:
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type
```

**Solution 3**: Verify audio format
```javascript
// Check MediaRecorder support
console.log(MediaRecorder.isTypeSupported('audio/webm'));
console.log(MediaRecorder.isTypeSupported('audio/mp4'));
```

**Solution 4**: Check network tab
```
1. Open DevTools > Network
2. Filter: Fetch/XHR
3. Start recording
4. Check for POST requests to /api/transcribe
5. Inspect request/response
```

---

## PWA Installation Issues

### Issue: "Install App" Prompt Not Showing

**Symptoms**:
- No install banner on mobile
- No install button in browser
- PWA criteria not met

**Solution 1**: Verify PWA criteria
```bash
# Open Chrome DevTools > Application > Manifest
# Check for errors

# Lighthouse audit
npx lighthouse https://your-site.com --view
# PWA score should be 100
```

**Solution 2**: Check manifest.json
```json
{
  "name": "Sauti Darasa",
  "short_name": "Sauti Darasa",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0A0A0A",
  "background_color": "#0A0A0A",
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Solution 3**: Verify HTTPS
```
PWA requires HTTPS (except localhost)
Check SSL certificate is valid
```

**Solution 4**: Check service worker registration
```javascript
// Browser console:
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    console.log('Service workers:', registrations.length);
    registrations.forEach(reg => console.log(reg.scope));
  });
```

---

### Issue: PWA Not Working Offline

**Symptoms**:
- App goes blank when offline
- Assets not cached
- Service worker not caching properly

**Solution 1**: Check service worker caching
```javascript
// Browser console:
caches.keys().then(keys => console.log('Cache keys:', keys));
caches.open('workbox-precache-v2').then(cache => 
  cache.keys().then(keys => console.log('Cached files:', keys.length))
);
```

**Solution 2**: Verify workbox configuration
```typescript
// vite.config.ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/,
      handler: 'NetworkFirst',
    }
  ]
}
```

**Solution 3**: Test offline mode
```
1. Chrome DevTools > Network > Offline
2. Refresh page
3. Should show cached version
```

---

## Mobile-Specific Issues

### Issue: App Not Responsive on Mobile

**Symptoms**:
- Text too small
- Buttons not tappable
- Layout breaks on mobile

**Solution 1**: Check viewport meta tag
```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**Solution 2**: Verify responsive classes
```tsx
// Use mobile-first classes
<div className="text-3xl md:text-4xl lg:text-6xl">
  Caption Text
</div>
```

**Solution 3**: Test on real devices
```bash
# Expose dev server to network
npm run dev -- --host

# Access from phone: http://your-ip:5173
```

---

### Issue: iOS Microphone Not Working

**Symptoms**:
- Works on Android/desktop but not iOS
- Safari shows "NotAllowedError"

**Solution 1**: Check iOS Safari settings
```
Settings > Safari > Camera & Microphone > Allow
Settings > [Your Site] > Microphone > Allow
```

**Solution 2**: Require user gesture
```typescript
// Recording must start from button tap, not automatic
const handleStartRecording = async () => {
  // This runs from user tap - OK
  await startRecording();
};
```

**Solution 3**: Check iOS version
```
MediaRecorder API requires:
- iOS 14.3+ for basic support
- iOS 15+ for better compatibility
```

---

## Performance Issues

### Issue: Slow Initial Load

**Symptoms**:
- White screen for 3+ seconds
- Large bundle size
- Lighthouse performance < 90

**Solution 1**: Check bundle size
```bash
npm run build
# Check dist/assets/*.js sizes
# Main bundle should be < 200KB gzipped

# Analyze bundle
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts and rebuild
```

**Solution 2**: Code splitting
```typescript
// Use lazy loading
const TeacherView = lazy(() => import('./pages/TeacherView'));
const StudentView = lazy(() => import('./pages/StudentView'));

<Suspense fallback={<div>Loading...</div>}>
  <TeacherView />
</Suspense>
```

**Solution 3**: Optimize images
```bash
# Compress PWA icons
npx @squoosh/cli --webp auto pwa-*.png
```

---

### Issue: High Memory Usage

**Symptoms**:
- Browser tab becomes slow
- Memory > 500MB
- "Out of memory" error

**Solution 1**: Check for memory leaks
```javascript
// Look for unremoved listeners
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  
  // Must cleanup!
  return () => window.removeEventListener('resize', handler);
}, []);
```

**Solution 2**: Stop audio context when unmounting
```typescript
useEffect(() => {
  return () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
  };
}, []);
```

**Solution 3**: Limit caption history
```typescript
// Keep only last 50 captions
const [captions, setCaptions] = useState<Caption[]>([]);

useEffect(() => {
  if (captions.length > 50) {
    setCaptions(prev => prev.slice(-50));
  }
}, [captions]);
```

---

## Development Environment Issues

### Issue: "npm install" Fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution 1**: Clear npm cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solution 2**: Use legacy peer deps
```bash
npm install --legacy-peer-deps
```

**Solution 3**: Check Node version
```bash
node --version  # Should be 18+

# Use nvm to switch versions
nvm install 18
nvm use 18
```

---

### Issue: Hot Reload Not Working

**Symptoms**:
- Changes don't reflect in browser
- Need manual refresh

**Solution 1**: Check Vite config
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true,  // For some filesystems
    },
  },
});
```

**Solution 2**: Check file watcher limits (Linux)
```bash
# Increase limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Issue: Port Already in Use

**Symptoms**:
```
Port 5173 is already in use
```

**Solution**:
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

---

## Browser-Specific Issues

### Issue: Safari Audio Context Issues

**Problem**: AudioContext starts suspended in Safari

**Solution**:
```typescript
const resumeAudioContext = async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
};

// Call on user interaction
<button onClick={resumeAudioContext}>Start</button>
```

---

### Issue: Firefox MediaRecorder Format

**Problem**: Firefox uses different audio format

**Solution**:
```typescript
// Detect supported format
const mimeType = MediaRecorder.isTypeSupported('audio/webm')
  ? 'audio/webm'
  : 'audio/mp4';

const recorder = new MediaRecorder(stream, { mimeType });
```

---

## Demo Mode Issues

### Issue: Demo Mode Not Activating

**Symptoms**:
- ?demo=true in URL but real mode active
- Demo captions not rotating

**Solution 1**: Check URL parameter
```
✓ http://localhost:5173/teacher?demo=true
✓ http://localhost:5173/student?demo=true
✗ http://localhost:5173/teacher/?demo=1
```

**Solution 2**: Check utils/session.ts
```typescript
export const isDemoMode = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
};
```

---

## Getting Additional Help

### Check Logs

**Browser Console**:
```
Chrome: Cmd+Option+J (Mac) / Ctrl+Shift+J (Windows)
Firefox: Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)
Safari: Cmd+Option+C (Mac)
```

**Server Logs**:
```bash
# Development server logs
npm run dev 2>&1 | tee server.log

# Build logs
npm run build > build.log 2>&1
```

### Debug Mode

Add to `.env.local`:
```bash
VITE_DEBUG=true
```

Add debug logging in code:
```typescript
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

if (DEBUG) {
  console.log('Audio chunk:', chunk.size, 'bytes');
}
```

### Report Issues

When reporting bugs, include:
1. Browser & version
2. Device & OS
3. Steps to reproduce
4. Console errors (screenshots)
5. Network tab (for API issues)
6. Expected vs actual behavior

### Community Resources

- GitHub Issues: [Link to repository]
- Documentation: `/docs/README.md`
- Testing Guide: `/docs/TESTING.md`
- Deployment Guide: `/docs/DEPLOYMENT.md`

---

**Last Updated**: December 5, 2025  
**Version**: 1.0  
**Maintainer**: Development Team
