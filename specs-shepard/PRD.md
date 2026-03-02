# Tonleiter — Shepard's Tone Explorer
# Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-02
**Status:** Draft

---

## Table of Contents

1. [Overview / Executive Summary](#1-overview--executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Goals & Objectives](#4-goals--objectives)
5. [User Stories & Use Cases](#5-user-stories--use-cases)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Technical Constraints](#8-technical-constraints)
9. [Technical Considerations](#9-technical-considerations)
10. [User Interface Concepts](#10-user-interface-concepts)
11. [MVP Scope](#11-mvp-scope)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Overview / Executive Summary

**Tonleiter** (*German: "scale" / "tone ladder"*) is a web-based educational application that lets students explore the **Shepard's Tone** — one of the most striking auditory illusions in psychoacoustics. The name plays on the double meaning: a musical scale (*Tonleiter*) that appears to climb endlessly, like a ladder (*Leiter*) with no top.

The application allows users to hear, see, and deconstruct the Shepard's Tone illusion through interactive controls and real-time visualizations. Students can experience the complete illusion with a single click, then progressively peel back the layers to understand *how* and *why* it works — isolating individual octave components, manipulating the spectral envelope, toggling the "trick" on and off, and watching the mechanism unfold in synchronized visual displays.

By bridging the gap between perception and physical reality, Tonleiter makes the principles of auditory illusions, octave equivalence, spectral envelopes, and logarithmic pitch perception accessible and engaging. The central design philosophy is the **"aha moment"** — the application is structured so that students first experience the illusion, then discover the mechanism through playful experimentation.

Tonleiter requires no installation, no backend infrastructure, and runs entirely in a modern web browser, making it ideal for classroom use on any device with a screen and speakers. The user interface is in German, targeting German-speaking Gymnasium classrooms.

**Relationship to Klanglabor:** Tonleiter is a sibling application to [Klanglabor](../index.html) (a Fourier Synthesis explorer). Both share the same target audience, educational philosophy (playful discovery, immediate feedback), and technical constraints (vanilla JS, Web Audio API, static deployment). However, Tonleiter is a completely independent application with its own UI, interactions, and educational flow tailored specifically to the Shepard's Tone phenomenon.

---

## 2. Problem Statement

The Shepard's Tone is a fascinating auditory illusion that demonstrates fundamental principles of psychoacoustics — yet it is remarkably difficult to teach effectively:

- **Audio alone is insufficient:** Students can hear the illusion, but without visualization they cannot understand *why* the pitch seems to rise forever. The mechanism (spectral envelope, octave layering, fade-in/fade-out) is invisible.
- **Static diagrams fail:** Textbook illustrations of the spectral envelope and octave components cannot convey the *dynamic, continuous* nature of the illusion — the simultaneous gliding, fading, and perceptual fusion that creates the effect.
- **Existing demonstrations are passive:** Most online Shepard's Tone demos are simple audio players or pre-rendered videos. Students can listen but cannot *interact* — they cannot isolate components, change parameters, or toggle the illusion on and off to understand the mechanism.
- **Professional tools are inaccessible:** Software like Max/MSP, Pure Data, or MATLAB can synthesize Shepard's Tones, but these tools require installation, training, and are far too complex for a 45-minute classroom session.

There is a need for a **purpose-built, interactive tool** that simultaneously generates, visualizes, and deconstructs the Shepard's Tone illusion in real time, allowing students to move from *experiencing* the illusion to *understanding* it through hands-on experimentation.

---

## 3. Target Users

### Primary Users

| User | Description |
|------|-------------|
| **Gymnasium students (ages 15–19)** | Students in physics, music, or psychology courses learning about acoustics, perception, or auditory illusions. They need an intuitive tool to experience and deconstruct the Shepard's Tone. |
| **Physics / Music teachers** | Educators who want to demonstrate auditory illusions in class, either on a projector or by having students interact individually on their devices. |

### User Characteristics

- Users have **basic familiarity** with musical pitch (higher/lower) and may know about octaves, but are not expected to understand spectral envelopes or psychoacoustics beforehand.
- Users may have **varying levels of musical knowledge** — some may play instruments, others may not.
- Users expect the tool to work **immediately in a browser** without setup, login, or installation.
- The classroom environment may involve **shared devices, projectors, or tablets**.
- Users are **curious and playful** — the illusion itself is inherently engaging and motivates exploration.

---

## 4. Goals & Objectives

### Primary Goals

1. **Experience the illusion** — Let users hear the Shepard's Tone and be genuinely surprised by the endlessly ascending/descending pitch.
2. **Deconstruct the mechanism** — Provide tools to isolate, visualize, and manipulate each component of the illusion (octave layers, spectral envelope, gliding) so students understand *how* it works.
3. **Enable experimentation** — Let users freely modify parameters (number of layers, envelope shape, speed, direction) and observe how changes affect both the sound and the illusion's effectiveness.
4. **Visualize the invisible** — Use real-time graphics to make the spectral envelope, octave fading, and pitch cycling visible — turning an auditory phenomenon into a multi-sensory learning experience.
5. **Deliver the "aha moment"** — Structure the experience so that the transition from "this is magic" to "I understand how this works" is satisfying and memorable.

### Success Criteria

- A student can experience the Shepard's Tone illusion within 5 seconds of opening the application (single click to start).
- A student can discover *why* the illusion works by isolating individual octave layers and toggling the spectral envelope on/off within 2 minutes of exploration.
- A teacher can demonstrate the complete illusion mechanism to a class in under 5 minutes using the guided mode or presets.
- The application runs smoothly (no audio glitches, 60fps visualizations) on a standard classroom laptop or tablet in a modern browser.

---

## 5. User Stories & Use Cases

### US-1: First Encounter — Experiencing the Illusion

> *As a student opening the app for the first time, I want to hear the Shepard's Tone with a single click so that I can experience the illusion before learning how it works.*

**Acceptance Criteria:**
- The app loads with a prominent "Play" button and a brief teaser text (e.g., "Hörst du den Ton, der ewig steigt?")
- Clicking play immediately starts the classic ascending Shepard's Tone
- The visualization shows the tones moving upward, reinforcing the auditory perception
- After ~10-15 seconds, the student realizes the pitch hasn't actually gotten higher — the "aha" seed is planted

### US-2: Deconstruction — Understanding the Mechanism

> *As a student who has heard the illusion, I want to isolate individual octave layers and see/hear them separately so that I can understand how the illusion is constructed.*

**Acceptance Criteria:**
- Each octave layer can be soloed or muted independently
- When a single layer is soloed, the student hears a simple tone that clearly rises and then "resets" (jumps back down an octave)
- The visualization highlights the soloed layer and shows its amplitude changing according to the spectral envelope
- The student can toggle between "all layers" and "single layer" to compare

### US-3: The Reveal — Toggling the Envelope

> *As a student, I want to toggle the spectral envelope on and off so that I can hear the difference between "with illusion" and "without illusion" and understand the envelope's role.*

**Acceptance Criteria:**
- A clear toggle switches between "envelope active" (illusion works) and "envelope off" (all layers at equal volume — illusion breaks, octave jumps become audible)
- The visualization updates to show the envelope curve appearing/disappearing
- The contrast is immediately obvious and dramatic

### US-4: Teacher Demonstration

> *As a teacher, I want to walk through the illusion step-by-step on a projector so that I can explain the concept to my class.*

**Acceptance Criteria:**
- A guided tutorial mode walks through the concept in numbered steps
- Each step has a brief explanation and an interactive element
- The UI is large enough to be readable on a projector (large fonts, high contrast)
- Presets allow quick switching between different configurations (e.g., "Classic", "3 layers only", "Wide envelope", "No envelope")

### US-5: Free Experimentation

> *As a student, I want to freely adjust all parameters (speed, direction, number of layers, envelope shape) so that I can discover how each parameter affects the illusion.*

**Acceptance Criteria:**
- All parameters are adjustable via intuitive controls (sliders, buttons)
- Changes are reflected immediately in both audio and visualization
- Extreme settings (very few layers, very narrow envelope, very fast speed) produce interesting and educational results
- The student can "break" the illusion intentionally and then "fix" it again

### US-6: Discrete Steps vs. Continuous Glide

> *As a student, I want to switch between a continuous glide and discrete semitone/whole-tone steps so that I can hear the Shepard Scale (discrete) vs. Shepard's Tone (continuous).*

**Acceptance Criteria:**
- A mode toggle switches between continuous glide and discrete steps
- In discrete mode, the pitch advances in semitone or whole-tone intervals at a configurable rate
- The visualization clearly shows the difference between smooth gliding and stepped movement

---

## 6. Functional Requirements

### FR-1: Shepard's Tone Audio Engine

| ID | Requirement |
|----|-------------|
| FR-1.1 | The application shall generate a Shepard's Tone using the Web Audio API, consisting of multiple sine wave oscillators spaced at octave intervals (e.g., f, 2f, 4f, 8f, 16f). |
| FR-1.2 | All oscillators shall glide continuously upward or downward in pitch simultaneously, with each oscillator's frequency multiplied by the same time-varying factor. |
| FR-1.3 | When an oscillator's frequency exits the audible/envelope range at the top, it shall seamlessly wrap around to the bottom (ascending mode) or vice versa (descending mode), creating the illusion of endless pitch change. |
| FR-1.4 | The glide shall be smooth and continuous (not stepped), using `AudioParam.setValueAtTime()` or `linearRampToValueAtTime()` with sufficiently small time steps to avoid audible stepping artifacts. |
| FR-1.5 | A spectral envelope (bell-shaped amplitude curve) shall control the gain of each oscillator based on its current frequency, so that oscillators near the center frequency are loudest and those near the edges fade to silence. |
| FR-1.6 | The spectral envelope shall operate in the **log-frequency domain** (i.e., the bell curve is symmetric on a logarithmic frequency axis), reflecting the logarithmic nature of pitch perception. |
| FR-1.7 | The application shall support a configurable number of simultaneous octave layers, from 3 to 8. |
| FR-1.8 | Audio output shall be click-free and pop-free during all parameter changes, gliding, and layer wrapping, using smooth gain transitions. |

### FR-2: Playback Controls

| ID | Requirement |
|----|-------------|
| FR-2.1 | A prominent play/stop button shall start and stop the Shepard's Tone. The initial state shall be stopped. |
| FR-2.2 | Clicking play shall immediately start the Shepard's Tone with the current parameter settings. |
| FR-2.3 | A direction control shall allow switching between ascending, descending, and paused (holding current pitch). Switching direction shall be smooth (no click or discontinuity). |
| FR-2.4 | A speed control (slider) shall adjust the glide rate from very slow (~2 octaves per minute) to fast (~2 octaves per 5 seconds). Default: ~1 octave per 10 seconds. |
| FR-2.5 | A master volume control shall adjust the overall output level from 0.0 to 1.0. |
| FR-2.6 | A "freeze" button shall pause the glide at the current pitch position, allowing inspection of the current state of all oscillators. Unfreezing resumes from the frozen position. |

### FR-3: Spectral Envelope Controls

| ID | Requirement |
|----|-------------|
| FR-3.1 | The spectral envelope center frequency shall be adjustable via a slider, ranging from ~100 Hz to ~5000 Hz (log scale). Default: ~500 Hz. |
| FR-3.2 | The spectral envelope bandwidth (width of the bell curve) shall be adjustable via a slider, from narrow (1 octave) to wide (6+ octaves). Default: ~3 octaves. |
| FR-3.3 | An envelope on/off toggle shall allow disabling the spectral envelope entirely, setting all layers to equal amplitude. This reveals the octave jumps and "breaks" the illusion, serving as a key educational tool. |
| FR-3.4 | Changes to envelope parameters shall be reflected immediately in both the audio output and the envelope visualization. |
| FR-3.5 | The envelope shape shall be a Gaussian (bell curve) in the log-frequency domain. |

### FR-4: Layer Controls (Deconstruction Tools)

| ID | Requirement |
|----|-------------|
| FR-4.1 | Each octave layer shall be individually toggleable (mute/unmute) via a dedicated control. |
| FR-4.2 | Each octave layer shall have a "solo" function that mutes all other layers, allowing the student to hear a single octave component in isolation. |
| FR-4.3 | When a single layer is soloed, the octave wrap-around (jump) shall be clearly audible, demonstrating that individual layers do NOT endlessly ascend — only the combination creates the illusion. |
| FR-4.4 | Each layer's current frequency and amplitude (as determined by the spectral envelope) shall be displayed numerically and visually. |
| FR-4.5 | Layer controls shall display a color-coded indicator matching the layer's color in the visualization. |

### FR-5: Discrete Step Mode (Shepard Scale)

| ID | Requirement |
|----|-------------|
| FR-5.1 | A mode toggle shall switch between continuous glide (Shepard's Tone) and discrete steps (Shepard Scale). |
| FR-5.2 | In discrete mode, the pitch shall advance in configurable intervals: semitone (default), whole tone, or minor third. |
| FR-5.3 | The step rate shall be configurable via a slider (e.g., 0.5 to 4 steps per second). Default: 1 step per second. |
| FR-5.4 | Each discrete step shall use a smooth crossfade (~50ms) to avoid clicks. |
| FR-5.5 | In discrete mode, the visualization shall show the tones jumping in steps rather than gliding smoothly. |

### FR-6: Spectral Envelope Visualization

| ID | Requirement |
|----|-------------|
| FR-6.1 | A dedicated visualization panel shall display the spectral envelope as a bell curve plotted on a log-frequency axis (x-axis: frequency in Hz, log scale; y-axis: amplitude 0–1). |
| FR-6.2 | The current frequency position of each octave layer shall be shown as a dot or marker on the envelope curve, with the dot's vertical position indicating the layer's current amplitude. |
| FR-6.3 | As the tone glides, the layer markers shall move along the envelope curve in real time, visually demonstrating how layers fade in and out. |
| FR-6.4 | When a layer wraps around (exits one end and re-enters the other), the marker shall smoothly transition to its new position. |
| FR-6.5 | The envelope curve shall update in real time when the user adjusts center frequency or bandwidth. |
| FR-6.6 | When the envelope is toggled off (FR-3.3), the visualization shall show a flat horizontal line (equal amplitude) instead of the bell curve. |

### FR-7: Frequency Spectrum Visualization

| ID | Requirement |
|----|-------------|
| FR-7.1 | A real-time frequency spectrum display shall show the individual sine tone components as vertical bars or peaks on a log-frequency axis. |
| FR-7.2 | Each bar's height shall represent the current amplitude of that oscillator (as modulated by the spectral envelope). |
| FR-7.3 | As the tone glides, the bars shall move horizontally across the spectrum, visually showing the pitch change. |
| FR-7.4 | Bars shall fade in/out as they enter/exit the spectral envelope, making the envelope's effect visible. |
| FR-7.5 | The spectral envelope curve shall be overlaid on the spectrum display as a semi-transparent shape, showing the relationship between the envelope and the individual components. |

### FR-8: Spiral / Barber Pole Visualization

| ID | Requirement |
|----|-------------|
| FR-8.1 | A circular/spiral visualization shall provide an intuitive visual metaphor for the Shepard's Tone illusion, analogous to a barber pole or Penrose staircase. |
| FR-8.2 | The visualization shall display pitch as angular position on a circle (one full rotation = one octave), with each octave layer represented as a dot or arc segment. |
| FR-8.3 | As the tone glides upward, the dots shall rotate clockwise (or counterclockwise for descending), visually demonstrating that the pitch cycles through the same octave positions repeatedly. |
| FR-8.4 | The brightness or size of each dot shall reflect its current amplitude (as determined by the spectral envelope), showing the fade-in/fade-out effect. |
| FR-8.5 | The spiral visualization shall make it visually obvious that the tone is "going in circles" rather than truly ascending — reinforcing the "aha moment." |
| FR-8.6 | Pitch class labels (C, C#, D, ..., B) shall be displayed around the circle perimeter for musical reference. |

### FR-9: Waveform Display

| ID | Requirement |
|----|-------------|
| FR-9.1 | A time-domain waveform display shall show the combined audio signal in real time. |
| FR-9.2 | The waveform shall update continuously during playback, driven by an AnalyserNode. |
| FR-9.3 | The waveform display shall serve as a secondary visualization, confirming that audio is being generated and showing the complexity of the combined signal. |

### FR-10: Visualization Layout and Selection

| ID | Requirement |
|----|-------------|
| FR-10.1 | The application shall provide a primary visualization area that can display one of the following views: (a) Spectral Envelope view (FR-6), (b) Frequency Spectrum view (FR-7), (c) Spiral/Barber Pole view (FR-8), (d) Waveform view (FR-9). |
| FR-10.2 | A view selector (tabs or buttons) shall allow the user to switch between visualization modes. |
| FR-10.3 | The default visualization shall be the Spectral Envelope view (FR-6), as it most directly illustrates the illusion mechanism. |
| FR-10.4 | Switching visualization modes shall not affect audio playback or any parameter settings. |
| FR-10.5 | Each visualization shall render at 60fps during playback using `requestAnimationFrame`. |

### FR-11: Presets

| ID | Requirement |
|----|-------------|
| FR-11.1 | The application shall provide preset configurations that demonstrate different aspects of the Shepard's Tone. |
| FR-11.2 | Available presets shall include: |
| | **Klassisch** — Classic Shepard's Tone: 6 layers, medium envelope width (~3 octaves), medium speed, ascending. The standard illusion. |
| | **Wenige Schichten** — Few Layers: 3 layers, medium envelope. Demonstrates that the illusion is weaker with fewer layers. |
| | **Viele Schichten** — Many Layers: 8 layers, wide envelope. Demonstrates a very smooth, convincing illusion. |
| | **Schmale Hüllkurve** — Narrow Envelope: 6 layers, narrow envelope (~1.5 octaves). Only 1-2 layers audible at a time; illusion is weak. |
| | **Breite Hüllkurve** — Wide Envelope: 6 layers, very wide envelope (~5 octaves). Many layers audible; octave jumps become noticeable. |
| | **Ohne Hüllkurve** — No Envelope: 6 layers, envelope disabled. Illusion breaks completely; octave jumps are obvious. |
| | **Absteigend** — Descending: Classic configuration but descending. Demonstrates the illusion works in both directions. |
| | **Shepard-Tonleiter** — Shepard Scale: Discrete semitone steps instead of continuous glide. The original Shepard (1964) experiment. |
| FR-11.3 | Loading a preset shall update all relevant parameters (layer count, envelope settings, speed, direction, mode) and restart playback with the new configuration. |
| FR-11.4 | The currently active preset (if any) shall be visually highlighted. Manually changing any parameter shall deselect the active preset indicator. |

### FR-12: Guided Tutorial Mode

| ID | Requirement |
|----|-------------|
| FR-12.1 | A guided tutorial mode shall walk the user through the Shepard's Tone concept in a sequence of numbered steps. |
| FR-12.2 | The tutorial shall follow this approximate sequence: |
| | **Step 1 — Hör zu:** Play the classic Shepard's Tone. "Hörst du, wie der Ton immer höher steigt? Oder doch nicht?" |
| | **Step 2 — Eine einzelne Schicht:** Solo a single layer. "Hör genau hin — dieser Ton steigt... und springt dann zurück!" |
| | **Step 3 — Alle Schichten:** Enable all layers without envelope. "Jetzt hörst du alle Schichten gleichzeitig. Kannst du die Sprünge hören?" |
| | **Step 4 — Die Hüllkurve:** Enable the spectral envelope. "Die Hüllkurve blendet die Sprünge aus. Jetzt klingt es wieder endlos!" |
| | **Step 5 — Experimentiere:** Free exploration with all controls unlocked. "Verändere die Parameter und entdecke, wie die Illusion funktioniert!" |
| FR-12.3 | Each tutorial step shall configure the application to the appropriate state (preset, solo, envelope on/off) and display an explanation panel. |
| FR-12.4 | Navigation buttons (Zurück / Weiter) shall move between steps. A "Tutorial beenden" button shall exit to free exploration mode. |
| FR-12.5 | The tutorial shall be accessible from a clearly visible button in the header (e.g., "📖 Anleitung"). |

### FR-13: Informational Tooltips

| ID | Requirement |
|----|-------------|
| FR-13.1 | Key controls and concepts shall have informational tooltips (hover/tap) that provide brief explanations in German. |
| FR-13.2 | Tooltips shall cover at minimum: spectral envelope ("Die Hüllkurve bestimmt die Lautstärke jeder Schicht basierend auf ihrer Frequenz"), octave layers ("Sinustöne im Oktavabstand, die gleichzeitig gleiten"), glide speed, direction, and the envelope toggle. |
| FR-13.3 | Tooltips shall not obstruct the visualization area. |

### FR-14: URL State Sharing

| ID | Requirement |
|----|-------------|
| FR-14.1 | The current configuration (layer count, envelope center, envelope width, speed, direction, mode, active layers) shall be encodable as a URL hash fragment. |
| FR-14.2 | Opening a URL with a valid hash fragment shall restore the configuration. |
| FR-14.3 | A "Teilen" (Share) button shall copy the shareable URL to the clipboard with visual confirmation ("✓ Kopiert!"). |
| FR-14.4 | Invalid or malformed URL hash data shall be gracefully ignored, falling back to the default configuration. |

---

## 7. Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement |
|----|-------------|
| NFR-1.1 | Audio gliding shall be smooth and continuous with no audible stepping, clicking, or popping artifacts, even at fast glide speeds. |
| NFR-1.2 | The spectral envelope amplitude modulation shall update frequently enough (at least every 20ms) to produce smooth fade-in/fade-out transitions as layers move through the envelope. |
| NFR-1.3 | All visualizations shall render at 60fps during playback with up to 8 simultaneous layers. |
| NFR-1.4 | Parameter changes (envelope shape, speed, direction, layer toggles) shall be reflected in both audio and visuals within 50ms. |
| NFR-1.5 | The application shall load and be interactive within 3 seconds on a standard broadband connection. |

### NFR-2: Browser Compatibility

| ID | Requirement |
|----|-------------|
| NFR-2.1 | The application shall work in the latest stable versions of Chrome, Firefox, Safari, and Edge. |
| NFR-2.2 | The application shall use standard Web APIs (Web Audio API, Canvas API) without requiring browser plugins or extensions. |
| NFR-2.3 | The application shall handle iOS Safari's AudioContext restrictions (suspended context until user gesture) gracefully. |

### NFR-3: Responsive Design & Viewport-Fitting Layout

| ID | Requirement |
|----|-------------|
| NFR-3.1 | The application shall be usable on screen widths from 768px (tablet) to 1920px (desktop). |
| NFR-3.2 | The entire application UI shall fit within the browser viewport without requiring page-level scrolling. The layout shall use viewport units and flexible sizing so that the header, visualization area, controls, and transport are all visible simultaneously. |
| NFR-3.3 | Touch interactions shall be supported for all slider controls on tablet devices. |
| NFR-3.4 | The layout shall adapt gracefully to different screen sizes, with the visualization area receiving the majority of available space. |

### NFR-4: Accessibility

| ID | Requirement |
|----|-------------|
| NFR-4.1 | All interactive controls shall be keyboard-navigable (Tab, Enter, Arrow keys for sliders). |
| NFR-4.2 | Controls shall have appropriate ARIA labels for screen reader compatibility. |
| NFR-4.3 | Color choices for layer indicators and visualizations shall be distinguishable for users with common forms of color vision deficiency (deuteranopia, protanopia). Use a colorblind-friendly palette (e.g., Wong or Okabe-Ito palette). |
| NFR-4.4 | The UI text shall use a minimum font size of 14px for readability. |
| NFR-4.5 | The play/stop state shall be communicated via both visual indicators and ARIA live regions. |

### NFR-5: Usability

| ID | Requirement |
|----|-------------|
| NFR-5.1 | The application shall be usable without prior instruction — the interface should be self-explanatory for a Gymnasium student. The guided tutorial provides optional scaffolding but is not required. |
| NFR-5.2 | The primary action (hearing the illusion) shall require at most one click from the initial state. |
| NFR-5.3 | The UI language shall be German throughout (labels, tooltips, tutorial text, button labels). |
| NFR-5.4 | The application shall be suitable for classroom projector use: high contrast, large visualization area, readable text at distance. |

### NFR-6: Audio Quality

| ID | Requirement |
|----|-------------|
| NFR-6.1 | The Shepard's Tone shall be perceptually convincing — a naive listener should perceive an endlessly ascending or descending pitch with the default settings. |
| NFR-6.2 | Layer wrapping (octave jump) shall be inaudible when the spectral envelope is active and properly configured. |
| NFR-6.3 | The audio output shall not clip or distort at any combination of settings. Automatic gain normalization shall prevent the combined amplitude of all layers from exceeding safe levels. |

---

## 8. Technical Constraints

| Constraint | Description |
|------------|-------------|
| **Client-side only** | The application shall run entirely in the browser with no backend server, database, or API dependencies. |
| **Technology stack** | HTML5, CSS3, and vanilla JavaScript (ES6+). No frameworks (React, Vue, etc.), no build tools (Webpack, Vite, etc.), no package managers. |
| **Web Audio API** | Audio generation shall use the Web Audio API's `OscillatorNode` (type: sine) and `GainNode` for amplitude control. |
| **Canvas API** | All visualizations shall use the HTML5 Canvas API for rendering. |
| **Deployment** | The application shall be deployable as static files (HTML, CSS, JS, assets) to any web server or static hosting service. |
| **No authentication** | No user accounts, login, or persistent storage required. |
| **Offline capability** | Once loaded, the application shall function without an active internet connection (no runtime external dependencies). |
| **Single HTML entry point** | The application shall be a single page (one HTML file) with linked CSS and JS files. |

---

## 9. Technical Considerations

### 9.1 Continuous Pitch Gliding

The core challenge is smoothly gliding all oscillators' frequencies simultaneously while applying the spectral envelope.

**Approach:** Use a scheduling loop (driven by `requestAnimationFrame` or a `setInterval` at ~20ms) that:
1. Calculates the current pitch offset based on elapsed time and glide speed
2. For each oscillator, computes its current frequency: `baseFreq × 2^(pitchOffset + layerIndex)`
3. Applies the frequency using `oscillator.frequency.setTargetAtTime()` with a short time constant (~10ms) for smooth transitions
4. Computes the spectral envelope amplitude for each oscillator's current frequency
5. Applies the amplitude using `gainNode.gain.setTargetAtTime()`

**Octave wrapping:** When `pitchOffset` exceeds 1.0 (one full octave), it wraps back to 0.0. Since all layers are spaced at octave intervals, this wrap is mathematically seamless — the frequency set that was `[f, 2f, 4f, 8f]` becomes `[2f, 4f, 8f, 16f]`, which after wrapping is `[f, 2f, 4f, 8f]` again (with the top layer becoming the new bottom layer). The spectral envelope ensures this transition is inaudible.

### 9.2 Spectral Envelope Implementation

The spectral envelope is a Gaussian function in the log-frequency domain:

```
amplitude(f) = exp(-0.5 × ((log2(f) - log2(centerFreq)) / sigma)^2)
```

Where:
- `f` is the oscillator's current frequency
- `centerFreq` is the envelope center frequency (user-adjustable)
- `sigma` controls the width (bandwidth) in octaves (user-adjustable)

This is computed in JavaScript and applied to each oscillator's gain node at each scheduling step.

### 9.3 Audio Graph Topology

```
OscillatorNode 1 → GainNode 1 (envelope) ─┐
OscillatorNode 2 → GainNode 2 (envelope) ─┤
OscillatorNode 3 → GainNode 3 (envelope) ─┤→ GainNode (normalizer) → GainNode (master) → AnalyserNode → destination
OscillatorNode N → GainNode N (envelope) ─┘
```

The normalizer gain node automatically scales the output by `1 / sqrt(N)` (where N is the number of active layers) to prevent clipping while maintaining perceived loudness.

### 9.4 Canvas Visualization Strategy

Each visualization type uses its own render function, all sharing a single `requestAnimationFrame` loop:

- **Spectral Envelope View:** Draw the Gaussian curve on a log-frequency x-axis. Overlay animated dots for each layer. Update dot positions and sizes each frame based on current oscillator frequencies and amplitudes.
- **Frequency Spectrum View:** Draw vertical bars at each oscillator's current frequency position (log-x axis). Bar height = current amplitude. Overlay the envelope curve as a semi-transparent fill.
- **Spiral View:** Draw a circle with pitch-class labels. Place dots at angular positions corresponding to each layer's current pitch class (0–11 semitones mapped to 0–360°). Dot size/opacity = current amplitude.
- **Waveform View:** Use AnalyserNode.getByteTimeDomainData() to draw the real-time waveform.

### 9.5 State Management

A central state object holds all parameters:

```javascript
const state = {
  isPlaying: false,
  isFrozen: false,
  direction: 'ascending',     // 'ascending' | 'descending' | 'paused'
  speed: 0.1,                 // octaves per second
  layerCount: 6,              // 3–8
  envelopeCenter: 500,        // Hz
  envelopeWidth: 3,           // octaves (sigma)
  envelopeEnabled: true,
  mode: 'continuous',         // 'continuous' | 'discrete'
  stepInterval: 'semitone',   // 'semitone' | 'wholetone' | 'minorthird'
  stepRate: 1,                // steps per second
  masterVolume: 0.5,
  pitchOffset: 0,             // current position in the octave cycle (0–1)
  layers: [                   // per-layer state
    { enabled: true, soloed: false, currentFreq: 0, currentAmp: 0 },
    // ...
  ],
  activeVisualization: 'envelope',  // 'envelope' | 'spectrum' | 'spiral' | 'waveform'
  tutorialStep: null,         // null = free mode, 1–5 = tutorial step
};
```

All UI controls read from and write to this state. The audio scheduling loop and visualization loop both read from this state each frame.

---

## 10. User Interface Concepts

### High-Level Layout

The UI is designed to fit entirely within the browser viewport (`100vh × 100vw`) with no page-level scrolling. The layout prioritizes the visualization area, which occupies the majority of the screen — the visualization is the primary educational tool in this application.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                     │
│  Tonleiter — Shepards Tone Explorer    [📖 Anleitung]  [▶ Abspielen]       │
├────────────────────────────────────────────┬────────────────────────────────┤
│                                            │  CONTROLS PANEL               │
│                                            │                               │
│         PRIMARY VISUALIZATION              │  ┌─ Richtung ──────────────┐  │
│                                            │  │ [↑ Auf] [↓ Ab] [⏸ Halt] │  │
│    [Hüllkurve] [Spektrum] [Spirale] [Welle]│  └────────────────────────┘  │
│                                            │                               │
│    ┌──────────────────────────────────┐    │  ┌─ Geschwindigkeit ───────┐  │
│    │                                  │    │  │ [━━━━━━━●━━━━━━━━━━━━━] │  │
│    │                                  │    │  └────────────────────────┘  │
│    │    Spectral Envelope / Spectrum  │    │                               │
│    │    / Spiral / Waveform           │    │  ┌─ Hüllkurve ────────────┐  │
│    │    visualization renders here    │    │  │ [✓] Aktiv               │  │
│    │                                  │    │  │ Mitte:  [━━━●━━━━━━━━] │  │
│    │    Animated dots show layers     │    │  │ Breite: [━━━━━━●━━━━━] │  │
│    │    moving through the envelope   │    │  └────────────────────────┘  │
│    │                                  │    │                               │
│    │                                  │    │  ┌─ Schichten ────────────┐  │
│    └──────────────────────────────────┘    │  │ Anzahl: [━━━━●━━━━━━━] │  │
│                                            │  │                         │  │
│                                            │  │ ● Schicht 1  [S] [M]   │  │
│                                            │  │ ● Schicht 2  [S] [M]   │  │
│                                            │  │ ● Schicht 3  [S] [M]   │  │
│                                            │  │ ● Schicht 4  [S] [M]   │  │
│                                            │  │ ● Schicht 5  [S] [M]   │  │
│                                            │  │ ● Schicht 6  [S] [M]   │  │
│                                            │  └────────────────────────┘  │
│                                            │                               │
│                                            │  ┌─ Modus ───────────────┐   │
│                                            │  │ [Kontinuierlich][Stufen]│  │
│                                            │  │ Intervall: [Halbton ▼] │  │
│                                            │  │ Tempo: [━━━●━━━━━━━━━] │  │
│                                            │  └────────────────────────┘  │
│                                            │                               │
├────────────────────────────────────────────┴────────────────────────────────┤
│  FOOTER                                                                     │
│  Vorlagen: [Klassisch][Wenige][Viele][Schmal][Breit][Ohne][Ab][Tonleiter]  │
│  Lautstärke: [━━━●━━━━]   [🔗 Teilen]   Über Tonleiter | Impressum        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layout Rationale

The layout differs significantly from Klanglabor:

- **Visualization-dominant:** The visualization area takes ~65-70% of the viewport width, because understanding the Shepard's Tone requires *seeing* the mechanism. In Klanglabor, the controls panel is on the left and the visualization on the right; in Tonleiter, the visualization is on the left (primary focus) and controls on the right (secondary).
- **Controls as a sidebar:** All parameter controls are grouped in a right-side panel, organized into collapsible sections. This keeps the visualization uncluttered while providing full control access.
- **Presets in the footer:** Presets are placed in the footer bar for quick access without taking space from the visualization or controls.
- **Play button in the header:** The primary action (play/stop) is in the header for maximum visibility and one-click access.

### Tutorial Overlay

When the guided tutorial is active, a semi-transparent overlay panel appears at the bottom of the visualization area:

```
┌──────────────────────────────────────────────────────────┐
│  Schritt 2 von 5                                         │
│                                                          │
│  Eine einzelne Schicht                                   │
│  Hör genau hin — dieser Ton steigt... und springt dann   │
│  zurück nach unten! Das ist KEINE endlose Tonleiter.     │
│                                                          │
│  [← Zurück]                    [Weiter →]  [✕ Beenden]  │
└──────────────────────────────────────────────────────────┘
```

The overlay does not cover the full visualization — it sits at the bottom ~20% of the visualization area, allowing the student to see the visualization while reading the explanation.

### UI Component Descriptions

| Component | Description |
|-----------|-------------|
| **Header** | Displays "Tonleiter" title and subtitle "Shepards Tone Explorer". Contains the tutorial button ("📖 Anleitung") and the primary play/stop button. Minimal fixed height. |
| **Visualization Area** | Large canvas area (~65-70% of viewport width). Contains visualization tab selector at the top and the active visualization canvas below. The canvas fills the available space. |
| **Visualization Tabs** | Four buttons to switch between Hüllkurve (Envelope), Spektrum (Spectrum), Spirale (Spiral), and Welle (Waveform) views. |
| **Controls Panel** | Right sidebar (~30-35% of viewport width) containing all parameter controls organized in collapsible sections. Scrolls internally if content exceeds available height. |
| **Direction Controls** | Three-button toggle: Aufsteigend (↑), Absteigend (↓), Angehalten (⏸). Plus a Freeze button (❄). |
| **Speed Slider** | Controls glide rate. Labeled "Geschwindigkeit" with value display. |
| **Envelope Section** | Contains: enable/disable toggle, center frequency slider (log scale, showing Hz value), bandwidth slider (showing octave value). |
| **Layer Section** | Shows layer count slider (3–8) and a list of individual layers with color indicator, solo [S] and mute [M] buttons. |
| **Mode Section** | Toggle between Kontinuierlich (continuous) and Stufen (discrete steps). When discrete mode is active, shows interval selector dropdown and step rate slider. |
| **Footer** | Contains preset buttons, master volume slider, share button, and navigation links. Fixed height at bottom. |

### Interaction Patterns

- **First visit:** The app loads in stopped state with the classic Shepard's Tone configuration (6 layers, medium envelope, ascending). The visualization shows the static envelope curve with layer markers at their starting positions. A prominent play button invites interaction.
- **Starting playback:** Click the play button → the Shepard's Tone begins, layer markers start moving through the envelope visualization, and the student hears the endlessly ascending pitch.
- **Switching visualization:** Click a visualization tab → the canvas smoothly transitions to the new view. Audio continues uninterrupted.
- **Adjusting envelope:** Drag the center frequency or bandwidth slider → the envelope curve reshapes in real time, and the audio immediately reflects the change (layers become louder/quieter as the envelope shifts).
- **Toggling envelope off:** Click the envelope toggle → all layers jump to equal volume, the envelope curve disappears from the visualization, and the octave jumps become audible. Click again to restore the illusion.
- **Soloing a layer:** Click [S] on a layer → all other layers are muted, the visualization highlights only the soloed layer, and the student hears a single tone that clearly rises and jumps back down.
- **Loading a preset:** Click a preset button in the footer → all parameters update, playback restarts with the new configuration, and the visualization reflects the changes.
- **Starting the tutorial:** Click "📖 Anleitung" → the tutorial overlay appears, the app configures itself for Step 1, and the student follows the guided sequence.
- **Freezing:** Click the freeze button → the glide pauses at the current position, all layer markers stop moving, and the student can inspect the current state. Click again to resume.

### Color Scheme

The application uses a dark theme optimized for projector visibility and visual focus:

- **Background:** Dark charcoal (#1a1a2e or similar)
- **Visualization background:** Slightly lighter (#16213e)
- **Accent color:** Warm amber/gold (#f0a500) for primary actions and highlights
- **Layer colors:** A colorblind-friendly palette of 8 distinct colors (e.g., Okabe-Ito palette adapted for dark backgrounds)
- **Envelope curve:** Semi-transparent warm gradient
- **Text:** Light gray (#e0e0e0) for readability on dark backgrounds

This dark theme contrasts with Klanglabor's lighter aesthetic, giving Tonleiter its own visual identity while being equally suitable for classroom projection.

---

## 11. MVP Scope

### Included in MVP

- [ ] Shepard's Tone audio engine with continuous pitch gliding (ascending/descending)
- [ ] Configurable number of octave layers (3–8)
- [ ] Spectral envelope (Gaussian in log-frequency domain) with adjustable center and width
- [ ] Envelope on/off toggle (key educational feature)
- [ ] Direction control (ascending/descending/paused)
- [ ] Speed control for glide rate
- [ ] Freeze/unfreeze functionality
- [ ] Individual layer mute/solo controls
- [ ] Spectral Envelope visualization with animated layer markers
- [ ] Frequency Spectrum visualization with envelope overlay
- [ ] Spiral/Barber Pole visualization
- [ ] Real-time waveform display
- [ ] Visualization tab switching
- [ ] Discrete step mode (Shepard Scale) with configurable interval and rate
- [ ] 8 presets (Klassisch, Wenige Schichten, Viele Schichten, Schmale Hüllkurve, Breite Hüllkurve, Ohne Hüllkurve, Absteigend, Shepard-Tonleiter)
- [ ] Guided tutorial mode (5 steps)
- [ ] Informational tooltips on key controls
- [ ] URL state sharing
- [ ] Master volume control
- [ ] Play/Stop control
- [ ] Responsive layout (768px–1920px)
- [ ] Dark theme optimized for projector use
- [ ] German-language UI
- [ ] Keyboard navigation and ARIA labels
- [ ] Colorblind-friendly palette
- [ ] Works in Chrome, Firefox, Safari, Edge (latest)
- [ ] Deployable as static files with no backend

### Excluded from MVP

- Microphone input / live audio analysis
- Recording or exporting audio
- User accounts or persistent storage (beyond URL sharing)
- Mobile phone optimization (< 768px)
- Internationalization / localization (German only)
- Custom envelope shapes (only Gaussian)
- MIDI input support
- Multi-user / collaborative features

---

## 12. Future Enhancements

The following features are candidates for post-MVP development, listed in approximate priority order:

| Enhancement | Description |
|-------------|-------------|
| **Risset Rhythm** | Demonstrate the temporal equivalent of the Shepard's Tone — an accelerating rhythm that never seems to get faster. This would be a natural companion feature, as it uses the same spectral envelope principle applied to tempo instead of pitch. |
| **Tritone Paradox** | Add a mode demonstrating the Tritone Paradox (Deutsch, 1986) — where two Shepard tones a tritone apart are perceived as ascending by some listeners and descending by others, depending on their linguistic background. |
| **A/B Comparison Mode** | Split the visualization into two side-by-side panels, each with independent settings, allowing direct comparison of different configurations (e.g., narrow vs. wide envelope, 3 layers vs. 8 layers). |
| **3D Spiral Visualization** | Extend the spiral visualization into a 3D helix (rendered on canvas with perspective projection), where the vertical axis represents octave height and the circular axis represents pitch class — making the "barber pole" metaphor even more vivid. |
| **Custom Envelope Shapes** | Allow users to draw custom spectral envelope shapes (not just Gaussian) to explore how different envelope profiles affect the illusion. |
| **Frequency Spectrum Analyzer** | Use the AnalyserNode's FFT data to show a real frequency spectrum (not just the computed oscillator positions), demonstrating the actual spectral content of the output. |
| **Audio Recording & Export** | Allow users to record the Shepard's Tone output and download it as a WAV file for use in presentations or further analysis. |
| **Shepard-Risset Glissando Variants** | Explore variations like the "Shepard-Risset glissando" with different waveforms (not just sine — sawtooth, triangle) to show how timbre affects the illusion. |
| **Mobile Phone Support** | Optimized layout and touch interactions for screens narrower than 768px. |
| **Classroom Quiz Mode** | A mode where the teacher can play different configurations and students vote on whether the pitch is "really" ascending or if it's an illusion — gamifying the learning experience. |
| **Integration with Klanglabor** | Cross-linking between Tonleiter and Klanglabor, allowing students to explore the connection between Fourier synthesis (Klanglabor) and spectral perception (Tonleiter). |

---

## Appendix A: Shepard's Tone — Technical Reference

### The Illusion Mechanism

The Shepard's Tone (Shepard, 1964) creates the perception of an endlessly ascending (or descending) pitch through three simultaneous mechanisms:

1. **Octave-spaced components:** Multiple sine tones are played simultaneously, each exactly one octave apart (frequency ratios of 1:2:4:8:16:...). Due to octave equivalence, these tones are perceptually similar — they share the same "pitch class" (e.g., all are "C" in different octaves).

2. **Simultaneous gliding:** All components glide upward (or downward) in pitch together, maintaining their octave spacing. This creates a strong perceptual cue of rising pitch.

3. **Spectral envelope:** A fixed bell-shaped amplitude curve (centered on a constant frequency) controls the loudness of each component. As a component glides upward past the envelope's peak, it gradually fades out. Simultaneously, a new component entering from below gradually fades in. Because the fading is gradual and the components are octave-equivalent, the listener does not perceive the "handoff" — only the continuous upward motion.

### Key Formulas

**Oscillator frequency at time t:**
```
f_i(t) = f_base × 2^(i + offset(t))
```
Where:
- `f_base` is the lowest base frequency
- `i` is the layer index (0, 1, 2, ..., N-1)
- `offset(t)` is the current pitch offset (0 to 1, wrapping), advancing at the glide speed

**Spectral envelope (Gaussian in log-frequency domain):**
```
A(f) = exp(-0.5 × ((log₂(f) - log₂(f_center)) / σ)²)
```
Where:
- `f` is the oscillator's current frequency
- `f_center` is the envelope center frequency
- `σ` is the envelope width in octaves

**Gain normalization:**
```
gain_normalized = 1 / sqrt(N_active)
```
Where `N_active` is the number of currently active (non-muted) layers.

### Reference: Shepard, R.N. (1964)

Shepard, R. N. (1964). "Circularity in Judgments of Relative Pitch." *Journal of the Acoustical Society of America*, 36(12), 2346–2353.

---

## Appendix B: Glossary (German UI Terms)

| German Term | English | Context |
|-------------|---------|---------|
| Tonleiter | Scale / Tone Ladder | Application name |
| Hüllkurve | Envelope | Spectral envelope |
| Schicht / Schichten | Layer / Layers | Octave components |
| Aufsteigend | Ascending | Direction control |
| Absteigend | Descending | Direction control |
| Angehalten | Paused/Stopped | Direction control |
| Geschwindigkeit | Speed | Glide rate |
| Breite | Width | Envelope bandwidth |
| Mitte | Center | Envelope center frequency |
| Abspielen | Play | Playback control |
| Stopp | Stop | Playback control |
| Einfrieren | Freeze | Freeze button |
| Lautstärke | Volume | Master volume |
| Vorlagen | Presets | Preset configurations |
| Anleitung | Tutorial/Guide | Guided mode |
| Teilen | Share | URL sharing |
| Spirale | Spiral | Spiral visualization |
| Spektrum | Spectrum | Frequency spectrum view |
| Welle | Wave | Waveform view |
| Stufen | Steps | Discrete step mode |
| Halbton | Semitone | Step interval |
| Ganzton | Whole tone | Step interval |
| Kleine Terz | Minor third | Step interval |

---

*This document serves as the foundation for implementation planning for Tonleiter. It should be reviewed and updated as the project evolves.*
