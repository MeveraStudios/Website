import { createContext, useContext, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * False when the enclosing scene is not pinned, so scene-driven children render
 * flat. Progress alone cannot express this: a layer that *arrives* rests at
 * progress 1, but a layer that *departs* rests at 0, so there is no single
 * fallback value that leaves both on screen.
 */
export const SceneActiveContext = createContext(false);

export const useSceneActive = () => useContext(SceneActiveContext);

/**
 * Pinned scenes are a desktop affordance. On narrow screens the extra scroll
 * length is a tax rather than an effect, and the depth is wasted on a viewport
 * that cannot show it.
 */
export function useSceneEnabled() {
  const reduceMotion = useReducedMotion();
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => setWide(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return wide && !reduceMotion;
}
