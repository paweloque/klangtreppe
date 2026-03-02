/**
 * Klangtreppe — Audio Engine
 * Web Audio API engine: creates AudioContext, manages oscillator/gain node graph,
 * and provides click-free parameter control via setTargetAtTime.
 */

import { LIMITS } from './constants.js';
import { getState } from './state.js';

/** @type {AudioContext|null} */
let audioContext = null;

/** @type {AnalyserNode|null} */
let analyserNode = null;

/** @type {GainNode|null} */
let masterGainNode = null;

/** @type {GainNode|null} */
let normalizerGainNode = null;

/** @type {OscillatorNode[]} */
let oscillators = [];

/** @type {GainNode[]} */
let layerGainNodes = [];

/** Whether initAudio has been called successfully */
let initialized = false;

/**
 * Create the AudioContext and build the static part of the node graph.
 * Must be called from a user gesture (e.g. play button click) for iOS Safari.
 * @returns {Promise<AudioContext>}
 */
export async function initAudio() {
  if (initialized && audioContext) {
    // Already initialized — just resume if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioCtx({ latencyHint: 'interactive' });

  // iOS Safari: resume on user gesture
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Create static nodes: normalizer → master → analyser → destination
  normalizerGainNode = audioContext.createGain();
  masterGainNode = audioContext.createGain();
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;

  // Set initial master volume from state
  const { masterVolume } = getState();
  masterGainNode.gain.value = masterVolume;

  // Connect static chain
  normalizerGainNode.connect(masterGainNode);
  masterGainNode.connect(analyserNode);
  analyserNode.connect(audioContext.destination);

  initialized = true;
  console.log('Audio engine initialized. Sample rate:', audioContext.sampleRate);
  return audioContext;
}

/**
 * Returns the AudioContext instance (or null if not yet initialized).
 * @returns {AudioContext|null}
 */
export function getAudioContext() {
  return audioContext;
}

/**
 * Returns the AnalyserNode (for visualizations).
 * @returns {AnalyserNode|null}
 */
export function getAnalyserNode() {
  return analyserNode;
}

/**
 * Create (or rebuild) oscillator + gain node chains for the given number of layers.
 * Each layer: OscillatorNode (sine) → GainNode → normalizerGainNode.
 * Oscillators start immediately but at gain 0.
 * @param {number} layerCount
 */
export function buildOscillators(layerCount) {
  if (!audioContext || !normalizerGainNode) {
    console.warn('buildOscillators called before initAudio');
    return;
  }

  // Tear down existing oscillators first
  destroyOscillators();

  const now = audioContext.currentTime;

  for (let i = 0; i < layerCount; i++) {
    // Create oscillator
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = LIMITS.baseFrequency * Math.pow(2, i);

    // Create per-layer gain node, starting at 0 (silent)
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, now);

    // Connect: osc → gain → normalizer
    osc.connect(gain);
    gain.connect(normalizerGainNode);

    // Start oscillator immediately
    osc.start();

    oscillators.push(osc);
    layerGainNodes.push(gain);
  }

  // Set normalizer gain
  setNormalizerGain(layerCount);

  console.log(`Built ${layerCount} oscillators`);
}

/**
 * Stop and disconnect all oscillators cleanly.
 */
export function destroyOscillators() {
  for (const osc of oscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch (_) {
      // Oscillator may already be stopped
    }
  }
  for (const gain of layerGainNodes) {
    try {
      gain.disconnect();
    } catch (_) {
      // May already be disconnected
    }
  }
  oscillators = [];
  layerGainNodes = [];
}

/**
 * Set oscillator frequency for a layer using setTargetAtTime for smooth transitions.
 * @param {number} index - Layer index
 * @param {number} freq - Target frequency in Hz
 */
export function setLayerFrequency(index, freq) {
  if (index < 0 || index >= oscillators.length || !audioContext) return;
  const osc = oscillators[index];
  osc.frequency.setTargetAtTime(freq, audioContext.currentTime, LIMITS.audioTimeConstant);
}

/**
 * Set layer gain using setTargetAtTime for click-free transitions.
 * @param {number} index - Layer index
 * @param {number} gain - Target gain value (0–1)
 */
export function setLayerGain(index, gain) {
  if (index < 0 || index >= layerGainNodes.length || !audioContext) return;
  const gainNode = layerGainNodes[index];
  // Use ~20ms time constant for gain changes (slightly longer than frequency)
  gainNode.gain.setTargetAtTime(gain, audioContext.currentTime, 0.02);
}

/**
 * Set master volume gain.
 * @param {number} volume - Master volume (0–1)
 */
export function setMasterVolume(volume) {
  if (!masterGainNode || !audioContext) return;
  masterGainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.02);
}

/**
 * Set normalizer gain to 1/sqrt(layerCount) to prevent clipping.
 * @param {number} layerCount
 */
export function setNormalizerGain(layerCount) {
  if (!normalizerGainNode || !audioContext) return;
  const normGain = 1 / Math.sqrt(layerCount);
  normalizerGainNode.gain.setTargetAtTime(normGain, audioContext.currentTime, 0.02);
}

/**
 * Resume AudioContext if suspended, build oscillators from current state.
 */
export async function startAudio() {
  if (!audioContext) {
    console.warn('startAudio called before initAudio');
    return;
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const { layerCount } = getState();
  buildOscillators(layerCount);
}

/**
 * Fade all gains to 0, then stop oscillators after a short delay.
 */
export function stopAudio() {
  if (!audioContext) return;

  const now = audioContext.currentTime;

  // Fade all layer gains to 0
  for (const gain of layerGainNodes) {
    gain.gain.setTargetAtTime(0, now, 0.02);
  }

  // After fade (~100ms = 5× time constant), destroy oscillators
  setTimeout(() => {
    destroyOscillators();
  }, 100);
}
