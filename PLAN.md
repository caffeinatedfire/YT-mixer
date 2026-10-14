# Party DJ Mixer: implementation plan

## Goal
Web app where a casual party host pastes YouTube links into ONE shared queue. Two decks (A, B) take turns pulling the next song and crossfade into each other. One crossfader raises one deck while lowering the other. Master controls play/pause and mute both decks. No backend, no extension.

## Locked decisions (do not re-ask)
- Stack: Vite + React + TypeScript, plain CSS with variables, vitest. No UI library, no state library (use useReducer).
- Audio: YouTube IFrame Player API only (setVolume 0-100). No Web Audio, EQ or beat-matching.
- Layout: top = add-link bar. Middle = Deck A | Deck B side by side. Below = crossfader + master controls. Bottom = "Up next" queue.
- Queue flow: A plays track 1 while B has track 2 cued (paused). On a mix, B starts and fades in as A fades out. When done, A pauses and cues the next queue item. The crossfader slides left/right on each mix.
- Curve (equal-power): gainA = cos(x*PI/2), gainB = sin(x*PI/2), x = crossfader 0..1. Final volume = round(gain * deck trim).
- Persona: casual party host, so hands-off matters more than precision. Layer mode is cut.
- Design: clean and simple (Google/Coursera/Zomato feel). White background, one accent colour, system sans font. No hero headline, gradients, glassmorphism, emoji icons or marketing copy. The first screen is the tool itself.

## Known pitfalls
- requestAnimationFrame pauses in hidden tabs. Use setInterval + performance.now() for fades and the autopilot poll.
- React StrictMode double-mounts effects in dev. Create the player in an effect, destroy it in cleanup, and load the iframe_api script once via a shared promise.
- The API does not flag ads. Do not fade in the incoming deck on "PLAYING" alone until Phase 0 shows what is detectable.
- Playback errors (onError 2/5/100/101/150) are all handled identically: show one message, "Can't play this one: blocked or unavailable", and skip to the next queue item. Validate the 11-character video ID at paste time. (Q4 closed.)
- getCurrentTime() is 0.0 at the first PLAYING event, so never use it as an "audible" signal.
- Keep the embedded players visible (at least 200x200). This is from the embed terms, unverified.
- Titles come from player.getVideoData().title. Thumbnails come from img.youtube.com/vi/ID/mqdefault.jpg. No API key needed.
- iOS ignores setVolume. Show a one-line note and do not support it.

## Phase 0: Spike (throwaway spike.html, ~45 min)
Two IFrame players with a plain HTML page. Write findings to SPIKE.md:
1. Does ONE click on a button start both players (autoplay policy)?
2. Does a 60s volume ramp via setInterval stay smooth with the tab hidden?
3. During a pre-roll ad, what do getDuration(), getCurrentTime() and getVideoData() return, compared with the real song? Test 5 videos. Is there ANY reliable ad signal?
4. Which error code fires for an embed-blocked video?
GATE: stop and report. If (1) fails, we redesign before building.

Phase 0 status: see SPIKE.md. Q1 pass (in-app browser), Q4 closed; Q1b, Q2, Q3 pending a real-Chrome run by the host.

## Phase 1: Scaffold
Vite react-ts, vitest, folder layout: src/lib (pure logic), src/hooks, src/components, src/state. CSS variables for colours, spacing and type. Commit.

## Phase 2: Pure logic + tests (no UI)
- parseYouTubeId(url): handles watch?v=, youtu.be, shorts, embed, music.youtube.com, extra params (&t=, &list=). Returns null for garbage. Accept bare 11-char IDs too.
- gains(x): gains(0)=(1,0), gains(1)=(0,1), gains(0.5) is about (0.707, 0.707), and gainA^2 + gainB^2 is about 1 everywhere.
- queueReducer: add (supports multi-line paste), remove, pullNext, clear.
- mixReducer: states idle | playing(active deck) | transitioning(from, to, progress).
Tests first, then implementation.

## Phase 3: Player layer
useYouTubePlayer hook returns { cue, play, pause, setVolume, mute, unMute, getTime, getDuration, state, title, error }. Single script loader. Clean teardown. Verify with a throwaway page showing two players.

## Phase 4: Static UI + manual controls
Build the layout above. Wire: per-deck trim slider, manual crossfader (applies gains live), per-deck play/pause, time bar, thumbnail, title. Queue shows the list with a remove button.
GATE: stop and show me a screenshot. I will review the design before the logic goes further.

## Phase 5: Queue and deck handoff
Adding a link appends to the queue. The first two items auto-cue into A and B (paused). After a mix, the outgoing deck cues the next item. An empty queue shows "Add a song" on that deck. A deck error skips to the next item.
- ONLY if SPIKE.md Q1b fails: add the "unlock B" fallback (inside the Start click, play B at volume 0, then pause it). Can land here or in Phase 8.

## Phase 6: Transition engine
- "Mix now" button and a fade-length setting (default 6s).
- Sequence: start incoming deck at gain 0, wait for PLAYING (5s timeout fallback), ramp x to the other end, then pause the outgoing deck and cue the next item.
- Dragging the crossfader mid-fade cancels the auto fade.
- Guard against double-triggers.
- Default is manual "Mix now" (no reliable ad signal) until SPIKE.md Q3 says otherwise: do not blind-fade. Show the incoming deck's state and let the host press "Mix now" once the song is audible.

## Phase 7: Autopilot
Stays behind a toggle (off by default while Q3 is unresolved), plus a "start mixing N s before end" setting (default 8s). Poll the active deck every 250ms and trigger once per track. Fallback: if a deck hits ENDED with no mix, hard-cut to the other deck. Test in a hidden tab for 10 min.

## Phase 8: Master controls
- Play/Pause all: remembers which decks were playing and resumes exactly those. A cued deck stays paused, never silently playing.
- Mute all: mutes both decks and keeps each volume.
- Keyboard: Space = play/pause all, M = mute all, Left/Right = nudge crossfader.

## Phase 9: Polish + deploy
Empty states, error toasts, localStorage persistence for queue and settings (wrapped in try/catch), laptop-width layout, README listing limitations (ads, iOS volume, blocked embeds), deploy to Vercel.

## Out of scope
EQ, beat-match, Layer mode, playlist import, accounts, backend, mobile, Chrome extension.

## Working agreements
- One commit per phase, tests passing.
- Add no dependencies beyond react, vite, vitest and typing packages.
- Stop at the two GATES. Ask before changing the layout.
- Final acceptance: 6 real videos (including one embed-blocked), 20-minute autopilot run, tab hidden for half of it.