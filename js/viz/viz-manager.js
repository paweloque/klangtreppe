/**
 * Klangtreppe — Visualization Manager
 * Manages the animation loop, canvas sizing, and tab switching
 * between the four visualization views.
 */

import { getState, setState, subscribe } from '../state.js';
import { debounce } from '../utils.js';
import { renderEnvelope } from './envelope-viz.js';
import { renderSpectrum } from './spectrum-viz.js';
import { renderSpiral } from './spiral-viz.js';
import { renderWaveform } from './waveform-viz.js';

/** @type {HTMLCanvasElement|null} */
let canvas = null;

/** @type {CanvasRenderingContext2D|null} */
let ctx = null;

/** @type {number} Current device pixel ratio */
let dpr = 1;

/** @type {number} Logical canvas width (CSS pixels) */
let logicalWidth = 0;

/** @type {number} Logical canvas height (CSS pixels) */
let logicalHeight = 0;

/** @type {number} Animation frame ID */
let animFrameId = 0;

/** Map of view IDs to render functions */
const renderers = {
  envelope: renderEnvelope,
  spectrum: renderSpectrum,
  spiral: renderSpiral,
  waveform: renderWaveform,
};

/**
 * Size the canvas to fill its container, accounting for devicePixelRatio.
 * Sets both the canvas buffer size and CSS display size.
 */
export function resizeCanvas() {
  if (!canvas || !ctx) return;

  const container = canvas.parentElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;

  logicalWidth = rect.width;
  logicalHeight = rect.height;

  // Set canvas buffer size (physical pixels)
  canvas.width = Math.round(logicalWidth * dpr);
  canvas.height = Math.round(logicalHeight * dpr);

  // Set CSS display size
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  // Scale context so drawing operations use logical (CSS) pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Update tab button states to reflect the active visualization.
 * @param {string} activeView - The active visualization ID
 */
function updateTabButtons(activeView) {
  const tabs = document.querySelectorAll('[data-view]');
  for (const tab of tabs) {
    const viewId = tab.getAttribute('data-view');
    const isActive = viewId === activeView;
    tab.setAttribute('aria-selected', String(isActive));
    tab.classList.toggle('btn--active', isActive);
  }

  // Update the tabpanel's aria-labelledby
  const panel = document.getElementById('viz-canvas');
  if (panel) {
    panel.setAttribute('aria-labelledby', `tab-${activeView}`);
  }
}

/**
 * Animation loop: reads current state and calls the active renderer.
 */
function animationLoop() {
  if (!ctx) return;

  const state = getState();
  const activeView = state.activeVisualization || 'envelope';
  const renderFn = renderers[activeView];

  if (renderFn) {
    renderFn(ctx, logicalWidth, logicalHeight, state);
  }

  animFrameId = requestAnimationFrame(animationLoop);
}

/**
 * Initialize the visualization system.
 * Sets up canvas, tab switching, and starts the animation loop.
 */
export function initVisualizations() {
  // Get canvas element
  canvas = document.getElementById('canvas');
  if (!canvas) {
    console.warn('Visualization canvas #canvas not found');
    return;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Could not get 2D context from canvas');
    return;
  }

  // Initial sizing
  resizeCanvas();

  // Set up tab switching
  const tabButtons = document.querySelectorAll('[data-view]');
  for (const btn of tabButtons) {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      if (viewId) {
        setState({ activeVisualization: viewId });
      }
    });
  }

  // Subscribe to activeVisualization changes to update tab UI
  subscribe(['activeVisualization'], (_changedKeys, state) => {
    updateTabButtons(state.activeVisualization);
  });

  // Set initial tab state
  updateTabButtons(getState().activeVisualization);

  // Handle window resize with debounce
  const debouncedResize = debounce(() => {
    resizeCanvas();
  }, 100);

  window.addEventListener('resize', debouncedResize);

  // Start animation loop
  animFrameId = requestAnimationFrame(animationLoop);

  console.log('Visualizations initialized');
}
