/**
 * Klangtreppe — Central State Management
 * Single source of truth for all application state.
 * Event emitter for change notifications.
 */

import { LIMITS } from './constants.js';

/**
 * Default state values.
 * @type {object}
 */
const DEFAULT_STATE = {
  isPlaying: false,
  isFrozen: false,
  direction: 'ascending',
  speed: 0.1,
  masterVolume: 0.5,
  envelopeCenter: 500,
  envelopeWidth: 3.0,
  envelopeEnabled: true,
  layerCount: 6,
  layers: Array.from({ length: 6 }, () => ({
    enabled: true,
    soloed: false,
    currentFreq: 0,
    currentAmp: 0,
  })),
  mode: 'continuous',
  stepInterval: 'semitone',
  stepRate: 1.0,
  pitchOffset: 0.0,
  activeVisualization: 'envelope',
  tutorialStep: null,
  activePreset: 'klassisch',
};

/**
 * Deep clone the default state to create a fresh state object.
 * @returns {object}
 */
function cloneDefaultState() {
  return {
    ...DEFAULT_STATE,
    layers: DEFAULT_STATE.layers.map(l => ({ ...l })),
  };
}

/** Module-scoped state object */
let state = cloneDefaultState();

/** Subscriber storage: Map<string, Set<Function>> */
const subscribers = new Map();

/**
 * Get the current state (read-only snapshot).
 * Returns a shallow copy to prevent direct mutation.
 * @returns {object}
 */
export function getState() {
  return {
    ...state,
    layers: state.layers.map(l => ({ ...l })),
  };
}

/**
 * Get a single state property directly.
 * @param {string} key - State property name
 * @returns {*}
 */
export function getStateValue(key) {
  return state[key];
}

/**
 * Update one or more state properties.
 * Emits change events for each changed key, then wildcard subscribers.
 * @param {object} partial - Object with keys to update
 */
export function setState(partial) {
  const changedKeys = [];

  for (const [key, value] of Object.entries(partial)) {
    if (key === 'layers') {
      // Always treat layers as changed if provided
      state.layers = value;
      changedKeys.push('layers');
    } else if (state[key] !== value) {
      state[key] = value;
      changedKeys.push(key);
    }
  }

  if (changedKeys.length === 0) return;

  // Create a snapshot for subscribers
  const snapshot = getState();

  // Notify specific-key subscribers
  // Use a Set to avoid calling the same callback multiple times
  const notified = new Set();

  for (const key of changedKeys) {
    const subs = subscribers.get(key);
    if (subs) {
      for (const cb of subs) {
        if (!notified.has(cb)) {
          notified.add(cb);
          try {
            cb(changedKeys, snapshot);
          } catch (err) {
            console.error(`State subscriber error for key "${key}":`, err);
          }
        }
      }
    }
  }

  // Notify wildcard subscribers
  const wildcardSubs = subscribers.get('*');
  if (wildcardSubs) {
    for (const cb of wildcardSubs) {
      if (!notified.has(cb)) {
        notified.add(cb);
        try {
          cb(changedKeys, snapshot);
        } catch (err) {
          console.error('State wildcard subscriber error:', err);
        }
      }
    }
  }
}

/**
 * Subscribe to state changes.
 * @param {string[]|string} keys - Array of state keys to watch, or '*' for all changes
 * @param {Function} callback - Called with (changedKeys: string[], state: object)
 * @returns {Function} Unsubscribe function
 */
export function subscribe(keys, callback) {
  const keyList = keys === '*' ? ['*'] : keys;

  if (!keyList || keyList.length === 0) {
    return () => {}; // no-op unsubscribe
  }

  for (const key of keyList) {
    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }
    subscribers.get(key).add(callback);
  }

  // Return unsubscribe function
  return () => {
    for (const key of keyList) {
      const subs = subscribers.get(key);
      if (subs) {
        subs.delete(callback);
      }
    }
  };
}

/**
 * Update a specific layer's properties.
 * @param {number} index - Layer index (0-based)
 * @param {object} props - Properties to update on the layer
 */
export function updateLayer(index, props) {
  if (index < 0 || index >= state.layers.length) return;

  const newLayers = state.layers.map((layer, i) => {
    if (i === index) {
      return { ...layer, ...props };
    }
    return { ...layer };
  });

  setState({ layers: newLayers });
}

/**
 * Initialize or resize the layers array to the given count.
 * New layers are enabled and not soloed.
 * @param {number} count - Target layer count
 */
export function initializeLayers(count) {
  const clamped = Math.max(LIMITS.minLayers, Math.min(LIMITS.maxLayers, count));
  const newLayers = Array.from({ length: clamped }, (_, i) => {
    // Preserve existing layer state if available
    if (i < state.layers.length) {
      return { ...state.layers[i] };
    }
    return {
      enabled: true,
      soloed: false,
      currentFreq: 0,
      currentAmp: 0,
    };
  });

  setState({ layers: newLayers, layerCount: clamped });
}

/**
 * Reset state to defaults.
 * Emits change events for all keys.
 */
export function resetState() {
  const newState = cloneDefaultState();
  // Set all keys to trigger change events
  state = newState;

  // Notify all subscribers that everything changed
  const allKeys = Object.keys(state);
  const snapshot = getState();

  // Collect all unique subscribers
  const allCallbacks = new Set();
  for (const [, subs] of subscribers) {
    for (const cb of subs) {
      allCallbacks.add(cb);
    }
  }

  for (const cb of allCallbacks) {
    try {
      cb(allKeys, snapshot);
    } catch (err) {
      console.error('State reset subscriber error:', err);
    }
  }
}

// Initialize layers on module load
initializeLayers(6);
