#!/usr/bin/env node
/*
 * scan-oracles.mjs
 *
 * Advisory sweep for the mistake class that produced the original gaps:
 * a chapter whose only row is the auto-fill placeholder, while its text
 * still contains a strong oracle formula. Exodus 8 (frogs, lice, flies),
 * 1 Kings 8:25, 2 Samuel 22:50 and 1 Chronicles 16:31 were all found this
 * way.
 *
 * It is deliberately noisy. It reports "look here", not "this is wrong",
 * so it prints candidates and always exits 0. Use it when adding rows or
 * revisiting a book.
 *
 *   node tools/scan-oracles.mjs            # everything
 *   node tools/scan-oracles.mjs --limit 40 # first 40 candidates
 *
 * Needs the KJV text. It downloads the same public-domain source the verse
 * text generator uses; if that fails the script explains and exits 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const limitArg = argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? Number(argv[limitArg + 1]) : Infinity;

const KJV_ZIP = 'https://codeload.github.com/aruljohn/Bible-kjv/tar.gz/refs/heads/master';

/* ---------- obtain the KJV source ---------- */

const sourceArg = argv.indexOf('--source');
let sourceDir = sourceArg !== -1 ? argv[sourceArg + 1] : null;

if (!sourceDir) {
  try {
    sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kjv-scan-'));
    console.log('downloading the KJV source...');
    const tar = path.join(sourceDir, 'kjv.tar.gz');
    execFileSync('curl', ['-sL', '--max-time', '60', '-o', tar, KJV_ZIP]);
    execFileSync('tar', ['xzf', tar, '-C', sourceDir, '--strip-components=1']);
  } catch (error) {
    console.log(`could not download the KJV source (${error.message}).`);
    console.log('Skipping the advisory sweep.');
    process.exit(0);
  }
}

const canon = {};
for (const file of fs.readdirSync(sourceDir)) {
  if (!file.endsWith('.json') || file === 'Books.json') continue;
  const data = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
  canon[data.book] = data.chapters;
}

/* ---------- read the tracker rows ---------- */

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const rows = [];
const packRe = /const\s+(rawData|pack\d+Rows)\s*=\s*(\[[\s\S]*?\n  \]);/g;
let match;

while ((match = packRe.exec(html))) {
  let value;
  try {
    value = new Function('return ' + match[2])();
  } catch {
    continue;
  }
  for (const row of value) {
    if (!Array.isArray(row)) continue;
    rows.push(row.length === 6
      ? { book: 'Genesis', chapter: +row[0], category: String(row[3] ?? '') }
      : { book: String(row[0]), chapter: +row[1], category: String(row[4] ?? '') });
  }
}

/* ---------- which chapters are catalogued as having no prophecy ---------- */

const declarations = new Set();
for (const m of html.matchAll(/const\s+(\w*[Cc]hapterCounts\w*)\s*=\s*\{([\s\S]*?)\n  \};/g)) {
  for (const entry of m[2].matchAll(/"([^"]+)"\s*:\s*(\d+)/g)) {
    declarations.add(entry[1]);
    void entry[2];
  }
}

const authored = new Set(rows.map(row => `${row.book}|${row.chapter}`));
const hasProphecy = new Set(
  rows.filter(row => row.category !== 'No explicit prophecy').map(row => `${row.book}|${row.chapter}`)
);

/*
 * Chapters that carry no authored prophecy row. Those with no authored row
 * at all are filled by the auto-fill placeholder at runtime, which is
 * exactly the state that hid the original gaps.
 */
const suspect = [];

for (const book of Object.keys(canon)) {
  if (!declarations.has(book)) continue;
  for (const chapter of canon[book]) {
    const number = Number(chapter.chapter);
    if (hasProphecy.has(`${book}|${number}`)) continue;
    suspect.push({ book, chapter: number, authored: authored.has(`${book}|${number}`) });
  }
}

/* ---------- look for oracle language in those chapters ---------- */

const ORACLE = [
  /\bbehold, I will\b/i,
  /\bI will (bring|raise|make|give|send|do|cut|set|gather|scatter|visit|punish|break|take|establish|multiply|destroy|smite|deliver|pour|stretch)\b/i,
  /\bthe LORD (shall|will) (bring|make|give|send|do|cut|set|gather|visit|punish|smite|deliver|save|come|destroy)\b/i,
  /\bshall come to pass\b/i,
  /\bbehold, the days come\b/i,
  /\bin the latter days\b/i,
  /\bI will make (my|the|a) covenant\b/i,
  /\bthe LORD hath sworn\b/i,
  /\bI have sworn\b/i
];

// verses that merely quote people, or are devotional, are not oracles
const NOT_AN_ORACLE =
  /\b(Pharaoh said|Moses said|the king said|he said unto|she said unto|they said|O LORD|I will praise|I will sing|I will bless|I will give thanks|my God|my strength|my rock)\b/i;

const findings = [];

for (const { book, chapter, authored: isAuthored } of suspect) {
  const verses = canon[book]?.[chapter - 1]?.verses ?? [];
  const hits = [];

  for (const verse of verses) {
    if (!ORACLE.some(re => re.test(verse.text))) continue;
    if (NOT_AN_ORACLE.test(verse.text) && !/saith the LORD/i.test(verse.text)) continue;
    hits.push(verse);
  }

  if (hits.length) {
    findings.push({ book, chapter, autoFilled: !isAuthored, hits });
  }
}

findings.sort((a, b) => b.hits.length - a.hits.length);

console.log(`chapters catalogued as having no explicit prophecy: ${suspect.length.toLocaleString()}`);
console.log(`of those, still containing oracle language        : ${findings.length.toLocaleString()} to review\n`);

let shown = 0;
for (const finding of findings) {
  if (shown >= LIMIT) break;
  shown++;
  const how = finding.autoFilled ? 'auto-fill placeholder' : 'authored "no prophecy"';
  console.log(`${finding.book} ${finding.chapter}  (${how}, ${finding.hits.length} candidate verses)`);
  for (const verse of finding.hits.slice(0, 3)) {
    console.log(`   ${finding.chapter}:${verse.verse}  ${verse.text.replace(/\s+/g, ' ').slice(0, 120)}`);
  }
  console.log('');
}

if (findings.length > shown) {
  console.log(`...and ${findings.length - shown} more. Run with --limit 0 to see none, or read the full list above.`);
}

console.log('Advisory only — many of these are statute, human speech or narrative,');
console.log('which the stated method excludes. No exit code is set.');
