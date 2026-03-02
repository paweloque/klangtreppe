/**
 * Klangtreppe — Shared Constants
 * All magic numbers, limits, defaults, and shared constants.
 */

/** Okabe-Ito colorblind-friendly palette for up to 8 layers */
export const LAYER_COLORS = [
  '#E69F00', // orange
  '#56B4E9', // sky blue
  '#009E73', // bluish green
  '#F0E442', // yellow
  '#0072B2', // blue
  '#D55E00', // vermillion
  '#CC79A7', // reddish purple
  '#999999', // gray
];

/** Dark theme color tokens */
export const THEME = {
  background: '#1a1a2e',
  vizBackground: '#16213e',
  accent: '#f0a500',
  text: '#e0e0e0',
  textMuted: '#8888aa',
  controlBg: '#1f1f3a',
  controlBorder: '#2a2a4a',
  envelopeFill: 'rgba(240, 165, 0, 0.15)',
  envelopeStroke: 'rgba(240, 165, 0, 0.8)',
  gridLine: 'rgba(255, 255, 255, 0.08)',
  gridLabel: 'rgba(255, 255, 255, 0.4)',
};

/** Parameter limits and defaults */
export const LIMITS = {
  minLayers: 3,
  maxLayers: 8,
  minSpeed: 0.033,            // ~2 octaves per minute
  maxSpeed: 0.4,              // ~2 octaves per 5 seconds
  defaultSpeed: 0.1,          // ~1 octave per 10 seconds
  minEnvelopeCenter: 100,     // Hz
  maxEnvelopeCenter: 5000,    // Hz
  defaultEnvelopeCenter: 500,
  minEnvelopeWidth: 1.0,      // octaves (sigma)
  maxEnvelopeWidth: 6.0,
  defaultEnvelopeWidth: 3.0,
  minStepRate: 0.5,           // steps per second
  maxStepRate: 4.0,
  defaultStepRate: 1.0,
  baseFrequency: 16.35,       // C0 in Hz — lowest base frequency
  schedulerIntervalMs: 20,
  audioTimeConstant: 0.01,    // 10ms for setTargetAtTime
  discreteCrossfadeMs: 50,
};

/** Step intervals as fractions of an octave */
export const STEP_INTERVALS = {
  semitone: 1 / 12,
  wholetone: 2 / 12,
  minorthird: 3 / 12,
};

/** Pitch class names for spiral visualization */
export const PITCH_CLASSES = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F',
  'F♯', 'G', 'G♯', 'A', 'A♯', 'B',
];

/** Direction constants */
export const DIRECTIONS = {
  ascending: 'ascending',
  descending: 'descending',
  paused: 'paused',
};

/** Visualization tab definitions */
export const VIZ_TABS = [
  { id: 'envelope', label: 'Hüllkurve' },
  { id: 'spectrum', label: 'Spektrum' },
  { id: 'spiral', label: 'Spirale' },
  { id: 'waveform', label: 'Wellenform' },
];
