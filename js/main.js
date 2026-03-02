/**
 * Klangtreppe — Application Entry Point
 * Bootstraps all modules, initializes state, and sets up event listeners.
 * Phase 4: Layer controls moved to js/ui/layers.js.
 * Phase 6: Visualization system added.
 * Phase 7: Presets & Tutorial systems added.
 * Phase 8: URL state, tooltips, accessibility.
 */

import {
  resetState,
  getState,
  setState,
  subscribe,
  initializeLayers,
} from './state.js';
import {
  initAudio,
  startAudio,
  stopAudio,
  setMasterVolume,
  buildOscillators,
  setNormalizerGain,
} from './audio-engine.js';
import { startScheduler, stopScheduler } from './scheduler.js';
import { initControls } from './ui/controls.js';
import { initLayers } from './ui/layers.js';
import { initVisualizations, resizeCanvas } from './viz/viz-manager.js';
import { initPresets, registerAudioCallbacks } from './presets.js';
import { initTutorial } from './ui/tutorial.js';
import { initURLState } from './url-state.js';
import { initTooltips } from './ui/tooltips.js';
import { initAccessibility } from './accessibility.js';

/** Whether initAudio() has been called at least once */
let audioInitialized = false;

/**
 * Handle play button click: initialize audio (once), start audio + scheduler.
 */
async function handlePlay() {
  const btnPlay = document.getElementById('btn-play');

  try {
    // Initialize AudioContext on first user interaction
    if (!audioInitialized) {
      await initAudio();
      audioInitialized = true;
      // Keep preset system in sync with audio initialization state
      registerAudioCallbacks({ audioInitialized: true });
    }

    await startAudio();
    startScheduler();
    setState({ isPlaying: true });
  } catch (err) {
    console.error('Failed to start audio:', err);
    if (btnPlay) {
      btnPlay.textContent = '▶ Abspielen';
      btnPlay.setAttribute('aria-label', 'Abspielen');
    }
  }
}

/**
 * Handle stop button click: stop scheduler, stop audio, update state.
 */
function handleStop() {
  stopScheduler();
  stopAudio();
  setState({ isPlaying: false });
}

/**
 * Initialize the application on DOMContentLoaded.
 */
function init() {
  // Initialize state with defaults
  resetState();
  initializeLayers(6);

  // Apply URL state before other initialization (overrides defaults)
  const urlState = initURLState();

  // Initialize all playback and envelope controls (UI ↔ state bindings)
  initControls();

  // Initialize layer controls (slider, list, solo/mute, real-time display)
  initLayers();

  // Initialize visualization system (canvas, tabs, animation loop)
  initVisualizations();

  // Register audio callbacks for preset system (so presets can auto-start playback)
  registerAudioCallbacks({
    initAudioFn: async () => {
      await initAudio();
      audioInitialized = true;
      registerAudioCallbacks({ audioInitialized: true });
    },
    startAudioFn: startAudio,
    startSchedulerFn: startScheduler,
    audioInitialized,
  });

  // Initialize preset system (buttons, active detection, highlighting)
  initPresets();

  // Initialize tutorial system (overlay, navigation, step execution)
  initTutorial();

  // Initialize tooltip system (hover tooltips on data-tooltip elements)
  initTooltips();

  // Initialize accessibility features (announcements, keyboard nav)
  initAccessibility();

  // Set up play/stop button
  const btnPlay = document.getElementById('btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      const state = getState();
      if (state.isPlaying) {
        handleStop();
      } else {
        handlePlay();
      }
    });
  }

  // Subscribe to isPlaying changes to update button text
  subscribe(['isPlaying'], (_changedKeys, state) => {
    if (btnPlay) {
      if (state.isPlaying) {
        btnPlay.textContent = '⏹ Stopp';
        btnPlay.setAttribute('aria-label', 'Stopp');
      } else {
        btnPlay.textContent = '▶ Abspielen';
        btnPlay.setAttribute('aria-label', 'Abspielen');
      }
    }
  });

  // Subscribe to masterVolume changes → update audio engine
  subscribe(['masterVolume'], (_changedKeys, state) => {
    setMasterVolume(state.masterVolume);
  });

  // Subscribe to layerCount changes → rebuild oscillators and normalizer
  // (Layer list re-rendering is handled in layers.js)
  subscribe(['layerCount'], (_changedKeys, state) => {
    if (audioInitialized && state.isPlaying) {
      buildOscillators(state.layerCount);
      setNormalizerGain(state.layerCount);
    }
  });

  // Handle window resize for canvas
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // Expose state API on window for console testing
  window.__klangtreppe = { getState, setState, subscribe };

  console.log('Klangtreppe initialized. State:', getState());
}

document.addEventListener('DOMContentLoaded', init);
