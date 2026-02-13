# Safe Journal (Sikker Dagbog) 🛡️

**A private, encrypted-first Progressive Web App (PWA) for journaling.**
*Safe Journal is designed for individuals in sensitive situations who need a secure place to document their thoughts and experiences without fear of discovery.*

![Status](https://img.shields.io/badge/Status-Beta-blue)
![Security](https://img.shields.io/badge/Security-AES--GCM-green)
![Privacy](https://img.shields.io/badge/Privacy-Local_Only-green)

---

## 🌟 Key Features

*   **🔒 Client-Side Encryption**: All data is encrypted in the browser using `AES-GCM` before being stored. The server (if one existed) would never see the raw data.
*   **🔑 Password Derivation**: Your master password is never stored. It derives an encryption key using `PBKDF2` (100,000 iterations).
*   **📱 PWA Support**: Installable on mobile and desktop. Works offline.
*   **🎙️ Secure Voice Notes**: Record audio journals which are encrypted on-the-fly.
*   **🚨 Panic Button**: Instantly nukes all local data in case of emergency.
*   **📊 Insights**: Emotional intensity tracking and statistics.
*   **🌍 Multi-language**: Supports English, Russian, and Danish.

---

## 🛠️ Technology Stack

*   **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Storage**: [Dexie.js](https://dexie.org/) (Wrapper for IndexedDB)
*   **Styling**: CSS Modules + Glassmorphism Design System + [Lucide Icons](https://lucide.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Testing**: [Vitest](https://vitest.dev/)

---

## 📂 Project Structure

```
safe-journal/
├── public/              # Static assets (icons, manifest)
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Login & Setup screens
│   │   ├── export/      # PDF Export logic
│   │   ├── journal/     # Editor, Card, List components
│   │   ├── layout/      # AnimatedLayout, Navigation
│   │   └── panic/       # Panic Button component
│   ├── hooks/           # Custom React Hooks
│   │   ├── useAuth.tsx         # Authentication state
│   │   ├── useEntries.ts       # CRUD for journal entries
│   │   └── useVoiceRecorder.ts # Audio recording & encryption logic
│   ├── i18n/            # Localization (i18next)
│   ├── services/        # Core Business Logic (Framework agnostic)
│   │   ├── auth.ts      # Key management & session handling
│   │   ├── crypto.ts    # Web Crypto API implementation (PBKDF2, AES-GCM)
│   │   └── storage.ts   # Dexie.js database schema & queries
│   ├── styles/          # Global CSS & Design Tokens
│   └── types/           # TypeScript interfaces
└── ...config files      # Vite, TS, ESLint
```

---

## 🔐 Security Architecture

### 1. Key Derivation (PBKDF2)
When a user sets a password:
1.  A random 16-byte `salt` is generated.
2.  `PBKDF2` derives a 256-bit Key Encryption Key (KEK) from the password + salt.
3.  This KEK encrypts a verification string ("VALID").
4.  The `salt` and `verificationBlock` are stored. **The password is never stored.**

### 2. Data Encryption (AES-GCM)
When saving an entry:
1.  A random 12-byte `IV` (Initialization Vector) is generated.
2.  The data (JSON) is encrypted using `AES-GCM` with the KEK and IV.
3.  The `IV` + `Ciphertext` + `AuthTag` are concatenated and stored as a Base64 string.

### 3. Audio Encryption
*   **Challenge**: Large audio blobs can cause stack overflows if converted naively.
*   **Solution**: We use `FileReader` to convert Blobs to Base64 in chunks/streams (optimized) before encryption.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/safe-journal.git
    cd safe-journal
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    npm ci
    ```

### Development

Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production

Create an optimized build:
```bash
npm run build
```
Preview the build locally:
```bash
npm run preview
```

### Testing

Run unit tests (covers Crypto, Storage, and Utils):
```bash
npm run test
```

---

## 🐛 Troubleshooting & FAQ

### "RangeError: Maximum call stack size exceeded" when recording audio
*   **Cause**: Converting large `Uint8Array` to string using spread syntax (`...array`) fails for large files.
*   **Fix**: Update `crypto.ts` to use `FileReader` or chunk-based processing for Blobs.

### "AddEntry is not a function"
*   **Cause**: Naming mismatch in `useEntries` hook versus `EntryEditor` component.
*   **Fix**: Ensure `useEntries` exports `createEntry`, and `EntryEditor` imports and uses `createEntry`.

### PWA not installing
*   **Requirement**: PWAs require `HTTPS` (or `localhost`) and a valid `manifest.json`.
*   **Check**: Look at the "Application" tab in Chrome DevTools -> "Manifest" for errors.

### Forgot Password?
*   **Result**: Data is **lost forever**.
*   **Reason**: Since the key is derived from the password, there is no backdoor or reset mechanism. This is a feature, not a bug.

---

## 🤝 Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
