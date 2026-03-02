/**
 * Klangtreppe — Waveform Display Visualization
 * Real-time time-domain waveform from AnalyserNode.
 */

import { THEME } from '../constants.js';
import { getAnalyserNode } from '../audio-engine.js';

/** Pre-allocated buffer for time-domain data (reused across frames) */
let dataArray = null;

/** Amplitude grid lines */
const AMP_GRID_VALUES = [0.5, 0, -0.5];

/** Margins */
const MARGIN_LEFT = 36;
const MARGIN_RIGHT = 10;
const MARGIN_TOP = 10;
const MARGIN_BOTTOM = 20;

/**
 * Ensure the data array is allocated and sized correctly for the analyser.
 * @param {AnalyserNode|null} analyser
 */
function ensureDataArray(analyser) {
  if (!analyser) return;
  const needed = analyser.fftSize;
  if (!dataArray || dataArray.length !== needed) {
    dataArray = new Uint8Array(needed);
  }
}

/**
 * Draw the grid: center line and amplitude reference lines.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 */
function drawGrid(ctx, plotW, plotH) {
  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  ctx.strokeStyle = THEME.gridLine;
  ctx.lineWidth = 1;

  // Horizontal grid lines at +0.5, 0, -0.5
  for (const amp of AMP_GRID_VALUES) {
    // Map amplitude (-1 to +1) to y coordinate
    const y = (1 - amp) * plotH / 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotW, y);
    ctx.stroke();
  }

  // Center line (amplitude = 0) — slightly brighter
  const centerY = plotH / 2;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(plotW, centerY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Amplitude labels on left
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = THEME.gridLabel;

  const labels = [
    { value: 1.0, label: '+1.0' },
    { value: 0.5, label: '+0.5' },
    { value: 0.0, label: '0' },
    { value: -0.5, label: '−0.5' },
    { value: -1.0, label: '−1.0' },
  ];

  for (const { value, label } of labels) {
    const y = (1 - value) * plotH / 2;
    ctx.fillText(label, -6, y);
  }

  ctx.restore();
}

/**
 * Draw the waveform from AnalyserNode time-domain data.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} plotW
 * @param {number} plotH
 */
function drawWaveform(ctx, plotW, plotH) {
  const analyser = getAnalyserNode();

  ctx.save();
  ctx.translate(MARGIN_LEFT, MARGIN_TOP);

  if (!analyser) {
    // No analyser available — draw flat line at center
    ctx.beginPath();
    ctx.moveTo(0, plotH / 2);
    ctx.lineTo(plotW, plotH / 2);
    ctx.strokeStyle = THEME.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  ensureDataArray(analyser);
  analyser.getByteTimeDomainData(dataArray);

  const bufferLength = dataArray.length;

  ctx.beginPath();
  ctx.strokeStyle = THEME.accent;
  ctx.lineWidth = 2;

  const sliceWidth = plotW / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    // Map byte value (0–255) to y coordinate
    // 128 = center (0 amplitude), 0 = -1, 255 = +1
    const v = dataArray[i] / 128.0;  // 0–2 range
    const y = (1 - (v - 1)) * plotH / 2;  // Map to canvas: v=2 → top, v=0 → bottom

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Render the waveform visualization.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {object} state
 */
export function renderWaveform(ctx, width, height, state) {
  // Clear background
  ctx.fillStyle = THEME.vizBackground;
  ctx.fillRect(0, 0, width, height);

  const plotW = width - MARGIN_LEFT - MARGIN_RIGHT;
  const plotH = height - MARGIN_TOP - MARGIN_BOTTOM;

  if (plotW <= 0 || plotH <= 0) return;

  drawGrid(ctx, plotW, plotH);
  drawWaveform(ctx, plotW, plotH);
}
