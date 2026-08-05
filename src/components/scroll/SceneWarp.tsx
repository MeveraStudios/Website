import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneEnabled } from '@/components/scroll/sceneContext';

/** Matches the sticky header offset the scenes pin beneath. */
const HEADER_PX = 64;

const COVER_MS = 100;
const REVEAL_MS = 250;

/** Long enough for a smooth scroll back to the top to finish. */
const GLIDE_MS = 900;

/** Clearance left below a scene when ejecting upward out of it. */
const EJECT_GAP = 60;

/** Ignore scroll events for this long after mount, so loading never triggers a jump. */
const ARM_DELAY_MS = 400;

interface Scene {
  /** Scroll position at which the scene pins. */
  start: number;
  /** Scroll position at which the pin releases. */
  end: number;
  /** Scrolling down, the point where the scene would first edge into view. */
  approachDown: number;
  /** Scrolling up, the point where the scene would first edge into view. */
  approachUp: number;
  /** Whether the scene directly above this one is another pinned scene. */
  flushPrev: boolean;
  /** Whether the scene directly below this one is another pinned scene. */
  flushNext: boolean;
}

/**
 * Makes pinned scenes behave like slides rather than tall scroll regions.
 *
 * The cut fires the moment a scene would *begin* to appear, not once it has
 * finished sliding in: the screen goes black, the page jumps straight to that
 * scene's pinned position, and the black lifts. So a scene is never watched
 * scrolling into place, and the dead space a pin leaves behind is never
 * scrolled through either.
 *
 * Scenes are discovered from the `data-scene-warp` attribute `PinnedScene`
 * stamps on its wrapper, and geometry is measured at trigger time, so adding
 * or reordering scenes needs no configuration here.
 */
export function SceneWarp() {
  const enabled = useSceneEnabled();
  const [covering, setCovering] = useState(false);
  const busyRef = useRef(false);
  const lastYRef = useRef(0);
  const armedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    lastYRef.current = window.scrollY;
    const armTimer = window.setTimeout(() => {
      armedRef.current = true;
    }, ARM_DELAY_MS);

    let rafId: number | null = null;

    const readScenes = (): Scene[] => {
      const y = window.scrollY;
      const viewH = window.innerHeight;

      const boxes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene-warp]')).map(el => {
        const rect = el.getBoundingClientRect();
        const top = rect.top + y;
        return { top, bottom: top + rect.height };
      });

      return boxes.map((box, i) => {
        const next = boxes[i + 1];
        const prev = boxes[i - 1];
        // A scene whose neighbour sits flush against it is covered by that
        // neighbour's pin, so coming back up it only reappears once that pin
        // releases rather than when its own box re-enters the viewport.
        const flushNext = next && Math.abs(box.bottom - next.top) <= 4 ? next : undefined;

        return {
          start: box.top - HEADER_PX,
          end: box.bottom - viewH,
          approachDown: box.top - viewH,
          approachUp: flushNext ? flushNext.top - HEADER_PX : box.bottom,
          flushPrev: Boolean(prev && Math.abs(prev.bottom - box.top) <= 4),
          flushNext: Boolean(flushNext)
        };
      });
    };

    const jumpTo = (target: number) => {
      busyRef.current = true;
      setCovering(true);

      window.setTimeout(() => {
        // Explicitly `instant`, not `auto`: `auto` defers to the global
        // `scroll-behavior: smooth`, which would animate the jump in full view
        // while the curtain is already lifting.
        window.scrollTo({ top: target, behavior: 'instant' });
        lastYRef.current = target;
        setCovering(false);

        // Hold the lock through the reveal so wheel momentum cannot bounce
        // straight back across the boundary it just crossed.
        window.setTimeout(() => {
          busyRef.current = false;
        }, REVEAL_MS);
      }, COVER_MS);
    };

    /**
     * Returning to the first scene means returning to the top of the page, so
     * it glides there instead of cutting: there is nothing above it to hide,
     * and a blackout would just interrupt the way back.
     */
    const glideToTop = () => {
      busyRef.current = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      window.setTimeout(() => {
        lastYRef.current = window.scrollY;
        busyRef.current = false;
      }, GLIDE_MS);
    };

    const check = () => {
      rafId = null;
      const y = window.scrollY;

      const prev = lastYRef.current;
      lastYRef.current = y;

      if (busyRef.current || !armedRef.current || y === prev) return;

      const down = y > prev;
      const scenes = readScenes();

      // These are range tests, not edge crossings. A flung scrollbar can move
      // thousands of pixels between two frames, so asking "did we step over the
      // threshold" misses; asking "are we somewhere we should never be" cannot.
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];

        if (down) {
          // The band where the scene has begun entering from the bottom but
          // has not pinned yet. The first scene has nothing above it, so it is
          // never approached this way.
          if (i > 0 && y >= scene.approachDown && y < scene.start) {
            jumpTo(scene.start + 2);
            return;
          }
        } else if ((i === 0 || scene.flushNext) && y > scene.end && y <= scene.approachUp) {
          // Coming back up into the scene. Only scenes handing over to each
          // other capture here: a scene followed by ordinary content must let
          // that content be scrolled freely, or a short section below it (Team)
          // becomes impossible to sit in without being yanked back.
          if (i === 0) glideToTop();
          else jumpTo(scene.end - 2);
          return;
        } else if (i > 0 && !scene.flushPrev && y >= scene.approachDown && y < scene.start) {
          // Leaving the scene upward into ordinary content. Eject clear of the
          // slide-in band so the scene is fully off screen, landing where the
          // downward cut fired from. Scenes stacked on another scene are
          // excluded: going up out of those belongs to the neighbour's pin,
          // handled above.
          jumpTo(scene.approachDown - EJECT_GAP);
          return;
        }
      }
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(check);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(armTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[70] bg-background pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: covering ? 1 : 0 }}
      transition={{ duration: (covering ? COVER_MS : REVEAL_MS) / 1000, ease: 'easeInOut' }}
    />
  );
}

export default SceneWarp;
