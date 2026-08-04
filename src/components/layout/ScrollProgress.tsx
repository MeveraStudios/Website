import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Hairline under the header showing how far down the page you are. Driven
 * entirely by `scaleX`, so it never triggers layout or paint while scrolling.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="absolute bottom-0 left-0 h-px w-full bg-primary/70"
    />
  );
}
