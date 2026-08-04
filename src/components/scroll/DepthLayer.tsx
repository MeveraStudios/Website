import { type ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';

type Mode = 'enter' | 'exit';

interface DepthLayerProps {
  /** Scene progress from the enclosing `PinnedScene`. */
  progress: MotionValue<number>;
  /** Slice of scene progress this layer moves over, as `[start, end]`. */
  range: [number, number];
  /** `enter` arrives from depth; `exit` starts in place and recedes into it. */
  mode?: Mode;
  /** Distance along z the layer travels, in px. Negative is away from the viewer. */
  z?: number;
  rotateX?: number;
  rotateY?: number;
  /** Vertical travel in px. */
  y?: number;
  /** Opacity at the far end of the travel. */
  fade?: number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Moves its children through depth across a slice of a pinned scene. Every
 * channel is a transform or opacity, so the whole effect stays on the
 * compositor and never triggers layout.
 */
export function DepthLayer({
  progress,
  range,
  mode = 'enter',
  z = -600,
  rotateX = 0,
  rotateY = 0,
  y = 0,
  fade = 0,
  className,
  style,
  children
}: DepthLayerProps) {
  const [from, to] = range;
  const entering = mode === 'enter';

  // Entering layers travel from the far value to rest; exiting layers do the
  // reverse. Opacity leads on the way in and lags on the way out, so a layer is
  // never fully transparent while it is still visibly moving.
  const motionRange: [number, number] = [from, to];
  const far = (value: number) => (entering ? [value, 0] : [0, value]);

  const opacityRange: [number, number] = entering
    ? [from, lerp(from, to, 0.55)]
    : [lerp(from, to, 0.35), to];
  const opacityValues = entering ? [fade, 1] : [1, fade];

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
        z: useTransform(progress, motionRange, far(z)),
        y: useTransform(progress, motionRange, far(y)),
        rotateX: useTransform(progress, motionRange, far(rotateX)),
        rotateY: useTransform(progress, motionRange, far(rotateY)),
        opacity: useTransform(progress, opacityRange, opacityValues)
      }}
    >
      {children}
    </motion.div>
  );
}

export default DepthLayer;
