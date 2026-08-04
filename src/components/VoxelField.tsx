import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Box, Camera, Transform } from 'ogl';

interface VoxelFieldProps {
  /** Base block colour as `#rrggbb`. Falls back to the `--primary` CSS variable. */
  baseColor?: string;
  /** Blocks tinted with these colours are sprinkled through the cluster. */
  accentColors?: string[];
  /** Scroll distance, in px, over which the cluster fully disperses. */
  disperseDistance?: number;
  className?: string;
}

/**
 * The rays this replaced rendered a full-screen shader every frame for the whole
 * page. This renders ~100 cubes in a single instanced draw call, and stops
 * rendering altogether once it has scrolled away.
 */

// The cluster is a hollow 5x5x5 lattice: the interior blocks are never visible
// from outside, so building them costs vertices for nothing.
const LATTICE = 5;
const SPACING = 1.15;
const BLOCK_SCALE = 0.52;
const SCATTER_RADIUS = 9;
const ASSEMBLE_MS = 1400;

// Past the hero the cluster does not leave — it opens out into a loose shell
// that frames the content instead of sitting on top of it. The radius is picked
// against the camera's frustum: at z=0 the visible half-height is ~4.1 units, so
// blocks land at the edges of the viewport and beyond.
const AMBIENT_RADIUS = 4.8;
const AMBIENT_SPREAD = 3.4;
/** How far the ambient shell sits back from the cluster, so it reads as distant. */
const AMBIENT_DEPTH = 3.2;
const AMBIENT_ALPHA = 0.42;

// A soft, low-frequency background object: full device pixel ratio buys nothing.
const MAX_DPR = 1.5;

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
  };
  return [f(0), f(8), f(4)];
};

/** Reads a Tailwind design token such as `--primary`, stored as `H S% L%`. */
const readHslVar = (name: string): [number, number, number] | null => {
  if (typeof window === 'undefined') return null;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(raw);
  if (!m) return null;
  return hslToRgb(parseFloat(m[1]), parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
};

/** Deterministic per-index pseudo-random, so the cluster looks the same every load. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface InstanceData {
  target: Float32Array;
  scatter: Float32Array;
  tint: Float32Array;
  seed: Float32Array;
  scale: Float32Array;
  count: number;
}

const buildInstances = (base: [number, number, number], accents: [number, number, number][]): InstanceData => {
  const targets: number[] = [];
  const scatters: number[] = [];
  const tints: number[] = [];
  const seeds: number[] = [];
  const scales: number[] = [];

  const half = (LATTICE - 1) / 2;
  let i = 0;

  for (let x = 0; x < LATTICE; x++) {
    for (let y = 0; y < LATTICE; y++) {
      for (let z = 0; z < LATTICE; z++) {
        const onShell = x === 0 || y === 0 || z === 0 || x === LATTICE - 1 || y === LATTICE - 1 || z === LATTICE - 1;
        if (!onShell) continue;

        const r1 = rand(i + 1);
        const r2 = rand(i + 97);
        const r3 = rand(i + 211);

        // Jitter keeps the lattice from reading as a machine-perfect grid.
        targets.push(
          (x - half) * SPACING + (r1 - 0.5) * 0.28,
          (y - half) * SPACING + (r2 - 0.5) * 0.28,
          (z - half) * SPACING + (r3 - 0.5) * 0.28
        );

        // Scatter origins sit on a sphere shell so the cluster converges inward.
        const theta = r1 * Math.PI * 2;
        const phi = Math.acos(2 * r2 - 1);
        const radius = SCATTER_RADIUS * (0.7 + r3 * 0.6);
        scatters.push(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        // A handful of accent blocks; the rest are shades of the base colour.
        const useAccent = accents.length > 0 && r3 > 0.94;
        const tint = useAccent
          ? accents[Math.floor(r1 * accents.length) % accents.length]
          : (base.map(c => c * (0.55 + r2 * 0.65)) as [number, number, number]);
        tints.push(tint[0], tint[1], tint[2]);

        seeds.push(r1);
        scales.push(BLOCK_SCALE * (0.75 + r2 * 0.45));
        i++;
      }
    }
  }

  return {
    target: new Float32Array(targets),
    scatter: new Float32Array(scatters),
    tint: new Float32Array(tints),
    seed: new Float32Array(seeds),
    scale: new Float32Array(scales),
    count: i
  };
};

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute vec3 aTarget;
attribute vec3 aScatter;
attribute vec3 aTint;
attribute float aSeed;
attribute float aScale;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uAssemble;
uniform float uDisperse;
uniform float uTime;
uniform float uAmbientRadius;
uniform float uAmbientSpread;
uniform float uAmbientDepth;
uniform float uAmbientAlpha;

varying vec3 vNormal;
varying vec3 vTint;
varying float vAlpha;

mat3 rotation(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float t = 1.0 - c;
  vec3 a = normalize(axis);
  return mat3(
    t * a.x * a.x + c,       t * a.x * a.y - s * a.z, t * a.x * a.z + s * a.y,
    t * a.x * a.y + s * a.z, t * a.y * a.y + c,       t * a.y * a.z - s * a.x,
    t * a.x * a.z - s * a.y, t * a.y * a.z + s * a.x, t * a.z * a.z + c
  );
}

void main() {
  // Stagger assembly by seed so blocks land raggedly rather than in unison.
  float stagger = aSeed * 0.45;
  float assemble = clamp((uAssemble - stagger) / 0.55, 0.0, 1.0);
  assemble = 1.0 - pow(1.0 - assemble, 3.0);

  float disperse = clamp((uDisperse - aSeed * 0.2) / 0.8, 0.0, 1.0);

  // Dispersing opens the cluster into a bounded shell rather than throwing the
  // blocks off screen: each one keeps its own outward bearing but stops at a
  // fixed radius, set back from the camera so it stays behind the content.
  vec3 bearing = normalize(aScatter + vec3(0.0001));
  vec3 ambient = bearing * (uAmbientRadius + aSeed * uAmbientSpread);
  ambient.z -= uAmbientDepth;

  vec3 centre = mix(aScatter, aTarget, assemble);
  centre = mix(centre, ambient, disperse);

  // Idle bob. It grows once dispersed, since drifting is all the ambient
  // state does.
  float bobbing = assemble * (1.0 + disperse * 1.6);
  centre.y += sin(uTime * 0.6 + aSeed * 6.2831) * 0.12 * bobbing;
  centre.x += cos(uTime * 0.4 + aSeed * 4.7124) * 0.09 * assemble * disperse;

  // Blocks tumble while in flight, settle square in the cluster, then turn
  // slowly and individually once they are part of the ambient field.
  float spin =
    (1.0 - assemble) * (aSeed * 6.0 + 2.0) +
    disperse * (1.0 - disperse) * (aSeed * 8.0 + 3.0) +
    disperse * uTime * (0.06 + aSeed * 0.1);
  mat3 tumble = rotation(vec3(aSeed, 1.0 - aSeed, 0.5), spin);

  vec3 local = tumble * (position * aScale);

  vNormal = normalMatrix * (tumble * normal);
  vTint = aTint;
  vAlpha = mix(1.0, uAmbientAlpha, disperse);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(centre + local, 1.0);
}`;

const fragment = `
precision mediump float;

uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vTint;
varying float vAlpha;

void main() {
  // Flat, unsmoothed lambert: the hard terminator between faces is what makes
  // these read as blocks rather than as generically shaded boxes.
  vec3 lightDir = normalize(vec3(0.45, 0.85, 0.55));
  float lambert = max(dot(normalize(vNormal), lightDir), 0.0);
  vec3 colour = vTint * (0.26 + 0.74 * lambert);

  gl_FragColor = vec4(colour, vAlpha * uOpacity);
}`;

export function VoxelField({
  baseColor,
  accentColors = [],
  disperseDistance,
  className = ''
}: VoxelFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouseRef = useRef({ x: 0, y: 0 });

  // Props are read inside a long-lived render loop; mirroring them into refs
  // keeps the loop from being torn down and rebuilt on every parent render.
  const accentsRef = useRef(accentColors);
  accentsRef.current = accentColors;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, MAX_DPR), alpha: true, antialias: true });
    } catch {
      // No WebGL: leave the container empty, the page is fine without it.
      return;
    }

    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 35, near: 0.1, far: 100 });
    camera.position.set(0, 0, 13);

    const scene = new Transform();

    const base = baseColor ? hexToRgb(baseColor) : (readHslVar('--primary') ?? [0.65, 0.85, 0.4]);
    const accents = accentsRef.current.map(hexToRgb);
    const data = buildInstances(base, accents);

    const geometry = new Box(gl);
    geometry.addAttribute('aTarget', { instanced: 1, size: 3, data: data.target });
    geometry.addAttribute('aScatter', { instanced: 1, size: 3, data: data.scatter });
    geometry.addAttribute('aTint', { instanced: 1, size: 3, data: data.tint });
    geometry.addAttribute('aSeed', { instanced: 1, size: 1, data: data.seed });
    geometry.addAttribute('aScale', { instanced: 1, size: 1, data: data.scale });

    const uniforms = {
      uAssemble: { value: reduceMotion ? 1 : 0 },
      uDisperse: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uAmbientRadius: { value: AMBIENT_RADIUS },
      uAmbientSpread: { value: AMBIENT_SPREAD },
      uAmbientDepth: { value: AMBIENT_DEPTH },
      uAmbientAlpha: { value: AMBIENT_ALPHA }
    };

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms,
      transparent: true,
      cullFace: gl.BACK,
      depthTest: true,
      depthWrite: true
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    // Horizontal offset of the assembled cluster; released as it disperses so
    // the ambient shell ends up centred on the viewport.
    let biasX = 0;

    const resize = () => {
      renderer.dpr = Math.min(window.devicePixelRatio, MAX_DPR);
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      camera.perspective({ aspect: clientWidth / Math.max(clientHeight, 1) });

      // On wide viewports the cluster sits right of centre so it haloes the
      // hero's code block instead of sitting behind the headline.
      const wide = clientWidth >= 1024;
      biasX = wide ? 2.9 : 0;
      mesh.position.y = wide ? 0 : 0.6;
      mesh.scale.set(wide ? 1 : 0.72);
      camera.position.z = wide ? 13 : 15;
    };

    const fadeOver = () => disperseDistance ?? Math.max(window.innerHeight * 0.85, 320);

    let rafId: number | null = null;
    let startedAt: number | null = null;

    const render = (t: number) => {
      rafId = null;
      if (!reduceMotion) rafId = requestAnimationFrame(render);

      if (startedAt === null) startedAt = t;

      if (!reduceMotion) {
        uniforms.uAssemble.value = Math.min((t - startedAt) / ASSEMBLE_MS, 1);
      }

      // Reduced motion gets a still, assembled cluster that never opens out.
      const disperse = reduceMotion ? 0 : Math.min(scrollRef.current / fadeOver(), 1);

      uniforms.uTime.value = t * 0.001;
      uniforms.uDisperse.value = disperse;

      smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.06;
      smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.06;

      mesh.position.x = biasX * (1 - disperse);
      mesh.rotation.y = t * 0.00008 + smoothMouseRef.current.x * 0.45;
      mesh.rotation.x = -0.18 + smoothMouseRef.current.y * 0.3;

      renderer.render({ scene, camera });
    };

    const start = () => {
      if (rafId !== null || document.hidden) return;
      rafId = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafId === null) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    };

    // Passive listener writing to a ref: no layout is read during scroll, and
    // the value is consumed on the next frame the loop runs anyway.
    const onScroll = () => {
      scrollRef.current = window.scrollY;
      start();
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      start();
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    scrollRef.current = window.scrollY;

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduceMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    start();

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMouseMove);

      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      gl.canvas.parentNode?.removeChild(gl.canvas);
    };
  }, [baseColor, disperseDistance]);

  return <div ref={containerRef} className={`w-full h-full pointer-events-none ${className}`.trim()} />;
}

export default VoxelField;
