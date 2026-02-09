// File: src/hooks/use3DInteraction.js
// Reusable hook for CSS 3D drag rotation, wheel zoom, and touch support

import { useState, useCallback, useRef } from 'react';

const DEFAULTS = {
  rotateX: -20,
  rotateY: 25,
  scale: 1,
  sensitivity: 0.3,
  minRotateX: -60,
  maxRotateX: 10,
  minScale: 0.5,
  maxScale: 2.0,
};

const use3DInteraction = (options = {}) => {
  const config = { ...DEFAULTS, ...options };

  const [rotateX, setRotateX] = useState(config.rotateX);
  const [rotateY, setRotateY] = useState(config.rotateY);
  const [scale, setScale] = useState(config.scale);
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const pinchStart = useRef(0);

  const clampX = useCallback(
    (val) => Math.max(config.minRotateX, Math.min(config.maxRotateX, val)),
    [config.minRotateX, config.maxRotateX]
  );

  const clampScale = useCallback(
    (val) => Math.max(config.minScale, Math.min(config.maxScale, val)),
    [config.minScale, config.maxScale]
  );

  // Mouse handlers
  const onMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotateX,
      rotY: rotateY,
    };
  }, [rotateX, rotateY]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotateY(dragStart.current.rotY + dx * config.sensitivity);
    setRotateX(clampX(dragStart.current.rotX - dy * config.sensitivity));
  }, [isDragging, config.sensitivity, clampX]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setScale((prev) => clampScale(prev - e.deltaY * 0.001));
  }, [clampScale]);

  // Touch handlers
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const t = e.touches[0];
      dragStart.current = { x: t.clientX, y: t.clientY, rotX: rotateX, rotY: rotateY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = Math.hypot(dx, dy);
    }
  }, [rotateX, rotateY]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      setRotateY(dragStart.current.rotY + dx * config.sensitivity);
      setRotateX(clampX(dragStart.current.rotX - dy * config.sensitivity));
    } else if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - pinchStart.current) * 0.005;
      setScale((prev) => clampScale(prev + delta));
      pinchStart.current = dist;
    }
  }, [isDragging, config.sensitivity, clampX, clampScale]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    pinchStart.current = 0;
  }, []);

  // Reset to defaults
  const resetView = useCallback(() => {
    setRotateX(config.rotateX);
    setRotateY(config.rotateY);
    setScale(config.scale);
  }, [config.rotateX, config.rotateY, config.scale]);

  // View presets
  const setPreset = useCallback((preset) => {
    const presets = {
      front: { x: -15, y: 0 },
      isometric: { x: -20, y: 25 },
      top: { x: -70, y: 0 },
      side: { x: -10, y: 90 },
    };
    const p = presets[preset];
    if (p) {
      setRotateX(p.x);
      setRotateY(p.y);
    }
  }, []);

  const handlers = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return {
    rotateX,
    rotateY,
    scale,
    isDragging,
    handlers,
    resetView,
    setPreset,
  };
};

export default use3DInteraction;
