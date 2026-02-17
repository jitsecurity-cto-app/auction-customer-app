'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || '';

interface WebSocketMessage {
  action: string;
  data?: any;
  type?: string;
  auction_id?: string;
  bid?: {
    id: string;
    auction_id: string;
    user_id: string;
    amount: number;
    created_at: string;
    user?: { id: string; email: string; name: string };
  };
  current_bid?: number;
}

interface UseWebSocketReturn {
  connected: boolean;
  lastMessage: WebSocketMessage | null;
  send: (data: Record<string, any>) => void;
}

/**
 * React hook for WebSocket connections to auction rooms.
 * No authentication on WebSocket (intentional vulnerability).
 */
export function useWebSocket(auctionId: string): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!WS_BASE_URL || !auctionId) return;

    try {
      // No auth token in WebSocket URL (intentional vulnerability)
      const ws = new WebSocket(`${WS_BASE_URL}?auctionId=${auctionId}`);

      ws.onopen = () => {
        console.log('WebSocket connected for auction:', auctionId);
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message:', message);
          setLastMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('WebSocket reconnecting...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [auctionId]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const send = useCallback((data: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, lastMessage, send };
}
