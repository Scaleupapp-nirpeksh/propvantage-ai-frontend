import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import ChatSocketManager from '../services/chatSocket';
import { useAuth } from './AuthContext';
import { buildLastMessagePreview } from '../components/chat/utils/chatHelpers';

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  isSocketConnected: false,
  socketError: null,
  shouldRefresh: false,

  conversations: {},
  conversationOrder: [],
  conversationsLoading: false,
  conversationsPagination: { page: 1, hasMore: true },

  activeConversationId: null,

  messages: {},
  messagesPagination: {},
  messagesLoading: {},

  onlineUserIds: [],
  typingUsers: {},
  totalUnreadCount: 0,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function chatReducer(state, action) {
  switch (action.type) {
    // Socket
    case 'SOCKET_CONNECTED':
      return { ...state, isSocketConnected: true, socketError: null };
    case 'SOCKET_DISCONNECTED':
      return { ...state, isSocketConnected: false };
    case 'SOCKET_ERROR':
      return { ...state, socketError: action.payload };
    case 'SHOULD_REFRESH':
      return { ...state, shouldRefresh: true };
    case 'CLEAR_REFRESH':
      return { ...state, shouldRefresh: false };

    // Conversations
    case 'SET_CONVERSATIONS': {
      const convMap = {};
      const order = [];
      action.payload.conversations.forEach((c) => {
        convMap[c._id] = c;
        order.push(c._id);
      });
      const totalUnread = action.payload.conversations.reduce(
        (sum, c) => sum + (c.myUnreadCount || 0), 0
      );
      return {
        ...state,
        conversations: convMap,
        conversationOrder: order,
        conversationsLoading: false,
        conversationsPagination: action.payload.pagination || state.conversationsPagination,
        totalUnreadCount: totalUnread,
      };
    }
    case 'APPEND_CONVERSATIONS': {
      const newConvMap = { ...state.conversations };
      const newOrder = [...state.conversationOrder];
      action.payload.conversations.forEach((c) => {
        newConvMap[c._id] = c;
        if (!newOrder.includes(c._id)) newOrder.push(c._id);
      });
      const totalUnread = Object.values(newConvMap).reduce(
        (sum, c) => sum + (c.myUnreadCount || 0), 0
      );
      return {
        ...state,
        conversations: newConvMap,
        conversationOrder: newOrder,
        conversationsLoading: false,
        conversationsPagination: action.payload.pagination || state.conversationsPagination,
        totalUnreadCount: totalUnread,
      };
    }
    case 'SET_CONVERSATIONS_LOADING':
      return { ...state, conversationsLoading: action.payload };
    case 'ADD_CONVERSATION': {
      const conv = action.payload;
      const newConvs = { ...state.conversations, [conv._id]: conv };
      const newOrder = [conv._id, ...state.conversationOrder.filter((id) => id !== conv._id)];
      return { ...state, conversations: newConvs, conversationOrder: newOrder };
    }
    case 'UPDATE_CONVERSATION': {
      const { id, changes } = action.payload;
      if (!state.conversations[id]) return state;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [id]: { ...state.conversations[id], ...changes },
        },
      };
    }
    case 'REMOVE_CONVERSATION': {
      const newConvs = { ...state.conversations };
      delete newConvs[action.payload];
      return {
        ...state,
        conversations: newConvs,
        conversationOrder: state.conversationOrder.filter((id) => id !== action.payload),
        activeConversationId: state.activeConversationId === action.payload ? null : state.activeConversationId,
      };
    }
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversationId: action.payload };

    // Messages
    case 'SET_MESSAGES': {
      const { conversationId, messages: msgs, pagination } = action.payload;
      return {
        ...state,
        messages: { ...state.messages, [conversationId]: msgs },
        messagesPagination: { ...state.messagesPagination, [conversationId]: pagination },
        messagesLoading: { ...state.messagesLoading, [conversationId]: false },
      };
    }
    case 'PREPEND_MESSAGES': {
      const { conversationId, messages: older, pagination } = action.payload;
      const existing = state.messages[conversationId] || [];
      return {
        ...state,
        messages: { ...state.messages, [conversationId]: [...older, ...existing] },
        messagesPagination: { ...state.messagesPagination, [conversationId]: pagination },
        messagesLoading: { ...state.messagesLoading, [conversationId]: false },
      };
    }
    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload;
      const existing = state.messages[conversationId] || [];
      return {
        ...state,
        messages: { ...state.messages, [conversationId]: [...existing, message] },
      };
    }
    case 'REPLACE_OPTIMISTIC_MESSAGE': {
      const { conversationId, tempId, message } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === tempId ? message : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'MARK_MESSAGE_FAILED': {
      const { conversationId, tempId } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === tempId ? { ...m, _failed: true } : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'UPDATE_MESSAGE': {
      const { conversationId, messageId, changes } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === messageId ? { ...m, ...changes } : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'DELETE_MESSAGE': {
      const { conversationId, messageId } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, _isDeletedPlaceholder: true, content: { text: null }, attachments: [], entityReference: null }
          : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'SET_MESSAGES_LOADING': {
      const { conversationId, loading } = action.payload;
      return { ...state, messagesLoading: { ...state.messagesLoading, [conversationId]: loading } };
    }

    // Socket events for messages
    case 'SOCKET_MESSAGE_NEW': {
      const { conversationId, message, currentUserId } = action.payload;
      const existing = state.messages[conversationId] || [];

      // Dedup: if message already exists by _id
      if (existing.some((m) => m._id === message._id)) return state;

      // Replace optimistic message from same sender
      if (message.sender?._id === currentUserId) {
        const optimistic = existing.find((m) => m._isOptimistic);
        if (optimistic) {
          const msgs = existing.map((m) => (m._id === optimistic._id ? message : m));
          const updatedConv = {
            ...state.conversations[conversationId],
            lastMessage: buildLastMessagePreview(message),
            messageCount: (state.conversations[conversationId]?.messageCount || 0) + 1,
          };
          return {
            ...state,
            messages: { ...state.messages, [conversationId]: msgs },
            conversations: { ...state.conversations, [conversationId]: updatedConv },
          };
        }
      }

      // New message from someone else (or own message without optimistic)
      const newMsgs = [...existing, message];
      const conv = state.conversations[conversationId];
      const isActive = state.activeConversationId === conversationId;
      const isOwnMessage = message.sender?._id === currentUserId;
      const unreadInc = (!isActive && !isOwnMessage) ? 1 : 0;

      const updatedConv = conv ? {
        ...conv,
        lastMessage: buildLastMessagePreview(message),
        messageCount: (conv.messageCount || 0) + 1,
        myUnreadCount: (conv.myUnreadCount || 0) + unreadInc,
      } : conv;

      // Move conversation to top
      const newOrder = conv
        ? [conversationId, ...state.conversationOrder.filter((id) => id !== conversationId)]
        : state.conversationOrder;

      const newTotalUnread = state.totalUnreadCount + unreadInc;

      return {
        ...state,
        messages: { ...state.messages, [conversationId]: newMsgs },
        conversations: updatedConv ? { ...state.conversations, [conversationId]: updatedConv } : state.conversations,
        conversationOrder: newOrder,
        totalUnreadCount: newTotalUnread,
      };
    }
    case 'SOCKET_MESSAGE_EDITED': {
      const { conversationId, messageId, text, isEdited, editedAt } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === messageId ? { ...m, content: { ...m.content, text }, isEdited, editedAt } : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'SOCKET_MESSAGE_DELETED': {
      const { conversationId, messageId } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, _isDeletedPlaceholder: true, content: { text: null }, attachments: [], entityReference: null }
          : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'SOCKET_MESSAGE_REACTION': {
      const { conversationId, messageId, reactions } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'SOCKET_MESSAGE_PINNED': {
      const { conversationId, messageId, isPinned, pinnedBy } = action.payload;
      const msgs = (state.messages[conversationId] || []).map((m) =>
        m._id === messageId ? { ...m, isPinned, pinnedBy, pinnedAt: isPinned ? new Date().toISOString() : null } : m
      );
      return { ...state, messages: { ...state.messages, [conversationId]: msgs } };
    }
    case 'SOCKET_CONVERSATION_UPDATED': {
      const { conversationId, changes } = action.payload;
      if (!state.conversations[conversationId]) return state;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: { ...state.conversations[conversationId], ...changes },
        },
      };
    }
    case 'SOCKET_READ_RECEIPT': {
      const { conversationId, userId, timestamp } = action.payload;
      const conv = state.conversations[conversationId];
      if (!conv) return state;
      const updatedParticipants = conv.participants?.map((p) =>
        p.user?._id === userId ? { ...p, lastReadAt: timestamp, unreadCount: 0 } : p
      );
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [conversationId]: { ...conv, participants: updatedParticipants },
        },
      };
    }

    // Mark read
    case 'MARK_CONVERSATION_READ': {
      const convId = action.payload;
      const conv = state.conversations[convId];
      if (!conv) return state;
      const prevUnread = conv.myUnreadCount || 0;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [convId]: { ...conv, myUnreadCount: 0, myLastReadAt: new Date().toISOString() },
        },
        totalUnreadCount: Math.max(0, state.totalUnreadCount - prevUnread),
      };
    }

    // Presence
    case 'SET_ONLINE_USERS':
      return { ...state, onlineUserIds: action.payload };
    case 'USER_ONLINE':
      return {
        ...state,
        onlineUserIds: state.onlineUserIds.includes(action.payload)
          ? state.onlineUserIds
          : [...state.onlineUserIds, action.payload],
      };
    case 'USER_OFFLINE':
      return {
        ...state,
        onlineUserIds: state.onlineUserIds.filter((id) => id !== action.payload),
      };

    // Typing
    case 'SET_TYPING': {
      const { conversationId, userId, userName } = action.payload;
      const convTyping = { ...(state.typingUsers[conversationId] || {}), [userId]: userName };
      return { ...state, typingUsers: { ...state.typingUsers, [conversationId]: convTyping } };
    }
    case 'CLEAR_TYPING': {
      const { conversationId, userId } = action.payload;
      const convTyping = { ...(state.typingUsers[conversationId] || {}) };
      delete convTyping[userId];
      return { ...state, typingUsers: { ...state.typingUsers, [conversationId]: convTyping } };
    }

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { isAuthenticated, token, user } = useAuth();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // ─── Socket lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token || !user?._id) return;

    const manager = new ChatSocketManager(token, dispatch, user._id);
    manager.connect();
    socketRef.current = manager;

    return () => {
      manager.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, user?._id]);

  // Refresh conversations after reconnect
  useEffect(() => {
    if (state.shouldRefresh) {
      dispatch({ type: 'CLEAR_REFRESH' });
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.shouldRefresh]);

  // ─── Conversation actions ────────────────────────────────────────────
  const loadConversations = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_CONVERSATIONS_LOADING', payload: true });
    try {
      const res = await chatAPI.getConversations({ page: 1, limit: 50, ...params });
      const data = res.data?.data || res.data;
      dispatch({
        type: 'SET_CONVERSATIONS',
        payload: {
          conversations: data.conversations || [],
          pagination: data.pagination
            ? { page: data.pagination.currentPage, hasMore: data.pagination.hasNextPage }
            : { page: 1, hasMore: false },
        },
      });
    } catch {
      dispatch({ type: 'SET_CONVERSATIONS_LOADING', payload: false });
    }
  }, []);

  const loadMoreConversations = useCallback(async () => {
    if (!state.conversationsPagination.hasMore || state.conversationsLoading) return;
    const nextPage = state.conversationsPagination.page + 1;
    dispatch({ type: 'SET_CONVERSATIONS_LOADING', payload: true });
    try {
      const res = await chatAPI.getConversations({ page: nextPage, limit: 50 });
      const data = res.data?.data || res.data;
      dispatch({
        type: 'APPEND_CONVERSATIONS',
        payload: {
          conversations: data.conversations || [],
          pagination: data.pagination
            ? { page: data.pagination.currentPage, hasMore: data.pagination.hasNextPage }
            : { page: nextPage, hasMore: false },
        },
      });
    } catch {
      dispatch({ type: 'SET_CONVERSATIONS_LOADING', payload: false });
    }
  }, [state.conversationsPagination, state.conversationsLoading]);

  const createConversation = useCallback(async (data) => {
    const res = await chatAPI.createConversation(data);
    const conv = res.data?.data?.conversation || res.data?.conversation;
    if (conv) {
      dispatch({ type: 'ADD_CONVERSATION', payload: conv });
      socketRef.current?.joinConversation(conv._id);
    }
    return conv;
  }, []);

  const setActiveConversation = useCallback((conversationId) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversationId });
    if (conversationId) {
      socketRef.current?.joinConversation(conversationId);
    }
  }, []);

  const updateConversation = useCallback(async (id, data) => {
    const res = await chatAPI.updateConversation(id, data);
    const conv = res.data?.data?.conversation || res.data?.conversation;
    if (conv) {
      dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, changes: conv } });
    }
    return conv;
  }, []);

  const addParticipants = useCallback(async (id, userIds) => {
    const res = await chatAPI.addParticipants(id, { userIds });
    const conv = res.data?.data?.conversation || res.data?.conversation;
    if (conv) {
      dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, changes: { participants: conv.participants } } });
    }
    return conv;
  }, []);

  const removeParticipant = useCallback(async (id, userId) => {
    await chatAPI.removeParticipant(id, userId);
    // Refresh the conversation to get updated participants
    try {
      const res = await chatAPI.getConversation(id);
      const conv = res.data?.data?.conversation || res.data?.conversation;
      if (conv) {
        dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, changes: { participants: conv.participants } } });
      }
    } catch { /* conversation might not be accessible anymore */ }
  }, []);

  const archiveConversation = useCallback(async (id, archive) => {
    await chatAPI.archiveConversation(id, { archive });
    if (archive) {
      dispatch({ type: 'REMOVE_CONVERSATION', payload: id });
    }
  }, []);

  const leaveConversation = useCallback(async (id) => {
    await chatAPI.leaveConversation(id);
    socketRef.current?.leaveConversation(id);
    dispatch({ type: 'REMOVE_CONVERSATION', payload: id });
  }, []);

  // ─── Message actions ─────────────────────────────────────────────────
  const loadMessages = useCallback(async (conversationId) => {
    dispatch({ type: 'SET_MESSAGES_LOADING', payload: { conversationId, loading: true } });
    try {
      const res = await chatAPI.getMessages(conversationId, { limit: 50 });
      const data = res.data?.data || res.data;
      // API returns newest-first, reverse for chronological rendering
      const msgs = (data.messages || []).reverse();
      dispatch({
        type: 'SET_MESSAGES',
        payload: {
          conversationId,
          messages: msgs,
          pagination: { hasMore: data.hasMore, oldestId: data.oldestId },
        },
      });
    } catch {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: { conversationId, loading: false } });
    }
  }, []);

  const loadOlderMessages = useCallback(async (conversationId) => {
    const pag = state.messagesPagination[conversationId];
    if (!pag?.hasMore || state.messagesLoading[conversationId]) return;

    dispatch({ type: 'SET_MESSAGES_LOADING', payload: { conversationId, loading: true } });
    try {
      const res = await chatAPI.getMessages(conversationId, { before: pag.oldestId, limit: 50 });
      const data = res.data?.data || res.data;
      const msgs = (data.messages || []).reverse();
      dispatch({
        type: 'PREPEND_MESSAGES',
        payload: {
          conversationId,
          messages: msgs,
          pagination: { hasMore: data.hasMore, oldestId: data.oldestId },
        },
      });
    } catch {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: { conversationId, loading: false } });
    }
  }, [state.messagesPagination, state.messagesLoading]);

  const sendMessage = useCallback(async (conversationId, data) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: user ? { _id: user._id, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage } : null,
      type: data.entityReference ? 'entity_reference' : data.attachments?.length ? 'file' : 'text',
      content: { text: data.text || null },
      attachments: data.attachments || [],
      entityReference: data.entityReference || null,
      mentions: [],
      reactions: [],
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      readBy: [],
      replyTo: data._replyToPreview || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isOptimistic: true,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message: optimisticMessage } });

    try {
      const sendData = { ...data };
      delete sendData._replyToPreview;
      const res = await chatAPI.sendMessage(conversationId, sendData);
      const msg = res.data?.data?.message || res.data?.message;
      if (msg) {
        dispatch({ type: 'REPLACE_OPTIMISTIC_MESSAGE', payload: { conversationId, tempId, message: msg } });
      }
      return msg;
    } catch (err) {
      dispatch({ type: 'MARK_MESSAGE_FAILED', payload: { conversationId, tempId } });
      throw err;
    }
  }, [user]);

  const editMessage = useCallback(async (messageId, text) => {
    const res = await chatAPI.editMessage(messageId, { text });
    return res.data?.data?.message || res.data?.message;
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    await chatAPI.deleteMessage(messageId);
  }, []);

  const toggleReaction = useCallback(async (messageId, emoji) => {
    await chatAPI.toggleReaction(messageId, { emoji });
  }, []);

  const togglePin = useCallback(async (messageId) => {
    await chatAPI.togglePin(messageId);
  }, []);

  const forwardMessage = useCallback(async (messageId, targetConversationId) => {
    const res = await chatAPI.forwardMessage(messageId, { targetConversationId });
    return res.data?.data?.message || res.data?.message;
  }, []);

  const createTaskFromMessage = useCallback(async (messageId, data) => {
    const res = await chatAPI.createTaskFromMessage(messageId, data);
    return res.data?.data?.task || res.data?.task;
  }, []);

  // ─── Entity conversations ────────────────────────────────────────────
  const openEntityConversation = useCallback(async (entityType, entityId) => {
    const res = await chatAPI.getEntityConversation(entityType, entityId);
    const conv = res.data?.data?.conversation || res.data?.conversation;
    if (conv) {
      dispatch({ type: 'ADD_CONVERSATION', payload: conv });
      socketRef.current?.joinConversation(conv._id);
    }
    return conv;
  }, []);

  // ─── Search ──────────────────────────────────────────────────────────
  const searchMessages = useCallback(async (query, conversationId) => {
    const params = { q: query, limit: 20 };
    if (conversationId) params.conversationId = conversationId;
    const res = await chatAPI.searchMessages(params);
    return res.data?.data?.messages || [];
  }, []);

  // ─── Pinned messages ─────────────────────────────────────────────────
  const loadPinnedMessages = useCallback(async (conversationId) => {
    const res = await chatAPI.getPinnedMessages(conversationId);
    return res.data?.data?.messages || [];
  }, []);

  // ─── Typing ──────────────────────────────────────────────────────────
  const handleTypingStart = useCallback((conversationId) => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current?.startTyping(conversationId);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.stopTyping(conversationId);
    }, 2000);
  }, []);

  const handleTypingStop = useCallback((conversationId) => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      clearTimeout(typingTimeoutRef.current);
      socketRef.current?.stopTyping(conversationId);
    }
  }, []);

  // ─── Mark read ───────────────────────────────────────────────────────
  const markConversationRead = useCallback((conversationId) => {
    dispatch({ type: 'MARK_CONVERSATION_READ', payload: conversationId });
    // Send via both socket (for read receipts) and REST (for persistence)
    socketRef.current?.markAsRead(conversationId);
    chatAPI.markAsRead(conversationId).catch(() => {});
  }, []);

  // ─── Online users ────────────────────────────────────────────────────
  const loadOnlineUsers = useCallback(async () => {
    try {
      const res = await chatAPI.getOnlineUsers();
      const users = res.data?.data?.onlineUsers || [];
      dispatch({ type: 'SET_ONLINE_USERS', payload: users.map((u) => u._id) });
    } catch { /* ignore */ }
  }, []);

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadConversations();
      loadOnlineUsers();
    }
  }, [isAuthenticated, token, loadConversations, loadOnlineUsers]);

  // ─── Context value ───────────────────────────────────────────────────
  const value = {
    ...state,
    loadConversations,
    loadMoreConversations,
    createConversation,
    setActiveConversation,
    updateConversation,
    addParticipants,
    removeParticipant,
    archiveConversation,
    leaveConversation,
    loadMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePin,
    forwardMessage,
    createTaskFromMessage,
    openEntityConversation,
    searchMessages,
    loadPinnedMessages,
    handleTypingStart,
    handleTypingStop,
    markConversationRead,
    loadOnlineUsers,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    // Return a safe default for components outside ChatProvider
    return { totalUnreadCount: 0, onlineUserIds: [], conversations: {} };
  }
  return context;
}

export default ChatContext;
