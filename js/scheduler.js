/**
 * Klangtreppe — Scheduler
 * Drives the pitch-gliding loop at ~20ms intervals.
 * Calculates frequencies and Gaussian envelope amplitudes for each layer,
 * then pushes updates to the audio engine and state.
 */

import { LIMITS, STEP_INTERVALS, DIRECTIONS } from './constants.js';
import { gaussianAmplitude, bandwidthToSigma } from './utils.js';
import { getState, setState, updateLayer, subscribe } from './state.js';
import { setLayerFrequency, setLayerGain } from './audio-engine.js';

/** @type {number|null} setInterval handle */
let intervalId = null;

/** Accumulated pitch offset in octaves (wraps 0–1) */
let pitchOffset = 0;

/** Last tick timestamp from performance.now() */
let lastTickTime = 0;

/** Discrete mode: timestamp of the last step (performance.now() in ms) */
let lastStepTime = 0;

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
 */
function updateContinuous(dt, direction, speed, layerCount,
                          envelopeCenter, envelopeWidth, envelopeEnabled, layers) {
  // Determine direction multiplier
  let dirMult = 0;
  if (direction === DIRECTIONS.ascending) dirMult = 1;
  else if (direction === DIRECTIONS.descending) dirMult = -1;
  // DIRECTIONS.paused → dirMult stays 0

  // Update pitch offset
  pitchOffset += dirMult * speed * dt;

  // Wrap pitchOffset to [0, 1)
  while (pitchOffset >= 1.0) pitchOffset -= 1.0;
  while (pitchOffset < 0.0) pitchOffset += 1.0;

  // Apply frequencies and amplitudes
  applyLayerParams(layerCount, envelopeCenter, envelopeWidth, envelopeEnabled, layers);

  // Update state with new pitchOffset
  setState({ pitchOffset });
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

    // Jump pitchOffset
    pitchOffset += dirMult * stepSize;

    // Wrap pitchOffset to [0, 1)
    while (pitchOffset >= 1.0) pitchOffset -= 1.0;
    while (pitchOffset < 0.0) pitchOffset += 1.0;

    // Update lastStepTime — align to step grid to prevent drift
    lastStepTime = now - (elapsed % stepPeriodMs);

    // Update state with new pitchOffset
    setState({ pitchOffset });
  }

  // Apply frequencies and amplitudes every tick (keeps audio/display in sync)
  applyLayerParams(layerCount, envelopeCenter, envelopeWidth, envelopeEnabled, layers);
}

/**
 * Calculate and apply frequency + amplitude for each layer.
 */
function applyLayerParams(layerCount, envelopeCenter, envelopeWidth, envelopeEnabled, layers) {
  const sigma = bandwidthToSigma(envelopeWidth);

  // Check if any layer is soloed
  const anySoloed = layers.some(l => l.soloed);

  for (let i = 0; i < layerCount; i++) {
    // Calculate frequency: baseFreq * 2^(pitchOffset + i)
    const freq = LIMITS.baseFrequency * Math.pow(2, pitchOffset + i);

    // Calculate amplitude from Gaussian envelope
    let amplitude;
    if (envelopeEnabled) {
      amplitude = gaussianAmplitude(freq, envelopeCenter, sigma);
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
    setLayerFrequency(i, freq);
    setLayerGain(i, amplitude);

    // Update layer state
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
 * Reset pitchOffset to 0.
 */
export function resetPitchOffset() {
  pitchOffset = 0;
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
