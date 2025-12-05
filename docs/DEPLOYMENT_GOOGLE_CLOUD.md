# Google Cloud Deployment Guide - Sauti Darasa Frontend

## Overview

This guide provides complete instructions for deploying the Sauti Darasa PWA to **Google Cloud Platform** using either **Cloud Run** (recommended) or **App Engine**. This documentation is designed for developers with no prior GCP deployment experience.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Project Setup](#google-cloud-project-setup)
3. [Deployment Method 1: Cloud Run (Recommended)](#deployment-method-1-cloud-run-recommended)
4. [Deployment Method 2: App Engine](#deployment-method-2-app-engine)
5. [Environment Configuration](#environment-configuration)
6. [Custom Domain Setup](#custom-domain-setup)
7. [CI/CD with Cloud Build](#cicd-with-cloud-build)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Install Required Tools

**Google Cloud SDK (gcloud)**:
```bash
# macOS (using Homebrew)
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version
```

**Docker** (for Cloud Run):
```bash
# macOS
brew install docker

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Verify installation
docker --version
```

**Node.js** (v18+):
```bash
# Check version
node --version
npm --version
```

### 2. Create Google Account

- Go to [https://console.cloud.google.com](https://console.cloud.google.com)
- Sign in with your Google account
- Accept terms of service

---

## Google Cloud Project Setup

### Step 1: Create a New Project

```bash
# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create sauti-darasa-prod --name="Sauti Darasa Production"

# Set as active project
gcloud config set project sauti-darasa-prod

# Verify
gcloud config list
```

**Or via Console**:
1. Visit [GCP Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Enter project name: `Sauti Darasa Production`
4. Click "Create"

### Step 2: Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build (for CI/CD)
gcloud services enable cloudbuild.googleapis.com

# Enable Secret Manager (for env variables)
gcloud services enable secretmanager.googleapis.com

# Verify enabled services
gcloud services list --enabled
```

### Step 3: Set Up Billing

⚠️ **Important**: GCP requires billing to be enabled, even for free tier usage.

1. Go to [Billing Console](https://console.cloud.google.com/billing)
2. Click "Link a Billing Account"
3. Create new billing account or select existing
4. Link to your project

**Cost Estimates**:
- Cloud Run: Free tier includes 2 million requests/month, 360,000 GB-seconds
- Typical usage: $0-5/month for small deployments
- Container Registry: $0.026/GB/month

### Step 4: Create Service Account

```bash
# Create service account for deployment
gcloud iam service-accounts create sauti-darasa-deployer \
    --description="Service account for Sauti Darasa deployments" \
    --display-name="Sauti Darasa Deployer"

# Grant necessary roles
gcloud projects add-iam-policy-binding sauti-darasa-prod \
    --member="serviceAccount:sauti-darasa-deployer@sauti-darasa-prod.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding sauti-darasa-prod \
    --member="serviceAccount:sauti-darasa-deployer@sauti-darasa-prod.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding sauti-darasa-prod \
    --member="serviceAccount:sauti-darasa-deployer@sauti-darasa-prod.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Generate key file (keep this secure!)
gcloud iam service-accounts keys create ~/sauti-darasa-key.json \
    --iam-account=sauti-darasa-deployer@sauti-darasa-prod.iam.gserviceaccount.com
```

---

## Deployment Method 1: Cloud Run (Recommended)

**Best for**: Containerized apps, automatic scaling, pay-per-use pricing

### Why Cloud Run?
- ✅ Automatic HTTPS with managed SSL
- ✅ Scales to zero (no costs when not in use)
- ✅ Fast cold start times
- ✅ Global CDN included
- ✅ Easy rollbacks

### Step 1: Configure Environment Variables

Copy the template and fill in your values:

```bash
cp .env.gcloud .env.production
```

Edit `.env.production`:
```bash
VITE_FIREBASE_API_KEY=AIzaSyYourActualKey
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_BACKEND_API_URL=https://your-backend.run.app
```

### Step 2: Authenticate Docker with GCR

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker
```

### Step 3: Build and Test Locally

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build Docker image locally
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_DATABASE_URL="$VITE_FIREBASE_DATABASE_URL" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --build-arg VITE_BACKEND_API_URL="$VITE_BACKEND_API_URL" \
  -t sauti-darasa-frontend:local .

# Test container locally
docker run -p 8080:8080 sauti-darasa-frontend:local

# Visit http://localhost:8080 to test
# Press Ctrl+C to stop
```

### Step 4: Deploy Using Script (Easiest)

```bash
# Run deployment script
./deploy-cloud-run.sh

# Follow prompts:
# - Enter GCP Project ID: sauti-darasa-prod
# - Enter region: us-central1 (or your preferred region)
# - Enter service name: sauti-darasa-frontend
# - Confirm deployment: y
```

### Step 5: Manual Deployment (Alternative)

```bash
# Set variables
PROJECT_ID="sauti-darasa-prod"
REGION="us-central1"
SERVICE_NAME="sauti-darasa-frontend"

# Build and tag image
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_DATABASE_URL="$VITE_FIREBASE_DATABASE_URL" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --build-arg VITE_BACKEND_API_URL="$VITE_BACKEND_API_URL" \
  -t $IMAGE_NAME .

# Push to Container Registry
docker push $IMAGE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --timeout 60

# Get service URL
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
```

### Step 6: Verify Deployment

```bash
# Get service details
gcloud run services describe sauti-darasa-frontend --region us-central1

# Test the URL
curl -I https://sauti-darasa-frontend-xxxxx-uc.a.run.app

# Check logs
gcloud run services logs read sauti-darasa-frontend --region us-central1
```

**Test in Browser**:
1. Visit the Cloud Run URL
2. Test `/teacher?demo=true`
3. Test `/student?demo=true`
4. Check PWA installation
5. Verify microphone permissions

---

## Deployment Method 2: App Engine

**Best for**: Simpler setup, integrated with GCP services, static hosting

### Step 1: Prepare Build

```bash
# Build production assets
npm run build

# Verify dist/ folder exists
ls -la dist/
```

### Step 2: Configure app.yaml

The `app.yaml` file is already configured in your project root. Review and adjust if needed.

### Step 3: Deploy to App Engine

```bash
# Initialize App Engine (first time only)
gcloud app create --region=us-central

# Deploy application
gcloud app deploy app.yaml \
  --project=sauti-darasa-prod \
  --quiet

# Deploy with environment variables
gcloud app deploy app.yaml \
  --env-vars-file=.env.production \
  --quiet

# View deployment
gcloud app browse
```

### Step 4: Update Deployment

```bash
# Rebuild
npm run build

# Deploy new version
gcloud app deploy --quiet

# View versions
gcloud app versions list

# Route traffic to specific version
gcloud app services set-traffic default --splits=v2=1
```

---

## Environment Configuration

### Using Secret Manager (Recommended)

Store sensitive environment variables in Google Secret Manager:

```bash
# Create secrets
echo -n "AIzaSyYourActualKey" | gcloud secrets create firebase-api-key --data-file=-
echo -n "https://your-project.firebaseio.com" | gcloud secrets create firebase-db-url --data-file=-

# Grant access to Cloud Run service
gcloud secrets add-iam-policy-binding firebase-api-key \
  --member="serviceAccount:sauti-darasa-deployer@sauti-darasa-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update Cloud Run to use secrets
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --update-secrets VITE_FIREBASE_API_KEY=firebase-api-key:latest,VITE_FIREBASE_DATABASE_URL=firebase-db-url:latest
```

### Environment-Specific Deployments

**Development**:
```bash
gcloud run deploy sauti-darasa-frontend-dev \
  --image gcr.io/sauti-darasa-prod/sauti-darasa-frontend:dev \
  --region us-central1 \
  --tag dev
```

**Staging**:
```bash
gcloud run deploy sauti-darasa-frontend-staging \
  --image gcr.io/sauti-darasa-prod/sauti-darasa-frontend:staging \
  --region us-central1 \
  --tag staging
```

**Production**:
```bash
gcloud run deploy sauti-darasa-frontend \
  --image gcr.io/sauti-darasa-prod/sauti-darasa-frontend:latest \
  --region us-central1 \
  --tag latest
```

---

## Custom Domain Setup

### Step 1: Verify Domain Ownership

```bash
# Map domain to Cloud Run
gcloud run domain-mappings create \
  --service sauti-darasa-frontend \
  --domain sautidarasa.com \
  --region us-central1
```

### Step 2: Update DNS Records

The command above will output DNS records you need to add:

```
CNAME:  www  →  ghs.googlehosted.com
A:      @    →  216.239.32.21
A:      @    →  216.239.34.21
A:      @    →  216.239.36.21
A:      @    →  216.239.38.21
```

Add these records in your domain registrar's DNS settings.

### Step 3: Verify Domain

```bash
# Check domain mapping status
gcloud run domain-mappings describe --domain sautidarasa.com --region us-central1

# List all mappings
gcloud run domain-mappings list --region us-central1
```

**SSL Certificate**: Automatically provisioned by Google (takes 15-60 minutes).

---

## CI/CD with Cloud Build

### Step 1: Create cloudbuild.yaml

```yaml
# cloudbuild.yaml
steps:
  # Install dependencies
  - name: 'node:18'
    entrypoint: npm
    args: ['ci']

  # Run tests
  - name: 'node:18'
    entrypoint: npm
    args: ['run', 'lint']

  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'VITE_FIREBASE_API_KEY=$_FIREBASE_API_KEY'
      - '--build-arg'
      - 'VITE_FIREBASE_AUTH_DOMAIN=$_FIREBASE_AUTH_DOMAIN'
      - '--build-arg'
      - 'VITE_FIREBASE_DATABASE_URL=$_FIREBASE_DB_URL'
      - '--build-arg'
      - 'VITE_FIREBASE_PROJECT_ID=$_FIREBASE_PROJECT_ID'
      - '--build-arg'
      - 'VITE_FIREBASE_STORAGE_BUCKET=$_FIREBASE_STORAGE'
      - '--build-arg'
      - 'VITE_FIREBASE_MESSAGING_SENDER_ID=$_FIREBASE_SENDER_ID'
      - '--build-arg'
      - 'VITE_FIREBASE_APP_ID=$_FIREBASE_APP_ID'
      - '--build-arg'
      - 'VITE_BACKEND_API_URL=$_BACKEND_URL'
      - '-t'
      - 'gcr.io/$PROJECT_ID/sauti-darasa-frontend:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/sauti-darasa-frontend:latest'
      - '.'

  # Push image to GCR
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sauti-darasa-frontend:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'sauti-darasa-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/sauti-darasa-frontend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/sauti-darasa-frontend:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/sauti-darasa-frontend:latest'

timeout: 1800s
```

### Step 2: Create Build Trigger

```bash
# Connect GitHub repository
gcloud builds triggers create github \
  --name="sauti-darasa-frontend-deploy" \
  --repo-name="SautiDarasa" \
  --repo-owner="ViggenKorir" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --substitutions=_FIREBASE_API_KEY="your-key",_FIREBASE_AUTH_DOMAIN="your-domain"
```

**Or via Console**:
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Connect Repository"
3. Select GitHub → Authorize → Select repository
4. Click "Create Trigger"
5. Set branch: `main`
6. Set build config: `cloudbuild.yaml`
7. Add substitution variables (environment variables)
8. Click "Create"

---

## Monitoring & Logging

### Cloud Monitoring

```bash
# View real-time logs
gcloud run services logs read sauti-darasa-frontend \
  --region us-central1 \
  --limit 50 \
  --follow

# Filter error logs
gcloud run services logs read sauti-darasa-frontend \
  --region us-central1 \
  --log-filter="severity>=ERROR"
```

### Performance Metrics

**Via Console**:
1. Go to [Cloud Run Services](https://console.cloud.google.com/run)
2. Click your service
3. View "Metrics" tab for:
   - Request count
   - Request latency
   - Container instance count
   - Memory/CPU utilization

### Set Up Alerts

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Sauti Darasa High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

### Cost Monitoring

```bash
# Check current costs
gcloud billing accounts list

# Export billing data to BigQuery
gcloud billing accounts projects link PROJECT_ID \
  --billing-account=BILLING_ACCOUNT_ID

# Set budget alerts
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Sauti Darasa Monthly Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

---

## Troubleshooting

### Build Failures

**Issue**: Docker build fails
```bash
# Check Docker daemon
docker info

# Clear build cache
docker system prune -a

# Rebuild with verbose output
docker build --no-cache --progress=plain .
```

**Issue**: Environment variables not working
```bash
# Verify build args are passed
docker build --build-arg VITE_FIREBASE_API_KEY="test" -t test .
docker run --rm test sh -c 'cat /usr/share/nginx/html/index.html | grep VITE'
```

### Deployment Failures

**Issue**: Permission denied
```bash
# Check IAM roles
gcloud projects get-iam-policy sauti-darasa-prod

# Re-authenticate
gcloud auth login
gcloud auth application-default login
```

**Issue**: Quota exceeded
```bash
# Check quotas
gcloud compute project-info describe --project=sauti-darasa-prod

# Request quota increase
# Go to: https://console.cloud.google.com/iam-admin/quotas
```

### Runtime Issues

**Issue**: 502 Bad Gateway
```bash
# Check container logs
gcloud run services logs read sauti-darasa-frontend --region us-central1 --limit 100

# Verify health endpoint
curl https://your-service.run.app/health
```

**Issue**: Slow cold starts
```bash
# Set minimum instances
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --min-instances 1
```

---

## Performance Optimization

### 1. Enable CDN

```bash
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --no-use-http2
```

### 2. Optimize Image Size

Current image: ~150MB  
Target: <100MB

```dockerfile
# Use multi-stage builds (already implemented)
# Use alpine base images
# Remove unnecessary dependencies
```

### 3. Configure Caching

Already implemented in `nginx.conf`:
- Static assets: 1 year cache
- Service worker: no cache
- HTML: no cache

### 4. Enable Compression

Already enabled in `nginx.conf`:
- Gzip compression for text assets
- Level 6 compression

---

## Rollback Procedure

### Cloud Run Rollback

```bash
# List revisions
gcloud run revisions list --service sauti-darasa-frontend --region us-central1

# Rollback to specific revision
gcloud run services update-traffic sauti-darasa-frontend \
  --region us-central1 \
  --to-revisions=sauti-darasa-frontend-00042-abc=100

# Rollback to previous (quick)
gcloud run revisions list --service sauti-darasa-frontend --region us-central1 --limit 2
# Note the previous revision name, then:
gcloud run services update-traffic sauti-darasa-frontend \
  --region us-central1 \
  --to-revisions=PREVIOUS_REVISION=100
```

### App Engine Rollback

```bash
# List versions
gcloud app versions list

# Route traffic to previous version
gcloud app services set-traffic default --splits=20231205t120000=1

# Delete bad version
gcloud app versions delete 20231205t150000
```

---

## Security Best Practices

### 1. Use Secret Manager

Never store secrets in environment variables or code:
```bash
# Store secret
echo -n "sensitive-value" | gcloud secrets create my-secret --data-file=-

# Access in Cloud Run
gcloud run services update sauti-darasa-frontend \
  --update-secrets=ENV_VAR=my-secret:latest
```

### 2. Enable Binary Authorization

```bash
# Require signed images
gcloud run services update sauti-darasa-frontend \
  --binary-authorization=default
```

### 3. Configure VPC Connector

```bash
# Create VPC connector for private backend access
gcloud compute networks vpc-access connectors create sauti-connector \
  --region us-central1 \
  --range 10.8.0.0/28

# Use in Cloud Run
gcloud run services update sauti-darasa-frontend \
  --vpc-connector sauti-connector
```

### 4. Set Up Cloud Armor

```bash
# Create security policy
gcloud compute security-policies create sauti-darasa-policy \
  --description "Security policy for Sauti Darasa"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy sauti-darasa-policy \
  --expression "true" \
  --action "rate-based-ban" \
  --rate-limit-threshold-count 1000 \
  --rate-limit-threshold-interval-sec 60
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Build successful locally (`npm run build`)
- [ ] Environment variables configured in `.env.production`
- [ ] Firebase rules updated for production
- [ ] Security audit passed (`npm audit`)
- [ ] Docker image builds successfully
- [ ] GCP project created and billing enabled
- [ ] Required APIs enabled

### Deployment

- [ ] Deploy to Cloud Run or App Engine
- [ ] Verify service URL accessible
- [ ] Test all routes (`/`, `/teacher`, `/student`)
- [ ] Test PWA installation
- [ ] Verify microphone permissions work
- [ ] Check Firebase connection
- [ ] Test in demo mode

### Post-Deployment

- [ ] Monitor error logs for first hour
- [ ] Run Lighthouse audit (Performance > 90)
- [ ] Set up monitoring alerts
- [ ] Configure custom domain (if applicable)
- [ ] Enable Cloud CDN
- [ ] Set budget alerts
- [ ] Document deployment URL
- [ ] Update DNS records (if custom domain)
- [ ] Notify team of deployment

---

## Quick Reference Commands

```bash
# Deploy to Cloud Run
./deploy-cloud-run.sh

# View logs
gcloud run services logs read sauti-darasa-frontend --region us-central1 --follow

# Update environment variable
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --update-env-vars KEY=VALUE

# Scale service
gcloud run services update sauti-darasa-frontend \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 20

# Delete service
gcloud run services delete sauti-darasa-frontend --region us-central1

# Check costs
gcloud billing accounts list
```

---

## Support & Resources

### Google Cloud Documentation
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [App Engine Docs](https://cloud.google.com/appengine/docs)
- [Container Registry](https://cloud.google.com/container-registry/docs)

### Troubleshooting
- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Quotas and Limits](https://cloud.google.com/run/quotas)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

### Community
- [Stack Overflow - google-cloud-run](https://stackoverflow.com/questions/tagged/google-cloud-run)
- [GCP Community Slack](https://googlecloud-community.slack.com)

---

**Last Updated**: December 5, 2025  
**Version**: 2.0  
**Platform**: Google Cloud (Cloud Run & App Engine)  
**Status**: Production Ready
