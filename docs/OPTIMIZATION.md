# Optimization & Best Practices - Sauti Darasa Frontend

This guide provides comprehensive optimization strategies for the Sauti Darasa PWA deployed on Google Cloud.

---

## Table of Contents

1. [Build Optimization](#build-optimization)
2. [Performance Optimization](#performance-optimization)
3. [Accessibility Enhancements](#accessibility-enhancements)
4. [Cost Optimization](#cost-optimization)
5. [Security Hardening](#security-hardening)
6. [Monitoring & Observability](#monitoring--observability)
7. [CI/CD Best Practices](#cicd-best-practices)

---

## Build Optimization

### Bundle Size Reduction

**Current**: ~500KB (gzipped)  
**Target**: <300KB (gzipped)

#### 1. Analyze Bundle

```bash
# Build with stats
npm run build -- --mode production

# Analyze bundle
npx vite-bundle-visualizer
```

#### 2. Code Splitting

Implement route-based code splitting in `src/App.tsx`:

```typescript
import { lazy, Suspense } from 'react';

const TeacherView = lazy(() => import('./pages/TeacherView'));
const StudentView = lazy(() => import('./pages/StudentView'));
const Home = lazy(() => import('./pages/Home'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher" element={<TeacherView />} />
          <Route path="/student" element={<StudentView />} />
        </Routes>
      </Router>
    </Suspense>
  );
}
```

#### 3. Tree Shaking

Update `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/database'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

#### 4. Remove Unused Dependencies

```bash
# Audit dependencies
npm ls --depth=0

# Remove unused packages
npm uninstall <unused-package>

# Use bundle analyzer
npx depcheck
```

**Expected Savings**: ~150KB

---

## Performance Optimization

### Lighthouse Score Targets

- **Performance**: >90
- **Accessibility**: >95
- **Best Practices**: 100
- **SEO**: >90

### 1. Image Optimization

**Current**: No images (audio waveform on canvas)  
**Recommendation**: If adding images in future:

```typescript
// Use WebP with fallback
<picture>
  <source srcSet="/logo.webp" type="image/webp" />
  <img src="/logo.png" alt="Sauti Darasa" loading="lazy" />
</picture>
```

### 2. Font Optimization

Update `index.html`:

```html
<!-- Preconnect to Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Load fonts with display swap -->
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### 3. Lazy Loading Components

Create `LoadingSpinner.tsx`:

```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );
}
```

### 4. Optimize Firebase Connection

Update `src/firebase.ts`:

```typescript
// Enable persistence for offline support
import { enableDatabase } from 'firebase/database';

export const initializeFirebase = async () => {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // Enable offline persistence
  await enableDatabase(db);

  return { app, db };
};
```

### 5. Service Worker Optimization

Update `vite.config.ts` PWA config:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    // Cache strategy for static assets
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'firebase-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
        },
      },
    ],
  },
});
```

### 6. Preload Critical Resources

Update `index.html`:

```html
<head>
  <!-- Preload critical CSS -->
  <link rel="preload" href="/src/index.css" as="style" />

  <!-- Preload main JS chunk -->
  <link rel="modulepreload" href="/src/main.tsx" />

  <!-- DNS prefetch for Firebase -->
  <link rel="dns-prefetch" href="https://firebaseio.com" />
</head>
```

---

## Accessibility Enhancements

### WCAG 2.1 Level AA Compliance

#### 1. Add ARIA Labels

Update `TeacherView.tsx`:

```typescript
<button
  onClick={startRecording}
  disabled={recording}
  aria-label={recording ? 'Stop recording' : 'Start recording'}
  aria-pressed={recording}
  className="..."
>
  {recording ? (
    <>
      <Square className="w-5 h-5" aria-hidden="true" />
      <span>Stop Recording</span>
    </>
  ) : (
    <>
      <Mic className="w-5 h-5" aria-hidden="true" />
      <span>Start Recording</span>
    </>
  )}
</button>
```

#### 2. Keyboard Navigation

Add keyboard shortcuts in `TeacherView.tsx`:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Space: Toggle recording
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      if (recording) {
        stopRecording();
      } else {
        startRecording();
      }
    }

    // Escape: Stop recording
    if (e.code === 'Escape' && recording) {
      stopRecording();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [recording]);
```

#### 3. Screen Reader Support

Add live regions for captions:

```typescript
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-relevant="additions"
  className="..."
>
  {captions.map((caption) => (
    <div key={caption.id} role="article" aria-label={`Caption from ${caption.timestamp}`}>
      {caption.text}
    </div>
  ))}
</div>
```

#### 4. Focus Management

Create `FocusTrap.tsx` utility:

```typescript
import { useEffect, useRef } from 'react';

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTab as EventListener);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab as EventListener);
    };
  }, [active]);

  return containerRef;
}
```

#### 5. Color Contrast

Update Tailwind colors for WCAG AA:

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Ensure 4.5:1 contrast ratio
        'text-primary': '#FFFFFF', // on #0A0A0A (21:1 ratio)
        'text-secondary': '#A3A3A3', // on #0A0A0A (7.5:1 ratio)
        'accent-green': '#22C55E', // on #0A0A0A (4.8:1 ratio)
      },
    },
  },
};
```

#### 6. Focus Indicators

Add custom focus styles:

```css
/* src/index.css */
@layer utilities {
  .focus-visible:focus-visible {
    @apply outline-none ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900;
  }

  button:focus-visible,
  a:focus-visible,
  input:focus-visible {
    @apply outline-none ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900;
  }
}
```

---

## Cost Optimization

### Google Cloud Run

**Current Cost**: ~$5/month  
**Optimized Target**: $2-3/month

#### 1. Right-Size Resources

```bash
# Reduce memory for static content
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --memory 256Mi \
  --cpu 1

# Set min instances to 0 (scale to zero)
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10
```

**Savings**: ~$2/month

#### 2. Optimize Container Image

Current: ~150MB  
Target: <80MB

Update `Dockerfile`:

```dockerfile
# Use distroless nginx for smaller image
FROM nginx:alpine AS production

# Copy only production files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Remove unnecessary files
RUN rm -rf /usr/share/nginx/html/*.map \
    && rm -rf /var/cache/apk/*

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Savings**: Faster cold starts, reduced bandwidth costs

#### 3. Enable Cloud CDN

```bash
# Create backend service
gcloud compute backend-services create sauti-darasa-backend \
  --global

# Enable Cloud CDN
gcloud compute backend-services update sauti-darasa-backend \
  --enable-cdn \
  --global

# Set cache TTL
gcloud compute backend-services update sauti-darasa-backend \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --global
```

**Savings**: Reduced egress costs, faster global access

#### 4. Set Budget Alerts

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="Sauti Darasa Monthly Budget" \
  --budget-amount=10USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

#### 5. Monitor Usage

```bash
# Check current costs
gcloud billing accounts list

# View service metrics
gcloud run services describe sauti-darasa-frontend \
  --region us-central1 \
  --format="table(status.traffic)"
```

---

## Security Hardening

### 1. Content Security Policy

Update `nginx.conf`:

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com;
  img-src 'self' data: https:;
  media-src 'self' blob:;
  frame-ancestors 'none';
" always;
```

### 2. Firebase Security Rules

Update Firebase Realtime Database rules:

```json
{
  "rules": {
    "captions": {
      "$sessionId": {
        ".read": "auth != null || query.orderByKey == true",
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['text', 'timestamp', 'sessionId'])",
        "text": {
          ".validate": "newData.isString() && newData.val().length <= 5000"
        },
        "timestamp": {
          ".validate": "newData.isNumber()"
        }
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['createdAt', 'active'])",
        "active": {
          ".validate": "newData.isBoolean()"
        }
      }
    }
  }
}
```

### 3. Rate Limiting

Implement rate limiting in Cloud Run:

```bash
# Install Cloud Armor (requires Load Balancer)
gcloud compute security-policies create rate-limit-policy \
  --description="Rate limiting for Sauti Darasa"

# Add rate limit rule
gcloud compute security-policies rules create 1000 \
  --security-policy=rate-limit-policy \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600
```

### 4. Secrets Management

Migrate environment variables to Secret Manager:

```bash
# Store secrets
echo -n "your-firebase-key" | gcloud secrets create firebase-api-key --data-file=-

# Grant access to Cloud Run service
gcloud secrets add-iam-policy-binding firebase-api-key \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update Cloud Run to use secret
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --update-secrets=VITE_FIREBASE_API_KEY=firebase-api-key:latest
```

### 5. HTTPS Enforcement

Already configured in Cloud Run (automatic HTTPS).

Verify with:

```bash
curl -I https://your-service.run.app
# Check for "Strict-Transport-Security" header
```

---

## Monitoring & Observability

### 1. Cloud Logging

Create custom log-based metrics:

```bash
# Create metric for error count
gcloud logging metrics create error-count \
  --description="Count of application errors" \
  --log-filter='resource.type="cloud_run_revision"
    AND severity>=ERROR'

# Create metric for slow requests
gcloud logging metrics create slow-requests \
  --description="Requests taking >2 seconds" \
  --log-filter='resource.type="cloud_run_revision"
    AND httpRequest.latency>"2s"'
```

### 2. Uptime Monitoring

```bash
# Create uptime check
gcloud monitoring uptime create sauti-darasa-health \
  --resource-type=uptime-url \
  --host=your-service.run.app \
  --http-check-path=/health \
  --period=60 \
  --timeout=10
```

### 3. Alert Policies

```bash
# High error rate alert
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

### 4. Custom Metrics in Application

Add custom logging in `src/utils/logger.ts`:

```typescript
export const logEvent = (event: string, metadata?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    // Send to Cloud Logging
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: event,
        ...metadata,
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    console.log(`[${event}]`, metadata);
  }
};

export const logError = (error: Error, context?: string) => {
  if (import.meta.env.PROD) {
    console.error(
      JSON.stringify({
        severity: 'ERROR',
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    console.error(`[Error in ${context}]`, error);
  }
};
```

Use in components:

```typescript
import { logEvent, logError } from '@/utils/logger';

const TeacherView = () => {
  const startRecording = async () => {
    try {
      logEvent('recording_started', { sessionId });
      // ... recording logic
    } catch (error) {
      logError(error as Error, 'startRecording');
    }
  };
};
```

### 5. Performance Monitoring

Add Web Vitals tracking:

```bash
npm install web-vitals
```

Create `src/utils/vitals.ts`:

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export const reportWebVitals = () => {
  onCLS((metric) => {
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Web Vital: CLS',
        value: metric.value,
        rating: metric.rating,
      })
    );
  });

  onFID((metric) => {
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Web Vital: FID',
        value: metric.value,
        rating: metric.rating,
      })
    );
  });

  onFCP((metric) => {
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Web Vital: FCP',
        value: metric.value,
        rating: metric.rating,
      })
    );
  });

  onLCP((metric) => {
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Web Vital: LCP',
        value: metric.value,
        rating: metric.rating,
      })
    );
  });

  onTTFB((metric) => {
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Web Vital: TTFB',
        value: metric.value,
        rating: metric.rating,
      })
    );
  });
};
```

Import in `src/main.tsx`:

```typescript
import { reportWebVitals } from './utils/vitals';

if (import.meta.env.PROD) {
  reportWebVitals();
}
```

---

## CI/CD Best Practices

### 1. Multi-Environment Setup

Create separate environments:

```bash
# Development
gcloud run deploy sauti-darasa-dev \
  --image gcr.io/PROJECT_ID/sauti-darasa:dev \
  --region us-central1 \
  --tag dev

# Staging
gcloud run deploy sauti-darasa-staging \
  --image gcr.io/PROJECT_ID/sauti-darasa:staging \
  --region us-central1 \
  --tag staging

# Production
gcloud run deploy sauti-darasa-frontend \
  --image gcr.io/PROJECT_ID/sauti-darasa:latest \
  --region us-central1 \
  --tag latest
```

### 2. Automated Testing in CI

Update `cloudbuild.yaml`:

```yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']

  # Run linting
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'lint']

  # Run type checking
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'type-check']

  # Run unit tests (when added)
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'test']

  # Build for production
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'build']

  # Lighthouse CI audit
  - name: 'cypress/browsers:node18.12.0-chrome106'
    entrypoint: bash
    args:
      - '-c'
      - |
        npm install -g @lhci/cli
        lhci autorun

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/sauti-darasa:$COMMIT_SHA', '.']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sauti-darasa-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/sauti-darasa:$COMMIT_SHA'
      - '--region'
      - 'us-central1'

timeout: 1800s
```

### 3. Canary Deployments

```bash
# Deploy new version with tag
gcloud run deploy sauti-darasa-frontend \
  --image gcr.io/PROJECT_ID/sauti-darasa:v2 \
  --region us-central1 \
  --tag v2 \
  --no-traffic

# Split traffic (90% old, 10% new)
gcloud run services update-traffic sauti-darasa-frontend \
  --region us-central1 \
  --to-revisions=v1=90,v2=10

# Monitor for errors, then gradually increase
gcloud run services update-traffic sauti-darasa-frontend \
  --region us-central1 \
  --to-revisions=v2=100
```

### 4. Rollback Strategy

```bash
# Automated rollback on high error rate
# Add to Cloud Build trigger:
- name: 'gcr.io/cloud-builders/gcloud'
  entrypoint: 'bash'
  args:
    - '-c'
    - |
      ERROR_RATE=$(gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=100 --format=json | jq '. | length')
      if [ "$ERROR_RATE" -gt 10 ]; then
        echo "High error rate detected, rolling back..."
        gcloud run services update-traffic sauti-darasa-frontend \
          --region us-central1 \
          --to-revisions=LATEST
        exit 1
      fi
```

---

## Summary Checklist

### Build Optimization
- [ ] Implement code splitting
- [ ] Configure tree shaking
- [ ] Remove unused dependencies
- [ ] Optimize bundle size to <300KB

### Performance
- [ ] Add lazy loading for routes
- [ ] Optimize service worker caching
- [ ] Preload critical resources
- [ ] Achieve Lighthouse score >90

### Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard shortcuts
- [ ] Add screen reader support
- [ ] Ensure 4.5:1 color contrast ratio
- [ ] Add focus indicators

### Cost Optimization
- [ ] Right-size Cloud Run resources (256Mi memory)
- [ ] Enable scale-to-zero
- [ ] Optimize Docker image (<80MB)
- [ ] Enable Cloud CDN
- [ ] Set budget alerts

### Security
- [ ] Configure CSP headers
- [ ] Update Firebase security rules
- [ ] Implement rate limiting
- [ ] Migrate secrets to Secret Manager
- [ ] Verify HTTPS enforcement

### Monitoring
- [ ] Create custom log metrics
- [ ] Set up uptime monitoring
- [ ] Configure alert policies
- [ ] Add Web Vitals tracking
- [ ] Implement custom application logging

### CI/CD
- [ ] Set up multi-environment deployments
- [ ] Add automated testing in pipeline
- [ ] Implement canary deployments
- [ ] Configure automated rollback

---

**Expected Results After Optimization**:
- **Bundle Size**: 500KB → <300KB (40% reduction)
- **Lighthouse Score**: 85 → >90
- **Monthly Cost**: $5 → $2-3 (40% savings)
- **Accessibility**: WCAG 2.1 Level AA compliant
- **Performance**: Sub-second page load times globally

---

**Last Updated**: December 5, 2025  
**Version**: 1.0  
**Status**: Recommended Best Practices
