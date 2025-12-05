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
  const chunksTimerRef = useRef<number | null>(null);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000, // 16kHz for backend
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;
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

      // Determine best mime type
      const supportedMimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : mimeType;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
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
        if (chunksTimerRef.current) {
          clearInterval(chunksTimerRef.current);
          chunksTimerRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start();

      // Request data in chunks
      chunksTimerRef.current = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
        }
      }, chunkDuration);

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
      
      if (chunksTimerRef.current) {
        clearInterval(chunksTimerRef.current);
        chunksTimerRef.current = null;
      }
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
      if (chunksTimerRef.current) {
        clearInterval(chunksTimerRef.current);
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
