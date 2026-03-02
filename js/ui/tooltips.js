/**
 * Klangtreppe — Tooltip System
 * Shows tooltips on hover for elements with data-tooltip attribute.
 * Phase 8 implementation.
 */

/** @type {HTMLElement|null} */
let tooltipEl = null;

/** @type {number|null} */
let showTimeout = null;

/** @type {HTMLElement|null} */
let currentTarget = null;

/** Delay before showing tooltip (ms) */
const SHOW_DELAY = 400;

/** Touch state tracking */
let touchActive = false;

// ─── Positioning ─────────────────────────────────────────────────────

/**
 * Position the tooltip near the target element.
 * Prefers above the element; falls back to below if near top of viewport.
 * @param {HTMLElement} target - The element to position near
 */
function positionTooltip(target) {
  if (!tooltipEl) return;

  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();

  // Horizontal: center on target, clamp to viewport
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

  // Vertical: prefer above, fall back to below
  const spaceAbove = rect.top;
  const tooltipHeight = tooltipRect.height;
  const gap = 8;

  let top;
  let below = false;

  if (spaceAbove >= tooltipHeight + gap + 8) {
    // Position above
    top = rect.top - tooltipHeight - gap;
  } else {
    // Position below
    top = rect.bottom + gap;
    below = true;
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;

  // Update arrow direction
  tooltipEl.classList.toggle('tooltip--below', below);
}

// ─── Show / Hide ─────────────────────────────────────────────────────

/**
 * Show the tooltip for a target element.
 * @param {HTMLElement} target
 */
function showTooltip(target) {
  if (!tooltipEl) return;

  const text = target.getAttribute('data-tooltip');
  if (!text) return;

  currentTarget = target;
  tooltipEl.textContent = text;
  tooltipEl.removeAttribute('hidden');

  // Position after making visible (need dimensions)
  requestAnimationFrame(() => {
    positionTooltip(target);
  });
}

/**
 * Hide the tooltip.
 */
function hideTooltip() {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }

  if (tooltipEl) {
    tooltipEl.setAttribute('hidden', '');
  }

  currentTarget = null;
}

// ─── Event Handlers ──────────────────────────────────────────────────

/**
 * Handle mouseenter on a tooltip target.
 * @param {MouseEvent} e
 */
function handleMouseEnter(e) {
  if (touchActive) return; // Ignore mouse events on touch devices

  const target = e.currentTarget;
  if (!target.getAttribute('data-tooltip')) return;

  // Delay before showing
  showTimeout = setTimeout(() => {
    showTooltip(target);
  }, SHOW_DELAY);
}

/**
 * Handle mouseleave on a tooltip target.
 */
function handleMouseLeave() {
  hideTooltip();
}

/**
 * Handle touchstart for touch device support.
 * First tap shows tooltip, second tap hides it.
 * @param {TouchEvent} e
 */
function handleTouchStart(e) {
  touchActive = true;
  const target = e.currentTarget;

  if (currentTarget === target) {
    // Second tap: hide
    hideTooltip();
  } else {
    // First tap: show
    hideTooltip();
    showTooltip(target);
  }
}

/**
 * Handle focus for keyboard accessibility.
 * @param {FocusEvent} e
 */
function handleFocus(e) {
  const target = e.currentTarget;
  if (!target.getAttribute('data-tooltip')) return;

  showTimeout = setTimeout(() => {
    showTooltip(target);
  }, SHOW_DELAY);
}

/**
 * Handle blur for keyboard accessibility.
 */
function handleBlur() {
  hideTooltip();
}

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Initialize the tooltip system.
 * Finds all elements with data-tooltip and attaches event listeners.
 */
export function initTooltips() {
  tooltipEl = document.getElementById('tooltip');
  if (!tooltipEl) {
    console.warn('Tooltip element #tooltip not found');
    return;
  }

  // Find all elements with data-tooltip
  const targets = document.querySelectorAll('[data-tooltip]');

  for (const target of targets) {
    // Mouse events
    target.addEventListener('mouseenter', handleMouseEnter);
    target.addEventListener('mouseleave', handleMouseLeave);

    // Touch events
    target.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Keyboard focus events
    target.addEventListener('focus', handleFocus);
    target.addEventListener('blur', handleBlur);
  }

  // Hide tooltip when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (currentTarget && !currentTarget.contains(e.target) && e.target !== tooltipEl) {
      hideTooltip();
    }
  });

  // Hide tooltip on scroll
  document.addEventListener('scroll', hideTooltip, { passive: true, capture: true });

  console.log(`Tooltip system initialized (${targets.length} targets)`);
}
