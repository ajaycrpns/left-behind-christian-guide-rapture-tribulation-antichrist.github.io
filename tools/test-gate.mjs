#!/usr/bin/env node
/*
 * test-gate.mjs
 *
 * Proves that tools/audit.mjs still catches the mistake classes it exists
 * for. Each mutation below breaks the tracker in one specific way inside
 * a throwaway copy of the repository; the audit is then expected to fail
 * with a message naming the problem.
 *
 * This is how the gate itself gets checked. It has already earned its
 * keep twice: a mistyped placeholder string left the placeholder check
 * silently doing nothing, and a reversed cross-chapter range such as
 * "4:1-3:16" passed unnoticed in the passage column while the same
 * mistake in the commentary was caught.
 *
 * A mutation that slips through means the gate has a hole. An anchor
 * that matches nothing means this test has gone stale and is reported as
 * a failure too, so it cannot quietly stop testing anything.
 *
 * Usage:
 *   node tools/test-gate.mjs
 *
 * No dependencies and no network: it copies the working tree into a
 * temporary directory and runs the audit there.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'index.html',
  'kjv-verses.json',
  'tools/audit.mjs',
  'tools/kjv-structure.json'
];

/* Each mutation: what it breaks, where, how, and what the audit must say. */

const MUTATIONS = [

  {
    name: 'a pack under-declares how many chapters it covers',
    file: 'index.html',
    find: '    Genesis: 50,',
    replace: '    Genesis: 49,',
    expect: /declares 49 chapters for "Genesis"/
  },

  {
    name: 'the vendored canon gives a chapter the wrong verse count',
    file: 'tools/kjv-structure.json',
    expect: /Genesis 1:28/,
    json: data => {
      data.chapters.Genesis[0] = 27; // Genesis 1 really has 31 verses
      return data;
    }
  },

  {
    name: 'a commentary reference runs past the end of a chapter',
    file: 'index.html',
    find: 'Genesis 49:33\u201350:1',
    replace: 'Genesis 49:33\u201350:99',
    expect: /Genesis 50:99/
  },

  {
    name: 'a commentary reference points at a verse that does not exist',
    file: 'index.html',
    find: 'Genesis 49:33\u201350:1',
    replace: 'Genesis 1:99',
    expect: /Genesis 1:99/
  },

  {
    name: 'the verse text is missing a verse the rows cite',
    file: 'kjv-verses.json',
    expect: /cited but has no text/,
    json: data => {
      delete data.Genesis['1'];
      return data;
    }
  },

  {
    name: 'the verse text stores verses out of ascending order',
    file: 'kjv-verses.json',
    expect: /not in ascending verse order/,
    json: data => {
      data.Genesis['3'].reverse();
      return data;
    }
  },

  {
    name: 'a verse in kjv-verses.json is missing its cross-references',
    file: 'kjv-verses.json',
    expect: /fewer than 2 cross-references in kjv-verses\.json/,
    json: data => {
      data.Genesis['1'][0][2] = [];
      return data;
    }
  },

  {
    name: 'a verse in kjv-verses.json is missing its concordances',
    file: 'kjv-verses.json',
    expect: /fewer than 2 concordances in kjv-verses\.json/,
    json: data => {
      data.Genesis['1'][0][3] = [];
      return data;
    }
  },

  {
    name: 'a row drops its sub-verse letter, contradicting a real row',
    file: 'index.html',
    find: '"61:1\u20132a \u2014 the acceptable year"',
    replace: '"61:1\u20132 \u2014 the acceptable year"',
    then: {
      find: '"61:2b \u2014 the day of vengeance"',
      replace: '"61:2 \u2014 the day of vengeance"'
    },
    expect: /Isaiah 61/
  },

  {
    name: 'a real row is added beside an auto-fill placeholder',
    file: 'index.html',
    find: '      "Exodus", 3, "3:7\u201310",',
    replace: `        "Exodus", 3, "\u2014",
        "No new explicit predictive prophecy.",
        "No explicit prophecy",
        "\u2014",
        "No new explicit divine prediction, covenant forecast or prophetic blessing is catalogued here."
      ],

      [
      "Exodus", 3, "3:7\u201310",`,
    expect: /Exodus 3 has both a real row and an auto-fill placeholder/
  },

  {
    name: 'a passage runs backwards across chapters',
    file: 'index.html',
    find: '"3:16\u20134:1"',
    replace: '"4:1\u20133:16"',
    expect: /runs backwards/
  },

  {
    name: 'a passage begins in a chapter other than its row',
    file: 'index.html',
    find: '"3:16\u20134:1"',
    replace: '"5:16\u20136:1"',
    expect: /begins in chapter 5/
  },

  {
    name: 'a cross-chapter passage runs past the end of its last chapter',
    file: 'index.html',
    find: '"3:16\u20134:1"',
    replace: '"3:16\u20134:99"',
    expect: /4:99|Isaiah 4 has 6 verses/
  },

  {
    name: 'a commentary reference names a chapter that does not exist',
    file: 'index.html',
    find: 'Genesis 49:33\u201350:1',
    replace: 'Genesis 51:1',
    expect: /Genesis 51/
  },

  {
    name: 'a prophecy row has no cross-references in its commentary',
    file: 'index.html',
    find: '"The judgment is imposed immediately. Its literal and symbolic dimensions are interpreted differently. Cross-references: 3:14 \u2192 Deuteronomy 28:15, Psalms 72:9. Concordances: 3:14 \u2192 serpent, belly, cursed."',
    replace: '"The judgment is imposed immediately. Its literal and symbolic dimensions are interpreted differently. Concordances: 3:14 \u2192 serpent, belly, cursed."',
    expect: /Genesis 3 \(3:14\) has no cross-references/
  },

  {
    name: 'a prophecy row has no concordances in its commentary',
    file: 'index.html',
    find: '"The judgment is imposed immediately. Its literal and symbolic dimensions are interpreted differently. Cross-references: 3:14 \u2192 Deuteronomy 28:15, Psalms 72:9. Concordances: 3:14 \u2192 serpent, belly, cursed."',
    replace: '"The judgment is imposed immediately. Its literal and symbolic dimensions are interpreted differently. Cross-references: 3:14 \u2192 Deuteronomy 28:15, Psalms 72:9."',
    expect: /Genesis 3 \(3:14\) has no concordances/
  },

  {
    name: 'a chapter gets a second "no prophecy" row',
    file: 'index.html',
    find: '    [1, "\u2014",\n      "No new explicit predictive prophecy.",',
    replace: `    [1, "\u2014",
      "No new explicit predictive prophecy.",
      "No explicit prophecy",
      "\u2014",
      "No new explicit divine prediction, covenant forecast or prophetic blessing is catalogued here."],

    [1, "\u2014",
      "No new explicit predictive prophecy.",`,
    expect: /Genesis 1 has 2 "no prophecy" rows/
  }

];

/* --------------------------------------------------------------- */

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-test-'));
const pristine = new Map();

const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');

for (const relative of FILES) {
  if (!fs.existsSync(path.join(ROOT, relative))) {
    console.error(`missing ${relative} — run this from a checkout of the project`);
    process.exit(1);
  }
  const text = read(relative);
  pristine.set(relative, text);
  const target = path.join(dir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}

function restore() {
  for (const [relative, text] of pristine) {
    fs.writeFileSync(path.join(dir, relative), text);
  }
}

/* Returns { code, output } for one run of the audit. */
function runAudit() {
  try {
    const stdout = execFileSync(process.execPath, ['tools/audit.mjs'], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { code: 0, output: stdout };
  } catch (error) {
    return {
      code: error.status ?? -1,
      output: String(error.stdout ?? '') + String(error.stderr ?? '')
    };
  }
}

let failures = 0;

/* The unmutated copy has to pass, or every result below is meaningless. */

restore();
const baseline = runAudit();

if (baseline.code === 0) {
  console.log('  PASS  baseline: the tracker as committed passes the audit');
} else {
  failures++;
  console.log('  FAIL  baseline: the tracker as committed does not pass:');
  console.log(baseline.output.split('\n').filter(Boolean).slice(-6).map(l => '          ' + l).join('\n'));
}

for (const mutation of MUTATIONS) {
  restore();

  const target = path.join(dir, mutation.file);
  let text = pristine.get(mutation.file);
  let edits = 0;

  const applyEdit = edit => {
    const hits = text.split(edit.find).length - 1;
    if (hits === 0) {
      console.log(`  STALE ${mutation.name}`);
      console.log(`          this test no longer matches anything in ${mutation.file}:`);
      console.log(`          ${JSON.stringify(edit.find.slice(0, 60))}`);
      return false;
    }
    text = text.split(edit.find).join(edit.replace);
    edits += hits;
    return true;
  };

  if (mutation.json) {
    fs.writeFileSync(target, JSON.stringify(mutation.json(JSON.parse(text)), null, 2));
  } else {
    if (!applyEdit(mutation)) {
      failures++;
      continue;
    }
    if (mutation.then && !applyEdit(mutation.then)) {
      failures++;
      continue;
    }
    fs.writeFileSync(target, text);
  }

  const { code, output } = runAudit();
  const caught = code !== 0 && mutation.expect.test(output);

  if (caught) {
    console.log(`  PASS  ${mutation.name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${mutation.name}`);
    console.log(`          exit ${code}, expected the audit to fail matching ${mutation.expect}`);
    if (code === 0) {
      console.log('          the audit reported no problem at all — this is a hole in the gate');
    }
  }
}

restore();
fs.rmSync(dir, { recursive: true, force: true });

const total = MUTATIONS.length + 1;
console.log('');

if (failures === 0) {
  console.log(`all ${total} checks behaved as expected: the gate catches every mutation, and the real tracker passes`);
  process.exit(0);
}

console.log(`${failures} of ${total} checks did not behave as expected`);
process.exit(1);
