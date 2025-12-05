import { useState, useEffect } from 'react';
import { getSessionIdFromUrl, isDemoMode } from '../utils/session';
import { subscribeToSessionCaptions } from '../services/firebase';
import { useFirebaseConnection } from '../hooks/useFirebaseConnection';
import { useWakeLock } from '../hooks/useWakeLock';

export default function StudentView() {
  const [caption, setCaption] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionReady, setIsSubscriptionReady] = useState(false);
  const demoMode = isDemoMode();

  // Firebase connection with auto-reconnect
  const { isConnected, isReconnecting } = useFirebaseConnection();

  // Keep screen awake while viewing captions
  const { isActive: wakeLockActive } = useWakeLock(isSubscriptionReady && !!caption);

  // Get session ID from URL
  useEffect(() => {
    const id = getSessionIdFromUrl();
    if (!id && !demoMode) {
      setError('No session ID provided. Please use the link shared by your teacher.');
      setIsLoading(false);
    } else {
      setSessionId(id);
      // Simulate loading delay
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [demoMode]);

  // Subscribe to captions
  useEffect(() => {
    if (demoMode) {
      // Demo mode: show rotating mock captions
      const mockCaptions = [
        'Welcome to Sauti Darasa',
        'This is a demo of real-time captioning',
        'In a real classroom, you would see live captions',
        'The captions update automatically',
        'Teachers can speak and students see the text',
        'Perfect for inclusive education',
      ];
      
      setIsSubscriptionReady(true);
      let index = 0;
      const interval = setInterval(() => {
        setCaption(mockCaptions[index]);
        index = (index + 1) % mockCaptions.length;
      }, 2000);

      return () => clearInterval(interval);
    }

    if (!sessionId) return;

    // Real Firebase subscription
    const unsubscribe = subscribeToSessionCaptions(sessionId, (data) => {
      setIsSubscriptionReady(true);
      if (data && typeof data === 'object' && 'text' in data) {
        setCaption((data as { text: string }).text);
      } else if (typeof data === 'string') {
        setCaption(data);
      }
    });

    // Mark subscription as ready after short delay even if no data yet
    const readyTimer = setTimeout(() => setIsSubscriptionReady(true), 1000);

    return () => {
      unsubscribe();
      clearTimeout(readyTimer);
    };
  }, [sessionId, demoMode]);



  // Show loading screen during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-400">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error && !demoMode) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <p className="text-gray-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Header - Enhanced with Session ID */}
      <header className="p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between">
          {/* Left: Session Info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500' : 'bg-red-500'
              } animate-pulse`}
              title={isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
            ></div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Session</span>
              {demoMode ? (
                <span className="text-sm font-mono font-semibold text-yellow-400">DEMO MODE</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold">{sessionId || 'Loading...'}</span>
                  {sessionId && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sessionId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                      title="Copy Session ID"
                    >
                      {copied ? (
                        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: App Name */}
          <span className="text-sm font-semibold text-gray-400">Sauti Darasa</span>
        </div>
      </header>

      {/* Caption Display - Full Screen */}
      <main className="flex-1 flex items-center justify-center p-8">
        {!isSubscriptionReady ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lg text-gray-400">Subscribing to captions...</p>
          </div>
        ) : caption ? (
          <div className="text-center max-w-4xl">
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {caption}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <div className="text-gray-600 text-2xl">
              Waiting for captions...
            </div>
            <div className="text-gray-500 text-lg">
              Your teacher will start the session soon
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
