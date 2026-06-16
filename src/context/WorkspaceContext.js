// File: src/context/WorkspaceContext.js
// Description: WorkspaceContext — cards, layout, shared-with-me, CRUD/layout actions
// Part of: Personalized My Workspace feature (Task 22)

import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from './AuthContext';
import { workspaceAPI } from '../services/api';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [cards, setCards] = useState([]);          // all cards: owned + shared-with-me
  const [layout, setLayout] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const userId = user?._id || user?.id;

  // Cards I own vs cards shared TO me (the "Shared with me" tray source).
  const ownedCards = useMemo(
    () => cards.filter((c) => String(c.ownerId) === String(userId)),
    [cards, userId],
  );
  const sharedWithMe = useMemo(
    () => cards.filter((c) => String(c.ownerId) !== String(userId)),
    [cards, userId],
  );

  const loadCards = useCallback(async () => {
    try {
      const res = await workspaceAPI.getCards();
      setCards(res.data?.data || []);
    } catch {
      setCards([]);
      enqueueSnackbar('Failed to load your workspace cards', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const loadLayout = useCallback(async () => {
    try {
      const res = await workspaceAPI.getLayout();
      setLayout(res.data?.data || { items: [] });
    } catch {
      setLayout({ items: [] });
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCards(), loadLayout()]);
    setLoading(false);
  }, [loadCards, loadLayout]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    refresh();
  }, [isAuthenticated, refresh]);

  // ── Card CRUD ──────────────────────────────────────────────────────────────
  const createCard = useCallback(async (payload) => {
    try {
      const res = await workspaceAPI.createCard(payload);
      const created = res.data?.data;
      if (created) setCards((prev) => [...prev, created]);
      enqueueSnackbar('Card created', { variant: 'success' });
      return created;
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to create card', { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);

  const updateCard = useCallback(async (id, payload) => {
    try {
      const res = await workspaceAPI.updateCard(id, payload);
      const updated = res.data?.data;
      if (updated) setCards((prev) => prev.map((c) => (c._id === id ? updated : c)));
      enqueueSnackbar('Card updated', { variant: 'success' });
      return updated;
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update card', { variant: 'error' });
      throw err;
    }
  }, [enqueueSnackbar]);

  const deleteCard = useCallback(async (id) => {
    const prevCards = cards;
    const prevLayout = layout;
    // optimistic removal from cards + layout
    setCards((prev) => prev.filter((c) => c._id !== id));
    setLayout((prev) => ({ ...prev, items: (prev.items || []).filter((it) => it.cardId !== id) }));
    try {
      await workspaceAPI.deleteCard(id);
      enqueueSnackbar('Card deleted', { variant: 'success' });
    } catch (err) {
      setCards(prevCards);
      setLayout(prevLayout);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete card', { variant: 'error' });
      throw err;
    }
  }, [cards, layout, enqueueSnackbar]);

  // ── Layout ──────────────────────────────────────────────────────────────────
  const saveLayout = useCallback(async (items) => {
    const prev = layout;
    setLayout({ items }); // optimistic
    try {
      const res = await workspaceAPI.saveLayout(items);
      if (res.data?.data) setLayout(res.data.data);
    } catch (err) {
      setLayout(prev);
      enqueueSnackbar('Failed to save board layout', { variant: 'error' });
      throw err;
    }
  }, [layout, enqueueSnackbar]);

  // Add a card to my personal board (used by SharedWithMeTray + suggested cards).
  const addToBoard = useCallback((cardId, size = 'md') => {
    const items = layout.items || [];
    if (items.some((it) => it.cardId === cardId)) return Promise.resolve();
    const next = [...items, { cardId, order: items.length, size }];
    return saveLayout(next);
  }, [layout, saveLayout]);

  const removeFromBoard = useCallback((cardId) => {
    const next = (layout.items || []).filter((it) => it.cardId !== cardId);
    return saveLayout(next.map((it, i) => ({ ...it, order: i })));
  }, [layout, saveLayout]);

  const value = useMemo(() => ({
    cards,
    ownedCards,
    sharedWithMe,
    layout,
    loading,
    refresh,
    createCard,
    updateCard,
    deleteCard,
    saveLayout,
    addToBoard,
    removeFromBoard,
  }), [
    cards, ownedCards, sharedWithMe, layout, loading, refresh,
    createCard, updateCard, deleteCard, saveLayout, addToBoard, removeFromBoard,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
};

export default WorkspaceContext;
