# Deployment Guide - Sauti Darasa Frontend

## Overview

This guide covers deploying the Sauti Darasa PWA to production environments. We'll cover three popular hosting options optimized for React applications.

---

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all production credentials are configured:

```bash
# .env.production (DO NOT commit to Git)
VITE_FIREBASE_API_KEY=<production-firebase-key>
VITE_FIREBASE_AUTH_DOMAIN=<production-domain>
VITE_FIREBASE_DATABASE_URL=<production-database-url>
VITE_FIREBASE_PROJECT_ID=<production-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<production-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<production-sender-id>
VITE_FIREBASE_APP_ID=<production-app-id>
VITE_BACKEND_API_URL=<production-backend-url>
```

### 2. Firebase Configuration

**Database Rules (Production)**:
```json
{
  "rules": {
    "captions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

**Indexes (if needed)**:
```json
{
  "rules": {
    "captions": {
      ".indexOn": ["timestamp"]
    }
  }
}
```

### 3. Build Validation

```bash
# Test production build locally
npm run build
npm run preview

# Check for build errors
# Verify bundle size < 500KB gzipped
# Test PWA installation
# Verify all assets load
```

### 4. Code Quality

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Security audit
npm audit fix

# Format code
npm run format  # if configured
```

---

## Deployment Option 1: Vercel (Recommended)

**Best for**: Quick deployment, automatic CI/CD, great DX

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Initial Deployment

```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set project name
# - Confirm framework detection (Vite)
```

### Step 4: Configure Environment Variables

**Via Vercel Dashboard**:
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add all VITE_* variables
4. Set for "Production" environment

**Via CLI**:
```bash
vercel env add VITE_FIREBASE_API_KEY
# Paste value when prompted
# Select "Production"
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

### Step 6: Configure Custom Domain (Optional)

**Via Dashboard**:
1. Project Settings > Domains
2. Add custom domain
3. Update DNS records as instructed

**Via CLI**:
```bash
vercel domains add yourdomain.com
```

### Vercel Configuration File

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Auto-Deploy with GitHub

1. Push code to GitHub
2. Import project in Vercel
3. Connect repository
4. Configure env variables
5. Deploy

**Every push to main branch auto-deploys!**

---

## Deployment Option 2: Firebase Hosting

**Best for**: Firebase ecosystem integration, global CDN

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login

```bash
firebase login
```

### Step 3: Initialize Firebase

```bash
firebase init

# Select:
# - Hosting
# - Use existing project
# - Public directory: dist
# - Configure as SPA: Yes
# - Set up GitHub Actions: Optional
```

### Step 4: Configure firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/service-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Step 5: Build and Deploy

```bash
# Build production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Or use npm script
npm run deploy
```

Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

### Step 6: Custom Domain

```bash
# Add domain
firebase hosting:channel:deploy production --expires 30d

# Via console
# Hosting > Add custom domain > Follow DNS setup
```

---

## Deployment Option 3: Netlify

**Best for**: Form handling, serverless functions, split testing

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login

```bash
netlify login
```

### Step 3: Initialize

```bash
netlify init

# Follow prompts:
# - Create new site or link existing
# - Build command: npm run build
# - Publish directory: dist
```

### Step 4: Configure netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Step 5: Configure Environment Variables

**Via Dashboard**:
1. Site Settings > Build & deploy > Environment
2. Add all VITE_* variables

**Via CLI**:
```bash
netlify env:set VITE_FIREBASE_API_KEY "your-key"
```

### Step 6: Deploy

```bash
# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Auto-Deploy with Git

1. Push to GitHub/GitLab/Bitbucket
2. Connect repository in Netlify
3. Configure build settings
4. Every push auto-deploys

---

## Post-Deployment Verification

### 1. Functionality Checklist

```bash
# Visit production URL
https://your-domain.com

# Test these URLs:
✓ /teacher
✓ /student
✓ /teacher?demo=true
✓ /student?demo=true
✓ /teacher (with real recording)
✓ /student?sessionId=xxx (with real session)
```

### 2. PWA Installation

- [ ] Visit site on mobile
- [ ] Install prompt appears
- [ ] Installation successful
- [ ] App icon correct
- [ ] Opens in standalone mode

### 3. Performance Check

Run Lighthouse audit in production:
- [ ] Performance > 90
- [ ] Accessibility > 95
- [ ] PWA: All checks pass
- [ ] Load time < 2s

### 4. SSL/HTTPS

- [ ] Site loads over HTTPS
- [ ] No mixed content warnings
- [ ] Valid SSL certificate
- [ ] Microphone permissions work

### 5. Firebase Connection

- [ ] Check browser console
- [ ] No Firebase errors
- [ ] Connection indicator green
- [ ] Captions sync properly

### 6. Backend Integration

- [ ] Audio upload successful
- [ ] Transcription working
- [ ] Latency acceptable
- [ ] Error handling works

---

## Environment-Specific Configurations

### Development

```bash
# .env.development
VITE_FIREBASE_API_KEY=dev-key
VITE_FIREBASE_DATABASE_URL=https://dev-project.firebaseio.com
VITE_BACKEND_API_URL=http://localhost:8000
```

### Staging

```bash
# .env.staging
VITE_FIREBASE_API_KEY=staging-key
VITE_FIREBASE_DATABASE_URL=https://staging-project.firebaseio.com
VITE_BACKEND_API_URL=https://staging-api.yourdomain.com
```

### Production

```bash
# .env.production
VITE_FIREBASE_API_KEY=prod-key
VITE_FIREBASE_DATABASE_URL=https://prod-project.firebaseio.com
VITE_BACKEND_API_URL=https://api.yourdomain.com
```

---

## Continuous Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_BACKEND_API_URL: ${{ secrets.VITE_BACKEND_API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Rollback Procedure

### Vercel

```bash
# List deployments
vercel ls

# Promote specific deployment to production
vercel promote <deployment-url>
```

### Firebase

```bash
# List releases
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

### Netlify

```bash
# List deploys
netlify api listSiteDeploys --site-id=<your-site-id>

# Restore specific deploy
netlify api restoreSiteDeploy --site-id=<your-site-id> --deploy-id=<deploy-id>
```

---

## Monitoring & Analytics

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/react @sentry/vite-plugin
```

Configure in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### 2. Analytics (Google Analytics)

```bash
npm install react-ga4
```

```typescript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
```

### 3. Performance Monitoring

Use Lighthouse CI for continuous monitoring:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npx @lhci/cli@0.12.x autorun
```

---

## Security Best Practices

### 1. Environment Variables

- [ ] Never commit `.env` files
- [ ] Use platform secrets management
- [ ] Rotate keys regularly
- [ ] Limit variable access

### 2. Firebase Security

- [ ] Enable App Check
- [ ] Restrict database rules
- [ ] Enable authentication
- [ ] Set up rate limiting

### 3. Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.gstatic.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com;">
```

---

## Backup & Disaster Recovery

### 1. Code Backup

- [ ] Git repository on GitHub/GitLab
- [ ] Multiple branches (main, staging, dev)
- [ ] Tagged releases
- [ ] Regular commits

### 2. Firebase Backup

```bash
# Export database
firebase database:get / > backup.json

# Automated backup script
0 2 * * * firebase database:get / > backup-$(date +\%Y\%m\%d).json
```

### 3. Deployment Snapshots

- Vercel: Automatic snapshots per deployment
- Firebase: Version history in console
- Netlify: Deploy history with rollback

---

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Environment Variables Not Working

```bash
# Check naming (must start with VITE_)
# Restart dev server after changes
# Check platform-specific syntax
```

### PWA Not Installing

- Check manifest.json validity
- Verify HTTPS
- Check service worker registration
- Clear browser cache

### Firebase Connection Issues

- Verify credentials
- Check database rules
- Enable billing (if using paid features)
- Check CORS settings

---

## Deployment Checklist

### Pre-Deploy

- [ ] All tests passing
- [ ] Build successful locally
- [ ] Environment variables configured
- [ ] Firebase rules updated
- [ ] Security audit passed
- [ ] Performance benchmarks met

### Deploy

- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Check error logs
- [ ] Verify PWA installation
- [ ] Test on mobile devices

### Post-Deploy

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify analytics working
- [ ] Update documentation
- [ ] Notify team
- [ ] Tag release in Git

---

## Support & Maintenance

### Regular Updates

```bash
# Weekly
npm outdated
npm update

# Monthly
npm audit
npm audit fix
```

### Monitoring

- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error alerts (Sentry, LogRocket)
- Track performance (Firebase Performance, Lighthouse CI)
- Monitor costs (Firebase, hosting platform)

---

**Last Updated**: December 5, 2025  
**Version**: 1.0  
**Status**: Production Ready
