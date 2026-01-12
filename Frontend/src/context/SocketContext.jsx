import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux'; // Nếu bạn dùng Redux cho Auth
// Hoặc import { useAuth } from './AuthContext' nếu dùng Context

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  
  // Lấy user để biết role (Redux example)
  const { user } = useSelector(state => state.auth); 

  useEffect(() => {
    // Kết nối
    const newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
    });
    setSocket(newSocket);

    // Join Room logic...
    newSocket.on('connect', () => {
        if (user && ['admin', 'waiter'].includes(user.role)) {
            newSocket.emit('join_admin');
        }
    });

    return () => newSocket.close();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 