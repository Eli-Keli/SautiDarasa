import { useState, useEffect, useCallback, useRef } from 'react';
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

  const onReconnectRef = useRef(onReconnect);
  const backoffTimerRef = useRef<number | null>(null);

  // Keep the ref updated
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

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
        if (backoffTimerRef.current) {
          clearTimeout(backoffTimerRef.current);
          backoffTimerRef.current = null;
        }

        console.log('[Firebase] Connected');
      } else {
        // Disconnected
        const now = Date.now();
        
        setState((prev) => {
          console.warn('[Firebase] Disconnected. Will attempt to reconnect...');
          
          // Trigger reconnect callback if provided
          if (onReconnectRef.current) {
            onReconnectRef.current();
          }

          // Calculate exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, prev.reconnectAttempts), 30000);
          
          // Clear any existing reconnection timer
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }
          
          // Schedule reconnection attempt
          reconnectTimer = window.setTimeout(() => {
            setState((current) => ({
              ...current,
              isReconnecting: false,
            }));
          }, backoffDelay);

          return {
            ...prev,
            isConnected: false,
            isReconnecting: true,
            reconnectAttempts: prev.reconnectAttempts + 1,
            lastDisconnectTime: now,
          };
        });
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
      }
    };
  }, []); // Empty dependency array - no circular dependencies

  const manualReconnect = useCallback(() => {
    console.log('[Firebase] Manual reconnect triggered');
    setState((prev) => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempts: 0,
    }));
    
    if (onReconnectRef.current) {
      onReconnectRef.current();
    }
  }, []);

  return {
    ...state,
    manualReconnect,
  };
};
