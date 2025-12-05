import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { blobToBase64, uploadAudioChunk, retryWithBackoff } from './audio';

describe('audio utils', () => {
  let originalFileReader: any;

  beforeEach(() => {
    originalFileReader = window.FileReader;
  });

  afterEach(() => {
    window.FileReader = originalFileReader;
    vi.restoreAllMocks();
  });

  describe('blobToBase64', () => {
    it('converts blob to base64 string', async () => {
      const blob = new Blob(['test audio'], { type: 'audio/webm' });

      // Create a class to mock FileReader
      class MockFileReader {
        result = 'data:audio/webm;base64,dGVzdCBhdWRpbw==';
        onloadend: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;

        readAsDataURL() {
            // Trigger onloadend asynchronously to simulate real behavior,
            // or synchronously if we know the listener is attached.
            // In the implementation, listener is attached before readAsDataURL.
            if (this.onloadend) {
                this.onloadend({} as any);
            }
        }
      }

      window.FileReader = MockFileReader as any;

      const result = await blobToBase64(blob);
      expect(result).toBe('dGVzdCBhdWRpbw==');
    });
  });

  describe('uploadAudioChunk', () => {
    beforeEach(() => {
        global.fetch = vi.fn();

        class MockFileReader {
            result = 'data:audio/webm;base64,dGVzdCBhdWRpbw==';
            onloadend: ((event: any) => void) | null = null;
            onerror: ((event: any) => void) | null = null;

            readAsDataURL() {
                if (this.onloadend) {
                    this.onloadend({} as any);
                }
            }
        }
        window.FileReader = MockFileReader as any;
    });

    it('successfully uploads audio', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success' }),
      });

      const blob = new Blob(['test'], { type: 'audio/webm' });

      const result = await uploadAudioChunk('session-123', blob, 'http://api.test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.test/api/transcribe?sessionId=session-123',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ audioChunk: 'dGVzdCBhdWRpbw==' }),
        })
      );
      expect(result).toEqual({ success: true, status: 'success' });
    });

    it('handles API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const blob = new Blob(['test'], { type: 'audio/webm' });
      const result = await uploadAudioChunk('session-123', blob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API error: 500');
    });
  });

  describe('retryWithBackoff', () => {
    it('retries on failure and eventually succeeds', async () => {
        const mockFn = vi.fn()
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockRejectedValueOnce(new Error('Fail 2'))
            .mockResolvedValue('Success');

        const result = await retryWithBackoff(() => mockFn(), 3, 1);

        expect(mockFn).toHaveBeenCalledTimes(3);
        expect(result).toBe('Success');
    });

    it('fails after max retries', async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error('Fail always'));

        await expect(retryWithBackoff(() => mockFn(), 2, 1)).rejects.toThrow('Fail always');
        expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
