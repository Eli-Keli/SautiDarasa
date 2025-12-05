# Testing Guide - Sauti Darasa Frontend

## Pre-Testing Setup

### 1. Environment Configuration

**Option A: Demo Mode (No Setup Required)**
```bash
# Access demo URLs directly
http://localhost:5173/teacher?demo=true
http://localhost:5173/student?demo=true
```

**Option B: Full Firebase Integration**
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Add Firebase credentials to .env
# Get credentials from Firebase Console

# 3. Restart development server
npm run dev
```

### 2. Browser Requirements

**Minimum Requirements**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Browser Features**:
- MediaRecorder API
- getUserMedia API
- Web Audio API
- Canvas API
- Service Worker support

**Enable in Chrome**:
1. Navigate to `chrome://flags`
2. Enable "Experimental Web Platform features"
3. Restart browser

---

## Testing Phases

## Phase 1: Demo Mode Testing (No Backend)

### 1.1 Teacher View Demo

**URL**: `http://localhost:5173/teacher?demo=true`

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| TD-001 | Load teacher page with `?demo=true` | Page loads, "DEMO MODE" badge visible | ⬜ |
| TD-002 | Check session ID | Random 10-char session ID displayed | ⬜ |
| TD-003 | Copy share link | Link copied to clipboard, shows "✓ Copied" | ⬜ |
| TD-004 | Click "Start Recording" | Button changes to "Stop Recording" | ⬜ |
| TD-005 | Verify waveform | Animated bars appear (demo animation) | ⬜ |
| TD-006 | Check status | "Recording..." message with chunk counter | ⬜ |
| TD-007 | Check connection | Green "Connected" indicator visible | ⬜ |
| TD-008 | Click "Stop Recording" | Recording stops, counter resets | ⬜ |

**Console Checks**:
```bash
# Should see these messages
[Demo] Audio chunk received: XXX bytes
Session ID: XXXXXXXXXX
```

### 1.2 Student View Demo

**URL**: `http://localhost:5173/student?demo=true`

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| SD-001 | Load student page with `?demo=true` | Page loads, "Demo Mode" in header | ⬜ |
| SD-002 | Wait 2 seconds | First mock caption appears | ⬜ |
| SD-003 | Wait 2 more seconds | Caption changes to next message | ⬜ |
| SD-004 | Observe rotation | Captions cycle through 6 messages | ⬜ |
| SD-005 | Check text size | Large, readable text (responsive) | ⬜ |
| SD-006 | Check contrast | White text on black background | ⬜ |
| SD-007 | Check connection | Green dot in header | ⬜ |

**Mock Captions Sequence**:
1. "Welcome to Sauti Darasa"
2. "This is a demo of real-time captioning"
3. "In a real classroom, you would see live captions"
4. "The captions update automatically"
5. "Teachers can speak and students see the text"
6. "Perfect for inclusive education"

---

## Phase 2: Basic Functionality Testing

### 2.1 Teacher View (Without Backend)

**URL**: `http://localhost:5173/teacher`

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| TB-001 | Load teacher page | Page loads successfully | ⬜ |
| TB-002 | Request microphone | Browser permission prompt appears | ⬜ |
| TB-003 | Grant permission | Permission status shows granted | ⬜ |
| TB-004 | Deny permission | Warning message appears | ⬜ |
| TB-005 | Start recording | Real waveform visualization starts | ⬜ |
| TB-006 | Speak into mic | Waveform responds to audio | ⬜ |
| TB-007 | Stop recording | Waveform stops, returns to inactive | ⬜ |
| TB-008 | Check upload errors | Error messages shown (no backend) | ⬜ |

**Console Checks**:
```bash
# Check for Firebase warning
[Firebase] Not configured. Using demo/offline mode.

# Check for upload attempts
Upload audio chunk error: ...
```

### 2.2 Student View (Without Backend)

**URL**: `http://localhost:5173/student?sessionId=test123`

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| SB-001 | Load with session ID | Page loads, shows "Waiting for captions" | ⬜ |
| SB-002 | Load without session ID | Error page: "Session Not Found" | ⬜ |
| SB-003 | Check Firebase warning | Console shows Firebase warning | ⬜ |
| SB-004 | Wait 30 seconds | No captions appear (expected) | ⬜ |

---

## Phase 3: Firebase Integration Testing

### 3.1 Prerequisites

```bash
# 1. Firebase project created
# 2. Realtime Database enabled
# 3. Database rules set to public (testing only)
# 4. Credentials added to .env
# 5. Server restarted
```

### 3.2 Connection Testing

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| FC-001 | Load teacher page | No Firebase errors in console | ⬜ |
| FC-002 | Check connection | Connection indicator turns green | ⬜ |
| FC-003 | Disconnect internet | Connection indicator turns red | ⬜ |
| FC-004 | Reconnect internet | Connection indicator returns green | ⬜ |

**Console Checks**:
```bash
# No errors should appear
# Connection should show true
```

### 3.3 Manual Caption Testing

**Setup**:
```javascript
// Open browser console on student page
// Manually write caption to Firebase

firebase.database().ref('captions/test123/latest').set({
  text: "Hello, this is a test caption",
  timestamp: firebase.database.ServerValue.TIMESTAMP
});
```

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| FM-001 | Write caption via console | Caption appears on student view | ⬜ |
| FM-002 | Update caption | Student view updates immediately | ⬜ |
| FM-003 | Long caption | Text wraps properly, no overflow | ⬜ |
| FM-004 | Special characters | Renders correctly (emoji, accents) | ⬜ |

---

## Phase 4: Backend Integration Testing

### 4.1 Prerequisites

```bash
# Backend server running
# VITE_BACKEND_API_URL set in .env
# Server accepts POST /api/transcribe
```

### 4.2 Audio Upload Testing

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| BU-001 | Start recording | Audio chunks sent every 1.5s | ⬜ |
| BU-002 | Check network tab | POST requests to /api/transcribe | ⬜ |
| BU-003 | Verify payload | Base64 audio in request body | ⬜ |
| BU-004 | Check session ID | Session ID in query parameter | ⬜ |
| BU-005 | Successful upload | Chunk counter increments | ⬜ |
| BU-006 | Failed upload | Error message displayed | ⬜ |
| BU-007 | Retry on error | 2 retry attempts with backoff | ⬜ |

**Network Tab Inspection**:
```
POST /api/transcribe?sessionId=abc123xyz
Content-Type: application/json

{
  "audioChunk": "data:audio/webm;base64,GkXf..."
}
```

### 4.3 End-to-End Testing

**Setup**:
1. Backend server running
2. Firebase configured
3. Teacher in one tab/device
4. Student in another tab/device

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| E2E-001 | Teacher starts session | Session ID created | ⬜ |
| E2E-002 | Student joins with link | Student page loads successfully | ⬜ |
| E2E-003 | Teacher starts recording | Audio sent to backend | ⬜ |
| E2E-004 | Backend transcribes | Caption written to Firebase | ⬜ |
| E2E-005 | Student sees caption | Caption appears within 2-3s | ⬜ |
| E2E-006 | Teacher speaks more | Captions update in real-time | ⬜ |
| E2E-007 | Teacher stops recording | Captions stop updating | ⬜ |
| E2E-008 | Check latency | < 3 second end-to-end delay | ⬜ |

---

## Phase 5: Mobile Testing

### 5.1 Mobile Chrome/Safari

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| MB-001 | Open teacher page on mobile | Page responsive, buttons large | ⬜ |
| MB-002 | Grant microphone | iOS/Android permission granted | ⬜ |
| MB-003 | Record audio | Recording works on mobile | ⬜ |
| MB-004 | Check waveform | Waveform renders and animates | ⬜ |
| MB-005 | Rotate device | Layout adapts to orientation | ⬜ |
| MB-006 | Open student page | Captions fill screen | ⬜ |
| MB-007 | Test font size | Text readable without zooming | ⬜ |
| MB-008 | Lock screen | Page maintains session | ⬜ |

### 5.2 iOS Specific

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| IOS-001 | Test on Safari | All features work | ⬜ |
| IOS-002 | Add to home screen | PWA installs successfully | ⬜ |
| IOS-003 | Open installed PWA | Launches in standalone mode | ⬜ |
| IOS-004 | Background app | Session remains active | ⬜ |

### 5.3 Android Specific

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| AND-001 | Test on Chrome | All features work | ⬜ |
| AND-002 | Install PWA prompt | Install banner appears | ⬜ |
| AND-003 | Install app | PWA installs to home screen | ⬜ |
| AND-004 | Open installed PWA | Launches in standalone mode | ⬜ |

---

## Phase 6: PWA Testing

### 6.1 Installation

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| PWA-001 | Visit site multiple times | Install prompt appears | ⬜ |
| PWA-002 | Click install | App installed to device | ⬜ |
| PWA-003 | Check app icon | Correct icon displayed | ⬜ |
| PWA-004 | Open installed app | No browser UI visible | ⬜ |

### 6.2 Offline Functionality

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| OFF-001 | Load page while online | Page loads | ⬜ |
| OFF-002 | Disable network | App remains functional | ⬜ |
| OFF-003 | Navigate pages | Routing works offline | ⬜ |
| OFF-004 | Demo mode offline | Demo mode works | ⬜ |
| OFF-005 | Check cached assets | CSS/JS/images load | ⬜ |

### 6.3 Service Worker

**Chrome DevTools > Application > Service Workers**

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| SW-001 | Check registration | Service worker registered | ⬜ |
| SW-002 | Check status | Service worker activated | ⬜ |
| SW-003 | Check cache | Assets cached properly | ⬜ |
| SW-004 | Update app | Service worker updates | ⬜ |

---

## Phase 7: Performance Testing

### 7.1 Lighthouse Audit

**Run in Chrome DevTools**:
```bash
# Open DevTools > Lighthouse
# Select: Performance, Accessibility, PWA
# Click "Analyze page load"
```

**Target Scores**:

| Metric | Target | Actual | Status |
|--------|--------|--------|---------|
| Performance | > 90 | ___ | ⬜ |
| Accessibility | > 95 | ___ | ⬜ |
| Best Practices | > 90 | ___ | ⬜ |
| SEO | > 80 | ___ | ⬜ |
| PWA | ✓ All | ___ | ⬜ |

### 7.2 Load Testing

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| PERF-001 | Measure page load | < 2s initial load | ⬜ |
| PERF-002 | Measure TTI | < 3s time to interactive | ⬜ |
| PERF-003 | Test with slow 3G | Acceptable performance | ⬜ |
| PERF-004 | Multiple tabs | No memory leaks | ⬜ |
| PERF-005 | Long session (30 min) | No performance degradation | ⬜ |

---

## Phase 8: Security Testing

### 8.1 Basic Security

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| SEC-001 | Check HTTPS | Runs on HTTPS (production) | ⬜ |
| SEC-002 | Inspect Firebase rules | Not fully public in prod | ⬜ |
| SEC-003 | Check .env | Not committed to git | ⬜ |
| SEC-004 | Test XSS | No script injection possible | ⬜ |
| SEC-005 | Check dependencies | No critical vulnerabilities | ⬜ |

**Run Security Audit**:
```bash
npm audit
npm audit fix
```

---

## Phase 9: Accessibility Testing

### 9.1 Screen Reader Testing

**Test with VoiceOver (Mac) or NVDA (Windows)**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| A11Y-001 | Navigate with Tab | Logical tab order | ⬜ |
| A11Y-002 | Screen reader | All content accessible | ⬜ |
| A11Y-003 | Button labels | Clear button descriptions | ⬜ |
| A11Y-004 | Error messages | Errors announced | ⬜ |
| A11Y-005 | Caption updates | New captions announced | ⬜ |

### 9.2 Keyboard Navigation

**Test Cases**:

| Test ID | Action | Expected Result | Status |
|---------|--------|----------------|---------|
| KB-001 | Tab through controls | All interactive elements reachable | ⬜ |
| KB-002 | Space on button | Activates button | ⬜ |
| KB-003 | Enter on link | Follows link | ⬜ |
| KB-004 | No mouse | Full functionality with keyboard | ⬜ |

### 9.3 Color Contrast

**Use Contrast Checker**:

| Test ID | Element | Ratio | Target | Status |
|---------|---------|-------|--------|---------|
| CC-001 | White on black | 21:1 | > 7:1 | ⬜ |
| CC-002 | Blue buttons | > 4.5:1 | > 4.5:1 | ⬜ |
| CC-003 | Gray text | > 4.5:1 | > 4.5:1 | ⬜ |

---

## Phase 10: Cross-Browser Testing

### 10.1 Desktop Browsers

| Browser | Version | Teacher View | Student View | PWA | Status |
|---------|---------|--------------|--------------|-----|---------|
| Chrome | Latest | ⬜ | ⬜ | ⬜ | ⬜ |
| Firefox | Latest | ⬜ | ⬜ | ⬜ | ⬜ |
| Safari | Latest | ⬜ | ⬜ | ⬜ | ⬜ |
| Edge | Latest | ⬜ | ⬜ | ⬜ | ⬜ |

### 10.2 Mobile Browsers

| Browser | Device | Teacher View | Student View | PWA | Status |
|---------|--------|--------------|--------------|-----|---------|
| Chrome | Android | ⬜ | ⬜ | ⬜ | ⬜ |
| Safari | iOS | ⬜ | ⬜ | ⬜ | ⬜ |
| Samsung Internet | Android | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Bug Reporting Template

When you find a bug, create an issue with this template:

```markdown
## Bug Report

**Bug ID**: [e.g., BUG-001]
**Test Case**: [e.g., TB-005]
**Severity**: Critical / High / Medium / Low

### Description
[Clear description of the bug]

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Device: [e.g., Desktop / iPhone 14]
- URL: [e.g., /teacher?demo=true]

### Screenshots
[If applicable]

### Console Logs
```
[Paste console errors here]
```

### Additional Context
[Any other relevant information]
```

---

## Testing Sign-Off

Once all phases are complete, fill in this checklist:

### Pre-Production Checklist

- [ ] All Phase 1-3 tests passing (demo + basic functionality)
- [ ] Firebase integration working
- [ ] Backend integration successful
- [ ] End-to-end latency < 3 seconds
- [ ] Mobile testing complete (iOS + Android)
- [ ] PWA installation working
- [ ] Offline mode functional
- [ ] Performance scores meet targets
- [ ] Security audit passed
- [ ] Accessibility tests passed
- [ ] Cross-browser testing complete
- [ ] No critical or high-severity bugs
- [ ] Documentation updated
- [ ] Deployment guide reviewed

### Sign-Off

**Tested By**: ________________  
**Date**: ________________  
**Status**: Ready for Production / Needs More Work  
**Notes**: ________________

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Security audit
npm audit

# Check bundle size
npm run build -- --report
```

---

**Last Updated**: December 5, 2025  
**Version**: 1.0  
**Status**: Ready for Testing
