import { useState, useEffect } from 'react';
import { getSessionIdFromUrl, isDemoMode } from '../utils/session';
import { subscribeToSessionCaptions, monitorConnection } from '../services/firebase';

export default function StudentView() {
  const [caption, setCaption] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const demoMode = isDemoMode();

  // Get session ID from URL
  useEffect(() => {
    const id = getSessionIdFromUrl();
    if (!id && !demoMode) {
      setError('No session ID provided. Please use the link shared by your teacher.');
    } else {
      setSessionId(id);
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
      if (data && typeof data === 'object' && 'text' in data) {
        setCaption((data as { text: string }).text);
      } else if (typeof data === 'string') {
        setCaption(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, demoMode]);

  // Monitor connection
  useEffect(() => {
    if (demoMode) return;

    const unsubscribe = monitorConnection((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, [demoMode]);

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
      {/* Header - Minimal */}
      <header className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span className="text-xs text-gray-400">
            {demoMode ? 'Demo Mode' : sessionId || 'Loading...'}
          </span>
        </div>
        <span className="text-xs text-gray-500">Sauti Darasa</span>
      </header>

      {/* Caption Display - Full Screen */}
      <main className="flex-1 flex items-center justify-center p-8">
        {caption ? (
          <div className="text-center max-w-4xl">
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {caption}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-600 text-2xl mb-4 animate-pulse">
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
