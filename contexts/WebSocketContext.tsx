import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const url = ((globalThis as any).process?.env?.NEXT_PUBLIC_BASE_URL) || "http://localhost:4000";
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(url, {
      auth: {
        token: token || null
      }
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log(`Global Socket.IO connected ${token ? 'with auth' : 'without auth'}`);
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Global Socket.IO disconnected');
    });
    
    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });
    
    newSocket.on('authError', (error) => {
      console.error('Socket auth error:', error);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const emit = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, emit }}>
      {children}
    </WebSocketContext.Provider>
  );
};