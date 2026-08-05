import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSceneActive } from '@/components/scroll/sceneContext';

interface DepthIntroProps {
  /** Seconds to wait before this element starts. */
  delay?: number;
  duration?: number;
  /** Starting distance along z, in px. Negative is away from the viewer. */
  z?: number;
  rotateX?: number;
  rotateY?: number;
  /** Starting vertical offset in px. */
  y?: number;
  className?: string;
  children: ReactNode;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Time-driven counterpart to `DepthLayer`: plays its 3D entrance once, as soon
 * as it scrolls into view, instead of scrubbing with scroll position. Inside a
 * pinned scene the pin then just holds the finished layout on screen.
 *
 * Outside an active scene (mobile, reduced motion) there is no perspective
 * container, so it degrades to a plain fade-up.
 */
export function DepthIntro({
  delay = 0,
  duration = 0.7,
  z = -520,
  rotateX = 14,
  rotateY = 0,
  y = 70,
  className,
  children
}: DepthIntroProps) {
  const active = useSceneActive();

  const hidden = active
    ? { opacity: 0, z, rotateX, rotateY, y }
    : { opacity: 0, y: 24 };
  const visible = active
    ? { opacity: 1, z: 0, rotateX: 0, rotateY: 0, y: 0 }
    : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={visible}
      // Not `once`: leaving the viewport reverts to hidden (offscreen, so the
      // revert is invisible) and the entrance replays on every approach, from
      // either direction.
      viewport={{ once: false, amount: 0.2 }}
      transition={{ delay, duration, ease: EASE }}
      style={active ? { transformStyle: 'preserve-3d', willChange: 'transform, opacity' } : undefined}
    >
      {children}
    </motion.div>
  );
}

export default DepthIntro;
