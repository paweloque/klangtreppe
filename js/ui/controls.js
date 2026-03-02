/**
 * Klangtreppe — UI Controls Module
 * Binds all playback and envelope controls to state with two-way binding:
 *   - Event listeners: UI → state
 *   - State subscriptions: state → UI
 */

import { LIMITS, DIRECTIONS, STEP_INTERVALS } from '../constants.js';
import {
  sliderToLogFreq,
  logFreqToSlider,
  formatFrequency,
  mapRange,
} from '../utils.js';
import { getState, setState, subscribe } from '../state.js';

// ─── Direction Controls ──────────────────────────────────────────────

/**
 * Set up the three direction radio-style buttons (ascending / descending / paused).
 * Buttons are identified by `data-direction` attribute inside the direction btn-group.
 */
function initDirectionControls() {
  const buttons = document.querySelectorAll('[data-direction]');

  // UI → state
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const dirKey = btn.getAttribute('data-direction');
      if (dirKey && DIRECTIONS[dirKey] !== undefined) {
        setState({ direction: DIRECTIONS[dirKey] });
      }
    });
  }

  // state → UI
  subscribe(['direction'], (_changedKeys, state) => {
    for (const btn of buttons) {
      const dirKey = btn.getAttribute('data-direction');
      const isActive = DIRECTIONS[dirKey] === state.direction;
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      btn.classList.toggle('btn--active', isActive);
    }
  });

  // Set initial UI from state
  const state = getState();
  for (const btn of buttons) {
    const dirKey = btn.getAttribute('data-direction');
    const isActive = DIRECTIONS[dirKey] === state.direction;
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    btn.classList.toggle('btn--active', isActive);
  }
}

// ─── Speed Slider ────────────────────────────────────────────────────

/**
 * Set up the speed slider (#slider-speed).
 * Linear mapping from slider 0–1 to LIMITS.minSpeed–LIMITS.maxSpeed.
 */
function initSpeedSlider() {
  const slider = document.getElementById('slider-speed');
  const display = document.getElementById('speed-value');
  if (!slider) return;

  /**
   * Convert slider position (0–1) to speed value.
   * @param {number} pos - Slider position 0–1
   * @returns {number} Speed in octaves/second
   */
  function sliderToSpeed(pos) {
    return mapRange(pos, 0, 1, LIMITS.minSpeed, LIMITS.maxSpeed);
  }

  /**
   * Convert speed value to slider position (0–1).
   * @param {number} speed - Speed in octaves/second
   * @returns {number} Slider position 0–1
   */
  function speedToSlider(speed) {
    return mapRange(speed, LIMITS.minSpeed, LIMITS.maxSpeed, 0, 1);
  }

  /**
   * Format speed for display.
   * @param {number} speed
   * @returns {string}
   */
  function formatSpeed(speed) {
    return `${speed.toFixed(2)} Okt/s`;
  }

  /**
   * Update the display and ARIA attributes for the speed slider.
   * @param {number} speed
   */
  function updateSpeedDisplay(speed) {
    const text = formatSpeed(speed);
    if (display) display.textContent = text;
    slider.setAttribute('aria-valuenow', speed.toFixed(3));
    slider.setAttribute('aria-valuetext', `${speed.toFixed(2)} Oktaven pro Sekunde`);
  }

  // UI → state
  slider.addEventListener('input', () => {
    const speed = sliderToSpeed(parseFloat(slider.value));
    setState({ speed });
    updateSpeedDisplay(speed);
  });

  // state → UI
  subscribe(['speed'], (_changedKeys, state) => {
    const pos = speedToSlider(state.speed);
    slider.value = pos.toString();
    updateSpeedDisplay(state.speed);
  });

  // Set initial UI from state
  const state = getState();
  slider.value = speedToSlider(state.speed).toString();
  updateSpeedDisplay(state.speed);
}

// ─── Freeze Button ───────────────────────────────────────────────────

/**
 * Set up the freeze toggle button (#btn-freeze).
 */
function initFreezeButton() {
  const btn = document.getElementById('btn-freeze');
  if (!btn) return;

  // UI → state
  btn.addEventListener('click', () => {
    setState({ isFrozen: !getState().isFrozen });
  });

  // state → UI
  subscribe(['isFrozen'], (_changedKeys, state) => {
    btn.setAttribute('aria-pressed', state.isFrozen ? 'true' : 'false');
    btn.classList.toggle('btn--active', state.isFrozen);
    btn.textContent = state.isFrozen ? '❄ Aufgetaut' : '❄ Einfrieren';
  });

  // Set initial UI from state
  const state = getState();
  btn.setAttribute('aria-pressed', state.isFrozen ? 'true' : 'false');
  btn.classList.toggle('btn--active', state.isFrozen);
}

// ─── Master Volume ───────────────────────────────────────────────────

/**
 * Set up the master volume slider (#slider-volume).
 * Range 0–1, maps directly to masterVolume 0.0–1.0.
 */
function initVolumeSlider() {
  const slider = document.getElementById('slider-volume');
  if (!slider) return;

  /**
   * Update ARIA attributes for the volume slider.
   * @param {number} volume - Volume 0–1
   */
  function updateVolumeAria(volume) {
    slider.setAttribute('aria-valuenow', volume.toFixed(2));
    slider.setAttribute('aria-valuetext', `${Math.round(volume * 100)}% Lautstärke`);
  }

  // UI → state
  slider.addEventListener('input', () => {
    const volume = parseFloat(slider.value);
    setState({ masterVolume: volume });
    updateVolumeAria(volume);
  });

  // state → UI
  subscribe(['masterVolume'], (_changedKeys, state) => {
    slider.value = state.masterVolume.toString();
    updateVolumeAria(state.masterVolume);
  });

  // Set initial UI from state
  const state = getState();
  slider.value = state.masterVolume.toString();
  updateVolumeAria(state.masterVolume);
}

// ─── Envelope Toggle ─────────────────────────────────────────────────

/**
 * Set up the envelope enable/disable checkbox (#chk-envelope).
 */
function initEnvelopeToggle() {
  const checkbox = document.getElementById('chk-envelope');
  if (!checkbox) return;

  // UI → state
  checkbox.addEventListener('change', () => {
    setState({ envelopeEnabled: checkbox.checked });
  });

  // state → UI
  subscribe(['envelopeEnabled'], (_changedKeys, state) => {
    checkbox.checked = state.envelopeEnabled;
    checkbox.setAttribute('aria-checked', state.envelopeEnabled ? 'true' : 'false');
  });

  // Set initial UI from state
  const state = getState();
  checkbox.checked = state.envelopeEnabled;
  checkbox.setAttribute('aria-checked', state.envelopeEnabled ? 'true' : 'false');
}

// ─── Envelope Center Frequency ───────────────────────────────────────

/**
 * Set up the envelope center frequency slider (#slider-env-center).
 * Logarithmic mapping from slider 0–1 to LIMITS.minEnvelopeCenter–LIMITS.maxEnvelopeCenter.
 */
function initEnvelopeCenterSlider() {
  const slider = document.getElementById('slider-env-center');
  const display = document.getElementById('env-center-value');
  if (!slider) return;

  /**
   * Update the display and ARIA attributes for the center frequency slider.
   * @param {number} freq - Center frequency in Hz
   */
  function updateCenterDisplay(freq) {
    const text = formatFrequency(freq);
    if (display) display.textContent = text;
    slider.setAttribute('aria-valuenow', Math.round(freq).toString());
    slider.setAttribute('aria-valuetext', text);
  }

  // UI → state
  slider.addEventListener('input', () => {
    const freq = sliderToLogFreq(
      parseFloat(slider.value),
      LIMITS.minEnvelopeCenter,
      LIMITS.maxEnvelopeCenter
    );
    setState({ envelopeCenter: freq });
    updateCenterDisplay(freq);
  });

  // state → UI
  subscribe(['envelopeCenter'], (_changedKeys, state) => {
    const pos = logFreqToSlider(
      state.envelopeCenter,
      LIMITS.minEnvelopeCenter,
      LIMITS.maxEnvelopeCenter
    );
    slider.value = pos.toString();
    updateCenterDisplay(state.envelopeCenter);
  });

  // Set initial UI from state
  const state = getState();
  const pos = logFreqToSlider(
    state.envelopeCenter,
    LIMITS.minEnvelopeCenter,
    LIMITS.maxEnvelopeCenter
  );
  slider.value = pos.toString();
  updateCenterDisplay(state.envelopeCenter);
}

// ─── Envelope Bandwidth ──────────────────────────────────────────────

/**
 * Set up the envelope bandwidth slider (#slider-env-width).
 * Linear mapping, slider min/max/step already set in HTML to match LIMITS.
 */
function initEnvelopeWidthSlider() {
  const slider = document.getElementById('slider-env-width');
  const display = document.getElementById('env-width-value');
  if (!slider) return;

  /**
   * Update the display and ARIA attributes for the bandwidth slider.
   * @param {number} width - Bandwidth in octaves
   */
  function updateWidthDisplay(width) {
    const text = `${width.toFixed(1)} Okt`;
    if (display) display.textContent = text;
    slider.setAttribute('aria-valuenow', width.toFixed(1));
    slider.setAttribute('aria-valuetext', `${width.toFixed(1)} Oktaven`);
  }

  // UI → state
  slider.addEventListener('input', () => {
    const width = parseFloat(slider.value);
    setState({ envelopeWidth: width });
    updateWidthDisplay(width);
  });

  // state → UI
  subscribe(['envelopeWidth'], (_changedKeys, state) => {
    slider.value = state.envelopeWidth.toString();
    updateWidthDisplay(state.envelopeWidth);
  });

  // Set initial UI from state
  const state = getState();
  slider.value = state.envelopeWidth.toString();
  updateWidthDisplay(state.envelopeWidth);
}

// ─── Mode Toggle ─────────────────────────────────────────────────────

/**
 * Set up the mode toggle buttons (continuous / discrete).
 * Buttons are identified by `data-mode` attribute.
 * Also controls visibility of the discrete options panel (#discrete-options).
 */
function initModeToggle() {
  const buttons = document.querySelectorAll('[data-mode]');
  const discreteOptions = document.getElementById('discrete-options');

  /**
   * Update the discrete options panel visibility based on mode.
   * @param {string} mode - 'continuous' or 'discrete'
   */
  function updateDiscreteVisibility(mode) {
    if (discreteOptions) {
      discreteOptions.hidden = mode !== 'discrete';
    }
  }

  // UI → state
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      if (mode) {
        setState({ mode });
      }
    });
  }

  // state → UI
  subscribe(['mode'], (_changedKeys, state) => {
    for (const btn of buttons) {
      const btnMode = btn.getAttribute('data-mode');
      const isActive = btnMode === state.mode;
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
      btn.classList.toggle('btn--active', isActive);
    }
    updateDiscreteVisibility(state.mode);
  });

  // Set initial UI from state
  const state = getState();
  for (const btn of buttons) {
    const btnMode = btn.getAttribute('data-mode');
    const isActive = btnMode === state.mode;
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    btn.classList.toggle('btn--active', isActive);
  }
  updateDiscreteVisibility(state.mode);
}

// ─── Step Interval Select ────────────────────────────────────────────

/**
 * Set up the step interval select (#select-interval).
 * Options: semitone (1/12), wholetone (2/12), minorthird (3/12).
 */
function initStepIntervalSelect() {
  const select = document.getElementById('select-interval');
  if (!select) return;

  // UI → state
  select.addEventListener('change', () => {
    const value = select.value;
    if (STEP_INTERVALS[value] !== undefined) {
      setState({ stepInterval: value });
    }
  });

  // state → UI
  subscribe(['stepInterval'], (_changedKeys, state) => {
    select.value = state.stepInterval;
  });

  // Set initial UI from state
  const state = getState();
  select.value = state.stepInterval;
}

// ─── Step Rate Slider ────────────────────────────────────────────────

/**
 * Set up the step rate slider (#slider-step-rate).
 * Range 0.5–4.0 steps per second.
 */
function initStepRateSlider() {
  const slider = document.getElementById('slider-step-rate');
  const display = document.getElementById('step-rate-value');
  if (!slider) return;

  /**
   * Format step rate for display.
   * @param {number} rate - Steps per second
   * @returns {string}
   */
  function formatStepRate(rate) {
    return `${rate.toFixed(1)} /s`;
  }

  /**
   * Update the display and ARIA attributes for the step rate slider.
   * @param {number} rate - Steps per second
   */
  function updateStepRateDisplay(rate) {
    const text = formatStepRate(rate);
    if (display) display.textContent = text;
    slider.setAttribute('aria-valuenow', rate.toFixed(1));
    slider.setAttribute('aria-valuetext', `${rate.toFixed(1)} Schritte pro Sekunde`);
  }

  // UI → state
  slider.addEventListener('input', () => {
    const rate = parseFloat(slider.value);
    setState({ stepRate: rate });
    updateStepRateDisplay(rate);
  });

  // state → UI
  subscribe(['stepRate'], (_changedKeys, state) => {
    slider.value = state.stepRate.toString();
    updateStepRateDisplay(state.stepRate);
  });

  // Set initial UI from state
  const state = getState();
  slider.value = state.stepRate.toString();
  updateStepRateDisplay(state.stepRate);
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Initialize all playback and envelope controls.
 * Sets up event listeners (UI → state) and state subscriptions (state → UI).
 */
export function initControls() {
  initDirectionControls();
  initSpeedSlider();
  initFreezeButton();
  initVolumeSlider();
  initEnvelopeToggle();
  initEnvelopeCenterSlider();
  initEnvelopeWidthSlider();
  initModeToggle();
  initStepIntervalSelect();
  initStepRateSlider();

  console.log('Controls initialized');
}
