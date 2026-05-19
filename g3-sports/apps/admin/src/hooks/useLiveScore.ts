import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ScorePayload {
  matchId: string;
  sport: string;
  score: unknown;
}

export function useLiveScore(matchId: string | null) {
  const [latestScore, setLatestScore] = useState<ScorePayload | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('g3_admin_token');
    const s = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = s;
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !matchId) return;
    const room = `match:${matchId}`;
    socket.emit('joinRoom', room);
    socket.on('score_update', (payload: ScorePayload) => setLatestScore(payload));
    return () => {
      socket.emit('leaveRoom', room);
      socket.off('score_update');
    };
  }, [matchId]);

  return latestScore;
}
