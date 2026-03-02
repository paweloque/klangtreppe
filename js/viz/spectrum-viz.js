/**
 * Klangtreppe — Frequency Spectrum Visualization
 * Shows vertical bars at each oscillator's frequency position
 * with a semi-transparent Gaussian envelope overlay.
 */

import { LAYER_COLORS, THEME } from '../constants.js';
import { gaussianAmplitude, bandwidthToSigma, freqToLog, formatFrequency } from '../utils.js';

/** Frequency grid lines for log-scale axis */
const FREQ_GRID_LINES = [100, 200, 500, 1000, 2000, 5000, 10000];

/** Margins */
const MARGIN_LEFT = 36;
const MARGIN_BOTTOM = 44;
const MARGIN_TOP = 10;
const MARGIN_RIGHT = 10;

/** Envelope curve samples */
const CURVE_SAMPLES = 200;

/** Min/max frequency range */
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

/** Bar width in pixels */
const BAR_WIDTH = 16;

/** Cap height on top of each bar */
const CAP_HEIGHT = 3;

/**
 * Draw the frequency grid and labels.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 */
function drawGrid(ctx, plotW, plotH) {
  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  ctx.strokeStyle = THEME.gridLine;
  ctx.lineWidth = 1;

  // Vertical frequency grid lines
  for (const freq of FREQ_GRID_LINES) {
    const x = freqToLog(freq, MIN_FREQ, MAX_FREQ) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, plotH);
    ctx.stroke();
  }

  // Horizontal amplitude grid lines at 25%, 50%, 75%, 100%
  const ampLines = [0.25, 0.5, 0.75, 1.0];
  for (const amp of ampLines) {
    const y = plotH - amp * plotH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotW, y);
    ctx.stroke();
  }

  // Frequency labels along bottom
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = THEME.gridLabel;

  for (const freq of FREQ_GRID_LINES) {
    const x = freqToLog(freq, MIN_FREQ, MAX_FREQ) * plotW;
    ctx.fillText(formatFrequency(freq), x, plotH + 6);
  }

  // Amplitude labels on left
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const amp of ampLines) {
    const y = plotH - amp * plotH;
    ctx.fillText(`${Math.round(amp * 100)}%`, -6, y);
  }

  ctx.restore();
}

/**
 * Draw the semi-transparent Gaussian envelope overlay.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 * @param {object} state
 */
function drawEnvelopeOverlay(ctx, plotW, plotH, state) {
  const { envelopeEnabled, envelopeCenter, envelopeWidth } = state;
  const sigma = bandwidthToSigma(envelopeWidth);

  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  if (envelopeEnabled) {
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
    ctx.strokeStyle = 'rgba(240, 165, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw frequency bars for each layer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 * @param {object} state
 */
function drawBars(ctx, plotW, plotH, state) {
  const { layers } = state;

  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer.currentFreq <= 0) continue;

    const color = LAYER_COLORS[i % LAYER_COLORS.length];
    const x = freqToLog(layer.currentFreq, MIN_FREQ, MAX_FREQ) * plotW;
    const barH = layer.currentAmp * plotH;
    const barX = x - BAR_WIDTH / 2;
    const barY = plotH - barH;

    // Skip if out of visible range
    if (barX + BAR_WIDTH < 0 || barX > plotW) continue;

    if (!layer.enabled) {
      ctx.globalAlpha = 0.2;
    }

    // Bar body
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, BAR_WIDTH, barH);

    // Bright cap on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(barX, barY, BAR_WIDTH, CAP_HEIGHT);

    // Frequency label below bar
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = THEME.gridLabel;
    ctx.fillText(formatFrequency(layer.currentFreq), x, plotH + 22);

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/**
 * Render the frequency spectrum visualization.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {object} state - Current application state
 */
export function renderSpectrum(ctx, width, height, state) {
  // Clear background
  ctx.fillStyle = THEME.vizBackground;
  ctx.fillRect(0, 0, width, height);

  const plotW = width - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - MARGIN_TOP - MARGIN_BOTTOM;

  if (plotW <= 0 || plotH <= 0) return;

  drawGrid(ctx, plotW, plotH);
  drawEnvelopeOverlay(ctx, plotW, plotH, state);
  drawBars(ctx, plotW, plotH, state);
}
