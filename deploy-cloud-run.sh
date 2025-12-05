#!/bin/bash

# Sauti Darasa - Google Cloud Deployment Script
# This script builds and deploys the frontend to Google Cloud Run

set -e  # Exit on error

echo "🚀 Starting Sauti Darasa deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if .env.gcloud exists
if [ ! -f ".env.gcloud" ]; then
    echo "❌ Error: .env.gcloud file not found"
    echo "Create .env.gcloud with your environment variables"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
export $(cat .env.gcloud | xargs)

# Get project configuration
read -p "Enter your GCP Project ID: " PROJECT_ID
read -p "Enter region (default: us-central1): " REGION
REGION=${REGION:-us-central1}
read -p "Enter service name (default: sauti-darasa-frontend): " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-sauti-darasa-frontend}

echo ""
echo "📦 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo ""

# Confirm deployment
read -p "Proceed with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Set project
echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Build Docker image
echo "🏗️  Building Docker image..."
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

# Push to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
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
  --timeout 60 \
  --set-env-vars NODE_ENV=production

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment successful!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "  1. Visit $SERVICE_URL to test your deployment"
echo "  2. Configure custom domain (optional): gcloud run domain-mappings create"
echo "  3. Set up monitoring in Cloud Console"
