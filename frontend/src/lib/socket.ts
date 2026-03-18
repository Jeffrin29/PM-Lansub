// src/lib/socket.ts
// Socket.io client for real-time collaboration

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(orgId: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on('connect', () => {
      s.emit('join:org', orgId);
    });
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// Typed event emitters
export const socketEvents = {
  TASK_CREATED:          'task:created',
  TASK_UPDATED:          'task:updated',
  TASK_MOVED:            'task:moved',
  COMMENT_ADDED:         'comment:added',
  NOTIFICATION_NEW:      'notification:new',
  TIMESHEET_SUBMITTED:   'timesheet:submitted',
} as const;

export default getSocket;
