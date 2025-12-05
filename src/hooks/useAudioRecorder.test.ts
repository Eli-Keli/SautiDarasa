import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAudioRecorder } from './useAudioRecorder';

describe('useAudioRecorder', () => {
  const onDataAvailable = vi.fn();

  beforeEach(() => {
    // Mock getUserMedia
    const mockStream = {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
    });

    // Mock MediaRecorder
    class MockMediaRecorder {
      state = 'inactive';
      stream: any;
      mimeType: string;
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;

      constructor(stream: any, options: any) {
        this.stream = stream;
        this.mimeType = options.mimeType;
      }

      start() {
        this.state = 'recording';
      }

      stop() {
        this.state = 'inactive';
        if (this.onstop) this.onstop();
      }

      pause() {
        this.state = 'paused';
      }

      resume() {
        this.state = 'recording';
      }

      requestData() {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['data']), timecode: Date.now() });
        }
      }

      static isTypeSupported() {
        return true;
      }
    }

    (window as any).MediaRecorder = MockMediaRecorder;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAudioRecorder({ onDataAvailable }));

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.permissionGranted).toBe(null);
  });

  it('requests permission successfully', async () => {
    const { result } = renderHook(() => useAudioRecorder({ onDataAvailable }));

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permissionGranted).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('starts recording successfully', async () => {
    const { result } = renderHook(() => useAudioRecorder({ onDataAvailable }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.permissionGranted).toBe(true);
  });

  it('stops recording', async () => {
    const { result } = renderHook(() => useAudioRecorder({ onDataAvailable }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    // Need to wait for state update in onstop callback
    await waitFor(() => {
        expect(result.current.isRecording).toBe(false);
    });
  });

  it('handles data availability', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAudioRecorder({
        onDataAvailable,
        chunkDuration: 100
    }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Advance time to trigger setInterval
    act(() => {
        vi.advanceTimersByTime(150);
    });

    expect(onDataAvailable).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
