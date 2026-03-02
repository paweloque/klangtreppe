/**
 * Klangtreppe — Accessibility Utilities
 * Screen reader announcements, keyboard navigation enhancements.
 * Phase 8 implementation.
 */

import { subscribe, getState } from './state.js';

// ─── Screen Reader Announcements ─────────────────────────────────────

/** Timeout ID for clearing announcements */
let clearTimeout_ = null;

/**
 * Announce a message to screen readers via the aria-live region.
 * Clears after 1 second so repeated identical messages are re-announced.
 * @param {string} message - Text to announce
 */
export function announce(message) {
  const el = document.getElementById('sr-status');
  if (!el) return;

  // Clear any pending timeout
  if (clearTimeout_) {
    clearTimeout(clearTimeout_);
  }

  el.textContent = message;

  // Clear after a delay so repeated messages are announced
  clearTimeout_ = setTimeout(() => {
    el.textContent = '';
    clearTimeout_ = null;
  }, 1000);
}

// ─── Direction Labels ────────────────────────────────────────────────

const DIRECTION_LABELS = {
  ascending: 'Aufsteigend',
  descending: 'Absteigend',
  paused: 'Pause',
};

// ─── State Change Announcements ──────────────────────────────────────

/**
 * Wire up screen reader announcements for key state changes.
 * Should be called once during initialization.
 */
export function initAccessibilityAnnouncements() {
  // Play/Stop announcements
  subscribe(['isPlaying'], (_changedKeys, state) => {
    announce(state.isPlaying ? 'Wiedergabe gestartet' : 'Wiedergabe gestoppt');
  });

  // Direction change announcements
  subscribe(['direction'], (_changedKeys, state) => {
    const label = DIRECTION_LABELS[state.direction] || state.direction;
    announce(`Richtung: ${label}`);
  });

  // Preset loaded announcements
  subscribe(['activePreset'], (_changedKeys, state) => {
    if (state.activePreset) {
      // Capitalize first letter for display
      const name = state.activePreset.charAt(0).toUpperCase() + state.activePreset.slice(1);
      announce(`Preset ${name} geladen`);
    }
  });

  // Tutorial step announcements
  subscribe(['tutorialStep'], (_changedKeys, state) => {
    if (state.tutorialStep !== null && state.tutorialStep >= 0) {
      announce(`Tutorial Schritt ${state.tutorialStep + 1} von 5`);
    }
  });
}

// ─── Keyboard Navigation ─────────────────────────────────────────────

/**
 * Set up global keyboard shortcuts and navigation enhancements.
 * - Escape closes tutorial overlay
 * - Space/Enter on buttons (native, but ensure custom elements work)
 */
export function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Escape closes tutorial overlay
    if (e.key === 'Escape') {
      const overlay = document.getElementById('tutorial-overlay');
      if (overlay && !overlay.hidden) {
        const endBtn = document.getElementById('btn-tutorial-end');
        if (endBtn) {
          endBtn.click();
        }
        e.preventDefault();
      }
    }
  });

  // Ensure all role="radio" buttons respond to Space/Enter
  const radioButtons = document.querySelectorAll('[role="radio"]');
  for (const btn of radioButtons) {
    btn.setAttribute('tabindex', '0');
    btn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        btn.click();
      }
    });
  }

  // Ensure all role="tab" buttons respond to Arrow keys
  const tabList = document.querySelector('[role="tablist"]');
  if (tabList) {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
      tab.setAttribute('tabindex', '0');
      tab.addEventListener('keydown', (e) => {
        const tabArray = [...tabs];
        const currentIndex = tabArray.indexOf(e.target);

        let newIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          newIndex = (currentIndex + 1) % tabArray.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          newIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = tabArray.length - 1;
        }

        if (newIndex >= 0) {
          e.preventDefault();
          tabArray[newIndex].focus();
          tabArray[newIndex].click();
        }
      });
    }
  }
}

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Initialize all accessibility features.
 */
export function initAccessibility() {
  initAccessibilityAnnouncements();
  initKeyboardNavigation();
  console.log('Accessibility features initialized');
}
