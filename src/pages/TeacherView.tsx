import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSessionId, createStudentLink, isDemoMode } from '../utils/session';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useFirebaseConnection } from '../hooks/useFirebaseConnection';
import { useWakeLock } from '../hooks/useWakeLock';
import { uploadAudioChunkWithRetry } from '../utils/audio';
import { markTeacherPresence } from '../services/firebase';
import WaveformVisualizer from '../components/WaveformVisualizer';

export default function TeacherView() {
  const [sessionId] = useState(() => generateSessionId());
  const [shareLink] = useState(() => createStudentLink(sessionId));
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chunksUploaded, setChunksUploaded] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const demoMode = isDemoMode();
  const streamRef = useRef<MediaStream | null>(null);

  // Firebase connection with auto-reconnect
  const { isConnected, isReconnecting, reconnectAttempts, manualReconnect } = useFirebaseConnection(
    () => {
      // Re-mark presence on reconnect
      markTeacherPresence(sessionId);
    }
  );

  // Audio recording hook
  const handleAudioChunk = useCallback(async (blob: Blob) => {
    if (demoMode) {
      // In demo mode, just log
      console.log('[Demo] Audio chunk received:', blob.size, 'bytes');
      setChunksUploaded(prev => prev + 1);
      return;
    }

    // Upload to backend
    const result = await uploadAudioChunkWithRetry(sessionId, blob);
    if (result.success) {
      setUploadError(null);
      setChunksUploaded(prev => prev + 1);
    } else {
      setUploadError(result.error || 'Upload failed');
    }
  }, [sessionId, demoMode]);

  const {
    isRecording,
    error: recorderError,
    permissionGranted,
    startRecording,
    stopRecording,
  } = useAudioRecorder({
    onDataAvailable: handleAudioChunk,
    chunkDuration: 1500, // 1.5 seconds
  });

  // Keep screen awake while recording
  const { isActive: wakeLockActive } = useWakeLock(isRecording);

  // Initialize
  useEffect(() => {
    if (demoMode) {
      setIsInitializing(false);
      return;
    }

    // Mark teacher presence
    markTeacherPresence(sessionId);
    
    // Simulate initialization delay
    const timer = setTimeout(() => setIsInitializing(false), 500);

    return () => {
      clearTimeout(timer);
    };
  }, [sessionId, demoMode]);

  // Store stream reference for waveform
  useEffect(() => {
    if (isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        streamRef.current = stream;
      });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const handleStartStop = async () => {
    if (isRecording) {
      stopRecording();
      setChunksUploaded(0);
    } else {
      setIsStartingRecording(true);
      try {
        await startRecording();
      } finally {
        setIsStartingRecording(false);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-400">Initializing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Sauti Darasa - Teacher</h1>
        {demoMode && (
          <span className="inline-block mt-2 px-3 py-1 bg-yellow-600 text-xs rounded-full">
            DEMO MODE
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500' : 'bg-red-500'
              } animate-pulse`}
            ></div>
            <span>
              {isConnected
                ? 'Connected'
                : isReconnecting
                ? `Reconnecting... (${reconnectAttempts})`
                : 'Disconnected'}
            </span>
          </div>
          {!isConnected && !isReconnecting && (
            <button
              onClick={manualReconnect}
              className="px-3 py-1 text-xs bg-[#3B82F6] hover:bg-blue-600 rounded transition-colors"
            >
              Retry
            </button>
          )}
        </div>

        {/* Waveform Visualizer */}
        <div className="w-full max-w-md h-32 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800 overflow-hidden">
          {isRecording ? (
            <WaveformVisualizer
              isActive={isRecording}
              stream={streamRef.current}
              color="#3B82F6"
              barCount={30}
            />
          ) : (
            <span className="text-gray-500">Waveform (inactive)</span>
          )}
        </div>

        {/* Recording Button */}
        <button
          onClick={handleStartStop}
          disabled={isStartingRecording}
          className={`px-8 py-4 rounded-lg text-xl font-semibold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#3B82F6] hover:bg-blue-600'
          }`}
        >
          {isStartingRecording ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Starting...</span>
            </>
          ) : isRecording ? (
            'Stop Recording'
          ) : (
            'Start Recording'
          )}
        </button>

        {/* Session Info */}
        <div className="w-full max-w-md space-y-4 pt-8 border-t border-gray-800">
          {/* Session ID - Prominent Display */}
          <div className="bg-gradient-to-br from-[#3B82F6]/10 to-transparent border-2 border-[#3B82F6]/30 rounded-xl p-6">
            <label className="block text-sm font-semibold text-[#3B82F6] mb-3">
              Session ID
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-900/80 p-4 rounded-lg font-mono text-2xl font-bold tracking-wider border border-gray-700 text-center">
                {sessionId}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-6 py-4 bg-[#3B82F6] hover:bg-blue-600 rounded-lg transition-all transform active:scale-95 font-semibold shadow-lg hover:shadow-xl"
                title="Copy Session ID"
              >
                {copied ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy ID
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Share Link with Students
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-900 p-3 rounded-lg text-sm border border-gray-700 font-mono text-gray-300 focus:outline-none focus:border-[#3B82F6] transition-colors"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 flex items-center gap-2"
                title="Copy Share Link"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Students can join by entering the Session ID or visiting this link
            </p>
          </div>
        </div>

        {/* Status Messages */}
        <div className="w-full max-w-md space-y-2">
          {isRecording && (
            <div className="text-sm text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Recording and sending audio chunks... ({chunksUploaded} sent)
              {wakeLockActive && (
                <span className="text-xs text-gray-500" title="Screen will stay awake">
                  🔆
                </span>
              )}
            </div>
          )}
          
          {uploadError && (
            <div className="text-sm text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              {uploadError}
            </div>
          )}
          
          {recorderError && (
            <div className="text-sm text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              {recorderError}
            </div>
          )}
          
          {permissionGranted === false && (
            <div className="text-sm text-yellow-400 flex items-center gap-2">
              <span>🎤</span>
              Microphone permission required
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
