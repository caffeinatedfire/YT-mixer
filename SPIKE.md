# Phase 0 spike findings

Test page: `spike.html` (served via `python -m http.server`, in the Claude desktop in-app browser).
Videos: Rick Astley `dQw4w9WgXcQ`, PSY `9bZkp7q19f0`.

## 1. One click starts both players: PASS (with caveat)
A single click handler calling `playVideo()` on both players put both in PLAYING within ~1.2s
(UNSTARTED -> BUFFERING -> PLAYING). Caveat: tested in the in-app browser, not desktop Chrome/Safari,
whose autoplay policies are stricter. Re-check in real Chrome before Phase 1.

## Real-Chrome results (host, 2026-10-15, on https://yt-mixer-two.vercel.app): ALL CLOSED
The host ran every pending test from the test plan and reported all OK:
Q1b, Q2, Q3, Space on a focused button, the 10-minute hidden-tab autopilot run, and the final
acceptance run (6 videos including one blocked, 20 minutes, tab hidden for half).
Consequences:
- Q1 confirmed in real Chrome.
- Q1b passed, so the "unlock B" fallback is **not needed** and was not built.
- Q2 passed: setInterval fades stay usable with the tab hidden.
- Q3: no reliable ad signal was reported, so **manual Mix now stays the default**
  (`AD_SIGNAL_RELIABLE = false`) and autopilot stays opt-in with its ad warning.

## 1b. B started later from a timer (no gesture): PASS (real Chrome)
Button "Q1b": click plays A only; 20s later a `setTimeout` calls `P.b.setVolume(100)` then `P.b.playVideo()`.
Log shows B's state at +2s and +5s. Result: OK per host.
Decision: add the "unlock B" fallback (play B at volume 0 then pause, inside the Start click) ONLY if this fails. Not needed.

## 2. 60s volume ramp with tab hidden: PASS (real Chrome, host)
Original in-app-browser notes:
`setInterval(250ms)` + `performance.now()` ramp ran smoothly (max gap 266ms, so no drift)
but `document.hidden` stayed `false` the whole time. The in-app browser did not really hide the tab
even with another tab in front. Needs a manual test in real Chrome: open spike.html, press Q2, switch tab,
return, read the log (`maxGap` and `hidden=true` lines). Expect throttling to ~1s in background tabs,
which is fine for fades.

## 3. Ad signal during pre-roll: CLOSED, no reliable signal adopted
Host ran the auto-probe in real Chrome and reported OK. No reliable ad signal was reported, so the decision below stands.
Original in-app-browser notes: no ad appeared in any load, so nothing to compare. Observed for normal playback:
`getDuration()` = 214 / 253, `getVideoData()` returns title, `video_id`, `author`; `getVideoUrl()` works.
Idea to check manually once an ad shows: compare `getVideoData().video_id` and `getDuration()` against
the expected video (ads reportedly return the ad's duration, or video_id mismatch).
Until confirmed, Phase 6 should follow the "no reliable ad signal" path (host presses Mix now).
Button "Q3 auto-probe" now probes both players every 3s for 60s; state changes are logged as they happen.
**Decision (final):** Phase 6 defaults to manual "Mix now" until this section says a reliable ad signal exists.
Autopilot (Phase 7) stays behind a toggle.

## 4. Embed-blocked error code: CLOSED
**Decision:** every error code (2/5/100/101/150) is handled identically. Validate the 11-character ID at paste time.
Show one message, "Can't play this one: blocked or unavailable", then skip to the next queue item.

Original notes:
Every bad ID tested returned **150**, including the garbage IDs `aaaaaaaaaaa` and `abc`
(docs say invalid IDs give 2 or 100). I did not have a known embed-blocked video to test with, and
the two "blocked" candidates I tried also returned 150. So: handle 2/5/100/101/150 identically (as planned);
150 is at least what blocked and invalid both produce here. After the error the player stays at
state -1 with empty title and duration 0.

## Other observations
- Both players fire `onReady` ~1s after API load.
- `getCurrentTime()` is 0.0 at the first PLAYING event, so never use it as an "audible" signal (now a pitfall in PLAN.md).
