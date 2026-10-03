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

const today = new Date();
const DAY = today.getDate();
const DATE_KEY = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(DAY).padStart(2, "0")}`;

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

async function openDayFromDashboard(page) {
  await page.waitForURL("**/dashboard", { timeout: 20000 });
  await page.locator("button.planner-calendar-cell").nth(DAY - 1).click();
}

(async () => {
  const consoleErrors = [];
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // ---------------- Account A: sign up + create space ----------------
    const a = await newPage(browser, "A", consoleErrors);
    await signup(a, A);
    pass("A signs up", A.email);

    await a.click("text=+ Create New Space");
    await a.waitForURL("**/space/create");
    await a.click("text=Create Our Space");
    await a.waitForURL("**/dashboard", { timeout: 20000 });
    pass("A creates a space and lands on dashboard");

    await a.goto(`${BASE}/space`);
    const codeText = await a.locator("text=Space Code:").first().locator("..").innerText();
    const spaceCode = codeText.replace("Space Code:", "").trim();
    check(/^[A-Z0-9]{6}$/.test(spaceCode), "Space code readable", spaceCode);

    // ---------------- Test 1: login lands on dashboard ----------------
    await a.goto(`${BASE}/`);
    await a.click("button:has-text('Logout')");
    await a.goto(`${BASE}/login`);
    await a.fill('input[name="email"]', A.email);
    await a.fill('input[name="password"]', A.pass);
    await a.click('button[type="submit"]');
    try {
      await a.waitForURL("**/dashboard", { timeout: 20000 });
      pass("T1 login lands on dashboard", a.url());
    } catch {
      fail("T1 login lands on dashboard", a.url());
    }
    await shot(a, "t1-dashboard");

    // ---------------- Test 2: scrapbook add / drag / rotate / delete ----------------
    await a.goto(`${BASE}/scrapbook/${DATE_KEY}`);
    await a.click('button[aria-label="Open menu"]');
    await a.click("text=Add text memory");
    await a.fill(".scrap-preview-card textarea", "QA sticky memory");
    await a.click(".scrap-preview-card button:has-text('Save')");
    const item = a.locator(".scrap-item", { hasText: "QA sticky memory" });
    await item.waitFor({ timeout: 15000 });
    await a.locator(".scrap-preview-overlay").waitFor({ state: "detached", timeout: 15000 });
    pass("T2 text memory added");

    // drag by +120,+60
    const before = await item.getAttribute("data-x").then(Number);
    const beforeY = await item.getAttribute("data-y").then(Number);
    const box = await item.boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await a.mouse.move(cx, cy);
    await a.mouse.down();
    for (let i = 1; i <= 20; i++) await a.mouse.move(cx + i * 6, cy + i * 3);
    await a.mouse.up();
    await a.waitForTimeout(1500);

    // rotate +5 twice
    await item.click();
    await a.click('button[aria-label="Rotate right"]');
    await a.click('button[aria-label="Rotate right"]');
    const rotBefore = Number(await item.getAttribute("data-rotate"));
    await a.waitForTimeout(2000);

    await a.reload();
    const item2 = a.locator(".scrap-item", { hasText: "QA sticky memory" });
    await item2.waitFor({ timeout: 15000 });
    const afterX = Number(await item2.getAttribute("data-x"));
    const afterY = Number(await item2.getAttribute("data-y"));
    const afterR = Number(await item2.getAttribute("data-rotate"));
    check(Math.abs(afterX - (before + 120)) < 15 && Math.abs(afterY - (beforeY + 60)) < 15,
      "T2 drag position persists after reload", `before=(${before},${beforeY}) after=(${afterX},${afterY})`);
    check(afterR === rotBefore, "T2 rotation persists after reload", `rotate=${afterR} (expected ${rotBefore})`);
    await shot(a, "t2-scrapbook-after-reload");

    // delete
    await item2.click();
    await a.click('button[aria-label="Delete"]');
    await a.waitForTimeout(1500);
    await a.reload();
    await a.waitForSelector(".scrapbook-canvas", { timeout: 15000 });
    await a.waitForTimeout(2000);
    const stillThere = await a.locator(".scrap-item", { hasText: "QA sticky memory" }).count();
    check(stillThere === 0, "T2 delete persists after reload", `items with text: ${stillThere}`);

    // ---------------- Test 3: shared letter vs draft ----------------
    await a.goto(`${BASE}/dashboard`);
    await openDayFromDashboard(a);
    await a.click("text=📚 Letters & notes");
    await a.waitForURL("**/notes");

    async function writeLetter(title, body, shared) {
      await a.click("text=+ Write a New Letter");
      await a.waitForURL("**/notes/new");
      await a.fill('input[placeholder="A title for your letter…"]', title);
      await a.fill("textarea", body);
      const box = a.locator('input[type="checkbox"]');
      if ((await box.isChecked()) !== shared) await box.click();
      await a.click("button:has-text('Send Letter')");
      await a.waitForURL("**/notes", { timeout: 15000 });
    }
    await writeLetter("QA shared letter", "hello from the shared letter", true);
    await writeLetter("QA private draft", "secret draft text", false);

    await a.click("button:has-text('My Drafts')");
    const draftEntry = a.locator("strong", { hasText: "QA private draft" });
    await draftEntry.waitFor({ timeout: 15000 });
    await draftEntry.click();
    await a.waitForURL("**/notes/*");
    const draftUrl = a.url();
    const draftOpens = await a.locator("text=secret draft text").waitFor({ timeout: 15000 }).then(() => 1, () => 0);
    check(draftOpens === 1, "T3 author can open own draft", draftUrl);

    await a.goto(`${BASE}/scrapbook/${DATE_KEY}`);
    await a.waitForSelector(".scrapbook-canvas", { timeout: 15000 });
    await a.waitForTimeout(2500);
    const sharedOnPage = await a.locator(".scrap-item", { hasText: "QA shared letter" }).count();
    const draftOnPage = await a.locator(".scrap-item", { hasText: "QA private draft" }).count();
    check(sharedOnPage === 1, "T3 shared letter appears on scrapbook", `count=${sharedOnPage}`);
    check(draftOnPage === 0, "T3 draft does NOT appear on scrapbook", `count=${draftOnPage}`);
    await shot(a, "t3-scrapbook-letters");

    // ---------------- Test 4: second account can't read the draft ----------------
    const b = await newPage(browser, "B", consoleErrors);
    await signup(b, B);
    await b.click("text=Join Space with Code");
    await b.waitForURL("**/space/join");
    await b.fill('input[placeholder="Enter space code"]', spaceCode);
    await b.click("button:has-text('Join Space')");
    await b.waitForURL("**/dashboard", { timeout: 20000 });
    pass("B joins A's space");

    await openDayFromDashboard(b);
    await b.click("text=📚 Letters & notes");
    await b.waitForURL("**/notes");
    await b.locator("strong", { hasText: "QA shared letter" }).waitFor({ timeout: 15000 });
    pass("T4 B sees the shared letter");
    await b.click("button:has-text('My Drafts')");
    await b.waitForTimeout(1500);
    const bDrafts = await b.locator("strong", { hasText: "QA private draft" }).count();
    check(bDrafts === 0, "T4 B's draft list does not include A's draft", `count=${bDrafts}`);

    await b.goto(draftUrl);
    await b.locator("text=/not found|permission|secret draft text/i").first().waitFor({ timeout: 15000 }).catch(() => {});
    const leaked = await b.locator("text=secret draft text").count();
    const blockedMsg = await b.locator("text=/not found|permission/i").count();
    check(leaked === 0 && blockedMsg > 0, "T4 B opening A's draft URL is blocked", `leaked=${leaked} blockedMsg=${blockedMsg}`);
    await shot(b, "t4-b-draft-blocked");

    await b.goto(`${BASE}/scrapbook/${DATE_KEY}`);
    await b.waitForSelector(".scrapbook-canvas", { timeout: 15000 });
    await b.waitForTimeout(2500);
    const bShared = await b.locator(".scrap-item", { hasText: "QA shared letter" }).count();
    check(bShared === 1, "T4 B sees the shared letter on the scrapbook", `count=${bShared}`);
  } catch (e) {
    fail("Script error", e.message.split("\n")[0]);
  } finally {
    await browser.close();
  }

  console.log("\n==== RESULTS ====");
  for (const [s, n, d] of results) console.log(`${s}  ${n}${d ? "  — " + d : ""}`);
  const relevant = consoleErrors.filter((e) => !/favicon|DevTools/i.test(e));
  console.log(`\n==== CONSOLE ERRORS (${relevant.length}) ====`);
  relevant.slice(0, 30).forEach((e) => console.log(e.slice(0, 400)));
  console.log(`\nAccounts used: ${A.email}, ${B.email}`);
})();
