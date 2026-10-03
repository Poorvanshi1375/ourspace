---
name: run-ourspace
description: Launch the OurSpace React + Firebase app locally and drive it end-to-end in headless Chrome (sign up, create/join a space, scrapbook add/drag/rotate/delete, shared letters vs private drafts). Use to run the app or verify a change in the real UI.
---

# Run and drive OurSpace

Create React App frontend talking directly to the live Firebase project `ourspace-dev`
(Auth + Firestore) and Cloudinary (uploads). There is no local backend or emulator.

## 1. Dev server

Check whether one is already running first — the user often has `npm start` open:

```bash
curl -s http://localhost:3000 | grep -o "<title>[^<]*</title>"   # "<title>OurSpace</title>" = ours, reuse it
```

If nothing is listening, start it in the background (no browser tab):

```bash
BROWSER=none PORT=3000 npm start
timeout 120 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 2; done'
```

Don't kill a server you didn't start.

## 2. Drive it

```bash
npm run e2e        # scripts/e2e-check.js — exits 1 if any check fails
```

- Uses Playwright with the system Chrome (`channel: "chrome"`), so no browser download is
  needed. If Chrome is missing, install it or change the channel to `msedge`.
- Creates two fresh accounts `qa.a.<ts>@example.com` / `qa.b.<ts>@example.com`
  (password `qa-test-123`), account A creates a space, B joins with the code.
- Prints PASS/FAIL per check plus console errors; screenshots go to `e2e-output/`.
  **Look at the screenshots** — a passing run with a blank page is still a failure.
- Expected console errors: B's `Missing or insufficient permissions` when opening A's
  draft. That is the security rule working.

For a one-off interaction, copy the login block from `scripts/e2e-check.js`
(fill `input[name="email"]` / `input[name="password"]`, click `button[type="submit"]`,
wait for `**/dashboard`) and add your steps.

## 3. Clean up test data

QA accounts and everything they created stay in `ourspace-dev`. Remove them with:

```bash
npm run cleanup:qa            # dry run
npm run cleanup:qa -- --yes   # delete
```

Needs a service account key saved as `serviceAccountKey.json` in the project root
(git-ignored). It only deletes spaces whose members are all QA accounts.

## Gotchas (all hit in practice)

- **Drags need many small pointer moves.** interact.js ignores a 2-step move; use a loop
  of ~20 `mouse.move` calls between `down()` and `up()`.
- **Wait for modals to close before interacting with the canvas.** Upload modals stay
  open until Cloudinary + Firestore finish; the new item can render behind the overlay.
- **Letters load after ~1.5 s** (profile + note fetch). Use `waitFor`, never an immediate
  `count()`.
- **Picking a date:** the dashboard calendar renders only day buttons
  (`button.planner-calendar-cell`), so day N is `.nth(N - 1)`. Pages like Letters and
  New memory need that selection — they read the date from router state.
- **Scrapbook URL is direct:** `/scrapbook/YYYY-MM-DD` works without the dashboard.
- **New Firestore indexes take a few minutes to build** after `firebase deploy`; until then
  queries fail with an "index is building" error in the console.
- Firebase CLI isn't installed globally: use `npx firebase-tools <command>`.
