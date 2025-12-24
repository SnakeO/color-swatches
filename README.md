# Color Swatches

An HSL color swatch grid application that discovers distinct named colors using The Color API.

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)
![Vuetify](https://img.shields.io/badge/Vuetify-3.7-1867C0?logo=vuetify&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

## Overview

Enter Saturation and Lightness values, and the app displays all distinct named colors for those HSL coordinates. Colors are discovered using an efficient binary search algorithm with parallel fetching and cached in localStorage for instant repeat requests.

### Features

- Binary search algorithm (~30-50 API calls vs 360 brute force)
- Parallel HTTP requests with concurrency limiting
- localStorage caching for instant repeat requests
- Responsive grid layout
- Vuetify Material Design UI
- Zero backend infrastructure

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

## Architecture

```
┌──────────────────────────────────────────────┐
│                  Browser                      │
│  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Vue 3     │  │     localStorage        │ │
│  │  Vuetify    │  │  (swatches + colors)    │ │
│  └──────┬──────┘  └────────────▲────────────┘ │
│         │                      │              │
│         │    Binary Search     │              │
│         │    + Caching         │              │
└─────────┼──────────────────────┼──────────────┘
          │                      │
          ▼                      │
   ┌──────────────┐              │
   │  Color API   │──────────────┘
   │  (external)  │   fetch() with CORS
   └──────────────┘
```

### Data Flow

1. User adjusts S/L sliders (debounced 300ms)
2. Check localStorage for cached swatches
   - **Cache hit**: Load all swatches instantly
   - **Cache miss**: Run binary search with parallel fetching
3. Discovery complete: Cache final result in localStorage
4. Display swatches sorted by hue

## Binary Search Algorithm

The Color API has no "list all names" endpoint. Instead of brute-forcing 360 hue values, we use binary search:

```
1. Generate 20 evenly distributed samples from hue 0 to 359

2. Fetch all samples in parallel (concurrency limit: 20)

3. Binary search between samples with different names
   - Search BOTH sides to find all colors
   - All branches run in parallel

Result: ~30-50 calls instead of 360, ~8 seconds total
```

### Example Trace

```
Position: 0  1  2  3  4  5  6  7  8  9  10 11 12
Color:    A  A  B  C  C  D  D  D  E  E  F  G  G

Initial: 0→A, 4→C, 8→E, 12→G (4 calls)
Gap(0-4): mid=2→B, search both sides
Gap(4-8): mid=6→D, search both sides
Gap(8-12): mid=10→F, search both sides
Result: All 7 colors found
```

## Caching Strategy

```
First request (S=100, L=50):
├─ Check swatches:100:50 → MISS
├─ Binary search with per-hue caching
├─ Complete: Save to swatches:100:50
└─ Cleanup: Remove working color cache

Repeat request:
└─ Check swatches:100:50 → HIT (instant load)
```

## Project Structure

```
frontend/
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── plugins/
│   │   ├── index.js
│   │   └── vuetify.js
│   ├── shared/
│   │   ├── config.js            # Centralized configuration
│   │   ├── services/
│   │   │   ├── colorApi.js      # fetch() to thecolorapi.com
│   │   │   ├── cache.js         # localStorage wrapper
│   │   │   └── concurrency.js   # Rate limiting utility
│   │   └── stores/
│   │       └── app.js           # Notifications
│   ├── modules/
│   │   └── swatches/
│   │       ├── services/
│   │       │   ├── colorClient.js     # Cache + API coordination
│   │       │   └── colorDiscovery.js  # Binary search algorithm
│   │       ├── composables/
│   │       │   └── useSwatches.js     # Reactive state management
│   │       └── components/
│   │           ├── ColorControls.vue
│   │           ├── SwatchCard.vue
│   │           └── SwatchGrid.vue
│   └── pages/
│       └── index.vue
├── index.html
├── jsconfig.json
├── package.json
└── vite.config.mjs
```

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

| Option | Path | Default | Description |
|--------|------|---------|-------------|
| API URL | `api.baseUrl` | `thecolorapi.com` | Color API endpoint |
| Starting Samples | `algorithm.startingSamples` | `20` | Initial hue samples |
| Concurrency | `algorithm.concurrencyLimit` | `20` | Max parallel requests |
| Saturation | `defaults.saturation` | `100` | Default S value |
| Lightness | `defaults.lightness` | `50` | Default L value |

Breakpoints are configured via Vuetify in `src/plugins/vuetify.js`.

## Performance

| Scenario | API Calls | Time |
|----------|-----------|------|
| First request | ~30-50 | ~3-4 seconds |
| Cached request | 0 | Instant |
| Brute force (comparison) | 360 | ~6 minutes |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Vue 3 |
| UI Library | Vuetify 3 |
| State | Pinia |
| Build | Vite |
| Cache | localStorage |
| Container | Docker + nginx |
| API | The Color API (thecolorapi.com) |

## Color API

```
GET https://www.thecolorapi.com/id?hsl=0,100%,50%

Response:
{
  "hex": { "value": "#FF0000" },
  "rgb": { "r": 255, "g": 0, "b": 0 },
  "name": { "value": "Red", "exact_match_name": true }
}
```

## License

MIT
