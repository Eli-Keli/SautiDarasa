# Sauti Darasa - Real-Time Classroom Captioning

**Empowering Kenyan classrooms with accessible, real-time speech-to-text captioning.**

A Progressive Web App (PWA) that enables teachers to provide live captions for deaf and hard-of-hearing students in real-time.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ViggenKorir/SautiDarasa.git
cd SautiDarasa

# Install dependencies
npm install

# Start development server
npm run dev

# Try demo mode (no setup required)
# Visit: http://localhost:5173/teacher?demo=true
```

### 🎯 For New Developers

If you're joining this project or forking it, **start with [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md)** for:
- Complete project context and architecture
- What's implemented vs. what needs work
- 2026 development roadmap
- Setup instructions for AI agents and developers

## 📖 Documentation

Complete documentation is available in the `/docs` folder:

- **[📘 Main Documentation](./docs/README.md)** - Project overview, architecture, features, setup
- **[📊 Project Status & Onboarding](./docs/PROJECT_STATUS.md)** - ⭐ **START HERE** - Complete project context, roadmap, and getting started guide
- **[🧪 Testing Guide](./docs/TESTING.md)** - Comprehensive testing procedures and checklists
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Google Cloud deployment instructions
- **[🚀 Google Cloud Guide](./docs/DEPLOYMENT_GOOGLE_CLOUD.md)** - Comprehensive GCP deployment guide
- **[⚡ Optimization Guide](./docs/OPTIMIZATION.md)** - Performance, accessibility, and cost optimization
- **[🔧 Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

## ✨ Features

- 🎤 Real-time audio recording and transcription
- 📱 Mobile-first responsive design
- 🌐 Progressive Web App (installable)
- 🔥 Firebase Realtime Database integration
- 🎨 High-contrast dark theme (accessible)
- 📊 Live waveform visualization
- 🔗 Easy session sharing via links
- 🎭 Demo mode for testing without backend

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 7.2.6
- **Styling**: TailwindCSS v4
- **Routing**: React Router DOM
- **Database**: Firebase Realtime Database
- **PWA**: vite-plugin-pwa with Workbox
- **Audio**: MediaRecorder API + Web Audio API

## 📦 Project Structure

```
sauti-darasa-frontend/
├── docs/                    # Complete documentation
├── src/
│   ├── pages/              # Teacher & Student views
│   ├── components/         # Waveform visualizer
│   ├── hooks/              # Audio recorder hook
│   ├── services/           # Firebase integration
│   └── utils/              # Session & audio utilities
└── public/                 # PWA icons & manifest
```

## 🎯 Usage

### Teacher View
1. Visit `/teacher`
2. Grant microphone permission
3. Click "Start Recording"
4. Share the session link with students

### Student View
1. Open shared link (or visit `/student?sessionId=xxx`)
2. View live captions as teacher speaks
3. Captions update in real-time

## 🧪 Testing

Start with demo mode (no backend required):
```bash
npm run dev
# Visit http://localhost:5173/teacher?demo=true
```

See [TESTING.md](./docs/TESTING.md) for complete testing procedures.

## 🚀 Deployment

Deploy to **Google Cloud** (Cloud Run or App Engine). See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Cloud Run

```bash
# 1. Configure environment
cp .env.gcloud .env.production
nano .env.production

# 2. Run deployment script
./deploy-cloud-run.sh
```

See [DEPLOYMENT_GOOGLE_CLOUD.md](./docs/DEPLOYMENT_GOOGLE_CLOUD.md) for comprehensive setup and CI/CD configuration.

⚠️ **Note**: Backend transcription service not yet implemented. See [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for roadmap.

## 📊 Project Status

**Current Phase**: Post-Hackathon MVP (December 5, 2025)  
**Status**: ✅ Frontend Complete | ❌ Backend Needed  

**What Works**:
- ✅ React PWA with teacher/student views
- ✅ Audio recording and waveform visualization
- ✅ Firebase real-time database integration
- ✅ Demo mode (no backend required)
- ✅ Google Cloud deployment configuration

**What's Missing**:
- ❌ Backend transcription service (speech-to-text)
- ❌ Production Firebase security rules
- ❌ User authentication
- ❌ Test suite

See [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for complete details and 2026 roadmap.

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

We welcome contributions! To get started:

1. Read [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for full project context
2. Check the [2026 Roadmap](./docs/PROJECT_STATUS.md#-2026-roadmap) for priority tasks
3. Fork the repository
4. Create a feature branch
5. Submit a pull request

See [docs/README.md](./docs/README.md) for detailed contribution guidelines.

---

**Built with ❤️ for Kenyan classrooms**  
**Repository**: https://github.com/ViggenKorir/SautiDarasa  
**Last Updated**: December 5, 2025
