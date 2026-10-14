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
const XREF_ZIP = 'https://codeload.github.com/calebmpeterson/bible-cross-reference-json/tar.gz/refs/heads/main';
const XREF_SOURCE = argOf('--xref-source', null);

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

function loadXrefSource() {
  if (XREF_SOURCE) return XREF_SOURCE;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xref-'));
  console.log('downloading KJV cross-reference source...');
  const tar = path.join(dir, 'xref.tar.gz');
  execFileSync('curl', ['-sL', '-o', tar, XREF_ZIP]);
  execFileSync('tar', ['xzf', tar, '-C', dir, '--strip-components=1']);
  return dir;
}

const sourceDir = loadSource();
const xrefRootDir = loadXrefSource();

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

/* 3c. full canon coverage for Bible Mode (all 66 books / 1,189 chapters) */

const CANON_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

for (const book of CANON_ORDER) {
  const chapters = canon[book] || [];
  for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
    const chNum = chIdx + 1;
    addRange(book, chNum, 1, maxVerse(book, chNum) ?? 0);
  }
}

/* 3d. build per-verse cross-references for all 31,102 KJV verses */

const xrefMap = new Map();
const addXrefLink = (srcKey, targetLabel) => {
  if (!xrefMap.has(srcKey)) xrefMap.set(srcKey, []);
  const list = xrefMap.get(srcKey);
  const selfLabel = srcKey.replace('\u0000', ' ').replace('\u0000', ':');
  if (targetLabel && targetLabel !== selfLabel && !list.includes(targetLabel)) {
    list.push(targetLabel);
  }
};

// First: include explicit verse-by-verse cross-references from index.html rows
const marker = ' Cross-references: ';
for (const row of rows) {
  const idx = row.prose.indexOf(marker);
  if (idx === -1) continue;
  const xrefRaw = row.prose.slice(idx + marker.length).replace(/\.$/, '');
  for (const item of xrefRaw.split('; ')) {
    const arrow = item.indexOf(' → ');
    if (arrow === -1) continue;
    const [ch, v] = item.slice(0, arrow).trim().split(':').map(Number);
    if (!ch || !v || !verseText(row.book, ch, v)) continue;
    const srcKey = `${row.book}\u0000${ch}\u0000${v}`;
    const srcLabel = `${row.book} ${ch}:${v}`;
    for (const m of item.slice(arrow + 3).matchAll(proseRef)) {
      const tBook = normaliseBook(m[1]);
      const tCh = +m[2];
      const tV = +m[3];
      if (!verseText(tBook, tCh, tV)) continue;
      const tKey = `${tBook}\u0000${tCh}\u0000${tV}`;
      const tLabel = `${tBook} ${tCh}:${tV}`;
      addXrefLink(srcKey, tLabel);
      addXrefLink(tKey, srcLabel);
    }
  }
}

// Second: include TSK cross-references across all 66 books
const abbrFile = path.join(xrefRootDir, 'cross-references/reference/book-abbreviation-to-title.json');
const abbrToTitle = JSON.parse(fs.readFileSync(abbrFile, 'utf8'));
const parseCode = code => {
  const parts = String(code).trim().split(/\s+/);
  const b = abbrToTitle[parts[0]];
  const ch = +parts[1];
  const v = +parts[2];
  if (!b || !ch || !v || !verseText(b, ch, v)) return null;
  return { key: `${b}\u0000${ch}\u0000${v}`, label: `${b} ${ch}:${v}` };
};

const xrefFilesDir = path.join(xrefRootDir, 'cross-references');
for (const f of fs.readdirSync(xrefFilesDir).sort()) {
  if (!f.endsWith('.json')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(xrefFilesDir, f), 'utf8'));
  for (const entry of data) {
    const src = parseCode(entry.v);
    if (!src) continue;
    for (const rCode of (entry.r || [])) {
      const tgt = parseCode(rCode);
      if (!tgt || tgt.key === src.key) continue;
      addXrefLink(src.key, tgt.label);
      addXrefLink(tgt.key, src.label);
    }
  }
}

// Third: deterministic lexical parallel fallback for any verse with < 2 refs
const STOP_WORDS = new Set([
  'the','and','of','to','that','in','shall','he','unto','for','his','they','be',
  'is','not','him','them','it','with','all','thou','thy','was','which','my','me',
  'said','but','ye','their','have','will','thee','from','as','are','when','this',
  'out','were','by','up','you','there','we','had','into','on','came','one','come',
  'her','upon','also','so','an','at','now','went','us','if','hath','then','shalt',
  'do','no','or','go','down','before','let','may','made','make'
]);
const wordDf = new Map();
const verseWords = new Map();
const wordPostings = new Map();

const PURE_STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'unto', 'for', 'a', 'an', 'with', 'by',
  'at', 'on', 'from', 'as', 'or', 'nor', 'but', 'if', 'that', 'which',
  'it', 'he', 'him', 'his', 'they', 'them', 'their', 'her', 'we', 'us',
  'ye', 'you', 'your', 'thou', 'thee', 'thy', 'thine', 'my', 'me', 'mine',
  'be', 'is', 'are', 'was', 'were', 'been', 'am', 'art', 'wert', 'wast',
  'so', 'not', 'no', 'into', 'up', 'out', 'upon'
]);
const allWordDf = new Map();
const verseConcCandidates = new Map();

for (const book of CANON_ORDER) {
  const chapters = canon[book] || [];
  for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
    const ch = chIdx + 1;
    const maxV = maxVerse(book, ch) ?? 0;
    for (let v = 1; v <= maxV; v++) {
      const key = `${book}\u0000${ch}\u0000${v}`;
      const text = verseText(book, ch, v) || '';
      const toks = [...new Set((text.toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !STOP_WORDS.has(w)))];
      verseWords.set(key, toks);
      for (const w of toks) {
        wordDf.set(w, (wordDf.get(w) || 0) + 1);
      }

      const allWords = [...new Set((text.toLowerCase().match(/[a-z]{2,}/g) || []))];
      const nonStop = allWords.filter(w => !PURE_STOP_WORDS.has(w));
      const chosen = nonStop.length >= 2 ? nonStop : allWords;
      verseConcCandidates.set(key, chosen);
      for (const w of chosen) {
        allWordDf.set(w, (allWordDf.get(w) || 0) + 1);
      }
    }
  }
}

function getVerseConcordance(book, ch, v) {
  const key = `${book}\u0000${ch}\u0000${v}`;
  const candidates = (verseConcCandidates.get(key) || []).slice();
  candidates.sort((a, b) => (allWordDf.get(a) || 99999) - (allWordDf.get(b) || 99999));
  return candidates.slice(0, 3);
}

for (const [key, toks] of verseWords.entries()) {
  const [b, c, v] = key.split('\u0000');
  const label = `${b} ${c}:${v}`;
  for (const w of toks) {
    if ((wordDf.get(w) || 0) <= 400) {
      let post = wordPostings.get(w);
      if (!post) {
        post = [];
        wordPostings.set(w, post);
      }
      post.push({ key, label, book: b });
    }
  }
}

function getVerseRefs(book, ch, v) {
  const key = `${book}\u0000${ch}\u0000${v}`;
  const selfLabel = `${book} ${ch}:${v}`;
  const list = (xrefMap.get(key) || []).slice(0, 3);
  if (list.length >= 2) return list;

  const toks = (verseWords.get(key) || [])
    .slice()
    .sort((a, b) => (wordDf.get(a) || 99999) - (wordDf.get(b) || 99999));
  const scores = new Map();
  for (const w of toks.slice(0, 8)) {
    const idf = 1 / Math.max(1, wordDf.get(w) || 500);
    for (const cand of (wordPostings.get(w) || [])) {
      if (cand.key === key) continue;
      scores.set(cand.label, (scores.get(cand.label) || 0) + idf + (cand.book !== book ? 0.01 : 0));
    }
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  for (const [lbl] of ranked) {
    if (list.length >= 3) break;
    if (lbl !== selfLabel && !list.includes(lbl)) list.push(lbl);
  }
  if (list.length < 2) {
    const maxV = maxVerse(book, ch) || 1;
    const candidates = [v - 1, v + 1, v - 2, v + 2, 1].filter(
      cv => cv >= 1 && cv <= maxV && cv !== v
    );
    for (const altV of candidates) {
      if (list.length >= 2) break;
      const altLabel = `${book} ${ch}:${altV}`;
      if (!list.includes(altLabel)) list.push(altLabel);
      for (const r of (xrefMap.get(`${book}\u0000${ch}\u0000${altV}`) || [])) {
        if (list.length >= 3) break;
        if (r !== selfLabel && !list.includes(r)) list.push(r);
      }
    }
  }
  return list.slice(0, 3);
}

/* ---------- 4. emit ---------- */

const out = {};
for (const key of needed) {
  const [book, chapter, verse] = key.split('\u0000');
  const text = verseText(book, +chapter, +verse);
  const refs = getVerseRefs(book, +chapter, +verse);
  const conc = getVerseConcordance(book, +chapter, +verse);
  ((out[book] ??= {})[chapter] ??= []).push([+verse, text, refs, conc]);
}
for (const chapters of Object.values(out)) {
  for (const list of Object.values(chapters)) {
    list.sort((a, b) => a[0] - b[0]);
  }
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
