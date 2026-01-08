import { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

export interface TranscriptionMessage {
    type: 'transcription' | 'error';
    transcript?: string;
    isFinal?: boolean;
    confidence?: number;
    sessionId?: string;
    message?: string;
}

export interface TranscriptionState {
    interimTranscript: string;
    finalTranscript: string;
    isConnected: boolean;
    error: string | null;
}

export const useTranscriptionWebSocket = (sessionId: string) => {
    const [state, setState] = useState<TranscriptionState>({
        interimTranscript: '',
        finalTranscript: '',
        isConnected: false,
        error: null,
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000;

    // Forward declare connect function for recursive reconnection
    const connectRef = useRef<(() => void) | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            const url = `${WS_URL}/ws/transcribe/${sessionId}`;
            console.log('🔌 Connecting to WebSocket:', url);

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                reconnectAttemptsRef.current = 0;
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    error: null,
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const message: TranscriptionMessage = JSON.parse(event.data);

                    if (message.type === 'transcription') {
                        if (message.isFinal) {
                            // Final transcript - append to complete transcript
                            console.log('✅ Final:', message.transcript);
                            setState(prev => ({
                                ...prev,
                                finalTranscript: prev.finalTranscript + message.transcript + ' ',
                                interimTranscript: '',
                            }));
                        } else {
                            // Interim transcript - update live preview
                            console.log('⏳ Interim:', message.transcript);
                            setState(prev => ({
                                ...prev,
                                interimTranscript: message.transcript || '',
                            }));
                        }
                    } else if (message.type === 'error') {
                        console.error('❌ WebSocket error:', message.message);
                        setState(prev => ({
                            ...prev,
                            error: message.message || 'Unknown error',
                        }));
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            ws.onerror = (event) => {
                console.error('❌ WebSocket error:', event);
                setState(prev => ({
                    ...prev,
                    error: 'WebSocket connection error',
                    isConnected: false,
                }));
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                setState(prev => ({
                    ...prev,
                    isConnected: false,
                }));

                // Attempt to reconnect if not manually closed
                if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        connectRef.current?.();
                    }, RECONNECT_DELAY);
                } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    setState(prev => ({
                        ...prev,
                        error: 'Failed to reconnect after multiple attempts',
                    }));
                }
            };
        } catch (err) {
            console.error('Failed to create WebSocket:', err);
            setState(prev => ({
                ...prev,
                error: 'Failed to establish WebSocket connection',
                isConnected: false,
            }));
        }
    }, [sessionId]);

    // Store connect function in ref for reconnection
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            try {
                // Send stop command before closing
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ command: 'stop' }));
                }
                wsRef.current.close(1000, 'Client disconnect');
            } catch (err) {
                console.error('Error closing WebSocket:', err);
            }
            wsRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isConnected: false,
        }));
    }, []);

    const sendAudio = useCallback((audioData: ArrayBuffer) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(audioData);
            } catch (err) {
                console.error('Failed to send audio:', err);
                setState(prev => ({
                    ...prev,
                    error: 'Failed to send audio data',
                }));
            }
        } else {
            console.warn('WebSocket not connected, cannot send audio');
        }
    }, []);

    const clearTranscripts = useCallback(() => {
        setState(prev => ({
            ...prev,
            interimTranscript: '',
            finalTranscript: '',
        }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        sendAudio,
        clearTranscripts,
    };
};
