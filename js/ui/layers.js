/**
 * Klangtreppe — Layer Controls Module
 * Manages the layer count slider, dynamic layer list rendering,
 * solo/mute buttons, and real-time frequency/amplitude display.
 * Phase 4 implementation.
 */

import { LAYER_COLORS, LIMITS } from '../constants.js';
import { formatFrequency } from '../utils.js';
import {
  getState,
  setState,
  subscribe,
  updateLayer,
  initializeLayers,
} from '../state.js';
import {
  buildOscillators,
  setNormalizerGain,
  destroyOscillators,
} from '../audio-engine.js';

// ─── Module State ────────────────────────────────────────────────────

/** @type {number|null} requestAnimationFrame handle for layer display updates */
let rafId = null;

/** Whether a layer display update is pending */
let displayUpdatePending = false;

// ─── Layer Count Slider ──────────────────────────────────────────────

/**
 * Set up the layer count slider (#slider-layers).
 * Range: LIMITS.minLayers (3) to LIMITS.maxLayers (8).
 * On change: update state, reinitialize layers, re-render, rebuild audio if playing.
 */
function initLayerCountSlider() {
  const slider = document.getElementById('slider-layers');
  const display = document.getElementById('layers-value');
  if (!slider) return;

  /**
   * Update the display and ARIA attributes for the layer count slider.
   * @param {number} count
   */
  function updateLayerCountDisplay(count) {
    if (display) display.textContent = count.toString();
    slider.setAttribute('aria-valuenow', count.toString());
    slider.setAttribute('aria-valuetext', `${count} Schichten`);
  }

  // UI → state
  slider.addEventListener('input', () => {
    const newCount = parseInt(slider.value, 10);
    if (isNaN(newCount)) return;

    // Update state and reinitialize layers
    initializeLayers(newCount);

    // Re-render the layer list
    renderLayerList(newCount);

    // Rebuild oscillators if currently playing
    const state = getState();
    if (state.isPlaying) {
      destroyOscillators();
      buildOscillators(state.layerCount);
      setNormalizerGain(state.layerCount);
    }

    updateLayerCountDisplay(newCount);
  });

  // state → UI (two-way binding for external changes, e.g. presets)
  subscribe(['layerCount'], (_changedKeys, state) => {
    slider.value = state.layerCount.toString();
    updateLayerCountDisplay(state.layerCount);
  });

  // Set initial UI from state
  const state = getState();
  slider.value = state.layerCount.toString();
  updateLayerCountDisplay(state.layerCount);
}

// ─── Layer List Rendering ────────────────────────────────────────────

/**
 * Render the layer list in the sidebar.
 * Creates layer items with color indicators, name, solo/mute buttons,
 * frequency display, and amplitude bar.
 * @param {number} [count] - Number of layers to render (defaults to state.layerCount)
 */
export function renderLayerList(count) {
  const container = document.getElementById('layer-list');
  if (!container) return;

  const state = getState();
  const layerCount = count !== undefined ? count : state.layerCount;

  container.innerHTML = '';

  for (let i = 0; i < layerCount; i++) {
    const layer = state.layers[i];
    const color = LAYER_COLORS[i] || '#999999';
    const isMuted = layer ? !layer.enabled : false;
    const isSoloed = layer ? layer.soloed : false;

    const item = document.createElement('div');
    item.className = 'layer-item';
    if (isMuted) item.classList.add('layer-item--muted');
    item.setAttribute('role', 'listitem');
    item.setAttribute('data-layer-index', i.toString());

    item.innerHTML = `
      <span class="layer-item__color" style="background: ${color}"></span>
      <span class="layer-item__name">Schicht ${i + 1}</span>
      <button class="btn btn--icon btn--solo"
              data-action="solo" data-layer="${i}"
              aria-pressed="${isSoloed ? 'true' : 'false'}"
              aria-label="Solo Schicht ${i + 1}">S</button>
      <button class="btn btn--icon btn--mute"
              data-action="mute" data-layer="${i}"
              aria-pressed="${isMuted ? 'true' : 'false'}"
              aria-label="Stumm Schicht ${i + 1}">M</button>
      <span class="layer-item__freq" id="layer-freq-${i}">— Hz</span>
      <div class="layer-item__amp-bar">
        <div class="layer-item__amp-fill" id="layer-amp-${i}"
             style="width: 0%; background: ${color}"></div>
      </div>
    `;

    container.appendChild(item);
  }
}

// ─── Event Delegation for Solo/Mute ─────────────────────────────────

/**
 * Set up event delegation on #layer-list for solo and mute button clicks.
 */
function initLayerListEvents() {
  const container = document.getElementById('layer-list');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const layerIndex = parseInt(btn.getAttribute('data-layer'), 10);
    if (isNaN(layerIndex)) return;

    const state = getState();
    const layer = state.layers[layerIndex];
    if (!layer) return;

    if (action === 'solo') {
      updateLayer(layerIndex, { soloed: !layer.soloed });
    } else if (action === 'mute') {
      updateLayer(layerIndex, { enabled: !layer.enabled });
    }
  });
}

// ─── Real-time Display Updates ───────────────────────────────────────

/**
 * Update the layer list display with current frequencies, amplitudes,
 * and solo/mute button states.
 * Uses requestAnimationFrame to batch DOM writes and avoid excessive updates.
 */
function scheduleDisplayUpdate() {
  if (displayUpdatePending) return;
  displayUpdatePending = true;

  rafId = requestAnimationFrame(() => {
    displayUpdatePending = false;
    performDisplayUpdate();
  });
}

/**
 * Perform the actual DOM update for layer displays.
 */
function performDisplayUpdate() {
  const state = getState();

  for (let i = 0; i < state.layerCount; i++) {
    const layer = state.layers[i];

    // Update frequency display
    const freqEl = document.getElementById(`layer-freq-${i}`);
    if (freqEl) {
      freqEl.textContent = layer.currentFreq > 0
        ? formatFrequency(layer.currentFreq)
        : '— Hz';
    }

    // Update amplitude bar
    const ampEl = document.getElementById(`layer-amp-${i}`);
    if (ampEl) {
      ampEl.style.width = `${Math.round(layer.currentAmp * 100)}%`;
    }

    // Update solo/mute button states
    const layerItem = document.querySelector(`[data-layer-index="${i}"]`);
    if (layerItem) {
      // Solo button
      const soloBtn = layerItem.querySelector('[data-action="solo"]');
      if (soloBtn) {
        soloBtn.setAttribute('aria-pressed', layer.soloed ? 'true' : 'false');
      }

      // Mute button
      const muteBtn = layerItem.querySelector('[data-action="mute"]');
      if (muteBtn) {
        muteBtn.setAttribute('aria-pressed', !layer.enabled ? 'true' : 'false');
      }

      // Dimmed styling for muted layers
      layerItem.classList.toggle('layer-item--muted', !layer.enabled);
    }
  }
}

/**
 * Subscribe to layer state changes and schedule display updates.
 */
function initLayerDisplaySubscription() {
  subscribe(['layers'], () => {
    scheduleDisplayUpdate();
  });
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Initialize all layer controls:
 * - Layer count slider with two-way binding
 * - Initial layer list rendering
 * - Event delegation for solo/mute buttons
 * - Real-time display update subscription
 */
export function initLayers() {
  initLayerCountSlider();
  renderLayerList();
  initLayerListEvents();
  initLayerDisplaySubscription();

  console.log('Layer controls initialized');
}
