# Party Mixer

A two-deck YouTube mixer for a casual party host. Paste YouTube links into one shared queue. Decks A and B take turns pulling the next song, and a single equal-power crossfader blends them. No backend, no account, no extension.

## Using it

1. Paste one or more YouTube links (or bare 11-character video IDs) into the bar at the top and press Enter. The first song cues on deck A, the second on deck B, the rest wait in **Up next**.
2. Press **Play all** (or Space). Only the deck the crossfader favours starts.
3. When you want the next song: press **Start B**, check the video shows the song and not an ad, then press **Mix now to B**. B fades in, A pauses and loads the next song from the queue.
4. Or turn on **Autopilot**: it mixes into the other deck a few seconds (default 8) before the current song ends.

Dragging the crossfader during a fade stops the fade and leaves it where you put it.

**Volume faders.** Above the crossfader, each deck has a vertical volume bar.
- **Link volumes** checked (default): the bars follow the crossfader. Sliding it left to right takes A from 100 to 0 and B from 0 to 100 on an equal-power curve. Dragging either bar moves the crossfader, so the other bar follows.
- **Link volumes** unchecked: each bar sets its deck's volume on its own, and the crossfader is disabled. Mix now and autopilot still work: they fade the louder deck to 0 and the other deck up to 100.
- Switching between the two keeps what you hear. Unlinking keeps both levels. Re-linking keeps the A/B balance, so overall loudness may change.

Each deck's **Trim** still scales its final volume in both modes.

| Key | Action |
| --- | --- |
| Space | Play / pause all (resumes exactly the decks that were playing) |
| M | Mute / unmute all (each deck keeps its volume) |
| Left / Right | Nudge the crossfader (only while volumes are linked) |

The queue, the songs on each deck, the trims, fade length, autopilot and Link volumes settings are saved in the browser and come back after a reload.

## Limitations

- **Ads.** The YouTube IFrame API gives no reliable way to tell a pre-roll ad from the song. Mixing is manual by default: you start the incoming deck and check it before fading. Autopilot can't check, so an ad may play during an automatic fade.
- **iPhone and iPad.** iOS ignores `setVolume`, so the crossfader and trims do nothing there. The app shows a one-line note and is not supported on iOS.
- **Blocked embeds.** Some videos can't be embedded (YouTube error 2/5/100/101/150). The app shows "Can't play this one: blocked or unavailable" and skips to the next song.
- **Players stay visible.** Both embedded players stay on screen (at least 200x200), as the YouTube embed terms appear to require.
- **Hidden tabs.** Fades and autopilot use `setInterval`, not `requestAnimationFrame`, so they keep running when the tab is in the background. Chrome slows timers in background tabs, but makes an exception for pages that are playing audio.
- **Mobile.** Built for laptop widths (1024px and up shows decks and queue side by side). Smaller screens stack, but phones are not a target.

## Development

Needs Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build      # typecheck + production build into dist/
```

Serve over `http://localhost`, never `file://`: the YouTube player needs a real origin.

`public/spike.html` is the Phase 0 test page (two raw players). It is deployed as-is: open `/spike.html` on the dev server or the deployed site. Findings are in `SPIKE.md`.

### Layout

- `src/lib`: pure logic (link parsing, gains, fades, autopilot decisions, storage, config)
- `src/state`: reducers (queue, decks, mix state)
- `src/hooks`: YouTube player, deck loading, transition engine, autopilot, keyboard
- `src/components`: UI

## Deploying to Vercel

It's a static Vite app, so Vercel's defaults work:

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Framework preset **Vite**; build command `npm run build`; output directory `dist`.
4. Deploy.
