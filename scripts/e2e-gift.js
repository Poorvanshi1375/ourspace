// End-to-end check of the gift flow (Phase 3): creator sets up a gift, a logged-out
// recipient opens it (locked, then unlocked), leaves replies; creator sees them; link off.
// Creates one QA account (qa.a.<ts>@example.com). Clean up with: npm run cleanup:qa -- --yes
//
// Usage: node scripts/e2e-gift.js   (dev server must be running on localhost:3000)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = path.join(__dirname, "..", "e2e-output");
fs.mkdirSync(SHOTS, { recursive: true });

const ts = Date.now();
const A = { email: `qa.a.${ts}@example.com`, pass: "qa-test-123", name: "QA Giver" };
const results = [];
const pass = (n, d = "") => { results.push(["PASS", n, d]); console.log("PASS", n, d); };
const fail = (n, d = "") => { results.push(["FAIL", n, d]); console.log("FAIL", n, d); };
const check = (c, n, d) => (c ? pass(n, d) : fail(n, d));
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

(async () => {
  const errors = [];
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  // RECIPIENT_VIEWPORT=390x844 runs the recipient on a phone-sized touch screen
  const rv = (process.env.RECIPIENT_VIEWPORT || "").split("x").map(Number);
  const phone = rv.length === 2 && rv[0] < 760;
  const mk = async (label) => {
    const opts = label === "recipient" && rv.length === 2
      ? { viewport: { width: rv[0], height: rv[1] }, isMobile: phone, hasTouch: phone, deviceScaleFactor: phone ? 2 : 1 }
      : { viewport: { width: 1440, height: 1000 } };
    const p = await (await browser.newContext(opts)).newPage();
    p.on("console", (m) => m.type() === "error" && !/permission|insufficient/i.test(m.text()) && errors.push(`[${label}] ${m.text()}`));
    p.on("pageerror", (e) => errors.push(`[${label}] pageerror ${e.message}`));
    return p;
  };
  const a = await mk("creator");
  const r = await mk("recipient");
  const shot = (p, name) => p.screenshot({ path: path.join(SHOTS, `gift-${name}.png`) });

  try {
    // ---- creator: account, space, a small book ----
    await a.goto(`${BASE}/signup`);
    await a.fill('input[name="name"]', A.name);
    await a.fill('input[name="username"]', "qa_giver");
    await a.fill('input[name="email"]', A.email);
    await a.fill('input[name="password"]', A.pass);
    await a.click('button[type="submit"]');
    await a.waitForURL("**/space", { timeout: 20000 });
    await a.click('button:has-text("Create our space")');
    await a.waitForURL("**/home", { timeout: 20000 });
    await a.goto(`${BASE}/space`);
    const code = (await a.locator('[data-testid="space-code"]').first().innerText()).replace(/-/g, "").trim();
    await a.waitForFunction(() => window.__ourspace, null, { timeout: 15000 });
    const ids = await a.evaluate(async ({ code, img }) => {
      const { model: m, auth } = window.__ourspace;
      const uid = auth.currentUser.uid;
      const bookId = await m.createBook(code, uid, { title: "Happy 20th, Ishu" });
      const spreadId = await m.createSpread(bookId, uid, { title: "Day out in Mumbai", date: "2025-04-18" });
      await m.addElement(bookId, spreadId, uid, { type: "photo", page: "left", x: 0.12, y: 0.2, w: 0.42, rotate: -3, content: { mediaUrl: img, caption: "diet coke girlies" } });
      await m.addElement(bookId, spreadId, uid, { type: "letter", page: "right", x: 0.3, y: 0.55, w: 0.45, rotate: 2, content: { title: "secret letter", text: "happy birthday, you!" } });
      await m.addElement(bookId, spreadId, uid, { type: "text", page: "right", x: 0.1, y: 0.12, w: 0.4, style: { variant: "sticky" }, content: { text: "we are still kiddos forever" } });
      return { bookId, spreadId };
    }, { code, img: `${BASE}/logo512.png` });

    // ---- creator sets up the gift, sealed for 2 days ----
    await a.goto(`${BASE}/books/${ids.bookId}`);
    await a.locator('[data-testid="spread"]').waitFor({ timeout: 15000 });
    await a.click('button:has-text("Share gift")');
    const dlg = a.locator('[role="dialog"][aria-label="Share gift"]');
    await dlg.locator('input[placeholder="Ishu"]').fill("Ishu");
    await dlg.locator('input[placeholder="Poorvanshi"]').fill("Poorvanshi");
    await dlg.locator('input[placeholder^="a little something"]').fill("a little something for your 20th, Ishu");
    await dlg.locator('input[placeholder="your 20th, with all my love"]').fill("your 20th, with all my love");
    await dlg.locator("textarea").fill("make a chai and take your time");
    await dlg.locator('input[aria-label="Sealed until"]').fill(dayKey(new Date(Date.now() + 2 * 864e5)));
    await dlg.locator('input[aria-label="Milestone 1 when"]').fill("2020");
    await dlg.locator('input[aria-label="Milestone 1 what"]').fill("met in 8th grade");
    await dlg.locator('button:has-text("Add a milestone")').click();
    await dlg.locator('input[aria-label="Milestone 2 when"]').fill("today");
    await dlg.locator('input[aria-label="Milestone 2 what"]').fill("you turn 20");
    await dlg.locator('input[placeholder="short n\' sweet"]').fill("short n' sweet");
    await dlg.locator('button:has-text("Create gift link")').click();
    const link = await dlg.locator('[data-testid="gift-link"]').innerText({ timeout: 20000 });
    check(/\/gift\/[A-Za-z0-9_-]{20,}$/.test(link), "Share gift creates a secret link", link);
    const created = await dlg.locator('[data-testid="share-result"]').innerText({ timeout: 10000 }).catch(() => "");
    check(/Your gift for Ishu is ready/.test(created) && /Copy the link/.test(created) && /countdown until/.test(created),
      "After saving, the dialog says it's ready and what to do next", created.split("\n")[0]);
    check((await dlg.locator('button:has-text("Saved ✓")').count()) === 1, "The save button confirms with 'Saved ✓'");
    await shot(a, "1-share-modal");
    await dlg.locator('button:has-text("Close")').click();

    // ---- recipient (not logged in): locked ----
    await r.goto(link);
    await r.locator("text=a little something for your 20th, Ishu").waitFor({ timeout: 20000 });
    const page1 = await r.locator("main").innerText();
    check(/1 handmade spread/.test(page1) && /1 polaroid of us/.test(page1) && /1 letter to open/.test(page1),
      "Packing slip counts what's inside", page1.match(/PACKING SLIP[\s\S]*?packed with love/)?.[0].replace(/\s+/g, " "));
    check(/make a chai and take your time/.test(page1) && /— Poorvanshi/.test(page1), "Note from the sender is shown");
    check(/met in 8th grade/.test(page1) && /you turn 20/.test(page1), "Our little story so far is shown");
    check(/to: Ishu/.test(page1) && /from: Poorvanshi/.test(page1), "Gift tag shows to / from");
    check((await r.locator('[data-testid="countdown"]').count()) === 1 && (await r.locator('button[aria-label="Sealed until its opening day"]').isDisabled()),
      "Before the unlock date: countdown shown, seal can't be broken");
    await shot(r, "2-locked");

    // ---- creator removes the lock ----
    await a.click('button:has-text("Gift settings")');
    await dlg.locator('input[aria-label="Sealed until"]').fill("");
    await dlg.locator('button:has-text("Save changes")').click();
    const updated = await dlg.locator('[data-testid="share-result"]').innerText({ timeout: 15000 }).catch(() => "");
    check(/Changes saved to the same link/.test(updated) && /ready to open right away/.test(updated),
      "Saving changes confirms it and says it opens right away", updated.split("\n")[0]);
    await dlg.locator('button:has-text("Close")').click();

    // ---- recipient opens it ----
    await r.reload();
    await r.locator("text=tap the seal to open").waitFor({ timeout: 20000 });
    await shot(r, "3-envelope");
    await r.click('button[aria-label="Break the seal to open your gift"]');
    await r.locator('button:has-text("Open the book")').waitFor({ timeout: 10000 });
    check((await r.locator("text=Happy 20th, Ishu").count()) >= 1, "Breaking the seal shows the book cover");
    await shot(r, "4-cover");
    await r.click('button:has-text("Open the book")');
    await r.locator('[data-testid="gift-spread"]').waitFor({ timeout: 15000 });
    await r.locator("text=diet coke girlies").waitFor({ timeout: 15000 });
    await r.waitForTimeout(800);
    pass("The book opens on its first spread with its photos");
    await shot(r, "5-reading");
    if (phone) {
      // phones show one page at a time: the letter is on the right-hand page
      const noScroll = await r.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      check(noScroll, "On a phone the page fits the screen (no sideways scrolling)");
      await r.click('button[aria-label="Next page"]');
      await r.locator('[data-type="letter"]').waitFor({ timeout: 10000 });
      await shot(r, "5c-phone-right-page");
    }
    await r.click('[data-type="letter"]');
    check((await r.locator('[role="dialog"][aria-label="Letter"] >> text=happy birthday, you!').count()) === 1, "Recipient can open a letter on the page");
    await r.click('[role="dialog"] button:has-text("Close")');
    await r.click('button:has-text("Love this page")');
    await r.fill("#gift-reply", "I cried at this one");
    await r.click('button:has-text("Stick it")');
    await r.locator('[data-testid="page-notes"] >> text=I cried at this one').waitFor({ timeout: 15000 });
    check((await r.locator('[data-testid="page-notes"] >> text=1 ♡').count()) === 1, "Recipient's heart and note appear stuck under the page");
    await r.waitForTimeout(1500); // let the page scroll to the new note
    await shot(r, "5b-note-stuck");
    await r.reload();
    await r.click('button[aria-label="Break the seal to open your gift"]');
    await r.click('button:has-text("Open the book")');
    await r.locator('[data-testid="page-notes"] >> text=I cried at this one').waitFor({ timeout: 15000 });
    pass("The note is still on the page after reopening the gift");

    // ---- creator sees the replies ----
    await a.reload();
    await a.locator('button:has-text("2 replies")').waitFor({ timeout: 20000 });
    await a.click('button:has-text("2 replies")');
    check((await a.locator('[role="dialog"][aria-label="Replies"] >> text=I cried at this one').count()) === 1, "Creator sees the recipient's replies in the editor");
    await shot(a, "6-replies");
    await a.click('[role="dialog"][aria-label="Replies"] button:has-text("Close")');

    // ---- link off ----
    await a.click('button:has-text("Gift settings")');
    await dlg.locator('label:has-text("Gift link is on") input').click();
    await dlg.locator('button:has-text("Save (link off)")').click();
    const off = await dlg.locator('[data-testid="share-result"]').innerText({ timeout: 15000 }).catch(() => "");
    check(/The gift link is off/.test(off), "Turning the link off is confirmed in the dialog", off.split("\n")[0]);
    await r.goto(link);
    await r.locator("text=This gift link isn't active").waitFor({ timeout: 20000 });
    pass("Turning the link off makes it stop working");
  } catch (e) {
    fail("Script error", e.message.split("\n")[0]);
    await a.screenshot({ path: path.join(SHOTS, "gift-error-creator.png") }).catch(() => {});
    await r.screenshot({ path: path.join(SHOTS, "gift-error-recipient.png") }).catch(() => {});
  } finally {
    await browser.close();
  }

  console.log("\n==== RESULTS ====");
  results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? "  — " + d : ""}`));
  console.log(`\n==== CONSOLE ERRORS (${errors.length}) ====`);
  errors.slice(0, 20).forEach((e) => console.log(e.slice(0, 300)));
  console.log(`\nAccount used: ${A.email}\nScreenshots: ${SHOTS}`);
  process.exit(results.some(([s]) => s === "FAIL") ? 1 : 0);
})();
