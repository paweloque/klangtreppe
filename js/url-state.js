/**
 * Klangtreppe — URL State Sharing
 * Encodes/decodes application state to/from URL hash fragments.
 * Phase 8 implementation.
 */

import { getState, setState, initializeLayers } from './state.js';
import { LIMITS, STEP_INTERVALS, DIRECTIONS } from './constants.js';
import { announce } from './accessibility.js';

// ─── Direction Encoding ──────────────────────────────────────────────

/** Map direction strings to compact URL values */
const DIR_TO_URL = {
  ascending: 1,
  descending: -1,
  paused: 0,
};

/** Map compact URL values back to direction strings */
const URL_TO_DIR = {
  '1': 'ascending',
  '-1': 'descending',
  '0': 'paused',
};

// ─── Step Interval Encoding ──────────────────────────────────────────

/** Map step interval names to compact float values */
const INTERVAL_TO_URL = {
  semitone: STEP_INTERVALS.semitone,
  wholetone: STEP_INTERVALS.wholetone,
  minorthird: STEP_INTERVALS.minorthird,
};

/** Map compact float values back to step interval names */
function urlToInterval(val) {
  const num = parseFloat(val);
  // Find closest match
  let closest = 'semitone';
  let minDiff = Infinity;
  for (const [name, fraction] of Object.entries(STEP_INTERVALS)) {
    const diff = Math.abs(num - fraction);
    if (diff < minDiff) {
      minDiff = diff;
      closest = name;
    }
  }
  return closest;
}

// ─── Encode / Decode ─────────────────────────────────────────────────

/**
 * Encode the current application state into a URL hash fragment.
 * @returns {string} Full URL with hash fragment
 */
export function encodeStateToURL() {
  const state = getState();
  const params = new URLSearchParams();

  params.set('d', DIR_TO_URL[state.direction] ?? 1);
  params.set('s', state.speed.toFixed(4));
  params.set('n', state.layerCount.toString());
  params.set('ec', Math.round(state.envelopeCenter).toString());
  params.set('ew', state.envelopeWidth.toFixed(1));
  params.set('ee', state.envelopeEnabled ? '1' : '0');
  params.set('m', state.mode === 'continuous' ? 'c' : 'd');
  params.set('si', INTERVAL_TO_URL[state.stepInterval]?.toFixed(4) ?? STEP_INTERVALS.semitone.toFixed(4));
  params.set('sr', state.stepRate.toFixed(1));
  params.set('v', state.masterVolume.toFixed(2));

  if (state.activePreset) {
    params.set('p', state.activePreset);
  }

  return `${window.location.origin}${window.location.pathname}#${params.toString()}`;
}

/**
 * Decode a URL hash fragment into a partial state object.
 * Validates and clamps all values to valid ranges.
 * @returns {object|null} Partial state object, or null if no hash present
 */
export function decodeURLToState() {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return null;

  const params = new URLSearchParams(hash.substring(1));

  // If no recognized params, return null
  if (![...params.keys()].some(k => ['d', 's', 'n', 'ec', 'ew', 'ee', 'm', 'si', 'sr', 'v', 'p'].includes(k))) {
    return null;
  }

  const result = {};

  // Direction
  if (params.has('d')) {
    const dir = URL_TO_DIR[params.get('d')];
    if (dir) result.direction = dir;
  }

  // Speed
  if (params.has('s')) {
    const speed = parseFloat(params.get('s'));
    if (!isNaN(speed)) {
      result.speed = Math.max(LIMITS.minSpeed, Math.min(LIMITS.maxSpeed, speed));
    }
  }

  // Layer count
  if (params.has('n')) {
    const n = parseInt(params.get('n'), 10);
    if (!isNaN(n)) {
      result.layerCount = Math.max(LIMITS.minLayers, Math.min(LIMITS.maxLayers, n));
    }
  }

  // Envelope center
  if (params.has('ec')) {
    const ec = parseFloat(params.get('ec'));
    if (!isNaN(ec)) {
      result.envelopeCenter = Math.max(LIMITS.minEnvelopeCenter, Math.min(LIMITS.maxEnvelopeCenter, ec));
    }
  }

  // Envelope width
  if (params.has('ew')) {
    const ew = parseFloat(params.get('ew'));
    if (!isNaN(ew)) {
      result.envelopeWidth = Math.max(LIMITS.minEnvelopeWidth, Math.min(LIMITS.maxEnvelopeWidth, ew));
    }
  }

  // Envelope enabled
  if (params.has('ee')) {
    result.envelopeEnabled = params.get('ee') === '1';
  }

  // Mode
  if (params.has('m')) {
    const m = params.get('m');
    result.mode = m === 'd' ? 'discrete' : 'continuous';
  }

  // Step interval
  if (params.has('si')) {
    result.stepInterval = urlToInterval(params.get('si'));
  }

  // Step rate
  if (params.has('sr')) {
    const sr = parseFloat(params.get('sr'));
    if (!isNaN(sr)) {
      result.stepRate = Math.max(LIMITS.minStepRate, Math.min(LIMITS.maxStepRate, sr));
    }
  }

  // Master volume
  if (params.has('v')) {
    const v = parseFloat(params.get('v'));
    if (!isNaN(v)) {
      result.masterVolume = Math.max(0, Math.min(1, v));
    }
  }

  // Active preset (optional)
  if (params.has('p')) {
    result.activePreset = params.get('p');
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Apply decoded URL state to the application.
 * Handles layerCount separately via initializeLayers.
 * @param {object} urlState - Partial state from decodeURLToState()
 */
function applyURLState(urlState) {
  if (!urlState) return;

  // Handle layerCount first (needs initializeLayers)
  if (urlState.layerCount !== undefined) {
    initializeLayers(urlState.layerCount);
    delete urlState.layerCount;
  }

  // Apply remaining state
  if (Object.keys(urlState).length > 0) {
    setState(urlState);
  }
}

// ─── Share Button ────────────────────────────────────────────────────

/**
 * Copy text to clipboard with fallback for older browsers.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback: textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Handle share button click: encode state to URL, copy to clipboard,
 * show confirmation feedback.
 */
async function handleShare() {
  const btn = document.getElementById('btn-share');
  if (!btn) return;

  const url = encodeStateToURL();

  // Update the URL hash without triggering hashchange handler
  const hash = url.split('#')[1] || '';
  history.replaceState(null, '', `#${hash}`);

  const success = await copyToClipboard(url);

  if (success) {
    // Show confirmation
    const originalText = btn.textContent;
    btn.textContent = '✓ Kopiert!';
    btn.classList.add('btn--copied');
    announce('URL in Zwischenablage kopiert');

    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('btn--copied');
    }, 2000);
  } else {
    announce('Kopieren fehlgeschlagen');
  }
}

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Initialize URL state system:
 * - Check for hash on load and apply state
 * - Set up share button click handler
 * - Listen for hashchange events (browser back/forward)
 * @returns {object|null} Decoded state from URL if present
 */
export function initURLState() {
  // Check for initial hash state
  const urlState = decodeURLToState();
  if (urlState) {
    applyURLState(urlState);
    console.log('URL state applied:', urlState);
  }

  // Set up share button
  const btnShare = document.getElementById('btn-share');
  if (btnShare) {
    btnShare.addEventListener('click', handleShare);
  }

  // Listen for hashchange (browser back/forward)
  window.addEventListener('hashchange', () => {
    const newState = decodeURLToState();
    if (newState) {
      applyURLState(newState);
      console.log('Hash change state applied:', newState);
    }
  });

  console.log('URL state system initialized');
  return urlState;
}
