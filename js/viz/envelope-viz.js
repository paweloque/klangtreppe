/**
 * Klangtreppe — Spectral Envelope Visualization
 * Shows the Gaussian bell curve with animated layer dots.
 * Default visualization view.
 */

import { LAYER_COLORS, THEME } from '../constants.js';
import { gaussianAmplitude, bandwidthToSigma, freqToLog, formatFrequency } from '../utils.js';

/** Frequency grid lines for log-scale axis */
const FREQ_GRID_LINES = [100, 200, 500, 1000, 2000, 5000, 10000];

/** Amplitude grid lines (fraction of 1.0) */
const AMP_GRID_LINES = [0.25, 0.5, 0.75, 1.0];

/** Margins for axis labels */
const MARGIN_LEFT = 36;
const MARGIN_BOTTOM = 44;
const MARGIN_TOP = 10;
const MARGIN_RIGHT = 10;

/** Number of sample points for the envelope curve */
const CURVE_SAMPLES = 200;

/** Min/max frequency range for the visualization */
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

/**
 * Draw the frequency/amplitude grid and axis labels.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW - Plot area width
 * @param {number} plotH - Plot area height
 */
function drawGrid(ctx, plotW, plotH) {
  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  // Grid lines
  ctx.strokeStyle = THEME.gridLine;
  ctx.lineWidth = 1;

  // Horizontal amplitude grid lines
  for (const amp of AMP_GRID_LINES) {
    const y = plotH - amp * plotH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotW, y);
    ctx.stroke();
  }

  // Vertical frequency grid lines
  for (const freq of FREQ_GRID_LINES) {
    const x = freqToLog(freq, MIN_FREQ, MAX_FREQ) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, plotH);
    ctx.stroke();
  }

  // Axis labels
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = THEME.gridLabel;

  // Frequency labels along bottom
  for (const freq of FREQ_GRID_LINES) {
    const x = freqToLog(freq, MIN_FREQ, MAX_FREQ) * plotW;
    ctx.fillText(formatFrequency(freq), x, plotH + 6);
  }

  // Amplitude labels on left
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const amp of AMP_GRID_LINES) {
    const y = plotH - amp * plotH;
    ctx.fillText(`${Math.round(amp * 100)}%`, -6, y);
  }

  ctx.restore();
}

/**
 * Draw the Gaussian envelope curve (filled area + stroke).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 * @param {object} state
 */
function drawEnvelopeCurve(ctx, plotW, plotH, state) {
  const { envelopeEnabled, envelopeCenter, envelopeWidth } = state;
  const sigma = bandwidthToSigma(envelopeWidth);

  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  if (envelopeEnabled) {
    // Sample points along log-frequency axis
    ctx.beginPath();
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const t = i / CURVE_SAMPLES;
      const freq = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, t);
      const amp = gaussianAmplitude(freq, envelopeCenter, sigma);
      const x = t * plotW;
      const y = plotH - amp * plotH;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Close the path for fill (down to bottom, back to start)
    ctx.lineTo(plotW, plotH);
    ctx.lineTo(0, plotH);
    ctx.closePath();

    // Fill with semi-transparent accent
    ctx.fillStyle = THEME.envelopeFill;
    ctx.fill();

    // Stroke the curve on top
    ctx.beginPath();
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const t = i / CURVE_SAMPLES;
      const freq = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, t);
      const amp = gaussianAmplitude(freq, envelopeCenter, sigma);
      const x = t * plotW;
      const y = plotH - amp * plotH;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = THEME.envelopeStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Envelope disabled: flat line at full amplitude
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(plotW, 0);
    ctx.strokeStyle = THEME.envelopeStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill below the line
    ctx.fillStyle = THEME.envelopeFill;
    ctx.fillRect(0, 0, plotW, plotH);
  }

  ctx.restore();
}

/**
 * Draw animated layer marker dots on the envelope curve.
 * Dots use currentAmp as opacity so they naturally fade out at the
 * envelope edges (near the octave wrap point) and fade in as they
 * move toward the center. This prevents visible "jumping" when a
 * layer wraps from one end of the frequency range to the other.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 * @param {object} state
 */
function drawLayerMarkers(ctx, plotW, plotH, state) {
  const { layers } = state;

  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer.currentFreq <= 0) continue;

    // Skip dots that are effectively silent — they're at the wrap point
    // and would just show a distracting jump
    if (layer.currentAmp < 0.02) continue;

    const x = freqToLog(layer.currentFreq, MIN_FREQ, MAX_FREQ) * plotW;
    const y = plotH - layer.currentAmp * plotH;
    const radius = 7;
    const color = LAYER_COLORS[i % LAYER_COLORS.length];

    // Skip if out of visible range
    if (x < -radius || x > plotW + radius) continue;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (!layer.enabled) {
      // Muted: draw hollow/dimmed
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3 * layer.currentAmp;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Active: filled with glow, opacity driven by amplitude
      // This ensures dots fade out smoothly at envelope edges
      const ampAlpha = layer.currentAmp;

      // Glow effect — scales with amplitude
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * ampAlpha;

      ctx.fillStyle = color;
      ctx.globalAlpha = ampAlpha;
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // White highlight ring — also fades with amplitude
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * ampAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Render the spectral envelope visualization.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width (in CSS pixels, already scaled for DPR)
 * @param {number} height - Canvas height
 * @param {object} state - Current application state
 */
export function renderEnvelope(ctx, width, height, state) {
  // Clear background
  ctx.fillStyle = THEME.vizBackground;
  ctx.fillRect(0, 0, width, height);

  // Calculate plot area
  const plotW = width - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - MARGIN_TOP - MARGIN_BOTTOM;

  if (plotW <= 0 || plotH <= 0) return;

  drawGrid(ctx, plotW, plotH);
  drawEnvelopeCurve(ctx, plotW, plotH, state);
  drawLayerMarkers(ctx, plotW, plotH, state);
}
