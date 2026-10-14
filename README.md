# KJV Prophecy Tracker

A single-page, chapter-by-chapter tracker of explicit divine predictions, covenant
promises, predictive dreams, warnings of future judgment and prophetic blessings,
covering all 66 books of the King James Bible from Genesis 1 to Revelation 22.

**Live site:** https://ajaycrpns.github.io/left-behind-christian-guide-rapture-tribulation-antichrist.github.io/

## What it does

- **2,300 rows across 66 books / 1,189 chapters** — every chapter of the Bible is
  represented. Chapters with no explicit prophecy say so rather than being skipped.
- **7 View Modes + Study Utilities (`#viewModeBar`)**:
  - **📊 Prophecy Tracker:** Full filterable table with 8 interactive summary cards,
    search scope selector, canon section filter, book/chapter/theme filters, multi-select
    status category checkboxes + presets, and 9 quick filter/display checkboxes.
  - **📖 Bible Mode (KJV):** Complete 66-book, 1,189-chapter, 31,102-verse King James
    Bible reader with color-coded prophetic verse highlighting, inline prophecy &
    fulfillment commentary cards, per-verse cross-reference & concordance chips, ⭐ bookmark
    and 📋 1-click verse citation copy buttons, ✅ 1,189-chapter read tracker, **🔊 Audio Bible
    Reader (`Read Aloud` with play/pause/stop, speed control, and live verse-by-verse highlight)**,
    chapter grid, paragraph layout toggle, font-size controls, bottom chapter navigation bar,
    and full-Bible search.
  - **⚖️ Split View:** Side-by-side Prophecy Tracker table and KJV Bible
    Reader; clicking any row in the Tracker syncs the Bible Reader to that chapter and verse.
  - **📚 Concordance Mode:** Exhaustive A–Z KJV word concordance
    across all 31,102 verses plus a 48-entry Hebrew (`H...`) / Greek (`G...`) Strong's
    Prophetic Key-Term Lexicon, with OT/NT/Prophetic occurrence counts, First & Last Mention
    links, book distribution pills, and KWIC highlighted verse results.
  - **🕰️ Prophetic Timeline:** Interactive 12-era chronological prophetic map from
    Eden (`Gen 3:15`) and the Patriarchal/Davidic Covenants through Daniel's 70 Weeks, the First
    Advent, the Rapture, 7 Seals, 7 Trumpets, Antichrist, 7 Vials, Second Coming, 1,000-Year
    Millennium, and New Jerusalem (`Rev 21–22`).
  - **🔗 OT↔NT Harmony:** Side-by-side Old Testament Prediction and New Testament
    Fulfillment/Parallel cards with the full KJV verse text of both passages rendered side by side
    (25 curated Landmark Messianic & Apocalyptic Harmonies + all dynamic OT-to-NT pairs) and
    **📄 Markdown Study Guide (`.md`) download**.
  - **🗺️ Study Hub & Heatmap:** Interactive 66-Book Prophetic Density Heatmap & Top 18
    Prophetic Chapters Leaderboard, 4 checkable Guided Prophetic Study Plans (with **📄 Markdown
    Study Plans handout download**), and a Personal Study Workspace (⭐ Bookmarks, 📝 Personal
    Study Notes, ✅ 1,189-Chapter KJV Reading Progress, and **💾 JSON Backup Export & Restore**).
  - **🎲 Random Prophecy, 🔗 Deep-Link URL Share, 🖨️ Print / PDF Handout, 📲 Offline-First Installable PWA, ⚙️ Collapsible Filters & 🌙 Dark Mode:**
    Built into the sticky top bar with `localStorage`, Service Worker `CacheStorage` (`sw.js`), Web App Manifest (`manifest.json`), and URL hash persistence.
- **16,250 prose cross-references + 100% 31,102-verse KJV cross-reference & concordance coverage** —
  every authored row carries verse-level cross-references (`Cross-references: <ch>:<v> → <Ref1>, <Ref2>; ...`)
  and verse-level concordances (`Concordances: <ch>:<v> → <word1>, <word2>, <word3>; ...`)
  with at least 2 cross-references and 2 concordance words per verse, and all 31,102 verses in
  `kjv-verses.json` include verified cross-references (`pair[2]`) and concordance key words (`pair[3]`)
  so every single verse across the entire 66-book Bible displays clickable cross-reference and
  concordance chips.
- **Paging** — the table draws 200 rows at a time (selectable: 100 / 200 / 500 / All).
  Drawing all 2,300 at once cost about half a second per interaction and 21,000 DOM
  elements; a page draws in roughly 30 ms and printing still covers everything.
- **Keyboard** — Tab into the table, then use ↑ ↓ Home End to move and Enter or Space to
  open a passage. Escape closes it.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole application (7 View Modes: Tracker, Bible Mode, Split View, Concordance, Prophetic Timeline, OT↔NT Harmony, and Study Hub & Heatmap). Styles, data packs and logic are inline; there is no build step. |
| `kjv-verses.json` | Complete 66-book, 1,189-chapter, 31,102-verse KJV Bible text + per-verse cross-references (`pair[2]`) + per-verse concordance key words (`pair[3]`) (`6,693 KB` raw / `1,975 KB` gzipped), fetched on demand and cached for offline use. |
| `manifest.json` | Web App Manifest enabling standalone PWA installation on desktop, Android, and iOS. |
| `sw.js` | Offline-first Service Worker pre-caching the app shell and full 31,102-verse KJV dataset (`kjv-verses.json`) in `CacheStorage`. |
| `icon.svg` | Scalable vector KJV 66 Bible & Prophecy app icon (`192x192` / `512x512` / `any maskable`). |
| `tools/build-verse-text.mjs` | Regenerates `kjv-verses.json` from `index.html`, the canonical KJV text, and the KJV cross-reference dataset. |
| `tools/audit.mjs` | Verifies the data (1,822 explicit rows / 2,300 total rows, 16,250 prose cross-references, 7,850 verse-slots with `>= 2` cross-references and `>= 2` concordances, and 31,102 verses + cross-references + concordances in `kjv-verses.json`). No dependencies, no network. |
| `tools/test-gate.mjs` | Breaks a copy of the tracker 17 ways (18 checks total) and checks the audit refuses each one. |
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

All 31,102 KJV verses across all 66 books and 1,189 chapters (`4,252 KB` raw / `1,242 KB`
gzipped) are included in `kjv-verses.json` so Bible Mode, Concordance Mode, and every row citation resolve locally.

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
- a prophecy row with no cross-references in its commentary
- a chapter in `kjv-verses.json` whose verses are not in ascending order, or invalid JSON
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

A separate workflow, `.github/workflows/audit.yml`, runs the full verification suite
(`audit.mjs`, `test-gate.mjs`, and `kjv-verses.json` drift check) on pushes and pull
requests, and `.github/workflows/static.yml` runs `node tools/audit.mjs` before uploading
the Pages artifact so broken data is never deployed.
