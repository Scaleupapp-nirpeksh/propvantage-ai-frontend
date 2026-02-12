import { io } from 'socket.io-client';

// Derive Socket.IO base URL (strip /api from the REST base URL)
const getSocketUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

class ChatSocketManager {
  constructor(token, dispatch, currentUserId) {
    this.dispatch = dispatch;
    this.currentUserId = currentUserId;
    this.socket = null;
    this.token = token;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(getSocketUrl(), {
      auth: { token: this.token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this._setupListeners();
  }

  _setupListeners() {
    const { socket, dispatch, currentUserId } = this;

    // ─── Connection ───────────────────────────────────────────────────
    socket.on('connect', () => {
      dispatch({ type: 'SOCKET_CONNECTED' });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SOCKET_DISCONNECTED' });
    });

    socket.on('connect_error', (err) => {
      dispatch({ type: 'SOCKET_ERROR', payload: err.message });
    });

    socket.on('reconnect', () => {
      dispatch({ type: 'SOCKET_CONNECTED' });
      // Signal to ChatContext to refresh conversations
      dispatch({ type: 'SHOULD_REFRESH' });
    });

    // ─── Messages ─────────────────────────────────────────────────────
    socket.on('message:new', ({ conversationId, message }) => {
      dispatch({
        type: 'SOCKET_MESSAGE_NEW',
        payload: { conversationId, message, currentUserId },
      });
    });

    socket.on('message:edited', ({ conversationId, messageId, text, isEdited, editedAt }) => {
      dispatch({
        type: 'SOCKET_MESSAGE_EDITED',
        payload: { conversationId, messageId, text, isEdited, editedAt },
      });
    });

    socket.on('message:deleted', ({ conversationId, messageId }) => {
      dispatch({
        type: 'SOCKET_MESSAGE_DELETED',
        payload: { conversationId, messageId },
      });
    });

    socket.on('message:reaction', ({ conversationId, messageId, reactions }) => {
      dispatch({
        type: 'SOCKET_MESSAGE_REACTION',
        payload: { conversationId, messageId, reactions },
      });
    });

    socket.on('message:pinned', ({ conversationId, messageId, isPinned, pinnedBy }) => {
      dispatch({
        type: 'SOCKET_MESSAGE_PINNED',
        payload: { conversationId, messageId, isPinned, pinnedBy },
      });
    });

    // ─── Conversations ────────────────────────────────────────────────
    socket.on('conversation:updated', ({ conversationId, changes }) => {
      dispatch({
        type: 'SOCKET_CONVERSATION_UPDATED',
        payload: { conversationId, changes },
      });
    });

    socket.on('conversation:read', ({ conversationId, userId, timestamp }) => {
      dispatch({
        type: 'SOCKET_READ_RECEIPT',
        payload: { conversationId, userId, timestamp },
      });
    });

    // ─── Typing ───────────────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId, userId, userName }) => {
      if (userId !== currentUserId) {
        dispatch({
          type: 'SET_TYPING',
          payload: { conversationId, userId, userName },
        });
      }
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      dispatch({
        type: 'CLEAR_TYPING',
        payload: { conversationId, userId },
      });
    });

    // ─── Presence ─────────────────────────────────────────────────────
    socket.on('user:online', ({ userId }) => {
      dispatch({ type: 'USER_ONLINE', payload: userId });
    });

    socket.on('user:offline', ({ userId }) => {
      dispatch({ type: 'USER_OFFLINE', payload: userId });
    });
  }

  // ─── Emit Helpers ─────────────────────────────────────────────────────
  joinConversation(conversationId) {
    this.socket?.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId) {
    this.socket?.emit('conversation:leave', { conversationId });
  }

  markAsRead(conversationId, callback) {
    this.socket?.emit('conversation:read', { conversationId }, callback);
  }

  startTyping(conversationId) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default ChatSocketManager;
