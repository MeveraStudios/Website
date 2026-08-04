import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 }
};

// Slight overshoot at the end reads as "settling" rather than "sliding to a halt".
const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: ReactNode;
  /** Where the content travels in from. */
  direction?: Direction;
  /** Seconds to wait before this element starts. Ignored inside a `RevealGroup`. */
  delay?: number;
  duration?: number;
  /** Fraction of the element that must be visible before it starts. */
  amount?: number;
  className?: string;
}

const buildVariants = (direction: Direction, duration: number): Variants => {
  const { x, y } = OFFSET[direction];
  return {
    hidden: { opacity: 0, x, y },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration, ease: EASE } }
  };
};

/**
 * Reveals its children once, when scrolled into view. Use standalone, or as a
 * child of `RevealGroup` to inherit that group's stagger.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  amount = 0.3,
  className
}: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={buildVariants(direction, duration)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{ delay }}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  /** Seconds between each child starting. */
  stagger?: number;
  delay?: number;
  amount?: number;
  className?: string;
}

/**
 * Staggers its direct `Reveal` children so a grid assembles item by item rather
 * than sliding in as one slab. Children must not set their own `initial`.
 */
export function RevealGroup({ children, stagger = 0.08, delay = 0, amount = 0.15, className }: RevealGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } }
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A `Reveal` that takes its timing from the enclosing `RevealGroup` instead of
 * driving its own viewport trigger.
 */
export function RevealItem({
  children,
  direction = 'up',
  duration = 0.6,
  className
}: Omit<RevealProps, 'delay' | 'amount'>) {
  return (
    <motion.div className={className} variants={buildVariants(direction, duration)} style={{ willChange: 'opacity, transform' }}>
      {children}
    </motion.div>
  );
}
