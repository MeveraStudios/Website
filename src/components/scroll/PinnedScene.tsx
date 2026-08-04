import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotionValue, useReducedMotion, useScroll, type MotionValue } from 'framer-motion';

/** Height of the sticky header the scene pins beneath. */
const HEADER = '4rem';

/**
 * Pinned scenes are a desktop affordance. On narrow screens the extra scroll
 * length is a tax rather than an effect, and the depth is wasted on a viewport
 * that cannot show it.
 */
function useSceneEnabled() {
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

interface PinnedSceneProps {
  /**
   * Extra viewport heights of scrolling the scene holds for while pinned.
   * 1 means the reader scrolls one full screen before the page moves on.
   */
  length?: number;
  id?: string;
  /**
   * Applied to the outer wrapper. Must not set any `overflow` other than
   * `visible` or `clip` — anything else turns the wrapper into a scroll
   * container and the scene silently stops pinning. Clipping belongs on the
   * sticky element, which already has it.
   */
  className?: string;
  /** Distance between the viewer and the z=0 plane. Lower is a wider angle. */
  perspective?: number;
  /**
   * Receives the scene's scroll progress, 0 at the moment it pins and 1 when it
   * releases. When scenes are disabled the value is a constant 1, so children
   * render in their finished state.
   */
  children: (progress: MotionValue<number>) => ReactNode;
}

export function PinnedScene({
  length = 1,
  id,
  className = '',
  perspective = 1600,
  children
}: PinnedSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useSceneEnabled();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const settled = useMotionValue(1);
  const progress = enabled ? scrollYProgress : settled;

  if (!enabled) {
    return (
      <section id={id} className={`py-24 relative ${className}`.trim()}>
        {children(progress)}
      </section>
    );
  }

  return (
    <section
      id={id}
      ref={ref}
      className={`relative ${className}`.trim()}
      // The wrapper is tall; the child inside it is what stays on screen. The
      // difference between the two is the scroll budget for the scene.
      style={{ height: `calc(${(1 + length) * 100}vh)` }}
    >
      <div
        className="sticky flex items-center overflow-hidden"
        style={{ top: HEADER, height: `calc(100vh - ${HEADER})`, perspective: `${perspective}px` }}
      >
        <div className="w-full" style={{ transformStyle: 'preserve-3d' }}>
          {children(progress)}
        </div>
      </div>
    </section>
  );
}

export default PinnedScene;
