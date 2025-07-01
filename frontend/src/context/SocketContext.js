import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { token, user } = useAuth();

    useEffect(() => {
        if (token) {
            const wsUrl = (
                process.env.REACT_APP_API_URL || 'http://localhost:3000'
            ).replace(/^http/, 'ws');
            const ws = new WebSocket(`${wsUrl}?token=${token}`);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setSocket(ws);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'notification' && message.data.type === 'new_appointment') {
                        const { patientName, scheduledAt } = message.data.data;
                        toast.info(`New appointment assigned: ${patientName} at ${new Date(scheduledAt).toLocaleString()}`);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setSocket(null);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return () => {
                ws.close();
            };
        }
    }, [token, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}; 