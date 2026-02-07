import { useState, useEffect, useRef } from 'react';

/**
 * Animated counter that counts from 0 to target value.
 * @param {{ value: number, duration?: number, formatter?: (n:number)=>string }} props
 */
const AnimatedCounter = ({ value, duration = 800, formatter }) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafId = useRef(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = Number(value) || 0;
    const startTime = performance.now();

    const ease = (t) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * ease(progress);
      setDisplay(current);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        prevValue.current = end;
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [value, duration]);

  const formatted = formatter ? formatter(display) : Math.round(display).toLocaleString('en-IN');
  return formatted;
};

export default AnimatedCounter;
