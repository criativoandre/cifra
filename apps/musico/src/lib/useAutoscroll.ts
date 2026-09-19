import { useEffect, useRef, useState } from 'react';

export function useAutoscroll() {
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(4);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function step() {
      window.scrollBy(0, speed / 10);
      rafRef.current = requestAnimationFrame(step);
    }
    if (scrolling) {
      rafRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrolling, speed]);

  function toggle(force?: boolean) {
    setScrolling((s) => (force !== undefined ? force : !s));
  }

  return { scrolling, speed, setSpeed, toggle };
}
