# OurSpace

A digital scrapbook that feels handmade — polaroids, handwritten notes, washi tape, stickers and
sealed letters — made to be gifted to the people you love.

Friends share a private **space**. Inside it they make **books** spread by spread, write letters that
can stay sealed until a date, see every day they've kept on a timeline, and chat. A book can be
sent as a **gift link** that opens like a real envelope, with no login needed.

**Live:** https://ourspace-dev.web.app

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Bug fixes, security rules, test tooling | Done |
| 1 | New data model: books → spreads → elements | Done |
| 2 | Redesigned screens: home, shelf, spread editor, letters, timeline | Done (old screens retired) |
| 3 | Gift viewer: no-login link, envelope opening, time capsule, replies | Done |

## Tech

- React 19 (Create React App), React Router 7
- Firebase Authentication (email + Google) and Cloud Firestore
- Cloudinary for photo, video and document uploads
- react-moveable for drag / resize / rotate in the spread editor

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase and Cloudinary values
npm start                    # http://localhost:3000
```

`.env.local` is git-ignored. Restart `npm start` after changing it.

## Deploy

```bash
npm run deploy        # production build + Firebase Hosting (https://ourspace-dev.web.app)
npm run smoke:prod    # checks the live site through the real UI, including a logged-out gift link
```

Hosting serves `build/` and sends every path to the app, so links like `/gift/<token>` work.
The build reads `.env.local`, so deploy from a machine that has it.

## Firebase

- Security rules: [`firestore.rules`](firestore.rules) — only members of a space can read or write
  it, private drafts are readable only by their author, sealed letters open only on their date,
  and joining a space can only add yourself. Old-scrapbook memories are read-only.
- Books: members of a space read and edit its books. A gifted book opens without login through
  its secret link: the cover always, the pages only after its unlock date; the link can't list
  anything else, and turning it off revokes it.
- Indexes: [`firestore.indexes.json`](firestore.indexes.json)
- Deploy both: `npx firebase-tools deploy --only firestore`

The Firebase web API key is public by design; access to data is controlled by the rules above, and
the key is restricted to the app's own domains and to the Auth and Firestore APIs.

## Checks and scripts

| Command | What it does |
| --- | --- |
| `npm run e2e` | Drives the real app in headless Chrome: sign-up, spaces, books/spreads/elements and their access rules, gift links, sealed letters across two accounts. Needs the dev server running. Screenshots go to `e2e-output/`. |
| `npm run e2e:editor` | Drives the new screens: home, shelf, spread editor (drag across pages, rotate, tray, undo/redo, in-place edits, delete, new spread), timeline, old-address redirects, chat. |
| `npm run e2e:gift` | Drives the gift flow with two browsers: creator sets up the gift, a logged-out recipient sees it locked, then opens it, reads a letter and replies; the link is turned off. |
| `npm run cleanup:qa` | Lists the test accounts the e2e run created and their data. Add `-- --yes` to delete them. Needs a Firebase service account key saved as `serviceAccountKey.json` (git-ignored). |
| `npm run migrate:books` | Copies old-scrapbook memories into books (one book per space, one spread per day). Dry run by default; `-- --yes` writes; `-- --add-new` copies only memories not yet in the book. Needs `serviceAccountKey.json`. |
| `npm run build` | Production build into `build/`. |

## Project layout

```
src/
  auth.js          login state, current profile, active space
  firebase.js      Firebase setup (reads .env.local)
  pages/           one file per screen
  editor/          spread editor pieces: element rendering, bottom tray
  gift/            gift link setup (ShareGiftModal) and the read-only spread
  ui/              shared look: AppShell, paper pieces, stickers, icons, ui.css
  components/      space chat
  model/           books, spreads, elements, gift links (books.js); page fractions (geometry.js)
  utils/           uploads (cloudinary.js), space and date helpers (space.js)
scripts/           e2e check and test-data cleanup
firestore.rules    database security rules
```
