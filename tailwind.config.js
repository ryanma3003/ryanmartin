/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent2) / <alpha-value>)',
        screen: 'rgb(var(--screen) / <alpha-value>)',
        'screen-ink': 'rgb(var(--screen-ink) / <alpha-value>)',
        device: 'rgb(var(--device) / <alpha-value>)',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
};
