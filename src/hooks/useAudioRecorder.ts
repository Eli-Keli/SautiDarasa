import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
  onDataAvailable: (audioBlob: Blob) => void;
  chunkDuration?: number; // in milliseconds
  mimeType?: string;
}

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  error: string | null;
  permissionGranted: boolean | null;
}

export const useAudioRecorder = ({
  onDataAvailable,
  chunkDuration = 1500, // 1.5 seconds default
  mimeType = 'audio/webm',
}: UseAudioRecorderOptions) => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    error: null,
    permissionGranted: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      // Remove sampleRate constraint - let browser choose optimal settings
      // Browser will typically use 48kHz which is supported by Speech API
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
      
      // Log audio track settings
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();
      console.log('[AudioRecorder] Audio track settings:', settings);
      
      setState(prev => ({ ...prev, permissionGranted: true, error: null }));
      return stream;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Microphone access denied';
      setState(prev => ({ ...prev, permissionGranted: false, error }));
      throw err;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      let stream = streamRef.current;
      
      if (!stream) {
        stream = await requestPermission();
      }

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported in this browser');
      }

      // Try to use Opus codec explicitly for better compatibility
      const mimeTypesToTry = [
        'audio/webm;codecs=opus',  // Preferred: WebM with Opus codec
        'audio/ogg;codecs=opus',   // Fallback: OGG with Opus codec
        'audio/webm',              // Generic WebM
        'audio/ogg',               // Generic OGG
      ];

      let supportedMimeType = mimeType;
      for (const mime of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mime)) {
          supportedMimeType = mime;
          console.log(`[MediaRecorder] Using MIME type: ${mime}`);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`[MediaRecorder] Chunk received: ${event.data.size} bytes, type: ${event.data.type}`);
          
          // Debug: Check first few bytes of the blob
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              const bytes = new Uint8Array(reader.result).slice(0, 8);
              const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
              console.log(`[MediaRecorder] First 8 bytes (hex): ${hex}`);
            }
          };
          reader.readAsArrayBuffer(event.data);
          
          onDataAvailable(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ 
          ...prev, 
          error: 'Recording error occurred',
          isRecording: false 
        }));
      };

      mediaRecorder.onstop = () => {
        setState(prev => ({ ...prev, isRecording: false }));
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with timeslice to get proper chunks
      // timeslice parameter ensures each chunk is a valid, complete media segment
      mediaRecorder.start(chunkDuration);

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        error: null 
      }));

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error, isRecording: false }));
      console.error('Start recording error:', err);
    }
  }, [onDataAvailable, chunkDuration, mimeType, requestPermission]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    requestPermission,
  };
};
