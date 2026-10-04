// Smoke test of the DEPLOYED app, through the real UI only (no dev hooks in production).
// Signs up a QA account, makes a one-note book, shares it, opens the gift link logged out.
// Creates one QA account (qa.a.<ts>@example.com). Clean up with: npm run cleanup:qa -- --yes
//
// Usage: node scripts/smoke-prod.js   (BASE_URL defaults to https://ourspace-dev.web.app)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "https://ourspace-dev.web.app";
const SHOTS = path.join(__dirname, "..", "e2e-output");
fs.mkdirSync(SHOTS, { recursive: true });
const ts = Date.now();
const A = { email: `qa.a.${ts}@example.com`, pass: "qa-test-123" };
const NOTE = `hello from production ${ts}`;

const results = [];
const pass = (n, d = "") => { results.push(["PASS", n, d]); console.log("PASS", n, d); };
const fail = (n, d = "") => { results.push(["FAIL", n, d]); console.log("FAIL", n, d); };

(async () => {
  const errors = [];
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const mk = async (label) => {
    const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    p.on("console", (m) => m.type() === "error" && errors.push(`[${label}] ${m.text()}`));
    p.on("pageerror", (e) => errors.push(`[${label}] pageerror ${e.message}`));
    return p;
  };
  const a = await mk("creator");
  const r = await mk("recipient");
  try {
    await a.goto(BASE);
    if (!(await a.title()).includes("OurSpace")) throw new Error("site did not load");
    pass("Site loads", BASE);

    await a.goto(`${BASE}/signup`);
    await a.fill('input[name="name"]', "QA Prod");
    await a.fill('input[name="username"]', "qa_prod");
    await a.fill('input[name="email"]', A.email);
    await a.fill('input[name="password"]', A.pass);
    await a.click('button[type="submit"]');
    await a.waitForURL("**/space", { timeout: 30000 });
    await a.click("text=+ Create New Space");
    await a.click("text=Create Our Space");
    await a.waitForURL("**/home", { timeout: 30000 });
    pass("Sign up and create a space (Auth + Firestore work in production)");

    await a.goto(`${BASE}/books`);
    await a.click('button:has-text("Start a new book")');
    await a.locator('[data-testid="spread"]').waitFor({ timeout: 30000 });
    await a.click('[role="tab"]:has-text("Text")');
    await a.click('button:has-text("Sticky note")');
    const note = a.locator('[data-type="text"]').first();
    await note.waitFor({ timeout: 20000 });
    await note.dblclick();
    await note.locator("textarea").fill(NOTE);
    await a.locator('[data-testid="spread"]').click({ position: { x: 5, y: 5 } });
    await a.locator(`text=${NOTE}`).waitFor({ timeout: 20000 });
    pass("Start a book and add a note in the editor");

    await a.click('button:has-text("Share gift")');
    const dlg = a.locator('[role="dialog"][aria-label="Share gift"]');
    await dlg.locator('input[placeholder="Ishu"]').fill("Ishu");
    await dlg.locator('input[placeholder="Poorvanshi"]').fill("QA");
    await dlg.locator('button:has-text("Create gift link")').click();
    const link = await dlg.locator('[data-testid="gift-link"]').innerText({ timeout: 30000 });
    if (!link.startsWith(`${BASE}/gift/`)) throw new Error(`unexpected link ${link}`);
    pass("Share gift gives a link on the live domain", link);
    const heads = await dlg.locator('[data-testid="share-result"]').innerText();
    if (/only running on this computer/.test(heads)) fail("Local-only warning should not show online");
    else pass("No 'only on this computer' warning online");
    await dlg.locator('button:has-text("Close")').click();

    // recipient: a fresh browser, never logged in, opens the link directly
    await r.goto(link);
    await r.locator("text=a little something for you, Ishu").waitFor({ timeout: 30000 });
    pass("Gift link opens logged out (deep link served by hosting)");
    await r.click('button[aria-label="Break the seal to open your gift"]');
    await r.click('button:has-text("Open the book")');
    await r.locator(`[data-testid="gift-spread"] >> text=${NOTE}`).waitFor({ timeout: 30000 });
    pass("Recipient reads the note in the book");
    await r.screenshot({ path: path.join(SHOTS, "prod-gift.png") });

    // tidy up: turn the test link off
    await a.click('button:has-text("Gift settings")');
    await dlg.locator('label:has-text("Gift link is on") input').click();
    await dlg.locator('button:has-text("Save (link off)")').click();
    await dlg.locator("text=The gift link is off").waitFor({ timeout: 20000 });
    pass("Test link turned off again");
  } catch (e) {
    fail("Script error", e.message.split("\n")[0]);
    await a.screenshot({ path: path.join(SHOTS, "prod-error-creator.png") }).catch(() => {});
    await r.screenshot({ path: path.join(SHOTS, "prod-error-recipient.png") }).catch(() => {});
  } finally {
    await browser.close();
  }
  console.log("\n==== RESULTS ====");
  results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? "  — " + d : ""}`));
  console.log(`\n==== CONSOLE ERRORS (${errors.length}) ====`);
  errors.slice(0, 15).forEach((e) => console.log(e.slice(0, 300)));
  console.log(`\nAccount used: ${A.email}`);
  process.exit(results.some(([s]) => s === "FAIL") ? 1 : 0);
})();
