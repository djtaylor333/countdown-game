# CountDown

A daily word and numbers puzzle game inspired by the British TV show *Countdown*, available as a **Progressive Web App** (GitHub Pages) and **Android app**.

Play at: **https://djtaylor333.github.io/countdown-game/**

---

## How to Play

Every day you get three rounds — same puzzle for all players worldwide:

### Letters Rounds (×2)
1. Pick 9 letters (choose Consonant or Vowel for each)
2. You have **30 seconds** to find the longest valid English word using those letters
3. Score = word length in points (18 pts for a full 9-letter word!)

### Numbers Round (×1)
1. Six numbers are revealed alongside a 3-digit target
2. You have **30 seconds** to combine the numbers using +, −, ×, ÷ to reach the target
3. Score: **10 pts** (exact) · **7 pts** (within 5) · **5 pts** (within 10) · **0 pts** (otherwise)

**Max daily score: ~46 points** (9 + 9 + 18 + 10 = theoretical max with full-house letters)

---

## Features

- 📅 **Daily challenge** — seeded by date, same puzzle for everyone
- 🔤 **Letters mode** — authentic Countdown letter frequencies
- 🔢 **Numbers mode** — recursive solver finds the optimal solution
- 📖 **Definitions** — best words explained via Free Dictionary API
- 🔥 **Streaks** — play and completion streaks tracked locally
- 📤 **Share results** — emoji summary for social sharing
- 📱 **PWA** — installable on iOS and Android from the browser
- ✅ **85 unit tests** — full TDD coverage of game logic

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
├── android-app/          Kotlin + Jetpack Compose (coming soon)
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

### Releasing

```powershell
# From repo root:
.\build-release.ps1 -BumpType patch   # bumps version, commits, tags, pushes
```

This triggers:
- **GitHub Pages deploy** (`deploy-web.yml`) — web app goes live at the GitHub Pages URL
- **Android APK/AAB release** (`build-android.yml`) — attached to the GitHub release

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
| Android | Kotlin + Jetpack Compose (planned) |
| CI/CD | GitHub Actions |

---

## License

MIT
