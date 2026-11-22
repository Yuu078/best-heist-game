# The Gilded Hour

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Yuu078/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Yuu078/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game for make.fun's **best-heist-game** bounty. One
thief, three museum floors at night, and one **Gilded Scarab** waiting on a
pedestal on each. Take the scarab, fill your pockets with whatever else is
under glass, and reach the getaway van before the alarm fills.

The game is plain static files — vanilla JavaScript on a canvas, no library,
no build step, no network request — and every sound is synthesised live with
WebAudio.

## How it plays

- **Read the room before you move.** Guards walk waypoint patrols and pause
  to scan; their amber vision cones are blocked by pillars and tall walls,
  never by the low display cases. Cameras sweep their own cones from the
  walls.
- **Being seen fills the alarm.** A guard's gaze fills it in about 0.8
  seconds — fair, if you are watching the cones. Break line of sight and it
  drains. Full alarm is caught, and the floor restarts.
- **Sneak (Shift)** to cross the edge of a cone: slower, but the alarm
  charges at under half rate while you sneak.
- **Decoy coins (click)** ring where they land and pull any guard in
  earshot off his patrol to investigate. Coins are limited per floor.
- **EMP (E)** blacks out every camera for 8 seconds — at a cost of 150 off
  your haul, so it is a tool, not a habit.
- Every room has more than one way in: doors, vents, and staggered gaps.
  Side loot is optional points; the scarab is not. The van will not leave
  without it.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Sneak (slow, quiet) |
| Mouse click | Throw a decoy coin |
| E | Fire an EMP charge |
| R | Restart the floor |
| Enter / click | Begin, advance, play again |

## Layout of the entry

- `main.ts` — the hand-in program (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output directory and writes
  `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the make.fun dossier library, copied unchanged.
- `game/index.html` — the page: canvas, HUD (alarm meter, haul, timer,
  tools) and banners.
- `game/src/` — one job per file: `levels.js` (the three floors as data,
  plus wall collision and line of sight), `player.js`, `guard.js`,
  `camera.js`, `alarm.js`, `render.js` (procedural marble, light and
  cones), `audio.js` (synthesised sound), `input.js`, and `main.js` (the
  loop and the screenshot scenes).
- `screenshots/` — three renders of the game itself, posed through its own
  `?shot=1|2|3` scenes: mid-hall under a guard's gaze, sneaking the edge of
  a cone, and the getaway with the alarm at 85.

## Run it

Play: serve `game/` with any static file server and open `index.html` in a
desktop browser.

Hand in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` writes
`game/`, `screenshots/` and `dossier.json` into `out/`.

## License

MIT — see `LICENSE`.
