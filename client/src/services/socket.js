import { io } from 'socket.io-client';
import config from '../utils/config';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Connect to socket server
  connect(userId) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io(config.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      
      // Join user's personal room
      if (userId) {
        this.socket.emit('join', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send a message
  sendMessage(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', data);
    }
  }

  // Send typing indicator
  sendTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', data);
    }
  }

  // Send stop typing indicator
  sendStopTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stop_typing', data);
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
      this.listeners.set('new_message', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
      this.listeners.set('user_typing', callback);
    }
  }

  // Remove event listeners
  removeListener(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.listeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 