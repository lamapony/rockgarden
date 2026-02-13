# Rockgarden 🪨

**Your private, encrypted-first Progressive Web App (PWA) for journaling.**

*Rockgarden is designed for individuals who need a secure, private space to document their thoughts, experiences, and emotions. Built with privacy as the foundation.*

![Status](https://img.shields.io/badge/Status-Production-green)
![Security](https://img.shields.io/badge/Security-AES--256--GCM-green)
![Privacy](https://img.shields.io/badge/Privacy-Local_Only-green)
![Languages](https://img.shields.io/badge/Languages-14-blue)

**🌐 Live Demo**: [https://lamapony.github.io/rockgarden](https://lamapony.github.io/rockgarden)

---

## 🌟 Key Features

*   **🔒 Military-Grade Encryption**: All data is encrypted using `AES-256-GCM` before storage. Your encryption key is derived from your password and never stored.
*   **🔑 Secure Password Derivation**: Uses `PBKDF2` with 100,000 iterations and a unique random salt.
*   **📱 PWA Support**: Installable on mobile and desktop. Works completely offline.
*   **🎙️ Secure Voice Notes**: Record audio journals that are encrypted on-the-fly.
*   **📊 Pattern Analysis**: Track emotional intensity over time with beautiful visualizations.
*   **📄 PDF Export**: Generate reports with Unicode support for legal documentation.
*   **🌍 14 Languages**: Full i18n support for English, Russian, Danish, Lithuanian, Latvian, Estonian, Ukrainian, Polish, Portuguese, Spanish, French, German, Italian, and Turkish.
*   **🎨 Visual Metaphors**: White stone garden visualization - larger stones for intense moments, fading opacity with time.
*   **🚨 Panic Button**: Triple-tap the logo for instant lock. Optional Burn PIN for emergency data deletion.
*   **⏱️ Auto-Lock**: Automatically locks after period of inactivity.

---

## 🛠️ Technology Stack

*   **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Routing**: [React Router](https://reactrouter.com/) (HashRouter for GitHub Pages compatibility)
*   **Storage**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
*   **Styling**: CSS Modules + Glassmorphism Design System + [Lucide Icons](https://lucide.dev/)
*   **Charts**: [Chart.js](https://www.chartjs.org/)
*   **PDF**: [jsPDF](https://parall.ax/products/jspdf) with Unicode transliteration
*   **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
*   **i18n**: [i18next](https://www.i18next.com/) with lazy loading

---

## 📂 Project Structure

```
safe-journal/
├── public/                   # Static assets (icons, manifest)
├── src/
│   ├── components/           # React components
│   │   ├── auth/             # Login & Setup screens
│   │   ├── export/           # PDF Export functionality
│   │   ├── journal/          # Editor, Card, List, Stone visualizations
│   │   ├── landing/          # Landing/Promo page
│   │   ├── layout/           # Navigation, AutoLock, PWA notifications
│   │   └── settings/         # Settings page
│   ├── hooks/                # Custom React Hooks
│   │   ├── useAuth.tsx       # Authentication state & key management
│   │   ├── useEntries.ts     # CRUD for journal entries
│   │   └── useVoiceRecorder.ts # Audio recording & encryption
│   ├── i18n/                 # Localization (14 languages)
│   │   ├── config.ts         # i18next configuration
│   │   └── locales/          # Translation files
│   ├── services/             # Core Business Logic
│   │   ├── analytics.ts      # Pattern analysis & statistics
│   │   ├── auth.ts           # Web Crypto API - key derivation
│   │   ├── crypto.ts         # Web Crypto API - AES encryption
│   │   ├── pdf.ts            # PDF generation with Unicode support
│   │   └── storage.ts        # Dexie.js database schema
│   ├── styles/               # Global CSS, themes, design tokens
│   └── types/                # TypeScript interfaces
└── ...config files
```

---

## 🔐 Security Architecture

### Zero-Knowledge Design
*   **No password storage**: Your password is never stored anywhere
*   **No cloud**: Everything stays on your device
*   **No tracking**: No analytics, no cookies, no external requests

### Key Derivation (PBKDF2)
1.  A random 16-byte `salt` is generated per account
2.  `PBKDF2` derives a 256-bit Key Encryption Key (KEK) from password + salt (100,000 iterations)
3.  This KEK encrypts a verification string to validate password correctness
4.  Only `salt` and `verificationBlock` are stored locally

### Data Encryption (AES-256-GCM)
1.  Random 12-byte `IV` generated for each entry
2.  Data encrypted using AES-256-GCM with the KEK
3.  IV + Ciphertext + AuthTag stored as Base64

### Side-Channel Protection
*   Randomized timing delays (800-1500ms) for password verification to prevent timing attacks

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v20+)
*   npm

### Installation

```bash
git clone https://github.com/lamapony/rockgarden.git
cd rockgarden/safe-journal
npm ci
```

### Development

```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
```

### Testing

```bash
npm test
```

---

## 🌍 Supported Languages

| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| Russian | ru | Русский |
| Danish | da | Dansk |
| Lithuanian | lt | Lietuvių |
| Latvian | lv | Latviešu |
| Estonian | et | Eesti |
| Ukrainian | uk | Українська |
| Polish | pl | Polski |
| Portuguese | pt | Português |
| Spanish | es | Español |
| French | fr | Français |
| German | de | Deutsch |
| Italian | it | Italiano |
| Turkish | tr | Türkçe |

---

## 🐛 Troubleshooting

### Forgot Password?
**Data is lost forever.** Since the encryption key is derived from your password, there is absolutely no backdoor or reset mechanism. This is by design for your security.

### Data Export Before Updates
Always export your data before app updates. The encrypted export can be re-imported later.

### PWA Installation
Requires HTTPS (or localhost) and a valid manifest. Check Chrome DevTools → Application → Manifest for errors.

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
1. All tests pass (`npm test`)
2. TypeScript compiles without errors (`npm run build`)
3. Follow the existing code style

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

Built with care for those who need a safe space to document their experiences. Special focus on supporting survivors of domestic violence and abuse across multiple regions and languages.
