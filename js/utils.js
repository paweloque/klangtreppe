/**
 * Klangtreppe — Utility Functions
 * Pure, stateless utility functions used across modules.
 */

/**
 * Base-2 logarithm.
 * @param {number} x
 * @returns {number}
 */
export function log2(x) {
  return Math.log2(x);
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between a and b.
 * @param {number} a
 * @param {number} b
 * @param {number} t - Interpolation factor (0–1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another.
 * @param {number} value
 * @param {number} inMin
 * @param {number} inMax
 * @param {number} outMin
 * @param {number} outMax
 * @returns {number}
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Compute Gaussian envelope amplitude for a frequency.
 * The envelope operates in the log-frequency domain.
 * @param {number} freq - Current oscillator frequency in Hz
 * @param {number} center - Envelope center frequency in Hz
 * @param {number} sigma - Envelope width in octaves
 * @returns {number} Amplitude value 0.0–1.0
 */
export function gaussianAmplitude(freq, center, sigma) {
  if (freq <= 0) return 0;
  const logDist = Math.log2(freq) - Math.log2(center);
  return Math.exp(-0.5 * (logDist / sigma) ** 2);
}

/**
 * Convert bandwidth in octaves to sigma for Gaussian.
 * sigma = bandwidth / (2 * sqrt(2 * ln(2))) ≈ bandwidth / 2.3548
 * @param {number} bandwidthOctaves
 * @returns {number}
 */
export function bandwidthToSigma(bandwidthOctaves) {
  return bandwidthOctaves / (2 * Math.sqrt(2 * Math.LN2));
}

/**
 * Map frequency to 0–1 range on log scale.
 * @param {number} freq - Frequency in Hz
 * @param {number} minFreq - Minimum frequency
 * @param {number} maxFreq - Maximum frequency
 * @returns {number} Normalized value 0–1
 */
export function freqToLog(freq, minFreq, maxFreq) {
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  const logFreq = Math.log2(freq);
  return (logFreq - logMin) / (logMax - logMin);
}

/**
 * Inverse of freqToLog — map 0–1 normalized value to frequency on log scale.
 * @param {number} normalized - Value 0–1
 * @param {number} minFreq - Minimum frequency
 * @param {number} maxFreq - Maximum frequency
 * @returns {number} Frequency in Hz
 */
export function logToFreq(normalized, minFreq, maxFreq) {
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  return 2 ** (logMin + normalized * (logMax - logMin));
}

/**
 * Convert a linear slider position (0–1) to a logarithmic frequency value.
 * Used for the envelope center frequency slider.
 * @param {number} position - Slider position 0–1
 * @param {number} minFreq - Minimum frequency
 * @param {number} maxFreq - Maximum frequency
 * @returns {number} Frequency in Hz
 */
export function sliderToLogFreq(position, minFreq, maxFreq) {
  const minLog = Math.log2(minFreq);
  const maxLog = Math.log2(maxFreq);
  return 2 ** (minLog + position * (maxLog - minLog));
}

/**
 * Inverse of sliderToLogFreq — convert frequency to slider position.
 * @param {number} freq - Frequency in Hz
 * @param {number} minFreq - Minimum frequency
 * @param {number} maxFreq - Maximum frequency
 * @returns {number} Slider position 0–1
 */
export function logFreqToSlider(freq, minFreq, maxFreq) {
  const minLog = Math.log2(minFreq);
  const maxLog = Math.log2(maxFreq);
  return (Math.log2(freq) - minLog) / (maxLog - minLog);
}

/**
 * Map a 0–1 linear slider value to a logarithmic scale value.
 * @param {number} sliderValue - Linear slider value 0–1
 * @param {number} min - Minimum output value
 * @param {number} max - Maximum output value
 * @returns {number}
 */
export function mapSliderToLog(sliderValue, min, max) {
  return sliderToLogFreq(sliderValue, min, max);
}

/**
 * Inverse of mapSliderToLog.
 * @param {number} value - Log-scale value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Linear slider value 0–1
 */
export function mapLogToSlider(value, min, max) {
  return logFreqToSlider(value, min, max);
}

/**
 * Standard debounce function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Format a frequency value for display.
 * Returns e.g. "440 Hz" or "1.2 kHz"
 * @param {number} hz - Frequency in Hz
 * @returns {string}
 */
export function formatFrequency(hz) {
  if (hz < 1) return `${hz.toFixed(2)} Hz`;
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
  if (hz >= 100) return `${Math.round(hz)} Hz`;
  return `${hz.toFixed(1)} Hz`;
}

/**
 * Format amplitude as percentage string.
 * @param {number} amp - Amplitude 0–1
 * @returns {string}
 */
export function formatAmplitude(amp) {
  return `${Math.round(amp * 100)}%`;
}
