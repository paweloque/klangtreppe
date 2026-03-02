/**
 * Klangtreppe — Scheduler
 * Drives the pitch-gliding loop at ~20ms intervals.
 * Calculates frequencies and Gaussian envelope amplitudes for each layer,
 * then pushes updates to the audio engine and state.
 *
 * Shepard tone algorithm:
 * - N layers are spaced exactly 1 octave apart, spanning N octaves total.
 * - pitchOffset grows continuously (never wraps globally).
 * - Each layer's position is (pitchOffset + i) % N, giving its octave offset
 *   from the base frequency.
 * - The base frequency is set so the range is centered (in log space) on
 *   the envelope center: baseFreq = envelopeCenter / 2^(N/2).
 * - A Gaussian envelope fades layers to silence at the range extremes.
 * - When a layer's modular position wraps (crosses an integer boundary),
 *   its frequency jumps by N octaves. This jump happens while the layer
 *   is silenced by the envelope, so it's inaudible.
 * - Instant gain silence + instant frequency set are used at wrap points
 *   to prevent any audible sweep artifacts.
 */

import { LIMITS, STEP_INTERVALS, DIRECTIONS } from './constants.js';
import { gaussianAmplitude, bandwidthToSigma } from './utils.js';
import { getState, setState, updateLayer, subscribe } from './state.js';
import { setLayerFrequency, setLayerGain, setLayerFrequencyInstant, silenceLayerInstant } from './audio-engine.js';

/** @type {number|null} setInterval handle */
let intervalId = null;

/** Accumulated pitch offset in octaves — grows continuously, never wraps */
let pitchOffset = 0;

/** Last tick timestamp from performance.now() */
let lastTickTime = 0;

/** Discrete mode: timestamp of the last step (performance.now() in ms) */
let lastStepTime = 0;

/**
 * Previous per-layer modular position, used to detect octave wraps.
 * When (pitchOffset + i) % N crosses an integer boundary, the layer has wrapped.
 * @type {number[]}
 */
let prevLayerPos = [];

/**
 * Core tick function — called every ~20ms.
 * Computes frequencies and amplitudes, updates audio engine and state.
 */
function tick() {
  const state = getState();
  const { isPlaying, isFrozen, direction, speed, layerCount,
          envelopeCenter, envelopeWidth, envelopeEnabled, mode,
          stepInterval, stepRate } = state;

  if (!isPlaying || isFrozen) return;

  const now = performance.now();
  const deltaTime = (now - lastTickTime) / 1000; // seconds
  lastTickTime = now;

  // Clamp deltaTime to avoid huge jumps (e.g. after tab was backgrounded)
  const dt = Math.min(deltaTime, 0.1);

  if (mode === 'continuous') {
    updateContinuous(dt, direction, speed, layerCount,
                     envelopeCenter, envelopeWidth, envelopeEnabled, state.layers);
  } else {
    updateDiscrete(now, direction, stepInterval, stepRate, layerCount,
                   envelopeCenter, envelopeWidth, envelopeEnabled, state.layers);
  }
}

/**
 * Continuous mode: smoothly glide pitchOffset.
 * pitchOffset grows continuously — no global wrapping.
 */
function updateContinuous(dt, direction, speed, layerCount,
                          envelopeCenter, envelopeWidth, envelopeEnabled, layers) {
  // Determine direction multiplier
  let dirMult = 0;
  if (direction === DIRECTIONS.ascending) dirMult = 1;
  else if (direction === DIRECTIONS.descending) dirMult = -1;
  // DIRECTIONS.paused → dirMult stays 0

  // Update pitch offset — grows continuously, no wrapping
  pitchOffset += dirMult * speed * dt;

  // Apply frequencies and amplitudes
  applyLayerParams(layerCount, envelopeCenter, envelopeWidth, envelopeEnabled, layers);

  // Store pitchOffset modulo layerCount for state (visualizations use this)
  setState({ pitchOffset: ((pitchOffset % layerCount) + layerCount) % layerCount });
}

/**
 * Discrete mode: step pitchOffset by fixed intervals.
 * Uses lastStepTime to determine when the next step should occur.
 * Between steps, pitchOffset stays fixed — only frequencies/amplitudes are refreshed.
 * @param {number} now - Current performance.now() timestamp in ms
 */
function updateDiscrete(now, direction, stepInterval, stepRate, layerCount,
                        envelopeCenter, envelopeWidth, envelopeEnabled, layers) {
  // Determine direction multiplier
  let dirMult = 0;
  if (direction === DIRECTIONS.ascending) dirMult = 1;
  else if (direction === DIRECTIONS.descending) dirMult = -1;

  // Time per step in milliseconds
  const stepPeriodMs = 1000 / stepRate;

  // Check if enough time has elapsed since the last step
  const elapsed = now - lastStepTime;

  if (elapsed >= stepPeriodMs) {
    // Get step size in octaves
    const stepSize = STEP_INTERVALS[stepInterval] || STEP_INTERVALS.semitone;

    // Jump pitchOffset — grows continuously, no wrapping
    pitchOffset += dirMult * stepSize;

    // Update lastStepTime — align to step grid to prevent drift
    lastStepTime = now - (elapsed % stepPeriodMs);

    // Store pitchOffset modulo layerCount for state
    setState({ pitchOffset: ((pitchOffset % layerCount) + layerCount) % layerCount });
  }

  // Apply frequencies and amplitudes every tick (keeps audio/display in sync)
  applyLayerParams(layerCount, envelopeCenter, envelopeWidth, envelopeEnabled, layers);
}

/**
 * Minimum Gaussian amplitude threshold. Layers below this are forced to 0
 * to guarantee silence at octave wrap points, preventing audible artifacts.
 *
 * With 6 layers spanning 6 octaves centered on the envelope (σ≈1.274),
 * the outermost layers at the wrap point are 3 octaves from center = 2.35σ
 * → raw amplitude ≈ 0.063. This cutoff (0.01) ensures layers are fully
 * silenced well before they reach the wrap point, providing a wide margin.
 */
const AMPLITUDE_CUTOFF = 0.01;

/**
 * Calculate and apply frequency + amplitude for each layer.
 *
 * Each layer i has position: pos = ((pitchOffset + i) % N + N) % N
 * where N = layerCount. This gives a value in [0, N) representing
 * the layer's octave offset from the base frequency.
 *
 * Frequency: baseFreq * 2^pos, where baseFreq = envelopeCenter / 2^(N/2)
 * This centers the N-octave range symmetrically around envelopeCenter
 * in log-frequency space.
 *
 * When a layer's pos wraps (e.g. from N-ε to 0+ε), its frequency jumps
 * from the top of the range to the bottom. At this point the Gaussian
 * envelope has faded it to silence, so the jump is inaudible. We use
 * instant gain silence + instant frequency set to prevent any sweep.
 */
function applyLayerParams(layerCount, envelopeCenter, envelopeWidth, envelopeEnabled, layers) {
  const sigma = bandwidthToSigma(envelopeWidth);
  const N = layerCount;

  // Base frequency: center the N-octave range on envelopeCenter in log space
  // Range spans from baseFreq to baseFreq * 2^N
  // Log-center = baseFreq * 2^(N/2) = envelopeCenter
  // → baseFreq = envelopeCenter / 2^(N/2)
  const baseFreq = envelopeCenter / Math.pow(2, N / 2);

  // Check if any layer is soloed
  const anySoloed = layers.some(l => l.soloed);

  // Initialize prevLayerPos if needed
  if (prevLayerPos.length !== N) {
    prevLayerPos = new Array(N);
    for (let i = 0; i < N; i++) {
      prevLayerPos[i] = ((pitchOffset + i) % N + N) % N;
    }
  }

  for (let i = 0; i < N; i++) {
    // Layer's modular position in [0, N) — each unit = 1 octave
    const pos = ((pitchOffset + i) % N + N) % N;

    // Detect wrap: check if the layer crossed an integer boundary
    // (i.e., jumped from near N to near 0, or vice versa)
    const prevPos = prevLayerPos[i];
    const posDelta = Math.abs(pos - prevPos);
    const wrapped = posDelta > N / 2; // Jump > half the range = wrap

    // Frequency: baseFreq * 2^pos
    const freq = baseFreq * Math.pow(2, pos);

    // Calculate amplitude from Gaussian envelope
    let amplitude;
    if (envelopeEnabled) {
      amplitude = gaussianAmplitude(freq, envelopeCenter, sigma);
      // Hard cutoff: force to 0 when below threshold to ensure silence at wrap
      if (amplitude < AMPLITUDE_CUTOFF) {
        amplitude = 0;
      }
    } else {
      amplitude = 1.0;
    }

    // Handle mute: if layer is not enabled, amplitude = 0
    if (!layers[i].enabled) {
      amplitude = 0;
    }

    // Handle solo: if any layer is soloed, only soloed layers get amplitude
    if (anySoloed && !layers[i].soloed) {
      amplitude = 0;
    }

    // Push to audio engine
    if (wrapped) {
      // Layer wrapped octaves — silence instantly, then set frequency instantly
      // to prevent audible sweep through intermediate frequencies
      silenceLayerInstant(i);
      setLayerFrequencyInstant(i, freq);
      // Don't set gain back up this tick — let the next tick's normal
      // setLayerGain bring it back smoothly (it will still be near 0
      // from the envelope anyway)
    } else {
      // Normal smooth transition
      setLayerFrequency(i, freq);
      setLayerGain(i, amplitude);
    }

    // Store current position for next tick's wrap detection
    prevLayerPos[i] = pos;

    // Update layer state for visualizations
    updateLayer(i, { currentFreq: freq, currentAmp: amplitude });
  }
}

/**
 * Start the scheduling loop.
 */
export function startScheduler() {
  if (intervalId !== null) return; // Already running

  const now = performance.now();
  lastTickTime = now;
  lastStepTime = now;
  pitchOffset = getState().pitchOffset || 0;
  prevLayerPos = []; // Reset wrap detection on start

  intervalId = setInterval(tick, LIMITS.schedulerIntervalMs);
  console.log('Scheduler started');
}

/**
 * Stop the scheduling loop.
 */
export function stopScheduler() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Scheduler stopped');
  }
}

/**
 * Reset pitchOffset to 0 and clear wrap-detection state.
 */
export function resetPitchOffset() {
  pitchOffset = 0;
  prevLayerPos = [];
  lastStepTime = performance.now();
  setState({ pitchOffset: 0 });
}

/**
 * Reset the discrete step timer.
 * Called when mode switches to discrete or direction changes,
 * so the next step starts fresh from the current moment.
 */
export function resetStepTimer() {
  lastStepTime = performance.now();
}

// ─── State Subscriptions ─────────────────────────────────────────────

/**
 * Subscribe to state changes that should reset the discrete step timer.
 * - mode → reset when switching to discrete
 * - direction → reset so step timing restarts cleanly
 * - isPlaying → reset when playback starts
 */
subscribe(['mode'], (_changedKeys, state) => {
  if (state.mode === 'discrete') {
    resetStepTimer();
  }
});

subscribe(['direction'], () => {
  resetStepTimer();
});

subscribe(['isPlaying'], (_changedKeys, state) => {
  if (state.isPlaying) {
    resetStepTimer();
  }
});
