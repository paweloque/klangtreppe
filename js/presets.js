/**
 * Klangtreppe — Preset System
 * Defines 8 presets and manages applying/detecting active presets.
 * Phase 7 implementation.
 */

import { getState, setState, subscribe, initializeLayers } from './state.js';
import { buildOscillators, setNormalizerGain } from './audio-engine.js';
import { resetPitchOffset } from './scheduler.js';
import { renderLayerList } from './ui/layers.js';

// ─── Preset Definitions ──────────────────────────────────────────────

/**
 * All preset definitions.
 * Each preset has a name, description, and config object matching state keys.
 * Note: direction uses string values ('ascending'/'descending') to match state.
 *       stepInterval uses string keys ('semitone') to match state.
 */
export const PRESETS = {
  klassisch: {
    name: 'Klassisch',
    description: 'Klassischer Shepard-Ton',
    config: {
      layerCount: 6,
      envelopeCenter: 500,
      envelopeWidth: 3.0,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'ascending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  wenige: {
    name: 'Wenige Schichten',
    description: '3 Schichten — schwächere Illusion',
    config: {
      layerCount: 3,
      envelopeCenter: 500,
      envelopeWidth: 3.0,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'ascending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  viele: {
    name: 'Viele Schichten',
    description: '8 Schichten, breite Hüllkurve — sehr glatte Illusion',
    config: {
      layerCount: 8,
      envelopeCenter: 500,
      envelopeWidth: 4.0,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'ascending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  schmal: {
    name: 'Schmale Hüllkurve',
    description: 'Nur 1-2 Schichten hörbar',
    config: {
      layerCount: 6,
      envelopeCenter: 500,
      envelopeWidth: 1.5,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'ascending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  breit: {
    name: 'Breite Hüllkurve',
    description: 'Sprünge werden hörbar',
    config: {
      layerCount: 6,
      envelopeCenter: 500,
      envelopeWidth: 5.0,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'ascending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  ohne: {
    name: 'Ohne Hüllkurve',
    description: 'Illusion bricht zusammen',
    config: {
      layerCount: 6,
      envelopeCenter: 500,
      envelopeWidth: 3.0,
      envelopeEnabled: false,
      speed: 0.1,
      direction: 'ascending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  absteigend: {
    name: 'Absteigend',
    description: 'Klassisch, aber absteigend',
    config: {
      layerCount: 6,
      envelopeCenter: 500,
      envelopeWidth: 3.0,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'descending',
      mode: 'continuous',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
  tonleiter: {
    name: 'Shepard-Tonleiter',
    description: 'Diskrete Halbtonschritte',
    config: {
      layerCount: 6,
      envelopeCenter: 500,
      envelopeWidth: 3.0,
      envelopeEnabled: true,
      speed: 0.1,
      direction: 'ascending',
      mode: 'discrete',
      stepInterval: 'semitone',
      stepRate: 1.0,
    },
  },
};

/** Keys in preset config that are compared for active preset detection */
const PRESET_CONFIG_KEYS = [
  'layerCount', 'envelopeCenter', 'envelopeWidth', 'envelopeEnabled',
  'speed', 'direction', 'mode', 'stepInterval', 'stepRate',
];

// ─── Callbacks ───────────────────────────────────────────────────────

/**
 * Callback references set by main.js for audio initialization and playback.
 * @type {{ initAudioFn: Function|null, startAudioFn: Function|null, startSchedulerFn: Function|null }}
 */
let audioCallbacks = {
  initAudioFn: null,
  startAudioFn: null,
  startSchedulerFn: null,
  audioInitialized: false,
};

/**
 * Register audio callbacks so presets can auto-start playback.
 * @param {object} callbacks
 * @param {Function} callbacks.initAudioFn - async initAudio()
 * @param {Function} callbacks.startAudioFn - async startAudio()
 * @param {Function} callbacks.startSchedulerFn - startScheduler()
 * @param {boolean} callbacks.audioInitialized - whether audio has been initialized
 */
export function registerAudioCallbacks(callbacks) {
  audioCallbacks = { ...audioCallbacks, ...callbacks };
}

/**
 * Check if audio has been initialized (updated externally).
 * @returns {boolean}
 */
export function isAudioInitialized() {
  return audioCallbacks.audioInitialized;
}

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Apply a preset by ID.
 * 1. Reset all layers (unmute, unsolo) via initializeLayers
 * 2. Apply all config values via setState
 * 3. Set activePreset
 * 4. Reset pitch offset
 * 5. If audio is initialized, rebuild oscillators
 * 6. Re-render layer list
 * 7. Auto-start playback if not already playing
 * @param {string} presetId - Key in PRESETS object
 */
export async function applyPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) {
    console.warn(`Unknown preset: ${presetId}`);
    return;
  }

  const config = preset.config;

  // 1. Reset all layers (unmute, unsolo) with new layer count
  initializeLayers(config.layerCount);

  // 2. Apply all config values to state
  setState({
    ...config,
    activePreset: presetId,
  });

  // 4. Reset pitch offset
  resetPitchOffset();

  // 5. If audio is initialized, rebuild oscillators for new layer count
  if (audioCallbacks.audioInitialized) {
    buildOscillators(config.layerCount);
    setNormalizerGain(config.layerCount);
  }

  // 6. Re-render layer list
  renderLayerList(config.layerCount);

  // 7. Auto-start playback if not already playing
  const state = getState();
  if (!state.isPlaying) {
    try {
      if (!audioCallbacks.audioInitialized && audioCallbacks.initAudioFn) {
        await audioCallbacks.initAudioFn();
        audioCallbacks.audioInitialized = true;
      }
      if (audioCallbacks.startAudioFn) {
        await audioCallbacks.startAudioFn();
      }
      if (audioCallbacks.startSchedulerFn) {
        audioCallbacks.startSchedulerFn();
      }
      setState({ isPlaying: true });
    } catch (err) {
      console.error('Failed to auto-start playback from preset:', err);
    }
  }

  console.log(`Preset applied: ${presetId} (${preset.name})`);
}

/**
 * Detect which preset (if any) matches the current state.
 * Compares all PRESET_CONFIG_KEYS against each preset's config.
 * @returns {string|null} Matching preset ID, or null if none match
 */
export function detectActivePreset() {
  const state = getState();

  for (const [presetId, preset] of Object.entries(PRESETS)) {
    const config = preset.config;
    let matches = true;

    for (const key of PRESET_CONFIG_KEYS) {
      if (state[key] !== config[key]) {
        matches = false;
        break;
      }
    }

    if (matches) return presetId;
  }

  return null;
}

// ─── UI Highlighting ─────────────────────────────────────────────────

/**
 * Update the visual highlighting of preset buttons.
 * Adds 'btn--active' class to the active preset button, removes from others.
 * @param {string|null} activePresetId
 */
function highlightPresetButton(activePresetId) {
  const buttons = document.querySelectorAll('[data-preset]');
  for (const btn of buttons) {
    const presetId = btn.getAttribute('data-preset');
    btn.classList.toggle('btn--active', presetId === activePresetId);
  }
}

// ─── Initialization ──────────────────────────────────────────────────

/** Flag to suppress deselection during preset application */
let applyingPreset = false;

/**
 * Initialize the preset system:
 * - Set up click handlers on preset buttons
 * - Subscribe to state changes for active preset highlighting
 * - Subscribe to config changes for auto-deselection
 */
export function initPresets() {
  // Set up click handlers on all preset buttons
  const buttons = document.querySelectorAll('[data-preset]');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const presetId = btn.getAttribute('data-preset');
      if (presetId) {
        applyingPreset = true;
        applyPreset(presetId).finally(() => {
          applyingPreset = false;
        });
      }
    });
  }

  // Subscribe to activePreset changes → update button highlighting
  subscribe(['activePreset'], (_changedKeys, state) => {
    highlightPresetButton(state.activePreset);
  });

  // Subscribe to config-relevant state changes → detect if preset is still active
  subscribe(PRESET_CONFIG_KEYS, () => {
    if (applyingPreset) return; // Don't deselect while applying a preset

    const state = getState();
    if (state.activePreset !== null) {
      const detected = detectActivePreset();
      if (detected !== state.activePreset) {
        setState({ activePreset: null });
      }
    }
  });

  // Set initial highlighting from state
  const state = getState();
  highlightPresetButton(state.activePreset);

  console.log('Preset system initialized');
}
