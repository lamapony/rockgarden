# Rockgarden — Agent Development Notes

## Project Overview
Rockgarden is an encrypted journal PWA built with React 19, TypeScript, and Vite. Uses client-side AES-256-GCM encryption via Web Crypto API with zero-knowledge architecture.

## Tech Stack
- React 19 + TypeScript 5.7
- Vite 6 (build tool)
- Dexie.js (IndexedDB wrapper)
- jsPDF (PDF export)
- Vitest (testing)

## Security Model
- **Encryption**: AES-256-GCM with random IV per entry
- **Key Derivation**: PBKDF2 with 100,000 rounds
- **Side-channel Protection**: Randomized artificial delays (800-1500ms)
- **Zero-knowledge**: Password-derived key never stored, session key in memory only

## Internationalization
14 languages supported via `src/i18n/`:
- en, ru, da, lt, lv, et, uk, pl, pt, es, fr, de, it, tr

Translation files follow pattern: `src/i18n/locales/{lang}.ts`

## Key Components
- `LandingPage.tsx` — Landing page with language auto-detection
- `JournalPage.tsx` — Main journal interface
- `StoneVisualization.tsx` — Garden visualization with stone metaphor
- `Onboarding.tsx` — First-time user tutorial
- `SettingsPage.tsx` — App settings with theme options

## Services
- `encryption.ts` — Web Crypto API wrapper
- `storage.ts` — IndexedDB persistence via Dexie
- `auth.ts` — Password-based key derivation and session management
- `pdf.ts` — PDF export with Unicode transliteration for 14 languages

## Testing
```bash
npm test           # Run all tests
npm run test:ui    # Run with UI
```

## Build & Deploy
```bash
npm run build      # Production build to `dist/`
npm run deploy     # Deploy to GitHub Pages
```

## File Structure
```
src/
  components/
    landing/       # Landing page components
    journal/       # Journal UI (entries, visualization)
    auth/          # Authentication flow
    settings/      # Settings page
    onboarding/    # Tutorial modal
  hooks/           # Custom React hooks
  i18n/            # Translations
  services/        # Core business logic
  types/           # TypeScript definitions
```

## Important Notes
- Uses HashRouter for GitHub Pages compatibility
- Service Worker handles offline caching
- Font files cached for 1 year in service worker
- Touch device detection via `pointer: coarse` + user agent
- Inverted metaphor: calm stones are large, intense stones are small
