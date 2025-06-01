import { WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { errors } from './errorHandler.js';

class WebSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Map of userId to WebSocket
    }

    initialize(server) {
        if (!(server instanceof Server)) {
            throw new Error('Server instance is required');
        }

        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', async (ws, req) => {
            try {
                // Extract token from query string
                const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
                if (!token) {
                    ws.close(1008, 'Authentication required');
                    return;
                }

                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;

                // Store client connection
                this.clients.set(userId, ws);

                // Send initial connection success
                ws.send(JSON.stringify({
                    type: 'connection',
                    status: 'connected',
                    userId
                }));

                // Handle client disconnect
                ws.on('close', () => {
                    this.clients.delete(userId);
                });

                // Handle errors
                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    ws.close(1011, 'Internal server error');
                });

            } catch (error) {
                console.error('WebSocket connection error:', error);
                ws.close(1008, 'Authentication failed');
            }
        });
    }

    // Send notification to a specific user
    sendNotification(userId, notification) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'notification',
                data: notification
            }));
        }
    }

    // Send notification to multiple users
    sendNotificationToUsers(userIds, notification) {
        userIds.forEach(userId => this.sendNotification(userId, notification));
    }

    // Broadcast notification to all connected clients
    broadcast(notification) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'notification',
                    data: notification
                }));
            }
        });
    }
}

// Create singleton instance
const websocketManager = new WebSocketManager();

export default websocketManager; 