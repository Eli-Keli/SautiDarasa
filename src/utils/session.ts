import { nanoid } from 'nanoid';

/**
 * Generates a unique session ID for classroom sessions
 * Uses nanoid for URL-safe, collision-resistant IDs
 * @param length - Length of the ID (default: 10)
 * @returns A unique session ID string
 */
export const generateSessionId = (length: number = 10): string => {
  return nanoid(length);
};

/**
 * Creates a shareable student link for a session
 * @param sessionId - The session ID to share
 * @param baseUrl - Base URL (defaults to current origin)
 * @returns Full student view URL
 */
export const createStudentLink = (sessionId: string, baseUrl?: string): string => {
  const base = baseUrl || window.location.origin;
  return `${base}/student?sessionId=${sessionId}`;
};

/**
 * Extracts session ID from URL query parameters
 * @returns Session ID if found, null otherwise
 */
export const getSessionIdFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('sessionId');
};

/**
 * Checks if demo mode is enabled via URL parameter
 * @returns true if ?demo=true is present
 */
export const isDemoMode = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === 'true';
};
