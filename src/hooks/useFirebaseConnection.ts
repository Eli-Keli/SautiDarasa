import { useState, useEffect, useCallback } from 'react';
import { monitorConnection } from '../services/firebase';

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastDisconnectTime: number | null;
}

export const useFirebaseConnection = (onReconnect?: () => void) => {
  const [state, setState] = useState<ConnectionState>({
    isConnected: true,
    isReconnecting: false,
    reconnectAttempts: 0,
    lastDisconnectTime: null,
  });

  const handleReconnect = useCallback(() => {
    console.log('[Firebase] Attempting to reconnect...');
    setState((prev) => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));

    // Trigger user-provided reconnect callback
    if (onReconnect) {
      onReconnect();
    }

    // Auto-retry with exponential backoff
    const backoffDelay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isReconnecting: false,
      }));
    }, backoffDelay);
  }, [state.reconnectAttempts, onReconnect]);

  useEffect(() => {
    let reconnectTimer: number | null = null;

    const unsubscribe = monitorConnection((connected) => {
      if (connected) {
        // Successfully connected
        setState({
          isConnected: true,
          isReconnecting: false,
          reconnectAttempts: 0,
          lastDisconnectTime: null,
        });

        // Clear any pending reconnection attempts
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        console.log('[Firebase] Connected');
      } else {
        // Disconnected
        const now = Date.now();
        setState((prev) => ({
          ...prev,
          isConnected: false,
          lastDisconnectTime: now,
        }));

        console.warn('[Firebase] Disconnected. Will attempt to reconnect...');

        // Start reconnection attempts after 2 seconds
        reconnectTimer = setTimeout(() => {
          handleReconnect();
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [handleReconnect]);

  const manualReconnect = useCallback(() => {
    handleReconnect();
  }, [handleReconnect]);

  return {
    ...state,
    manualReconnect,
  };
};
