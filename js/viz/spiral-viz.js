/**
 * Klangtreppe — Spiral / Barber Pole Visualization
 * Circular display where one rotation = one octave.
 * Dots rotate clockwise (ascending) or counterclockwise (descending).
 */

import { LAYER_COLORS, THEME, PITCH_CLASSES } from '../constants.js';

/** Reference frequency for pitch class calculation (C4 = 261.63 Hz) */
const REF_FREQ = 261.63;

/**
 * Calculate pitch class (0–12 continuous) from frequency.
 * @param {number} freq - Frequency in Hz
 * @returns {number} Pitch class 0–12 (fractional)
 */
function freqToPitchClass(freq) {
  if (freq <= 0) return 0;
  const semitones = 12 * Math.log2(freq / REF_FREQ);
  // Modulo 12, always positive
  return ((semitones % 12) + 12) % 12;
}

/**
 * Draw pitch class labels around the perimeter.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - Center x
 * @param {number} cy - Center y
 * @param {number} radius - Circle radius
 */
function drawPitchLabels(ctx, cx, cy, radius) {
  ctx.save();
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = THEME.gridLabel;

  const labelRadius = radius + 22;

  for (let i = 0; i < 12; i++) {
    // Start from top (12 o'clock = C), going clockwise
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(angle) * labelRadius;
    const ly = cy + Math.sin(angle) * labelRadius;
    ctx.fillText(PITCH_CLASSES[i], lx, ly);
  }

  ctx.restore();
}

/**
 * Draw the main circle and octave tick marks.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 */
function drawCircle(ctx, cx, cy, radius) {
  ctx.save();

  // Main circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tick marks at each pitch class position
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const innerR = radius - 8;
    const outerR = radius + 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Inner concentric rings for octave reference
  const innerRings = [0.3, 0.55, 0.8];
  for (const frac of innerRings) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * frac, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw layer dots on the circle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {object} state
 */
function drawLayerDots(ctx, cx, cy, radius, state) {
  const { layers } = state;

  ctx.save();

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer.currentFreq <= 0) continue;

    // Skip dots that are effectively silent — prevents visible jumping
    // when a layer wraps from one end of the frequency range to the other
    if (layer.currentAmp < 0.02) continue;

    const color = LAYER_COLORS[i % LAYER_COLORS.length];
    const pitchClass = freqToPitchClass(layer.currentFreq);

    // Angle: start from top (12 o'clock), clockwise
    const angle = (pitchClass / 12) * Math.PI * 2 - Math.PI / 2;

    // Place dot on the circle
    const dotX = cx + Math.cos(angle) * radius;
    const dotY = cy + Math.sin(angle) * radius;

    // Dot size proportional to amplitude (8–16px)
    const dotRadius = 8 + layer.currentAmp * 8;

    if (!layer.enabled) {
      // Muted: hollow dimmed dot, opacity driven by amplitude
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.25 * layer.currentAmp;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Active: filled with glow, opacity driven by amplitude
      // This ensures dots fade out smoothly at envelope edges
      const ampAlpha = layer.currentAmp;

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 14 * ampAlpha;

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = ampAlpha;
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // White highlight — also fades with amplitude
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * ampAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draw a direction indicator arrow.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {string} direction - 'ascending', 'descending', or 'paused'
 */
function drawDirectionIndicator(ctx, cx, cy, radius, direction) {
  if (direction === 'paused') return;

  ctx.save();

  const arrowRadius = radius + 40;
  // Place arrow at the 2 o'clock position
  const baseAngle = -Math.PI / 6;

  const ax = cx + Math.cos(baseAngle) * arrowRadius;
  const ay = cy + Math.sin(baseAngle) * arrowRadius;

  ctx.translate(ax, ay);

  // Clockwise for ascending, counterclockwise for descending
  const arrowAngle = direction === 'ascending' ? baseAngle + Math.PI / 2 : baseAngle - Math.PI / 2;
  ctx.rotate(arrowAngle);

  // Draw arrow
  const size = 8;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.5, -size * 0.6);
  ctx.lineTo(-size * 0.5, size * 0.6);
  ctx.closePath();

  ctx.fillStyle = THEME.accent;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/**
 * Render the spiral visualization.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} state
 */
export function renderSpiral(ctx, width, height, state) {
  // Clear background
  ctx.fillStyle = THEME.vizBackground;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  if (radius < 20) return;

  drawCircle(ctx, cx, cy, radius);
  drawPitchLabels(ctx, cx, cy, radius);
  drawLayerDots(ctx, cx, cy, radius, state);
  drawDirectionIndicator(ctx, cx, cy, radius, state.direction);
}
