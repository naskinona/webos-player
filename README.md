# Netflix-like App for webOS TV

A full-featured streaming application built with React, TypeScript, and Vite, designed specifically for LG webOS TV platform. Features spatial navigation for remote control, TMDB integration for content, and a Netflix-like UI.

## Features

- 🎬 **Full Streaming Experience** - Browse movies, TV shows, search, and play content
- 📺 **webOS TV Optimized** - Spatial navigation for remote control, hardware acceleration
- 🔍 **TMDB Integration** - Real movie/TV data from The Movie Database API
- 👤 **User Profiles** - Multiple profiles with continue watching and My List
- 🎮 **Remote Control Navigation** - Full spatial navigation support (up/down/left/right/enter/back)
- 📱 **Responsive Design** - Works on TV, desktop, and mobile for testing
- ⚡ **Performance Optimized** - Code splitting, lazy loading, skeleton screens

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API requests
- **TMDB API** for content data
- **webOS CLI** for packaging and deployment

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- TMDB API key (free from [themoviedb.org](https://www.themoviedb.org/settings/api))
- webOS TV or emulator for testing

### Installation

1. Clone and navigate to the project:
```bash
git clone https://github.com/naskinona/webos-player.git
cd webos-player
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Add your TMDB API key to `.env`:
```env
VITE_TMDB_API_KEY=your_actual_api_key_here
```

### Development

Start the development server:
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Building for webOS

Build the production bundle:
```bash
npm run build
```

Package for webOS:
```bash
npm run webos:pack
```

This creates a `.ipk` file in the `dist` folder.

### Installing on webOS TV

1. Enable Developer Mode on your webOS TV:
   - Settings → General → About This TV → Developer Mode
   - Turn on Developer Mode
   - Note the TV's IP address

2. Install the app:
```bash
npm run webos:install -- --device <TV_IP_ADDRESS>
```

3. Launch the app:
```bash
npm run webos:launch
```

## Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   └── Header.tsx          # Navigation header with profile menu
│   └── UI/
│       └── LoadingSpinner.tsx  # Loading states and skeletons
├── context/
│   └── AppContext.tsx          # Global state (profiles, continue watching, my list)
├── hooks/
│   └── useSpatialNavigation.ts # Remote control spatial navigation
├── pages/
│   ├── Home.tsx                # Main home page with hero and content rows
│   ├── Movies.tsx              # Movies browse page
│   ├── TVShows.tsx             # TV shows browse page
│   ├── MyList.tsx              # User's saved list
│   ├── Search.tsx              # Search with suggestions
│   ├── Detail.tsx              # Content detail page
│   ├── Player.tsx              # Video player with controls
│   └── ProfileSelect.tsx       # Profile selection screen
├── services/
│   └── api.ts                  # TMDB API service
├── types/
│   └── tmdb.ts                 # TypeScript types for TMDB
├── utils/
│   └── webos.ts                # webOS platform utilities
├── styles/
│   └── global.css              # Global styles and CSS variables
├── App.tsx                     # Main app with routing
└── main.tsx                    # Entry point
```

## Spatial Navigation

The app uses a custom spatial navigation system (`useSpatialNavigation`) designed for TV remote controls:

- **Arrow Keys** - Navigate between focusable elements
- **Enter/Space** - Select/activate focused element
- **Backspace/Escape** - Go back
- **Auto-scrolling** - Focused elements scroll into view
- **Row-based navigation** - Up/down moves between rows, left/right within rows

### Adding Spatial Navigation to Components

```tsx
const { containerRef, focusedElement, navigate, focusElement } = useSpatialNavigation({
  containerSelector: '[data-nav-container="my-page"]',
  itemSelector: '[data-focusable]',
  rowSelector: '[data-nav-row]',
  onEnter: () => {
    // Handle Enter key on focused element
    if (focusedElement?.dataset.action === 'play') {
      // Play video
    }
  },
  onBack: () => {
    // Handle Back key
    navigate(-1);
  },
});

// Add to container element
<div ref={containerRef} data-nav-container="my-page">

// Add to focusable elements
<button data-focusable data-nav-row="row-1" data-action="play">
```

## webOS Specific Features

### Remote Control Keys

The app handles standard webOS remote keys:
- Navigation: Up, Down, Left, Right, Enter, Back
- Media: Play/Pause, Stop, Rewind, Fast Forward
- Volume: Up, Down, Mute
- Colors: Red, Green, Yellow, Blue
- Numbers: 0-9

### Hardware Acceleration

The app is configured for hardware-accelerated video playback on webOS.

### DRM Support

The `webos.ts` utility includes DRM detection for Widevine and PlayReady.

## TMDB API

The app uses TMDB API for content. Key endpoints used:

- `/trending` - Trending content
- `/movie/popular`, `/tv/popular` - Popular content
- `/movie/top_rated`, `/tv/top_rated` - Top rated
- `/movie/now_playing` - Now playing in theaters
- `/movie/upcoming` - Upcoming movies
- `/discover` - Discover by genre
- `/search/multi` - Search movies, TV, people
- `/movie/{id}`, `/tv/{id}` - Details with videos, credits, recommendations

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TMDB_API_KEY` | TMDB API key | Yes |
| `VITE_TMDB_BASE_URL` | Custom API base URL | No |
| `VITE_TMDB_IMAGE_BASE_URL` | Custom image CDN URL | No |
| `VITE_DEBUG` | Enable debug logging | No |

## Deployment

### Production Build

```bash
npm run build
```

Output in `dist/` folder, ready for webOS packaging.

### webOS App Info

Configured in `appinfo.json`:
- App ID: `com.netflix.webos`
- Required permissions: internet, mediaPlayback, mediaRecording, storage
- Minimum memory: 256MB
- Resolution: 1920x1080

## License

MIT License - feel free to use for learning or commercial projects.

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for the excellent movie/TV API
- [LG webOS](https://webostv.developer.lge.com/) for the TV platform
- Netflix for UI/UX inspiration