<p align="center">
  <img src="public/logo.png" alt="NUMBR Logo" width="130" height="130" style="border-radius: 28px;" />
</p>

<h1 align="center">NUMBR // Hardware-Level Tally Runtime</h1>

<p align="center">
  <strong>A high-precision, tactile online tally counter and state engine with authentic Neumorphic Soft UI, Web Audio mechanical switches, mobile haptics, and instant offline storage.</strong>
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react" alt="React 19" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite" alt="Vite" /></a>
  <img src="https://img.shields.io/badge/UI-Neumorphism%20%2F%20Soft%20UI-00b4d8?style=flat-square" alt="Neumorphic UI" />
  <img src="https://img.shields.io/badge/License-MIT-emerald?style=flat-square" alt="License" />
</p>

---

## ⚡ Overview

**NUMBR** is a modern, tactile tally counter web application built from the ground up using React's `useState` architecture. It features a realistic hardware-inspired Neumorphic aesthetic, sub-millisecond click response, Web Audio API mechanical sound synthesis, mobile haptic vibration feedback, 64-bit integer radix conversions (Decimal, Hexadecimal, Binary, Parity), and a live 50-event LIFO audit buffer with CSV export.

---

## ✨ Features

- **Pure React `useState` Engine**: Master count, step multipliers, custom target goal, and undo stack managed reactively.
- **Authentic Neumorphic (Soft UI) Styling**: Tactile convex push buttons, debossed deep-sunken readout display, glowing cyan/emerald LEDs, and scale-bounce micro-interactions.
- **Web Audio API Mechanical Feedback**: Synthetic physical click and thud audio tailored for increments, decrements, reset, and milestone fanfares.
- **Mobile Responsive & Haptics**: Full touch compatibility with fluid font scaling (`clamp()`), dynamic viewport units (`100dvh`), and `navigator.vibrate` haptic pulses.
- **Goal Progress & Confetti**: Real-time progress bar toward custom targets with confetti celebrations upon completion.
- **64-Bit Radix Conversions**: Instant real-time conversion to Hexadecimal (`HEX`), Binary (`BIN`), and Parity (`EVEN` / `ODD`).
- **Audit Event Buffer**: 50-step LIFO log recording timestamps, triggers (Mouse, Space key, Macros), and one-click CSV export.
- **Quick Math Macros**: Instant `×2 Double`, `÷2 Half`, `± Invert`, `00 Round`, and `🎲 Rand`.
- **Offline LocalStorage Persistence**: Your tally, settings, and peak statistics persist automatically across page reloads.
- **Google Search Engine Optimized (SEO)**: Pre-configured Schema.org `WebApplication` and `FAQPage` JSON-LD, sitemap, robots.txt, and Open Graph social metadata.

---

## ⌨️ Tactile Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>SPACE</kbd> | **Increment** | Adds current step delta |
| <kbd>SHIFT</kbd> + <kbd>SPACE</kbd> | **Decrement** | Subtracts current step delta |
| <kbd>R</kbd> | **Reset** | Clears count back to 0 |
| <kbd>1</kbd> – <kbd>5</kbd> | **Step Multiplier** | Quickly switch steps: `1`, `5`, `10`, `50`, `100` |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | **Undo** | Reverts to previous count in undo buffer |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Typography**: Plus Jakarta Sans & JetBrains Mono (Google Fonts)
- **Icons**: Google Material Symbols Outlined
- **Audio & Haptics**: Web Audio API & Navigator Vibration API
- **Celebration Effects**: `canvas-confetti`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mohammedshadab78/NUMBR---A-React-Counter-app-.git
   cd NUMBR---A-React-Counter-app-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
