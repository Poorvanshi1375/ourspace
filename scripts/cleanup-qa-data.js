#!/usr/bin/env node
/*
 * Removes the test accounts created by the end-to-end checks, and everything they made.
 *
 *   QA accounts:  qa.a.<timestamp>@example.com / qa.b.<timestamp>@example.com
 *   Removed:      their spaces (only when every member is a QA account), all memories,
 *                 letters and chat in those spaces, their profile docs, their Auth users.
 *
 * Uses the Admin SDK because firestore.rules (correctly) blocks deletes from the app.
 *
 * Setup (once): Firebase Console → Project settings → Service accounts →
 * "Generate new private key". Save it as serviceAccountKey.json in the project root
 * (it is git-ignored) — or point GOOGLE_APPLICATION_CREDENTIALS at it.
 *
 * Usage:
 *   node scripts/cleanup-qa-data.js          # dry run: lists what would be deleted
 *   node scripts/cleanup-qa-data.js --yes    # actually deletes
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const PROJECT_ID = "ourspace-dev";
const QA_EMAIL = /^qa\.[ab]\.\d+@example\.com$/;
const APPLY = process.argv.includes("--yes");

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
initializeApp({
  projectId: PROJECT_ID,
  credential: fs.existsSync(keyPath) ? cert(require(keyPath)) : applicationDefault(),
});

const auth = getAuth();
const db = getFirestore();

async function findQaUsers() {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users.filter((u) => QA_EMAIL.test(u.email || "")));
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

async function deleteQuery(q, label) {
  const snap = await q.get();
  if (APPLY && !snap.empty) {
    // Batches are limited to 500 writes
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = db.batch();
      snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  console.log(`  ${label}: ${snap.size}`);
  return snap.size;
}

(async () => {
  console.log(APPLY ? "DELETING QA data…\n" : "DRY RUN (nothing is deleted; add --yes to delete)\n");

  const qaUsers = await findQaUsers();
  const qaUids = new Set(qaUsers.map((u) => u.uid));
  console.log(`QA accounts found: ${qaUsers.length}`);
  qaUsers.forEach((u) => console.log(`  ${u.email}`));
  if (!qaUsers.length) return;

  // Spaces any QA account belongs to
  const spaces = new Map();
  for (const uid of qaUids) {
    const snap = await db.collection("spaces").where("userIds", "array-contains", uid).get();
    snap.docs.forEach((d) => spaces.set(d.id, d));
  }

  console.log(`\nSpaces found: ${spaces.size}`);
  for (const [code, spaceDoc] of spaces) {
    const members = spaceDoc.get("userIds") || [];
    if (!members.every((m) => qaUids.has(m))) {
      console.log(`\n  SKIPPING ${code}: it has real (non-QA) members`);
      continue;
    }

    console.log(`\n  Space ${code}`);
    await deleteQuery(db.collection("memory_posts").where("spaceCode", "==", code), "memories");
    await deleteQuery(db.collection("notes").where("spaceCode", "==", code), "letters");

    const chatRef = db.collection("scrapbook_chat").doc(code);
    const chatCount = (await chatRef.collection("messages").count().get()).data().count;
    if (APPLY) await db.recursiveDelete(chatRef);
    console.log(`  chat messages: ${chatCount}`);

    if (APPLY) await spaceDoc.ref.delete();
    console.log("  space document: 1");
  }

  console.log(`\nProfile docs: ${qaUids.size}`);
  if (APPLY) {
    const batch = db.batch();
    qaUids.forEach((uid) => batch.delete(db.collection("users").doc(uid)));
    await batch.commit();

    const res = await auth.deleteUsers([...qaUids]);
    console.log(`Auth users deleted: ${res.successCount} (failed: ${res.failureCount})`);
  } else {
    console.log(`Auth users: ${qaUids.size}`);
  }

  console.log(APPLY ? "\nDone." : "\nDry run complete. Run again with --yes to delete.");
})().catch((err) => {
  if (/credential|Could not load the default credentials/i.test(err.message)) {
    console.error(
      "No Firebase admin credentials found.\n" +
        "Download a service account key (Firebase Console → Project settings → Service accounts →\n" +
        "Generate new private key) and save it as serviceAccountKey.json in the project root."
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
