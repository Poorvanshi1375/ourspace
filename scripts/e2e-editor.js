// End-to-end check of the Spread Editor (Phase 2), driven in headless Chrome.
// Creates one QA account (qa.a.<ts>@example.com) with a space and a test book.
// Remove it afterwards with: npm run cleanup:qa -- --yes
//
// Usage: node scripts/e2e-editor.js   (dev server must be running on localhost:3000)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = path.join(__dirname, "..", "e2e-output");
fs.mkdirSync(SHOTS, { recursive: true });

const ts = Date.now();
const A = { email: `qa.a.${ts}@example.com`, pass: "qa-test-123", name: "QA Editor" };

const results = [];
const pass = (n, d = "") => { results.push(["PASS", n, d]); console.log("PASS", n, d); };
const fail = (n, d = "") => { results.push(["FAIL", n, d]); console.log("FAIL", n, d); };
const check = (c, n, d) => (c ? pass(n, d) : fail(n, d));

(async () => {
  const errors = [];
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await (await browser.newContext({ viewport: process.env.VIEWPORT ? { width: +process.env.VIEWPORT.split("x")[0], height: +process.env.VIEWPORT.split("x")[1] } : { width: 1440, height: 1000 } })).newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror ${e.message}`));
  const shot = (name) => page.screenshot({ path: path.join(SHOTS, `editor-${name}.png`) });
  const model = async (fn, arg) => {
    await page.waitForFunction(() => window.__ourspace, null, { timeout: 15000 });
    return page.evaluate(fn, arg);
  };
  const els = (ids) => model(({ bookId, spreadId }) => window.__ourspace.model.listElements(bookId, spreadId), ids);

  try {
    // ---- account + space ----
    await page.goto(`${BASE}/signup`);
    await page.fill('input[name="name"]', A.name);
    await page.fill('input[name="username"]', "qa_editor");
    await page.fill('input[name="email"]', A.email);
    await page.fill('input[name="password"]', A.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/space", { timeout: 20000 });
    await page.click('button:has-text("Create our space")');
    await page.waitForURL("**/home", { timeout: 20000 });
    await page.goto(`${BASE}/space`);
    const code = (await page.locator('[data-testid="space-code"]').first().innerText()).replace(/-/g, "").trim();

    // ---- a test book with one of each main element ----
    const ids = await model(async ({ code, img }) => {
      const { model: m, auth } = window.__ourspace;
      const uid = auth.currentUser.uid;
      const bookId = await m.createBook(code, uid, { title: "QA Mumbai book", recipient: { name: "Ishu" } });
      const spreadId = await m.createSpread(bookId, uid, { title: "Day out in Mumbai", date: "2025-04-18" });
      const photo = await m.addElement(bookId, spreadId, uid, { type: "photo", page: "left", x: 0.12, y: 0.2, w: 0.42, rotate: -3, z: 1, content: { mediaUrl: img, caption: "diet coke girlies" } });
      const note = await m.addElement(bookId, spreadId, uid, { type: "text", page: "right", x: 0.1, y: 0.12, w: 0.38, rotate: -2, z: 2, style: { variant: "sticky" }, content: { text: "we are still kiddos forever" } });
      await m.addElement(bookId, spreadId, uid, { type: "letter", page: "right", x: 0.5, y: 0.62, w: 0.4, rotate: 2, z: 3, content: { title: "secret letter", text: "happy birthday!" } });
      await m.addElement(bookId, spreadId, uid, { type: "sticker", page: "left", x: 0.6, y: 0.7, w: 0.13, z: 4, content: { key: "tulip" } });
      return { bookId, spreadId, photo, note };
    }, { code, img: `${BASE}/logo512.png` });
    pass("Test book created", ids.bookId);

    // ---- new home ----
    await page.goto(`${BASE}/home`);
    await page.locator("h1:has-text('Hi QA')").waitFor({ timeout: 15000 });
    await page.locator(`[data-book="${ids.bookId}"]`).waitFor({ timeout: 15000 });
    await page.locator("text=A MEMORY").waitFor({ timeout: 20000 });
    await page.waitForTimeout(1000);
    check((await page.locator("text=diet coke girlies").count()) >= 1, "Home shows greeting, shelf and a memory polaroid from the book");
    check((await page.locator("text=Continue QA Mumbai book").count()) === 1, "Home offers to continue the last edited book");
    await shot("0-home");
    await page.click("text=open this spread");
    await page.locator('[data-testid="spread"]').waitFor({ timeout: 15000 });
    pass("Memory links straight to its spread in the editor");

    // ---- shelf ----
    await page.goto(`${BASE}/books`);
    await page.locator(`[data-book="${ids.bookId}"]`).waitFor({ timeout: 15000 });
    await shot("1-shelf");
    pass("Shelf shows the book");

    // ---- editor opens with all elements ----
    await page.locator(`[data-book="${ids.bookId}"]`).click();
    await page.locator('[data-testid="spread"]').waitFor({ timeout: 15000 });
    await page.locator("[data-el]").nth(3).waitFor({ timeout: 15000 });
    await page.waitForTimeout(1200); // fonts and image
    const count0 = await page.locator("[data-el]").count();
    check(count0 === 4, "Editor shows all 4 elements", `count=${count0}`);
    check((await page.inputValue('input[aria-label="Spread title"]')) === "Day out in Mumbai", "Spread title shown");
    await shot("2-editor");

    // ---- select + drag the photo onto the right page ----
    const photo = page.locator(`[data-el="${ids.photo}"]`);
    await photo.click({ position: { x: 40, y: 40 } });
    await page.locator('[role="toolbar"][aria-label="Selected item"]').waitFor();
    const box = await photo.boundingBox();
    const sx = box.x + 60, sy = box.y + 60;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    for (let i = 1; i <= 25; i++) await page.mouse.move(sx + i * 18, sy + i * 2);
    await page.mouse.up();
    await page.waitForTimeout(1500);
    let p = (await els(ids)).find((e) => e.id === ids.photo);
    check(p.page === "right", "Dragging the photo across the spine moves it to the right page", `page=${p.page} x=${p.x.toFixed(3)} y=${p.y.toFixed(3)}`);

    // ---- rotate with the rotation handle ----
    const rot = page.locator(".moveable-rotation-control").first();
    const rb = await rot.boundingBox();
    if (rb) {
      await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2);
      await page.mouse.down();
      for (let i = 1; i <= 15; i++) await page.mouse.move(rb.x + rb.width / 2 + i * 6, rb.y + rb.height / 2 + i * 2);
      await page.mouse.up();
      await page.waitForTimeout(1500);
      const before = p.rotate;
      p = (await els(ids)).find((e) => e.id === ids.photo);
      check(Math.abs(p.rotate - before) >= 5, "Rotation handle turns the photo and saves", `rotate ${before} -> ${p.rotate}`);
    } else fail("Rotation handle visible");

    // ---- lock: a locked item can't be dragged or deleted until it's unlocked ----
    await page.click('[role="toolbar"] button[aria-label="Lock"]');
    await page.waitForTimeout(1200);
    p = (await els(ids)).find((e) => e.id === ids.photo);
    check(p.locked === true && (await page.locator('[data-testid="lock-badge"]').count()) === 1 && (await page.locator(".moveable-control >> visible=true").count()) === 0,
      "Lock saves, shows a lock badge and hides the move handles", `locked=${p.locked}`);
    const lb = await photo.boundingBox();
    const lx = lb.x + lb.width / 2, ly = lb.y + lb.height / 2;
    await page.mouse.move(lx, ly);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(lx - i * 12, ly + i * 4);
    await page.mouse.up();
    await page.keyboard.press("Delete");
    await page.waitForTimeout(1500);
    const pl = (await els(ids)).find((e) => e.id === ids.photo);
    check(pl.x === p.x && pl.y === p.y && pl.page === p.page && !pl.is_deleted, "A locked item doesn't move when dragged, and Delete leaves it alone", `x ${p.x} -> ${pl.x}`);
    await shot("2b-locked");
    await page.click('[role="toolbar"] button[aria-label="Unlock"]');
    await page.waitForTimeout(1200);
    p = (await els(ids)).find((e) => e.id === ids.photo);
    check(p.locked === false && (await page.locator(".moveable-control >> visible=true").count()) > 0, "Unlock brings the move handles back");

    // ---- add a sticker from the tray, undo, redo ----
    await page.click('[role="tab"]:has-text("Stickers")');
    await page.click('button:has-text("Daisy")');
    await page.waitForTimeout(1500);
    check((await page.locator("[data-el]").count()) === 5, "Sticker added from the tray", `count=${await page.locator("[data-el]").count()}`);
    await page.locator('[data-testid="spread"]').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(1500);
    check((await page.locator("[data-el]").count()) === 4, "Undo removes the sticker");
    await page.keyboard.press("Control+y");
    await page.waitForTimeout(1500);
    check((await page.locator("[data-el]").count()) === 5, "Redo brings it back");

    // ---- edit the sticky note in place ----
    await page.locator(`[data-el="${ids.note}"]`).dblclick();
    const ta = page.locator(`[data-el="${ids.note}"] textarea`);
    await ta.fill("we are still kiddos forever ♡ (edited)");
    await page.locator('[data-testid="spread"]').click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(1500);
    const note = (await els(ids)).find((e) => e.id === ids.note);
    check(note.content.text.endsWith("(edited)"), "Double-click edits the note text and saves", note.content.text);

    // ---- delete with the toolbar ----
    await page.locator(`[data-el="${ids.note}"]`).click();
    await page.click('[role="toolbar"] button[aria-label="Delete"]');
    await page.waitForTimeout(1500);
    await page.reload();
    await page.locator("[data-el]").first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1500);
    const afterReload = await page.locator("[data-el]").count();
    check(afterReload === 4 && (await page.locator(`[data-el="${ids.note}"]`).count()) === 0, "Delete persists after reload", `count=${afterReload}`);
    await shot("3-after-edits");

    // ---- letter opens on double-click ----
    await page.locator('[data-type="letter"]').dblclick();
    check((await page.locator('[role="dialog"][aria-label="Letter"]').count()) === 1, "Double-clicking a letter opens it");
    await page.click('[role="dialog"] button:has-text("Close")');

    // ---- new spread ----
    await page.click('button:has-text("New spread")');
    await page.waitForFunction(() => /Spread 2/.test(document.body.innerText), null, { timeout: 15000 });
    check(true, "New spread added and opened");
    await shot("4-new-spread");

    // ---- turn pages like a book ----
    const spreadNo = async () => Number((await page.locator("header").innerText()).match(/Spread (\d+)/)[1]);
    const sb = await page.locator('[data-testid="spread"]').boundingBox();
    // swipe the empty page to the right: back a page
    await page.mouse.move(sb.x + sb.width * 0.3, sb.y + sb.height * 0.6);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(sb.x + sb.width * 0.3 + i * 22, sb.y + sb.height * 0.6 + i);
    await page.mouse.up();
    await page.waitForTimeout(250);
    await shot("4b-page-turning");
    await page.waitForTimeout(900);
    check((await spreadNo()) === 1, "Swiping the page to the right turns back a spread", `spread ${await spreadNo()}`);
    // trackpad: scroll sideways for the next page
    await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
    for (let i = 0; i < 4; i++) await page.mouse.wheel(60, 0);
    await page.waitForTimeout(1000);
    check((await spreadNo()) === 2, "Scrolling sideways turns to the next spread", `spread ${await spreadNo()}`);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(1000);
    check((await spreadNo()) === 1, "The left arrow key turns back");
    await page.click('button[aria-label="Turn the page forward"]');
    await page.waitForTimeout(1000);
    check((await spreadNo()) === 2, "Clicking the folded page corner turns forward");

    // ---- timeline ----
    await page.goto(`${BASE}/timeline`);
    await page.locator(`[data-entry="${ids.bookId}/${ids.spreadId}"]`).waitFor({ timeout: 20000 });
    await page.waitForTimeout(1000);
    check((await page.locator('[data-testid="year"]').innerText()) === "2025", "Timeline opens on the latest year with dated spreads");
    const entryText = await page.locator(`[data-entry="${ids.bookId}/${ids.spreadId}"]`).innerText();
    check(/Day out in Mumbai/.test(entryText) && /1 photo/.test(entryText) && /April/.test(await page.locator("main").innerText()),
      "Timeline shows the spread under April with its photo count", entryText.replace(/\s+/g, " ").slice(0, 120));
    await shot("5-timeline");
    await page.click(`[data-entry="${ids.bookId}/${ids.spreadId}"] >> text=Open this spread`);
    await page.locator('[data-testid="spread"]').waitFor({ timeout: 15000 });
    pass("Timeline entry opens its spread in the editor");

    // ---- retired screens redirect; chat lives on the new screens ----
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL("**/home", { timeout: 15000 });
    await page.goto(`${BASE}/gallery`);
    await page.waitForURL("**/timeline", { timeout: 15000 });
    await page.goto(`${BASE}/notes`);
    await page.waitForURL("**/letters", { timeout: 15000 });
    pass("Old addresses (/dashboard, /gallery, /notes) open the new screens");

    await page.click('button:has-text("Our chat")');
    await page.locator('input[placeholder="Write something…"]').fill("qa hello from the new screens");
    await page.keyboard.press("Enter");
    await page.locator("text=qa hello from the new screens").waitFor({ timeout: 15000 });
    await shot("6-chat");
    pass("Our chat opens on the new screens and sends a message");
  } catch (e) {
    fail("Script error", e.message.split("\n")[0]);
    await shot("error").catch(() => {});
  } finally {
    await browser.close();
  }

  console.log("\n==== RESULTS ====");
  results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? "  — " + d : ""}`));
  const relevant = errors.filter((e) => !/favicon|DevTools/i.test(e));
  console.log(`\n==== CONSOLE ERRORS (${relevant.length}) ====`);
  relevant.slice(0, 20).forEach((e) => console.log(e.slice(0, 300)));
  console.log(`\nAccount used: ${A.email}\nScreenshots: ${SHOTS}`);
  process.exit(results.some(([s]) => s === "FAIL") ? 1 : 0);
})();
