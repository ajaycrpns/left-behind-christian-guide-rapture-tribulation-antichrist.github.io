#!/usr/bin/env node
/*
 * build-verse-text.mjs
 *
 * Generates kjv-verses.json — the KJV text for every verse the tracker cites.
 *
 * The tracker references verses in two places:
 *   1. the "Passage" column of each row
 *   2. scripture references written inside the prose columns
 *      (prophecy, category, status, fulfillment)
 *
 * Both sets are collected so that a reader can open any row and read its
 * text, and click any reference written in the commentary.
 *
 * Usage:
 *   node tools/build-verse-text.mjs [--source <dir>] [--out <file>]
 *
 * Source is the public-domain KJV as one JSON file per book:
 *   https://github.com/aruljohn/Bible-kjv
 * It is downloaded to a temp directory when --source is not supplied.
 *
 * Output shape (kept small: only cited verses, no full Bible):
 *   { "Genesis": { "1": [[1, "In the beginning..."], ...] } }
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const OUT = path.resolve(ROOT, argOf('--out', 'kjv-verses.json'));
const INDEX = path.join(ROOT, 'index.html');
const SOURCE = argOf('--source', null);
const KJV_ZIP = 'https://codeload.github.com/aruljohn/Bible-kjv/tar.gz/refs/heads/master';

/* ---------- 1. obtain the KJV source ---------- */

function loadSource() {
  if (SOURCE) return SOURCE;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kjv-'));
  console.log('downloading KJV source...');
  const tar = path.join(dir, 'kjv.tar.gz');
  const res = execFileSync('curl', ['-sL', '-o', tar, KJV_ZIP]);
  void res;
  execFileSync('tar', ['xzf', tar, '-C', dir, '--strip-components=1']);
  return dir;
}

const sourceDir = loadSource();

const canon = {};       // book -> chapters[] as in the source
for (const file of fs.readdirSync(sourceDir)) {
  if (!file.endsWith('.json') || file === 'Books.json') continue;
  const data = JSON.parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
  canon[data.book] = data.chapters;
}

const maxVerse = (book, chapter) => canon[book]?.[chapter - 1]?.verses.length ?? null;
const verseText = (book, chapter, verse) =>
  canon[book]?.[chapter - 1]?.verses[verse - 1]?.text ?? null;

/* ---------- 2. read the tracker rows out of index.html ---------- */

const html = fs.readFileSync(INDEX, 'utf8');

/** Pull every row array literal out of the data packs. */
function parseRows(source) {
  const rows = [];
  // Each row is a 5- or 7-element array literal assigned into a pack array.
  const re = /\[\s*("(?:[^"\\]|\\.)*"|\d+)\s*,\s*(?:"(?:[^"\\]|\\.)*"|\d+)\s*,\s*"(?:[^"\\]|\\.)*"/g;
  void re;

  // Simpler and more robust: evaluate each pack array with a sandboxed Function.
  const packRe = /const\s+(rawData|pack\d+Rows)\s*=\s*(\[[\s\S]*?\n  \]);/g;
  let m;
  while ((m = packRe.exec(source))) {
    let value;
    try {
      value = new Function('return ' + m[2])();
    } catch {
      continue;
    }
    for (const row of value) {
      if (!Array.isArray(row)) continue;
      // Genesis (rawData) rows are [chapter, passage, prophecy, category, status, fulfillment]
      // Pack rows are [book, chapter, passage, prophecy, category, status, fulfillment]
      if (row.length === 6) {
        rows.push({
          book: 'Genesis',
          chapter: String(row[0]),
          passage: String(row[1] ?? ''),
          prose: [row[2], row[3], row[4], row[5]].filter(Boolean).map(String).join(' ')
        });
      } else if (row.length === 7) {
        rows.push({
          book: String(row[0]),
          chapter: String(row[1]),
          passage: String(row[2] ?? ''),
          prose: [row[3], row[4], row[5], row[6]].filter(Boolean).map(String).join(' ')
        });
      }
    }
  }
  return rows;
}

const rows = parseRows(html);
if (!rows.length) {
  console.error('No tracker rows found in index.html — aborting.');
  process.exit(1);
}
console.log(`tracker rows parsed: ${rows.length}`);

/* ---------- 3. collect every cited verse ---------- */

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm', 'Proverbs', 'Ecclesiastes',
  'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea',
  'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
].sort((a, b) => b.length - a.length);

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normaliseBook = b => (b === 'Psalm' ? 'Psalms' : b);
const needed = new Set();

const addVerse = (book, chapter, verse) => {
  if (!verseText(book, chapter, verse)) return;
  needed.add(`${book}\u0000${chapter}\u0000${verse}`);
};
const addRange = (book, chapter, from, to) => {
  const max = maxVerse(book, chapter) ?? to;
  for (let v = from; v <= Math.min(to, max); v++) addVerse(book, chapter, v);
};

/* 3a. the Passage column */

for (const row of rows) {
  const { book } = row;
  const base = Number(row.chapter);
  // strip the em-dash qualifier, and normalise sub-verse letters (61:2a -> 61:2)
  const passage = row.passage.replace(/\s+—\s+.*$/, '').replace(/(\d)[ab](?=\D|$)/g, '$1');
  if (!passage || passage === '—') continue;

  let current = base;
  for (const part of passage.split(/;|,|\band\b|&/).map(s => s.trim()).filter(Boolean)) {
    let m;
    if ((m = part.match(/^(\d+):(\d+)\s*[–\-—]\s*(\d+):(\d+)$/))) {
      addRange(book, +m[1], +m[2], maxVerse(book, +m[1]) ?? +m[2]);
      addRange(book, +m[3], 1, +m[4]);
      current = +m[3];
    } else if ((m = part.match(/^(\d+):(\d+)\s*[–\-—]\s*(\d+)$/))) {
      current = +m[1];
      addRange(book, current, +m[2], +m[3]);
    } else if ((m = part.match(/^(\d+):(\d+)$/))) {
      current = +m[1];
      addRange(book, current, +m[2], +m[2]);
    } else if ((m = part.match(/^(\d+)\s*[–\-—]\s*(\d+)$/))) {
      addRange(book, current, +m[1], +m[2]);
    } else if ((m = part.match(/^(\d+)$/))) {
      addRange(book, current, +m[1], +m[1]);
    }
  }
}

/* 3b. references written inside the prose columns */

const proseRef = new RegExp(
  '\\b(' + BOOKS.map(esc).join('|') + ')\\s+(\\d+):(\\d+)' +
  '(?:\\s*[–\\-]\\s*(?:(\\d+):)?(\\d+))?',
  'g'
);

for (const row of rows) {
  for (const m of row.prose.matchAll(proseRef)) {
    const book = normaliseBook(m[1]);
    if (!canon[book]) continue;
    const chapter = +m[2];
    const from = +m[3];
    const endChapter = m[4] ? +m[4] : chapter;
    const to = m[5] ? +m[5] : from;
    if (endChapter > chapter) {
      addRange(book, chapter, from, maxVerse(book, chapter) ?? from);
      addRange(book, endChapter, 1, to);
    } else {
      addRange(book, chapter, from, to);
    }
  }
}

/* ---------- 4. emit ---------- */

const out = {};
for (const key of needed) {
  const [book, chapter, verse] = key.split('\u0000');
  const text = verseText(book, +chapter, +verse);
  ((out[book] ??= {})[chapter] ??= []).push([+verse, text]);
}

const json = JSON.stringify(out);
fs.writeFileSync(OUT, json);

const gz = zlib.gzipSync(Buffer.from(json), { level: 9 });
const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`verses written : ${needed.size}`);
console.log(`books covered  : ${Object.keys(out).length}`);
console.log(`output         : ${path.relative(ROOT, OUT)}`);
console.log(`  raw          : ${kb(json.length)}`);
console.log(`  gzipped      : ${kb(gz.length)}`);
