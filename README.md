# Sauti Darasa - Real-Time Classroom Captioning

**Empowering Kenyan classrooms with accessible, real-time speech-to-text captioning.**

A Progressive Web App (PWA) that enables teachers to provide live captions for deaf and hard-of-hearing students in real-time.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Try demo mode (no setup required)
# Visit: http://localhost:5173/teacher?demo=true
```

## 📖 Documentation

Complete documentation is available in the `/docs` folder:

- **[📘 Main Documentation](./docs/README.md)** - Project overview, architecture, features, setup
- **[🧪 Testing Guide](./docs/TESTING.md)** - Comprehensive testing procedures and checklists
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
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

Deploy to Vercel, Firebase Hosting, or Netlify. See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

See [docs/README.md](./docs/README.md) for contribution guidelines.

---

**Built with ❤️ for Kenyan classrooms**
