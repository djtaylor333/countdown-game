# CountDown

[![Deploy PWA](https://github.com/djtaylor333/countdown-game/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/djtaylor333/countdown-game/actions/workflows/deploy-web.yml)
[![Build Android](https://github.com/djtaylor333/countdown-game/actions/workflows/build-android.yml/badge.svg)](https://github.com/djtaylor333/countdown-game/actions/workflows/build-android.yml)
![Version](https://img.shields.io/badge/version-1.0.4-blue)

A daily word and numbers puzzle game inspired by the British TV show *Countdown*, available as a **Progressive Web App** (GitHub Pages) and **Android app**.

Play at: **https://djtaylor333.github.io/countdown-game/**

---

## How to Play

Every day you get three rounds — same puzzle for all players worldwide:

### Letters Rounds (×2)
1. Pick 9 letters (choose Consonant or Vowel for each)
2. You have **60 seconds** to find the longest valid English word using those letters
3. Score = word length in points (18 pts for a full 9-letter word!)

### Numbers Round (×1)
1. Pick 6 numbers — choose **Large** (25/50/75/100) or **Small** (1–10) for each slot
2. You have **60 seconds** to combine the numbers using +, −, ×, ÷ to reach the target
3. Score: **10 pts** (exact) · **7 pts** (within 5) · **5 pts** (within 10) · **0 pts** (otherwise)

**Max daily score: ~46 points** (9 + 9 + 18 + 10 = theoretical max with full-house letters)

---

## Features

- 📅 **Daily challenge** — seeded by date, same puzzle for everyone
- 🎮 **Three modes** — Daily, Practice (no timer, random puzzle), Full Game (9 rounds)
- 🔤 **Letters mode** — authentic Countdown letter frequencies; keyboard input supported
- 🔢 **Numbers mode** — recursive solver finds the optimal solution
- 📖 **Definitions** — best words explained via Free Dictionary API
- 🔥 **Streaks** — play and completion streaks tracked locally
- 📤 **Share results** — emoji summary for social sharing
- 📱 **PWA** — installable on iOS and Android; responsive layout for portrait/landscape and desktop
- ✅ **110 unit tests** — full TDD coverage of game logic

---

## Project Structure

```
countdown-game/
├── web-app/              Next.js 15 PWA (GitHub Pages)
│   ├── src/
│   │   ├── app/          Pages: home, game, results
│   │   ├── components/   UI components
│   │   └── logic/        Game logic (letters, numbers, streak, etc.)
│   └── public/
│       ├── data/         wordlist.json (202,565 words)
│       └── icons/        PWA icons
├── android-app/          Kotlin + Jetpack Compose (Hilt, DataStore)
├── .github/workflows/    CI/CD (GitHub Pages + Android release)
├── build-release.ps1     Release automation script
└── version.json          Current version
```

---

## Development

### Web App

```bash
cd web-app
npm install
npm run dev      # http://localhost:3000
npm test         # run unit tests
npm run build    # production build
```

### Android App

```bash
cd android-app
./gradlew assembleDebug     # debug APK
./gradlew test              # unit tests
```

### Android Release Signing (GitHub Secrets)

The Android release job requires four repository secrets. Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|--------|-------|
| `KEYSTORE_BASE64` | Base64-encoded PKCS12 keystore file |
| `KEYSTORE_PASSWORD` | Keystore store password |
| `KEY_ALIAS` | Key alias inside the keystore |
| `KEY_PASSWORD` | Key password |

**Generating a new keystore** (run once, keep the file safe):
```bash
keytool -genkeypair -v \
  -keystore countdown-release.jks \
  -alias countdown-key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype PKCS12 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD

# Encode for GitHub secret (Linux/macOS):
base64 -w 0 countdown-release.jks

# Encode for GitHub secret (Windows PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("countdown-release.jks"))
```

Paste the encoded output as `KEYSTORE_BASE64`.

### Releasing

```powershell
# From repo root:
.\build-release.ps1 -BumpType patch   # bumps version, commits, tags, pushes
```

This triggers:
- **GitHub Pages deploy** (`deploy-web.yml`) — web app goes live at the GitHub Pages URL
- **Android APK/AAB release** (`build-android.yml`) — attached to the GitHub release

---

## CI/CD Pipeline

### Web App — GitHub Pages

```
push to main
    └─► deploy-web.yml
            ├── npm ci
            ├── npm test               (110 unit tests — must pass)
            ├── npm run build          (Next.js static export → out/)
            └── Deploy to gh-pages     → https://djtaylor333.github.io/countdown-game/
```

Workflow file: [`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml)

Triggers on every push to `main`.

### Android App — GitHub Releases

```
push tag v*
    └─► build-android.yml
            ├── Set up JDK 17
            ├── Generate wordlist        (scripts/generate_wordlist.py)
            ├── ./gradlew test           (unit tests — must pass)
            ├── ./gradlew assembleRelease  → .apk
            ├── ./gradlew bundleRelease   → .aab
            └── Create GitHub Release
                    ├── countdown-game-v*.apk  (sideloadable)
                    └── countdown-game-v*.aab  (Play Store)
```

Workflow file: [`.github/workflows/build-android.yml`](.github/workflows/build-android.yml)

Triggers on any `v*` tag push alongside the web deploy.

### Release Flow

```
1. Make code changes
2. Run: .\build-release.ps1 -BumpType patch
        │
        ├── Bumps version.json + build.gradle
        ├── git commit "chore: bump to vX.Y.Z"
        └── git tag -a vX.Y.Z
            └── git push --tags
                    │
                    ├── GitHub Actions: deploy-web.yml  ─► PWA live
                    └── GitHub Actions: build-android.yml ─► APK/AAB release
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 15 (static export) |
| Styling | Tailwind CSS v3 + custom CSS animations |
| Language | TypeScript 5 |
| Testing | Jest 29 + ts-jest + Testing Library |
| PWA | next-pwa v5 (Workbox) |
| Word list | 202,565 words (dwyl/english-words) |
| Definitions | Free Dictionary API |
| Android | Kotlin 2.1 + Jetpack Compose + Hilt |
| CI/CD | GitHub Actions (deploy-web.yml + build-android.yml) |

---

## License

MIT
