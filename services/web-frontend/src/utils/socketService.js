import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Initialize socket connection
   */
  initialize() {
    if (this.socket) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    this.socket = io(apiUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle violation notifications
    this.socket.on('violation:new', (violation) => {
      console.log('New violation received:', violation);
      
      // Show toast notification
      if (window.toastManager) {
        window.toastManager.showViolationAlert(violation);
      }
      
      // Notify registered listeners
      this.notifyListeners('violation:new', violation);
    });
  }

  /**
   * Authenticate user with socket
   * @param {string} userId - User ID
   */
  authenticate(userId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('authenticate', { userId });
  }

  /**
   * Subscribe to camera events
   * @param {string} cameraId - Camera ID
   */
  subscribeToCamera(cameraId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('subscribe:camera', cameraId);
  }

  /**
   * Unsubscribe from camera events
   * @param {string} cameraId - Camera ID
   */
  unsubscribeFromCamera(cameraId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('unsubscribe:camera', cameraId);
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {string} Listener ID
   */
  addEventListener(event, callback) {
    if (!event || typeof callback !== 'function') return null;
    
    const listenerId = `${event}_${Date.now()}`;
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    
    this.listeners.get(event).set(listenerId, callback);
    return listenerId;
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {string} listenerId - Listener ID
   */
  removeEventListener(event, listenerId) {
    if (!event || !listenerId) return;
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(listenerId);
    }
  }

  /**
   * Notify registered listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    if (!event || !this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;