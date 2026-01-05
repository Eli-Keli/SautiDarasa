import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderOptions {
  onDataAvailable: (audioBlob: Blob) => void;
  chunkDuration?: number; // in milliseconds
  sampleRate?: number; // Sample rate for PCM audio
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
  sampleRate = 48000, // Default to 48kHz for optimal quality
}: UseAudioRecorderOptions) => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    error: null,
    permissionGranted: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const chunkIntervalRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
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

  // Convert Float32Array PCM data to Int16Array (LINEAR16 format)
  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array.buffer;
  };

  // Process accumulated audio chunks and send as blob
  const processAndSendChunks = useCallback(() => {
    if (audioChunksRef.current.length === 0) return;

    // Concatenate all Float32Array chunks
    const totalLength = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedFloat32 = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunksRef.current) {
      combinedFloat32.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to 16-bit PCM
    const pcm16Buffer = floatTo16BitPCM(combinedFloat32);
    
    // Create blob from raw PCM data (no WAV header - backend expects raw LINEAR16)
    const blob = new Blob([pcm16Buffer], { type: 'audio/l16' });
    
    console.log(`[AudioRecorder] Sending PCM chunk: ${blob.size} bytes, ${combinedFloat32.length} samples, ${(combinedFloat32.length / sampleRate).toFixed(2)}s duration`);
    
    // Clear chunks
    audioChunksRef.current = [];
    
    // Send to callback
    onDataAvailable(blob);
  }, [onDataAvailable, sampleRate]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      let stream = streamRef.current;
      
      if (!stream) {
        stream = await requestPermission();
      }

      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate,
      });
      audioContextRef.current = audioContext;

      // Create source from microphone stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create ScriptProcessorNode for audio processing
      // Buffer size: 4096 samples (~85ms at 48kHz)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Process audio data
      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current || isPausedRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Clone the data since it will be reused
        const chunk = new Float32Array(inputData);
        audioChunksRef.current.push(chunk);
        
        console.log(`[AudioRecorder] Audio chunk captured: ${chunk.length} samples`);
      };

      // Connect nodes
      source.connect(processor);
      processor.connect(audioContext.destination);

      // Set up interval to send chunks periodically
      const intervalId = window.setInterval(processAndSendChunks, chunkDuration);
      chunkIntervalRef.current = intervalId;

      console.log(`[AudioRecorder] Started recording with PCM LINEAR16, sample rate: ${sampleRate}Hz, chunk interval: ${chunkDuration}ms`);

      isRecordingRef.current = true;
      isPausedRef.current = false;

      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        error: null 
      }));

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error, isRecording: false }));
      isRecordingRef.current = false;
      isPausedRef.current = false;
      console.error('Start recording error:', err);
    }
  }, [requestPermission, sampleRate, chunkDuration, processAndSendChunks]);

  // Stop recording
  const stopRecording = useCallback(() => {
    // Clear interval
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    // Send any remaining chunks
    if (audioChunksRef.current.length > 0) {
      processAndSendChunks();
    }

    // Disconnect audio nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    isRecordingRef.current = false;
    isPausedRef.current = false;

    setState(prev => ({ ...prev, isRecording: false, isPaused: false }));
    console.log('[AudioRecorder] Recording stopped');
  }, [processAndSendChunks]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
      isPausedRef.current = true;
      setState(prev => ({ ...prev, isPaused: true }));
      console.log('[AudioRecorder] Recording paused');
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      isPausedRef.current = false;
      setState(prev => ({ ...prev, isPaused: false }));
      console.log('[AudioRecorder] Recording resumed');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
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
