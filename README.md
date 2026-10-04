# OurSpace

A digital scrapbook that feels handmade — polaroids, handwritten notes, washi tape, stickers and
sealed letters — made to be gifted to the people you love.

Friends share a private **space**. Inside it they keep memories day by day, write letters that can
stay sealed until a date, and chat. The next version turns this into **books** you design spread by
spread and send as a gift link that opens like a real envelope.

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Bug fixes, security rules, test tooling | Done |
| 1 | New data model: books → spreads → elements | In progress |
| 2 | Redesigned screens (pistachio + off-white, handwritten type) | Planned |
| 3 | Gift viewer: no-login link, envelope opening, time capsule | Planned |

## Tech

- React 19 (Create React App), React Router 7
- Firebase Authentication (email + Google) and Cloud Firestore
- Cloudinary for photo, video and document uploads
- interact.js for dragging items on the scrapbook canvas

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase and Cloudinary values
npm start                    # http://localhost:3000
```

`.env.local` is git-ignored. Restart `npm start` after changing it.

## Firebase

- Security rules: [`firestore.rules`](firestore.rules) — only members of a space can read or write
  it, private drafts are readable only by their author, and joining a space can only add yourself.
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
| `npm run e2e` | Drives the real app in headless Chrome: sign-up, spaces, scrapbook drag/rotate/delete, shared letters vs private drafts. Needs the dev server running. Screenshots go to `e2e-output/`. |
| `npm run cleanup:qa` | Lists the test accounts the e2e run created and their data. Add `-- --yes` to delete them. Needs a Firebase service account key saved as `serviceAccountKey.json` (git-ignored). |
| `npm run migrate:books` | Copies existing memories into books (one book per space, one spread per day). Dry run by default; add `-- --yes` to write. Needs `serviceAccountKey.json`. |
| `npm run build` | Production build into `build/`. |

## Project layout

```
src/
  auth.js          login state, current profile, active space
  firebase.js      Firebase setup (reads .env.local)
  pages/           one file per screen
  components/      scrapbook menu, chat, add-item modals
  model/           books, spreads, elements, gift links (books.js); page fractions (geometry.js)
  utils/           uploads (cloudinary.js), space and date helpers (space.js)
scripts/           e2e check and test-data cleanup
firestore.rules    database security rules
```
