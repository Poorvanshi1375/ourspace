// End-to-end check for OurSpace, driven through the real UI with headless Chrome.
// Creates two QA accounts (qa.a/qa.b.<timestamp>@example.com) in ourspace-dev.
// Remove them afterwards with: npm run cleanup:qa -- --yes
//
// Usage: node scripts/e2e-check.js      (dev server must be running; BASE_URL to override)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = path.join(__dirname, "..", "e2e-output");
fs.mkdirSync(SHOTS, { recursive: true });

const ts = Date.now();
const A = { email: `qa.a.${ts}@example.com`, pass: "qa-test-123", name: "QA Alpha" };
const B = { email: `qa.b.${ts}@example.com`, pass: "qa-test-123", name: "QA Beta" };


const results = [];
const pass = (name, detail = "") => { results.push(["PASS", name, detail]); console.log("PASS", name, detail); };
const fail = (name, detail = "") => { results.push(["FAIL", name, detail]); console.log("FAIL", name, detail); };
const check = (cond, name, detail) => (cond ? pass(name, detail) : fail(name, detail));

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

async function newPage(browser, label, consoleErrors) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${label}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror ${e.message}`));
  page.on("dialog", (d) => { consoleErrors.push(`[${label}] dialog: ${d.message()}`); d.dismiss(); });
  return page;
}

async function signup(page, u) {
  await page.goto(`${BASE}/signup`);
  await page.fill('input[name="name"]', u.name);
  await page.fill('input[name="username"]', u.name.toLowerCase().replace(" ", "_"));
  await page.fill('input[name="email"]', u.email);
  await page.fill('input[name="password"]', u.pass);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/space", { timeout: 20000 });
}


(async () => {
  const consoleErrors = [];
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // ---------------- Account A: sign up + create space ----------------
    const a = await newPage(browser, "A", consoleErrors);
    await signup(a, A);
    pass("A signs up", A.email);

    await a.click('button:has-text("Create our space")');
    await a.waitForURL("**/home", { timeout: 20000 });
    pass("A creates a space and lands on the new home");

    await a.goto(`${BASE}/space`);
    const shownCode = await a.locator('[data-testid="space-code"]').first().innerText();
    const spaceCode = shownCode.replace(/-/g, "").trim();
    check(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(shownCode), "New spaces get a 10-character code", shownCode);

    // ---------------- Test 1: log out from the space menu, log back in ----------------
    await a.goto(`${BASE}/home`);
    await a.click('[data-testid="space-menu"]');
    await a.click('[role="dialog"][aria-label="Space settings"] button:has-text("Log out")');
    await a.waitForURL(`${BASE}/`, { timeout: 15000 });
    await a.locator('text=Make memories they can almost hold').waitFor({ timeout: 15000 });
    pass("Log out from the space menu lands on the new welcome page");
    await a.goto(`${BASE}/login`);
    await a.fill('input[name="email"]', A.email);
    await a.fill('input[name="password"]', A.pass);
    await a.click('button[type="submit"]');
    try {
      await a.waitForURL("**/home", { timeout: 20000 });
      pass("T1 login lands on the new home", a.url());
    } catch {
      fail("T1 login lands on the new home", a.url());
    }
    await shot(a, "t1-dashboard");

    // ---------------- Account B joins the space ----------------
    const b = await newPage(browser, "B", consoleErrors);
    await signup(b, B);
    // typed the way people share it: lower case, with the dash
    await b.fill('input[aria-label="Space code"]', shownCode.toLowerCase());
    await b.click('button:has-text("Join space")');
    await b.waitForURL("**/home", { timeout: 20000 });
    pass("B joins A's space");


    // ---------------- Phase 1: books -> spreads -> elements (model + rules) ----------------
    // Calls the data model in the browser as each user (dev-only window.__ourspace).
    const model = async (page, fn, arg) => {
      await page.waitForFunction(() => window.__ourspace, null, { timeout: 15000 });
      return page.evaluate(fn, arg);
    };

    const made = await model(a, async (code) => {
      const { model: m, auth } = window.__ourspace;
      const uid = auth.currentUser.uid;
      const bookId = await m.createBook(code, uid, { title: "QA book", recipient: { name: "Ishu" } });
      const spreadId = await m.createSpread(bookId, uid, { title: "Day out", date: "2025-04-18" });
      const elementId = await m.addElement(bookId, spreadId, uid, {
        type: "photo", page: "right", x: 0.2, y: 0.3, w: 0.4, rotate: 4, content: { caption: "pure serotonin" },
      });
      await m.updateElement(bookId, spreadId, elementId, { x: 1.7, y: 0.5, rotate: -8 });
      let badType = null;
      try { await m.addElement(bookId, spreadId, uid, { type: "hologram", x: 0, y: 0 }); } catch (e) { badType = e.message; }
      const el = (await m.listElements(bookId, spreadId))[0];
      const books = await m.listBooks(code);
      return { bookId, spreadId, el, nBooks: books.length, badType };
    }, spaceCode);
    check(made.nBooks === 1, "T5 member creates a book in their space", made.bookId);
    check(made.el && made.el.page === "right" && made.el.x === 1 && made.el.y === 0.5 && made.el.rotate === -8,
      "T5 element saved as page fractions (x clamped to 1)", JSON.stringify(made.el && { page: made.el.page, x: made.el.x, y: made.el.y, rotate: made.el.rotate }));
    check(/Unknown element type/.test(made.badType || ""), "T5 unknown element type rejected", made.badType);

    const bRead = await model(b, async ({ bookId, spreadId }) => {
      const { model: m } = window.__ourspace;
      return { title: (await m.getBook(bookId))?.title, n: (await m.listElements(bookId, spreadId)).length };
    }, made);
    check(bRead.title === "QA book" && bRead.n === 1, "T6 other member reads the book and its elements", JSON.stringify(bRead));

    // outsider: signed in, but not in the space
    const C = { email: `qa.b.${ts}9@example.com`, pass: "qa-test-123", name: "QA Gamma" };
    const c = await newPage(browser, "C", consoleErrors);
    await signup(c, C);
    const cRead = await model(c, async ({ bookId, spreadId, code }) => {
      const { model: m } = window.__ourspace;
      const t = async (f) => { try { await f(); return "allowed"; } catch (e) { return e.code; } };
      return {
        book: await t(() => m.getBook(bookId)),
        elements: await t(() => m.listElements(bookId, spreadId)),
        books: await t(() => m.listBooks(code)),
      };
    }, { ...made, code: spaceCode });
    check(cRead.book === "permission-denied" && cRead.elements === "permission-denied" && cRead.books === "permission-denied",
      "T7 outsider can't read the book, its elements or the space's books", JSON.stringify(cRead));

    // ---------------- Space lock: no one new can join, even with the code ----------------
    await a.goto(`${BASE}/home`);
    await a.click('[data-testid="space-menu"]');
    await a.locator('[role="dialog"][aria-label="Space settings"] label:has-text("Lock this space") input').click();
    await a.locator('text=Locked: no one new can join').waitFor({ timeout: 15000 });
    await c.goto(`${BASE}/space`);
    await c.fill('input[aria-label="Space code"]', spaceCode);
    await c.click('button:has-text("Join space")');
    const refusedMsg = await c.locator('form[aria-label="Join a space"] [role="alert"]').innerText({ timeout: 15000 }).catch(() => "");
    check(/locked/i.test(refusedMsg), "A locked space refuses new members even with the right code", refusedMsg);
    const cStillOut = await model(c, async ({ bookId }) => {
      try { await window.__ourspace.model.getBook(bookId); return "allowed"; } catch (e) { return e.code; }
    }, made);
    check(cStillOut === "permission-denied", "The refused person still can't read the space's books", cStillOut);
    // the menu is still open from locking it
    await a.locator('[role="dialog"][aria-label="Space settings"] label:has-text("Lock this space") input').click();
    await a.locator('text=Unlocked').waitFor({ timeout: 15000 });

    // gift link, time capsule locked
    const token = await model(a, async ({ bookId }) => {
      const { model: m } = window.__ourspace;
      const book = await m.getBook(bookId);
      return m.enableGift(book, { unlockAt: new Date(Date.now() + 86400000), allowReplies: true });
    }, made);
    const anon = await newPage(browser, "anon", consoleErrors);
    await anon.goto(`${BASE}/`);
    const probeAnon = async () => model(anon, async ({ token, bookId, spreadId, code }) => {
      const { model: m } = window.__ourspace;
      const t = async (f) => { try { const v = await f(); return v; } catch (e) { return { denied: e.code }; } };
      const gift = await t(() => m.openGift(token));
      return {
        gift: gift && !gift.denied ? { title: gift.book.title, locked: gift.locked, spreads: gift.spreads.length } : gift,
        spreads: await t(async () => (await m.listSpreads(bookId)).length),
        elements: await t(async () => (await m.listElements(bookId, spreadId)).length),
        books: await t(async () => (await m.listBooks(code)).length),
        reply: await t(() => m.addReply(bookId, { spreadId, text: "I cried at this one", name: "Ishu" })),
      };
    }, { token, ...made, code: spaceCode });

    const locked = await probeAnon();
    check(locked.gift && locked.gift.title === "QA book" && locked.gift.locked === true && locked.gift.spreads === 0,
      "T8 gift link (no login), before unlock: cover only", JSON.stringify(locked.gift));
    check(locked.spreads?.denied === "permission-denied" && locked.elements?.denied === "permission-denied" && locked.reply?.denied === "permission-denied",
      "T8 before unlock: pages and replies blocked by the rules", JSON.stringify({ s: locked.spreads, e: locked.elements, r: locked.reply }));
    check(locked.books?.denied === "permission-denied", "T8 link can't list the space's books", JSON.stringify(locked.books));

    // unlock now (same token)
    await model(a, async ({ bookId }) => {
      const { model: m } = window.__ourspace;
      return m.enableGift(await m.getBook(bookId), { unlockAt: null, allowReplies: true });
    }, made);
    const open = await probeAnon();
    check(open.gift && open.gift.locked === false && open.gift.spreads === 1 && open.elements === 1,
      "T9 after unlock: link shows the live pages", JSON.stringify({ gift: open.gift, elements: open.elements }));
    check(typeof open.reply === "string", "T9 recipient can leave a reply without login", JSON.stringify(open.reply));

    // turn the link off
    await model(a, async ({ bookId }) => {
      const { model: m } = window.__ourspace;
      return m.disableGift(await m.getBook(bookId));
    }, made);
    const off = await probeAnon();
    check(off.gift === null || off.gift?.denied, "T10 disabled link no longer opens", JSON.stringify(off.gift));
    check(off.spreads?.denied === "permission-denied", "T10 disabled link can't read pages", JSON.stringify(off.spreads));

    // ---------------- Phase 2: Letters page (sealed time capsules) ----------------
    const tomorrow = new Date(Date.now() + 2 * 86400000);
    const dateKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    async function writeLetterUI(title, body, { share = true, seal = false } = {}) {
      await a.click('button:has-text("Write a letter")');
      const dlg = a.locator('[role="dialog"][aria-label="Write a letter"]');
      await dlg.locator('input[placeholder="open when you feel lonely"]').fill(title);
      await dlg.locator("textarea").fill(body);
      const shareBox = dlg.locator('label:has-text("Share with my space") input');
      if ((await shareBox.isChecked()) !== share) await shareBox.click();
      if (share && seal) {
        await dlg.locator('label:has-text("Seal it until") input').click();
        await dlg.locator('input[type="date"]').fill(dateKey);
      }
      await dlg.locator("button.ui-btn-primary").click();
      await dlg.waitFor({ state: "detached", timeout: 15000 });
    }
    await a.goto(`${BASE}/letters`);
    await a.locator('h1:has-text("Letters")').waitFor({ timeout: 15000 });
    await writeLetterUI("QA time capsule", "open this on your birthday", { seal: true });
    await writeLetterUI("QA open letter", "you are my favourite person");
    await writeLetterUI("QA new draft", "not ready yet", { share: false });
    await a.click('[role="tab"]:has-text("Shared")');
    const capsule = a.locator('[data-letter]', { hasText: "QA time capsule" });
    await capsule.waitFor({ timeout: 15000 });
    check((await capsule.locator("text=opens on").count()) === 1, "T11 sealed letter shows as a locked envelope with its opening date");
    await shot(a, "t11-letters");
    await capsule.click();
    const ownText = await a.locator('[data-testid="letter-text"]').innerText({ timeout: 15000 }).catch(() => "");
    check(ownText.includes("open this on your birthday"), "T11 the writer can read their own sealed letter", ownText);
    await a.click('[role="dialog"] button:has-text("Close")');

    await b.goto(`${BASE}/letters`);
    const bCapsule = b.locator('[data-letter]', { hasText: "QA time capsule" });
    await bCapsule.waitFor({ timeout: 15000 });
    await bCapsule.click();
    await b.locator('[role="dialog"] [data-testid="letter-text"], [role="dialog"] >> text=Come back then').first().waitFor({ timeout: 15000 });
    const leakedCapsule = await b.locator('[data-testid="letter-text"]').count();
    const lockedMsg = await b.locator("text=Come back then").count();
    check(leakedCapsule === 0 && lockedMsg === 1, "T12 the friend can't open the sealed letter early", `leaked=${leakedCapsule} locked=${lockedMsg}`);
    await shot(b, "t12-sealed-for-friend");
    await b.click('[role="dialog"] button:has-text("Close")');
    await b.locator('[data-letter]', { hasText: "QA open letter" }).click();
    const openText = await b.locator('[data-testid="letter-text"]').innerText({ timeout: 15000 }).catch(() => "");
    check(openText.includes("favourite person"), "T12 the friend reads the open letter", openText);
    await b.click('[role="dialog"] button:has-text("Close")');
    await b.click('[role="tab"]:has-text("My drafts")');
    await b.waitForTimeout(1500);
    check((await b.locator('[data-letter]', { hasText: "QA new draft" }).count()) === 0, "T12 the writer's draft stays private");
  } catch (e) {
    fail("Script error", e.message.split("\n")[0]);
  } finally {
    await browser.close();
  }

  console.log("\n==== RESULTS ====");
  for (const [s, n, d] of results) console.log(`${s}  ${n}${d ? "  — " + d : ""}`);
  const relevant = consoleErrors.filter((e) => !/favicon|DevTools|permission|insufficient/i.test(e));
  // permission errors are expected: several checks prove access is blocked
  console.log(`\n==== CONSOLE ERRORS (${relevant.length}) ====`);
  relevant.slice(0, 30).forEach((e) => console.log(e.slice(0, 400)));
  console.log(`\nAccounts used: ${A.email}, ${B.email}`);
})();
