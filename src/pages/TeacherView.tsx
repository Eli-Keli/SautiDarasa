import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSessionId, createStudentLink, isDemoMode } from '../utils/session';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { uploadAudioChunkWithRetry } from '../utils/audio';
import { monitorConnection, markTeacherPresence } from '../services/firebase';
import WaveformVisualizer from '../components/WaveformVisualizer';

export default function TeacherView() {
  const [sessionId] = useState(() => generateSessionId());
  const [isConnected, setIsConnected] = useState(true);
  const [shareLink] = useState(() => createStudentLink(sessionId));
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chunksUploaded, setChunksUploaded] = useState(0);
  const demoMode = isDemoMode();
  const streamRef = useRef<MediaStream | null>(null);

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

  // Monitor Firebase connection
  useEffect(() => {
    if (demoMode) return;
    
    const unsubscribe = monitorConnection((connected) => {
      setIsConnected(connected);
    });

    // Mark teacher presence
    markTeacherPresence(sessionId);

    return () => {
      unsubscribe();
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
      await startRecording();
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
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`}
          ></div>
          <span>{isConnected ? 'Connected' : 'Reconnecting...'}</span>
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
          className={`px-8 py-4 rounded-lg text-xl font-semibold transition-all transform active:scale-95 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#3B82F6] hover:bg-blue-600'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        {/* Session Info */}
        <div className="w-full max-w-md space-y-4 pt-8 border-t border-gray-800">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Session ID</label>
            <div className="bg-gray-900 p-3 rounded-lg font-mono text-sm border border-gray-800">
              {sessionId}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Share with Students</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-900 p-3 rounded-lg text-sm border border-gray-800 font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-[#3B82F6] hover:bg-blue-600 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="w-full max-w-md space-y-2">
          {isRecording && (
            <div className="text-sm text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Recording and sending audio chunks... ({chunksUploaded} sent)
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
