# Lumen

Lumen is a guest-first Pomodoro timer for focused study and work. It combines a reliable countdown, a personal task list, YouTube-based focus music, and session statistics. The temporary product name lives in `src/config/app.ts` so it can be renamed later.

The first version is a fully client-side MVP. There is no account system, database, or paid API. Guest data stays in this browser.

## Features

- Deadline-based Pomodoro timer (Focus 25m, Short Break 5m, Long Break 15m, long break every 4 focus sessions)
- Start, pause, resume, reset, skip, and session switching
- Task list with an active task, edit, complete, delete, and undo
- Focus Music panel that embeds official YouTube playback from a pasted URL
- Daily and weekly statistics derived from completed focus sessions only
- Local persistence through a versioned `localStorage` adapter
- Dark, keyboard-accessible interface

## Requirements

- Node.js 22 or later
- npm 10 or later

## Local development

Install dependencies and start the Next.js dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm start` serves the production build after `npm run build`.

## How guest data is stored

Lumen writes JSON to `localStorage` under `lumen.v1.*` keys:

- Timer settings and a snapshot of the active timer
- Tasks and the selected active task
- Completed focus-session history
- The last YouTube URL and music-panel collapsed state
- An anonymous local guest id for future account migration

This is not a backup. Clearing site data, using another browser, or another device will not keep your history. Use **Settings → Reset local data** to delete it on purpose.

The app does not use cookies for storage.

## YouTube Focus Music

Paste a YouTube or YouTube Music URL and choose **Load**. Supported examples:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/playlist?list=PLAYLIST_ID`

Playback uses the official YouTube IFrame Player API. Lumen does not download, extract, or re-host audio. Some videos cannot be embedded. Ads, age restrictions, and regional limits are controlled by YouTube. Loading the player may allow Google to collect data under Google’s policies. The player is independent of the timer: pausing a Pomodoro does not pause the music.

## Architecture notes

- `src/features/timer` owns timer state as a reducer. Remaining time is calculated from an absolute deadline, not by subtracting one second per tick.
- `src/lib/storage.ts` is the only module that talks to `localStorage`.
- Tasks, sessions, and guest identity are modeled so a later authenticated backend can replace local storage without rewriting the UI.
- Collaborative study rooms are not implemented. The header includes a disabled **Rooms** label as a future-facing hint only.

## Testing

Vitest covers timer calculations, pause/resume, skip/reset, exactly-once completion, task updates, YouTube URL parsing, stats aggregation, and malformed storage payloads.

## Self-hosting later

This MVP is a standard Next.js application (`next build` / `next start`). When you are ready to host it on an Ubuntu server, a reverse proxy and HTTPS should sit in front of the Node process. Do not treat this README as a completed production deployment guide; no server, domain, or TLS setup is included yet.

## Known limitations

- Data is local to one browser.
- YouTube autoplay is not attempted; you must press play on the embedded player.
- Browser notification support varies; permission is requested from Settings.
- Completion chime uses the Web Audio API and stays off until enabled.
- Study rooms, accounts, and server sync are out of scope for the MVP.
