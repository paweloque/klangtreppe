/**
 * Klangtreppe — Tutorial System
 * Guided 5-step tutorial that demonstrates the Shepard tone illusion.
 * Phase 7 implementation.
 */

import { getState, setState, subscribe, updateLayer } from '../state.js';
import { applyPreset } from '../presets.js';

// ─── Tutorial Step Definitions ───────────────────────────────────────

/**
 * The 5 tutorial steps.
 * Each step has an id, title, text, and a setup function that configures
 * the audio/state for that step.
 */
const TUTORIAL_STEPS = [
  {
    id: 'listen',
    title: 'Schritt 1: Hör zu',
    text: 'Drücke Play und höre genau hin. Steigt der Ton wirklich immer weiter an? Oder täuscht dich dein Gehör?',
    setup: () => {
      // Apply classic preset and start playing
      applyPreset('klassisch');
    },
  },
  {
    id: 'single',
    title: 'Schritt 2: Eine einzelne Schicht',
    text: 'Jetzt hörst du nur eine einzelne Schicht. Achte auf den Moment, wenn die Frequenz springt — das ist der Oktavsprung, den die Illusion normalerweise versteckt.',
    setup: () => {
      applyPreset('klassisch');
      // Set visualization to envelope view
      setState({ activeVisualization: 'envelope' });
      // Solo layer 3 (index 2) — middle layer, most audible
      const state = getState();
      for (let i = 0; i < state.layerCount; i++) {
        updateLayer(i, { soloed: i === 2 });
      }
    },
  },
  {
    id: 'all-layers',
    title: 'Schritt 3: Alle Schichten',
    text: 'Jetzt hörst du alle Schichten gleichzeitig, aber ohne die Lautstärke-Hüllkurve. Du kannst die Oktavsprünge hören!',
    setup: () => {
      applyPreset('ohne'); // Without envelope
      // Unsolo all layers, ensure all enabled
      const state = getState();
      for (let i = 0; i < state.layerCount; i++) {
        updateLayer(i, { soloed: false, enabled: true });
      }
    },
  },
  {
    id: 'envelope',
    title: 'Schritt 4: Die Hüllkurve',
    text: 'Jetzt wird die Hüllkurve aktiviert. Sie blendet die Schichten sanft ein und aus — und die Sprünge verschwinden! Die Illusion ist perfekt.',
    setup: () => {
      applyPreset('klassisch');
      setState({ activeVisualization: 'envelope' });
    },
  },
  {
    id: 'experiment',
    title: 'Schritt 5: Experimentiere!',
    text: 'Jetzt bist du dran! Verändere die Parameter und beobachte, wie sich der Klang und die Visualisierung ändern. Versuche die Hüllkurve ein- und auszuschalten.',
    setup: () => {
      // Don't change anything — let user explore
    },
  },
];

// ─── DOM References ──────────────────────────────────────────────────

/** @type {HTMLElement|null} */
let overlayEl = null;
/** @type {HTMLElement|null} */
let stepLabelEl = null;
/** @type {HTMLElement|null} */
let titleEl = null;
/** @type {HTMLElement|null} */
let textEl = null;
/** @type {HTMLButtonElement|null} */
let prevBtn = null;
/** @type {HTMLButtonElement|null} */
let nextBtn = null;
/** @type {HTMLButtonElement|null} */
let endBtn = null;

/** Current tutorial step index (-1 = not active) */
let currentStep = -1;

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Start the tutorial at step 0.
 */
export function startTutorial() {
  currentStep = 0;
  showStep(currentStep);
  showOverlay(true);
  console.log('Tutorial started');
}

/**
 * End the tutorial, hide overlay, reset tutorial state.
 */
export function endTutorial() {
  currentStep = -1;
  showOverlay(false);
  setState({ tutorialStep: null });
  console.log('Tutorial ended');
}

/**
 * Go to a specific tutorial step.
 * @param {number} stepIndex - Index into TUTORIAL_STEPS
 */
function goToStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= TUTORIAL_STEPS.length) return;
  currentStep = stepIndex;
  showStep(currentStep);
}

/**
 * Show a tutorial step: update overlay content and execute setup.
 * @param {number} stepIndex
 */
function showStep(stepIndex) {
  const step = TUTORIAL_STEPS[stepIndex];
  if (!step) return;

  // Update state
  setState({ tutorialStep: stepIndex });

  // Update overlay content
  if (stepLabelEl) {
    stepLabelEl.textContent = `Schritt ${stepIndex + 1} von ${TUTORIAL_STEPS.length}`;
  }
  if (titleEl) {
    titleEl.textContent = step.title;
  }
  if (textEl) {
    textEl.textContent = step.text;
  }

  // Update navigation buttons
  updateNavButtons(stepIndex);

  // Execute step setup (configures audio/state)
  try {
    step.setup();
  } catch (err) {
    console.error(`Tutorial step ${stepIndex} setup error:`, err);
  }
}

/**
 * Update navigation button visibility and text.
 * @param {number} stepIndex
 */
function updateNavButtons(stepIndex) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  // Back button: disabled on first step
  if (prevBtn) {
    prevBtn.disabled = isFirst;
    prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';
  }

  // Next button: changes text on last step
  if (nextBtn) {
    nextBtn.textContent = isLast ? 'Fertig! ✓' : 'Weiter →';
  }
}

/**
 * Show or hide the tutorial overlay.
 * @param {boolean} visible
 */
function showOverlay(visible) {
  if (!overlayEl) return;

  if (visible) {
    overlayEl.removeAttribute('hidden');
  } else {
    overlayEl.setAttribute('hidden', '');
  }
}

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Initialize the tutorial system:
 * - Cache DOM references
 * - Set up tutorial button click handler
 * - Set up navigation button handlers
 * - Subscribe to tutorialStep state for overlay visibility
 */
export function initTutorial() {
  // Cache DOM references
  overlayEl = document.getElementById('tutorial-overlay');
  stepLabelEl = document.getElementById('tutorial-step-label');
  titleEl = document.getElementById('tutorial-title');
  textEl = document.getElementById('tutorial-text');
  prevBtn = document.getElementById('btn-tutorial-prev');
  nextBtn = document.getElementById('btn-tutorial-next');
  endBtn = document.getElementById('btn-tutorial-end');

  // Tutorial start button in header
  const tutorialBtn = document.getElementById('btn-tutorial');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => {
      startTutorial();
    });
  }

  // Navigation: Back
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        goToStep(currentStep - 1);
      }
    });
  }

  // Navigation: Next / Finish
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < TUTORIAL_STEPS.length - 1) {
        goToStep(currentStep + 1);
      } else {
        // Last step → end tutorial
        endTutorial();
      }
    });
  }

  // Navigation: End (close at any point)
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      endTutorial();
    });
  }

  // Subscribe to tutorialStep state for overlay visibility sync
  subscribe(['tutorialStep'], (_changedKeys, state) => {
    const isActive = state.tutorialStep !== null && state.tutorialStep >= 0;
    showOverlay(isActive);
  });

  console.log('Tutorial system initialized');
}
