# KJV Prophecy Tracker

A single-page, chapter-by-chapter tracker of explicit divine predictions, covenant
promises, predictive dreams, warnings of future judgment and prophetic blessings,
covering all 66 books of the King James Bible from Genesis 1 to Revelation 22.

**Live site:** https://ajaycrpns.github.io/left-behind-christian-guide-rapture-tribulation-antichrist.github.io/

## What it does

- **2,300 rows** — every chapter of the Bible is represented. Chapters with no explicit
  prophecy say so rather than being skipped.
- **Filters** — search, book, chapter, status category, and a "prophecy entries only"
  toggle. The CSV export always covers every row the filters match, not just the page
  on screen.
- **Paging** — the table draws 200 rows at a time (selectable: 100 / 200 / 500 / All).
  Drawing all 2,300 at once cost about half a second per interaction and 21,000 DOM
  elements; a page draws in roughly 30 ms and printing still covers everything.
- **Read the verses** — open any row to read the KJV text it cites. References quoted in
  a row's own commentary appear as chips you can click to jump to them.
- **Keyboard** — Tab into the table, then use ↑ ↓ Home End to move and Enter or Space to
  open a passage. Escape closes it.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole application. Styles, data packs and logic are inline; there is no build step. |
| `kjv-verses.json` | KJV text for every verse the tracker cites, fetched only when a reader first opens a row. |
| `tools/build-verse-text.mjs` | Regenerates `kjv-verses.json` from `index.html`. |
| `tools/audit.mjs` | Verifies the data. No dependencies, no network. |
| `tools/test-gate.mjs` | Breaks a copy of the tracker a dozen ways and checks the audit refuses each one. |
| `tools/scan-oracles.mjs` | Advisory sweep for prophecy missed in chapters marked "no prophecy". |
| `tools/kjv-structure.json` | Canonical chapter and verse counts, so the audit needs no download. |
| `PROPHECY-AUDIT.md` | Record of the verse-level audits: what was missing, what was fixed, and what was checked. |

## Regenerating the verse text

Run this after adding, removing or re-passaging any row. It reads the data straight out
of `index.html`, so it never drifts from the table.

```bash
node tools/build-verse-text.mjs                    # downloads the KJV source automatically
node tools/build-verse-text.mjs --source ./kjv     # or point it at an existing copy
```

The source is the public-domain KJV from
[aruljohn/Bible-kjv](https://github.com/aruljohn/Bible-kjv), one JSON file per book.

Only cited verses are included, which keeps the file at roughly 1.2 MB raw / 375 KB
gzipped instead of the whole Bible's 4 MB. If a reference is ever missing from the panel,
the row will say so and the fix is to re-run the generator.

## Data packs

The rows are stored in twelve arrays — `rawData` for Genesis plus `pack2Rows` through
`pack11Rows` — each appending one stretch of the canon. Row shapes differ slightly:

```js
// rawData (Genesis), 6 elements
[chapter, passage, prophecy, category, status, fulfillment]

// pack2Rows..pack11Rows, 7 elements
[book, chapter, passage, prophecy, category, status, fulfillment]
```

Each pack also declares the canonical book order and each book's chapter count. Any
chapter without an explicit row automatically receives a "no new explicit predictive
prophecy" placeholder, so the table always covers the whole canon.

## Categories

`Fulfilled` · `Ongoing` · `Partial / ongoing` · `Conditional` · `Future` · `Disputed` ·
`Restatement` · `Introductory`

Interpretations that are not universally accepted are marked **Disputed** rather than
presented as settled. Ordinary wishes, guesses and unconfirmed typology are excluded.

## Verifying the data

```bash
node tools/audit.mjs            # errors and warnings
node tools/audit.mjs --quiet    # errors only
```

It fails on:

- a book or chapter with no row and no pack declaring it
- a declared chapter count that disagrees with the Bible
- a citation to a chapter or verse that does not exist, or a reversed range
- a reference in the commentary columns that points nowhere
- a chapter holding both a real row and an auto-fill placeholder
- a repeated passage, or several "no prophecy" rows in one chapter
- one verse described as both past and future (except deliberate `61:2a` / `61:2b` splits)
- a cited verse with no text in `kjv-verses.json`

`.github/workflows/audit.yml` runs it on every push and pull request, then regenerates the
verse text and compares it with the committed copy so the panel cannot silently drift.

The audit is itself checked by `node tools/test-gate.mjs`: it copies the project to a
temporary directory, breaks one thing at a time — a wrong chapter count, a citation past
the end of a chapter, a passage running backwards across chapters, a real row sitting
beside an auto-fill placeholder — and fails unless the audit rejects every one. That is
how a reversed range in the passage column was found slipping through.

`tools/scan-oracles.mjs` is separate and advisory: it lists chapters catalogued as having
no explicit prophecy whose text still contains oracle wording, which is how the original
gaps in Exodus 8, 1 Kings 8 and 2 Samuel 22 were found. Most hits are statute, human
speech or narrative, so it reports rather than fails.

## Deployment

Pushing to `main` triggers `.github/workflows/static.yml`, which publishes the repository
root to GitHub Pages. Because `index.html` fetches `kjv-verses.json` by relative path,
both files must be published together — and `tools/` is uploaded too but never requested.

A separate workflow, `.github/workflows/audit.yml`, runs on pushes and pull requests.
It does not currently gate the deploy; to make it gate, add
`- run: node tools/audit.mjs` as a step in `static.yml` before the upload.
