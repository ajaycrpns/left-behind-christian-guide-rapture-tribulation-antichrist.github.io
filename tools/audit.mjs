#!/usr/bin/env node
/*
 * audit.mjs
 *
 * Checks the tracker's data for the classes of mistake that have actually
 * occurred in this repository: chapters silently covered by an auto-fill
 * placeholder while a parallel passage is tracked elsewhere, citations to
 * verses that do not exist, prose cross-references that point nowhere,
 * contradictory statuses on a shared verse, and verse text that has drifted
 * from the rows.
 *
 * Runs with no dependencies and no network. Exit code 1 means a real
 * problem; warnings alone do not fail the run.
 *
 *   node tools/audit.mjs            # errors + warnings
 *   node tools/audit.mjs --quiet    # errors only
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quiet = process.argv.includes('--quiet');

const INDEX = path.join(ROOT, 'index.html');
const STRUCTURE = path.join(ROOT, 'tools/kjv-structure.json');
const VERSES = path.join(ROOT, 'kjv-verses.json');

const errors = [];
const warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);

const html = fs.readFileSync(INDEX, 'utf8');
const structure = JSON.parse(fs.readFileSync(STRUCTURE, 'utf8'));
let cited = null;
let citedInvalid = false;
if (fs.existsSync(VERSES)) {
  try {
    cited = JSON.parse(fs.readFileSync(VERSES, 'utf8'));
  } catch (error) {
    citedInvalid = true;
    fail(`kjv-verses.json is not valid JSON (${error.message}) — re-run tools/build-verse-text.mjs`);
  }
}

/* ---------------------------------------------------------------
 * 1. read the rows straight out of index.html
 * --------------------------------------------------------------- */

function readRows(source) {
  const rows = [];
  const packRe = /const\s+(rawData|pack\d+Rows)\s*=\s*(\[[\s\S]*?\n  \]);/g;
  let match;

  while ((match = packRe.exec(source))) {
    let value;
    try {
      value = new Function('return ' + match[2])();
    } catch (error) {
      fail(`could not read the ${match[1]} array: ${error.message}`);
      continue;
    }

    for (const row of value) {
      if (!Array.isArray(row)) continue;

      if (row.length === 6) {
        rows.push({
          book: 'Genesis',
          chapter: Number(row[0]),
          passage: String(row[1] ?? ''),
          prophecy: String(row[2] ?? ''),
          category: String(row[3] ?? ''),
          status: String(row[4] ?? ''),
          fulfillment: String(row[5] ?? '')
        });
      } else if (row.length === 7) {
        rows.push({
          book: String(row[0]),
          chapter: Number(row[1]),
          passage: String(row[2] ?? ''),
          prophecy: String(row[3] ?? ''),
          category: String(row[4] ?? ''),
          status: String(row[5] ?? ''),
          fulfillment: String(row[6] ?? '')
        });
      } else {
        fail(`a row with ${row.length} values is neither 6 nor 7 long: ${JSON.stringify(row).slice(0, 80)}`);
      }
    }
  }

  return rows;
}

const rows = readRows(html);
if (!rows.length) {
  console.error('No tracker rows could be read from index.html.');
  process.exit(1);
}

const { books: canonicalBooks, chapters: canonicalChapters } = structure;
const maxChapter = book => canonicalChapters[book]?.length ?? null;
const maxVerse = (book, chapter) => canonicalChapters[book]?.[chapter - 1] ?? null;

/* ---------------------------------------------------------------
 * 2. the chapter counts declared by each pack must match the canon
 * --------------------------------------------------------------- */

const declared = {};

/*
 * Every pack carries its own chapter-count map, and the page auto-fills a
 * chapter if ANY pack declares it, so for coverage purposes the last
 * declaration of a book wins. Each declaration is still checked on its
 * own, because a pack that under-declares only looks harmless while some
 * later pack happens to declare the full canon.
 */

const declarations = [];

for (const match of html.matchAll(/const\s+(\w*[Cc]hapterCounts\w*)\s*=\s*\{([\s\S]*?)\n  \};/g)) {
  const pack = match[1];

  for (const entry of match[2].matchAll(/(?:^|\n)\s*(?:"([^"]+)"|([A-Za-z0-9 ]+?))\s*:\s*(\d+)/g)) {
    const book = (entry[1] ?? entry[2]).trim();
    const count = Number(entry[3]);
    declared[book] = count;
    declarations.push({ pack, book, count });
  }
}

for (const { pack, book, count } of declarations) {
  const actual = maxChapter(book);
  if (actual === null) {
    fail(`${pack} declares a chapter count for unknown book "${book}"`);
  } else if (count !== actual) {
    fail(`${pack} declares ${count} chapters for "${book}" but the Bible has ${actual}`);
  }
}

for (const book of canonicalBooks) {
  if (!(book in declared)) {
    fail(`no chapter count is declared for ${book}, so its chapters are never auto-covered`);
  }
}

/* ---------------------------------------------------------------
 * 3. every book and chapter must be covered
 * --------------------------------------------------------------- */

/*
 * Chapters without an authored row are filled in at runtime by the pack
 * that declares the book, so coverage is the authored rows plus whatever
 * the declared chapter counts will auto-fill. Check 2 has already proved
 * those counts match the canon, so an authored row is only required for
 * chapters that no pack declares.
 */

const authored = new Set(rows.map(row => `${row.book}|${row.chapter}`));
const autoFillBooks = new Set(Object.keys(declared));

for (const book of canonicalBooks) {
  if (autoFillBooks.has(book)) continue;
  for (let chapter = 1; chapter <= maxChapter(book); chapter++) {
    if (!authored.has(`${book}|${chapter}`)) {
      fail(`no row for ${book} ${chapter}, and no pack declares ${book} to auto-fill it`);
    }
  }
}

for (const row of rows) {
  if (!canonicalBooks.includes(row.book)) {
    fail(`unknown book "${row.book}"`);
  } else if (row.chapter < 1 || row.chapter > maxChapter(row.book)) {
    fail(`${row.book} ${row.chapter} is outside the book`);
  }
}

/* ---------------------------------------------------------------
 * 4. parse the passage column
 * --------------------------------------------------------------- */

function parseSpans(book, baseChapter, passage) {
  const spans = [];
  const cleaned = String(passage)
    .replace(/\s+—\s+.*$/, '')
    .replace(/(\d)[ab](?=\D|$)/g, '$1');

  if (!cleaned || cleaned === '—') return spans;

  let current = baseChapter;

  for (const part of cleaned.split(/;|,|\band\b|&/).map(s => s.trim()).filter(Boolean)) {
    let m;
    if ((m = part.match(/^(\d+):(\d+)\s*[–\-—]\s*(\d+):(\d+)$/))) {
      // a cross-chapter range has to move forwards: "3:16-4:1", never "4:1-3:16"
      if (+m[3] < +m[1]) {
        fail(`${book} ${baseChapter}: the passage "${passage}" runs backwards across chapters (${part})`);
      }
      spans.push({ chapter: +m[1], from: +m[2], to: Infinity });
      spans.push({ chapter: +m[3], from: 1, to: +m[4] });
      current = +m[3];
    } else if ((m = part.match(/^(\d+):(\d+)\s*[–\-—]\s*(\d+)$/))) {
      current = +m[1];
      spans.push({ chapter: current, from: +m[2], to: +m[3] });
    } else if ((m = part.match(/^(\d+):(\d+)$/))) {
      current = +m[1];
      spans.push({ chapter: current, from: +m[2], to: +m[2] });
    } else if ((m = part.match(/^(\d+)\s*[–\-—]\s*(\d+)$/))) {
      spans.push({ chapter: current, from: +m[1], to: +m[2] });
    } else if ((m = part.match(/^(\d+)$/))) {
      spans.push({ chapter: current, from: +m[1], to: +m[1] });
    } else {
      fail(`${book} ${baseChapter}: unreadable passage "${part}" in "${passage}"`);
    }
  }

  /*
   * Every row in this tracker is about the chapter it sits under, so a
   * passage has to begin there. A row under Isaiah 3 quoting "5:1-6:2"
   * is a copy-paste slip, not a cross-reference.
   */

  if (spans.length && spans[0].chapter !== baseChapter) {
    fail(`${book} ${baseChapter}: the passage "${passage}" begins in chapter ${spans[0].chapter}, not ${baseChapter}`);
  }

  return spans;
}

/*
 * A passage may address only part of a verse, written "61:2a" / "61:2b".
 * Two rows can then describe the same verse number from different angles
 * without contradicting each other, so those rows are reported rather than
 * failed.
 */

const hasSubVerse = passage => /\d\s*:\s*\d+\s*[ab]\b/i.test(String(passage));

const spanKey = (span, book) => {
  const last = maxVerse(book, span.chapter) ?? span.to;
  const to = span.to === Infinity ? last : span.to;
  return { chapter: span.chapter, from: span.from, to };
};

for (const row of rows) {
  if (!row.passage || row.passage === '—') continue;
  if (row.category === 'No explicit prophecy') continue;

  for (const span of parseSpans(row.book, row.chapter, row.passage)) {
    const resolved = spanKey(span, row.book);
    const verses = maxVerse(row.book, resolved.chapter);

    if (verses === null) {
      fail(`${row.book} ${row.chapter} "${row.passage}" cites chapter ${resolved.chapter}, which does not exist`);
      continue;
    }
    if (resolved.from < 1 || resolved.from > verses) {
      fail(`${row.book} ${row.chapter} "${row.passage}" starts at verse ${resolved.from} but ${row.book} ${resolved.chapter} has ${verses} verses`);
    }
    if (resolved.to < 1 || resolved.to > verses) {
      fail(`${row.book} ${row.chapter} "${row.passage}" ends at verse ${resolved.to} but ${row.book} ${resolved.chapter} has ${verses} verses`);
    }
    if (resolved.to < resolved.from) {
      fail(`${row.book} ${row.chapter} "${row.passage}" runs backwards`);
    }
  }
}

/* ---------------------------------------------------------------
 * 5. cross-references written inside the prose columns
 * --------------------------------------------------------------- */

const PROSE_BOOKS = [...canonicalBooks, 'Psalm'].sort((a, b) => b.length - a.length);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const proseRef = new RegExp(
  '\\b(' + PROSE_BOOKS.map(esc).join('|') + ')\\s+(\\d+):(\\d+)' +
  '(?:\\s*[–\\-]\\s*(?:(\\d+):)?(\\d+))?',
  'g'
);

let proseCount = 0;

for (const row of rows) {
  const prose = [row.prophecy, row.category, row.status, row.fulfillment].join(' ');
  let rowRefs = 0;

  for (const m of prose.matchAll(proseRef)) {
    const book = m[1] === 'Psalm' ? 'Psalms' : m[1];
    if (!canonicalChapters[book]) continue;
    proseCount++;
    rowRefs++;

    const chapter = +m[2];
    const from = +m[3];
    const endChapter = m[4] ? +m[4] : chapter;
    const to = m[5] ? +m[5] : from;

    const check = (c, v) => {
      const verses = maxVerse(book, c);
      if (verses === null) {
        fail(`${row.book} ${row.chapter}: commentary cites ${book} ${c}, which has no chapter ${c}`);
      } else if (v < 1 || v > verses) {
        fail(`${row.book} ${row.chapter}: commentary cites ${book} ${c}:${v}, but that chapter has ${verses} verses`);
      }
    };

    check(chapter, from);
    check(endChapter, to);

    if (endChapter < chapter || (endChapter === chapter && to < from)) {
      fail(`${row.book} ${row.chapter}: commentary reverses the range ${m[0]}`);
    }
  }

  if (row.category !== 'No explicit prophecy' && rowRefs === 0) {
    fail(`${row.book} ${row.chapter} (${row.passage}) has no cross-references in its commentary`);
  }

  if (row.category !== 'No explicit prophecy') {
    const xrefMarker = ' Cross-references: ';
    const concMarker = ' Concordances: ';
    const xrefIdx = row.fulfillment.indexOf(xrefMarker);
    const concIdx = row.fulfillment.indexOf(concMarker);
    const coveredByVerse = new Map();
    const concByVerse = new Map();

    if (xrefIdx !== -1) {
      const end = concIdx !== -1 ? concIdx : row.fulfillment.length;
      const raw = row.fulfillment.slice(xrefIdx + xrefMarker.length, end).replace(/\.$/, '');
      for (const item of raw.split('; ')) {
        const arrow = item.indexOf(' → ');
        if (arrow === -1) continue;
        const cv = item.slice(0, arrow).trim();
        const refs = [...item.slice(arrow + 3).matchAll(proseRef)];
        coveredByVerse.set(cv, refs.length);
      }
    }

    if (concIdx !== -1) {
      const raw = row.fulfillment.slice(concIdx + concMarker.length).replace(/\.$/, '');
      for (const item of raw.split('; ')) {
        const arrow = item.indexOf(' → ');
        if (arrow === -1) continue;
        const cv = item.slice(0, arrow).trim();
        const words = item.slice(arrow + 3).split(', ').map(w => w.trim()).filter(Boolean);
        concByVerse.set(cv, words.length);
      }
    } else {
      fail(`${row.book} ${row.chapter} (${row.passage}) has no concordances in its commentary`);
    }

    for (const span of parseSpans(row.book, row.chapter, row.passage)) {
      const { chapter, from, to } = spanKey(span, row.book);
      for (let v = from; v <= to; v++) {
        const cv = `${chapter}:${v}`;
        const count = coveredByVerse.get(cv) ?? 0;
        if (count < 2) {
          fail(`${row.book} ${cv} (in passage "${row.passage}") has ${count} cross-references in commentary (expected at least 2)`);
        }
        const concCount = concByVerse.get(cv) ?? 0;
        if (concCount < 2) {
          fail(`${row.book} ${cv} (in passage "${row.passage}") has ${concCount} concordances in commentary (expected at least 2)`);
        }
      }
    }
  }
}

/* ---------------------------------------------------------------
 * 6. a chapter must not hold both a real row and a placeholder,
 *    and must not repeat the same passage
 * --------------------------------------------------------------- */

const byChapter = new Map();
for (const row of rows) {
  const key = `${row.book}|${row.chapter}`;
  if (!byChapter.has(key)) byChapter.set(key, []);
  byChapter.get(key).push(row);
}

const PLACEHOLDER =
  'No new explicit divine prediction, covenant forecast or prophetic blessing';

for (const [key, list] of byChapter) {
  const [book, chapter] = key.split('|');
  const real = list.filter(row => row.category !== 'No explicit prophecy');
  const placeholders = list.filter(row =>
    row.category === 'No explicit prophecy' && row.fulfillment.startsWith(PLACEHOLDER)
  );

  if (real.length && placeholders.length) {
    fail(`${book} ${chapter} has both a real row and an auto-fill placeholder`);
  }
  if (list.length > 1 && list.every(row => row.category === 'No explicit prophecy')) {
    fail(`${book} ${chapter} has ${list.length} "no prophecy" rows`);
  }

  const seen = new Set();
  for (const row of list) {
    const passage = `${row.passage}|${row.category}`;
    if (seen.has(passage)) {
      fail(`${book} ${chapter} repeats the passage "${row.passage}" with category ${row.category}`);
    }
    seen.add(passage);
  }
}

/* ---------------------------------------------------------------
 * 7. one verse must not be described as both past and future
 * --------------------------------------------------------------- */

const family = category => ({
  Fulfilled: 'past',
  Ongoing: 'present',
  Future: 'future',
  'Partial / ongoing': 'mixed'
}[category] ?? 'other');

for (const [, list] of byChapter) {
  const sets = list
    .filter(row => row.category !== 'No explicit prophecy')
    .map(row => ({
      row,
      partial: hasSubVerse(row.passage),
      verses: new Set(
        parseSpans(row.book, row.chapter, row.passage)
          .map(span => spanKey(span, row.book))
          .flatMap(({ chapter, from, to }) =>
            Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => `${chapter}:${from + i}`)
          )
      )
    }));

  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const shared = [...sets[i].verses].filter(v => sets[j].verses.has(v));
      if (!shared.length) continue;

      const a = family(sets[i].row.category);
      const b = family(sets[j].row.category);
      const opposed =
        (a === 'past' && b === 'future') || (a === 'future' && b === 'past');
      if (!opposed) continue;

      const row = sets[i].row;
      const message =
        `${row.book} ${row.chapter}: "${sets[i].row.passage}" (${sets[i].row.category}) and ` +
        `"${sets[j].row.passage}" (${sets[j].row.category}) both claim ${shared.join(', ')}`;

      // a sub-verse split ("61:2a" against "61:2b") is intentional
      if (sets[i].partial || sets[j].partial) {
        warn(`sub-verse split, accepted: ${message}`);
      } else {
        fail(message);
      }
    }
  }
}

/* ---------------------------------------------------------------
 * 8. the verse text must still cover every citation
 * --------------------------------------------------------------- */

if (!cited && !citedInvalid) {
  warn('kjv-verses.json is missing, so the verse panel has no text to show');
} else if (cited) {
  for (const [book, chapters] of Object.entries(cited)) {
    for (const [chapter, list] of Object.entries(chapters)) {
      if (!Array.isArray(list)) continue;
      for (let i = 1; i < list.length; i++) {
        if (list[i][0] <= list[i - 1][0]) {
          fail(`${book} ${chapter} in kjv-verses.json is not in ascending verse order (${list[i - 1][0]} before ${list[i][0]}) — re-run tools/build-verse-text.mjs`);
          break;
        }
      }
      for (const pair of list) {
        if (!Array.isArray(pair[2]) || pair[2].length < 2) {
          fail(`${book} ${chapter}:${pair[0]} has fewer than 2 cross-references in kjv-verses.json — re-run tools/build-verse-text.mjs`);
          break;
        }
        if (!Array.isArray(pair[3]) || pair[3].length < 2) {
          fail(`${book} ${chapter}:${pair[0]} has fewer than 2 concordances in kjv-verses.json — re-run tools/build-verse-text.mjs`);
          break;
        }
        const lowerText = String(pair[1] || '').toLowerCase();
        if (pair[3].some(w => !lowerText.includes(String(w).toLowerCase()))) {
          fail(`${book} ${chapter}:${pair[0]} has a concordance word not present in its verse text — re-run tools/build-verse-text.mjs`);
          break;
        }
      }
    }
  }

  const wanted = new Set();

  for (const row of rows) {
    for (const span of parseSpans(row.book, row.chapter, row.passage)) {
      const { chapter, from, to } = spanKey(span, row.book);
      for (let v = from; v <= to; v++) wanted.add(`${row.book}\u0000${chapter}\u0000${v}`);
    }
  }

  for (const row of rows) {
    const prose = [row.prophecy, row.category, row.status, row.fulfillment].join(' ');
    for (const m of prose.matchAll(proseRef)) {
      const book = m[1] === 'Psalm' ? 'Psalms' : m[1];
      if (!canonicalChapters[book]) continue;
      const chapter = +m[2];
      const from = +m[3];
      const endChapter = m[4] ? +m[4] : chapter;
      const to = m[5] ? +m[5] : from;
      if (endChapter > chapter) {
        for (let v = from; v <= (maxVerse(book, chapter) ?? from); v++) wanted.add(`${book}\u0000${chapter}\u0000${v}`);
        for (let v = 1; v <= to; v++) wanted.add(`${book}\u0000${endChapter}\u0000${v}`);
      } else {
        for (let v = from; v <= to; v++) wanted.add(`${book}\u0000${chapter}\u0000${v}`);
      }
    }
  }

  let missing = 0;
  for (const key of wanted) {
    const [book, chapter, verse] = key.split('\u0000');
    const entry = cited[book]?.[chapter];
    const present = Array.isArray(entry) && entry.some(pair => pair[0] === Number(verse));
    if (!present) {
      if (missing < 5) {
        fail(`${book} ${chapter}:${verse} is cited but has no text in kjv-verses.json — re-run tools/build-verse-text.mjs`);
      }
      missing++;
    }
  }
  if (missing > 5) {
    fail(`...and ${missing - 5} further cited verses have no text — re-run tools/build-verse-text.mjs`);
  }
}

/* ---------------------------------------------------------------
 * 9. report
 * --------------------------------------------------------------- */

console.log(`rows read from index.html : ${rows.length.toLocaleString()}`);
console.log(`books / chapters in canon : ${canonicalBooks.length} / ${canonicalBooks.reduce((n, b) => n + maxChapter(b), 0).toLocaleString()}`);
console.log(`prose cross-references    : ${proseCount.toLocaleString()}`);

if (!quiet && warnings.length) {
  console.log('\nWARNINGS');
  for (const message of warnings) console.log(`  ⚠ ${message}`);
}

const dist = zlib.gzipSync(Buffer.from(JSON.stringify(cited ?? {}))).length;

if (errors.length) {
  console.log(`\nFAILED — ${errors.length} problem${errors.length === 1 ? '' : 's'}`);
  for (const message of errors) console.log(`  ✗ ${message}`);
  process.exit(1);
}

console.log(`\nPASSED — no structural or citation problems found`);
console.log(`  verse text: ${(fs.statSync(VERSES).size / 1024).toFixed(0)} KB (${(dist / 1024).toFixed(0)} KB gzipped)`);
