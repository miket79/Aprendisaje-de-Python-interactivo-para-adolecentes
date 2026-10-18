# Python Quest

Learn Python in 30 days: an interactive web app for teens, in **English** (default) and **Spanish**.
Each day follows the PRIMM method (Predict → Run → Investigate → Modify → Make), with a talking mascot, real Python running in the browser, XP and streaks.

The curriculum follows the topic order of [30 Days Of Python](https://github.com/Asabeneh/30-Days-Of-Python) by Asabeneh Yetayeh. The lessons themselves are original rewrites for teens.

## Quick start (macOS)

```bash
brew install node python@3.12      # once (or the Node.js LTS installer from nodejs.org)
npm install
npm run dev                        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm test` | Unit tests (bilingual content, exercise checks, streaks, error helpers) |
| `npm run build` | Production build in `dist/` (works from any sub-path, e.g. GitHub Pages) |
| `npm run voice:setup` | One-time Python env for voice-overs (Kokoro TTS, runs locally, free) |
| `npm run voice` | Generate or refresh voice-over MP3s for changed lines only |
| `npm run package` | Build the standalone executables in `release/` (needs Go: `brew install go`) |

## Installable app (recommended for students)

Every push to `main` publishes the app to GitHub Pages (`.github/workflows/deploy-pages.yml`).

One-time setup: make the repo public, then go to **Settings → Pages → Source** and choose **GitHub Actions**.

Students open <https://miket79.github.io/Aprendisaje-de-Python-interactivo-para-adolecentes/> and click **Install app**. It installs like a native app, with no OS security warnings, and works offline after the first visit: Python, voice-overs and fonts are all cached by a service worker. Student guide: [docs/INSTALL.md](docs/INSTALL.md).

## Standalone executables (alternative)

`npm run package` creates two files with the whole app built in: Python (Pyodide), voice-overs and fonts. Students don't need to install anything, and the app works offline.

| File | Runs on | How |
|---|---|---|
| `release/PythonQuest-Mac` | macOS 11+, Apple Silicon and Intel (universal) | Double-click. A Terminal window opens and the app opens in the browser. |
| `release/PythonQuest-Windows.exe` | Windows 10/11 (x64; also runs on ARM) | Double-click. A console window opens and the app opens in the browser. |

The executable serves the app only to this computer (`http://127.0.0.1:51730`). Closing its window quits the app. Progress is saved in the browser, per computer.

The first time someone runs the app, it shows a **personal-responsibility notice** about content from the 30 Days Of Python repository, and nothing else loads until they accept. The acceptance is saved per device. If you edit the notice text (`terms` in `src/i18n/locales/*.json`), bump `TERMS_VERSION` in `src/store/terms.ts` so everyone is asked again.

The files aren't signed, so the first launch shows a warning:

- **macOS:** right-click → **Open**, or *System Settings → Privacy & Security → Open Anyway*.
- **Windows SmartScreen:** **More info → Run anyway**.

Signing them (Apple Developer ID + notarization, and a Windows code-signing certificate) removes these warnings.

## Project map

```
src/content/lessons/   lesson content (EN/ES), shared with the voice-over tool
src/lessons/           lesson types, 30-day curriculum, exercise checks
src/python/            Pyodide in a Web Worker (timeouts, clean tracebacks)
src/audio/             voice-over playback (falls back to browser speech)
src/components/        Mascot (SVG + Motion), CodePlayground, Header, LanguageToggle
src/i18n/              UI translations
tools/tts/             voice-over generator (Python + Kokoro)
tools/launcher/        standalone executable (Go): embeds dist/ and opens the browser
docs/RESOURCES.md      dependencies, resources and learning-science notes (Spanish)
```

Full guide, in Spanish: [docs/RESOURCES.md](docs/RESOURCES.md).
