# Color Swatches

An HSL color swatch grid application that discovers distinct named colors using The Color API.

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![Vuetify](https://img.shields.io/badge/Vuetify-3.7-1867C0?logo=vuetify&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

## Overview

Enter Saturation and Lightness values, and the app displays all distinct named colors for those HSL coordinates. Colors are discovered using an efficient binary search algorithm with parallel fetching and cached in localStorage for instant repeat requests.

![](https://wow-ss-from-2020.s3.amazonaws.com/demo.mov)

### Features

- Binary search algorithm
- Parallel HTTP requests with concurrency limiting
- localStorage caching for instant repeat requests
- Responsive grid layout

## Quick Start

### Option 1: Docker

```bash
# Using Docker Compose (recommended)
docker compose up --build
```

Open http://localhost:3005

### Option 2: Local Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 (or the port shown in terminal).

## Testing

The project includes comprehensive tests at three levels:

### Test Stack

| Type | Framework | Count |
|------|-----------|-------|
| Unit | Vitest | 43 tests |
| Feature | Vitest + Vue Test Utils | 33 tests |
| E2E | Playwright | 12 tests |

### Commands

```bash
cd frontend

# Run all unit & feature tests
npm test

# Run specific test suites
npm run test:unit      # Unit tests only
npm run test:feature   # Feature tests only

# Coverage report
npm run test:coverage

# E2E tests (requires dev server)
npm run test:e2e
```

### CI/CD

Tests run automatically on push via GitHub Actions (`.github/workflows/test.yml`):
- Unit & feature tests run in parallel with E2E tests
- Playwright report uploaded as artifact on failure

### Data Flow

1. User adjusts S/L sliders (debounced 300ms)
2. Check localStorage for cached swatches
   - **Cache hit**: Load all swatches instantly
   - **Cache miss**: Run binary search with parallel fetching
3. Discovery complete: Cache final result in localStorage
4. Display swatches sorted by hue

## Configuration

All settings are centralized in `src/shared/config.js`:

```javascript
export const config = {
  api: {
    baseUrl: 'https://www.thecolorapi.com',
  },
  algorithm: {
    startingSamples: 20,      // Initial sample points (0 to 359)
    concurrencyLimit: 20,     // Max parallel HTTP requests
  },
  defaults: {
    saturation: 100,          // Initial saturation value
    lightness: 50,            // Initial lightness value
  },
}
```

Breakpoints are configured via Vuetify in `src/plugins/vuetify.js`.

## Design Decision Summary

**UI:** The input system pairs sliders for quick experimentation with text fields for precise value entry. Loading state uses placeholder skeleton cards so users see exactly where colors will appear, reinforced by a status badge that transitions from "discovering..." to "found". The layout is responsive—controls and grid stack vertically on mobile while expanding horizontally on larger screens.

**Performance:** Binary search reduces the search space from 360 brute-force API calls to ~30-50 calls (log n complexity), with all branches executing in parallel. The `startingSamples` and `concurrencyLimit` settings in config give direct control over the tradeoff between discovery speed and API resource consumption—though in practice, The Color API never rate-limited during testing. Results are cached in localStorage with no expiration, making repeat requests instant.

## License

MIT
