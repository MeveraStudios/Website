import { createContext, useContext } from 'react';

/**
 * False when the enclosing scene is not pinned, so scene-driven children render
 * flat. Progress alone cannot express this: a layer that *arrives* rests at
 * progress 1, but a layer that *departs* rests at 0, so there is no single
 * fallback value that leaves both on screen.
 */
export const SceneActiveContext = createContext(false);

export const useSceneActive = () => useContext(SceneActiveContext);
