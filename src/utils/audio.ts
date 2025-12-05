/**
 * Converts a Blob (audio data) to base64 string
 * @param blob - The audio blob to convert
 * @returns Promise resolving to base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Sends audio chunk to backend transcription API
 * @param sessionId - The session ID
 * @param audioBlob - The audio data blob
 * @param baseUrl - Backend API base URL
 * @returns Promise resolving to API response
 */
export const uploadAudioChunk = async (
  sessionId: string,
  audioBlob: Blob,
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    
    const apiUrl = baseUrl || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
    const endpoint = `${apiUrl}/api/transcribe?sessionId=${sessionId}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioChunk: base64Audio,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error('Upload audio chunk error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Retry wrapper for API calls with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delay - Initial delay in milliseconds
 * @returns Promise resolving to function result
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        const backoffDelay = delay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

/**
 * Upload audio chunk with retry logic
 * @param sessionId - The session ID
 * @param audioBlob - The audio data blob
 * @param baseUrl - Backend API base URL
 * @param maxRetries - Maximum retry attempts
 * @returns Promise resolving to API response
 */
export const uploadAudioChunkWithRetry = async (
  sessionId: string,
  audioBlob: Blob,
  baseUrl?: string,
  maxRetries: number = 2
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await retryWithBackoff(
      () => uploadAudioChunk(sessionId, audioBlob, baseUrl),
      maxRetries
    );
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed after retries',
    };
  }
};
