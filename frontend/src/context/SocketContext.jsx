import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ token, children }) {
  const ref = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const socket = io({ auth: { token }, transports: ['websocket', 'polling'] });
    ref.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
      ref.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: ref.current, connected, getSocket: () => ref.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
