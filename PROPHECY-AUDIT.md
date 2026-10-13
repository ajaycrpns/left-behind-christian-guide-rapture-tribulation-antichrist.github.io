# Prophecy Tracker — Missing Verse Audit

Audit of `index.html` (KJV Prophecy Tracker, Genesis–Revelation), verified against the
canonical KJV text and verse counts (`aruljohn/Bible-kjv`).

**Status: audit complete, fixes applied on this branch (15 new rows).**

## Structural checks — all pass

| Check | Result |
|---|---|
| Books present | **66 / 66** |
| Chapters present (a row for every chapter) | **1,189 / 1,189** — none missing, none out of range |
| Passage citations valid (chapter & verse exist, no reversed ranges) | **2,280 rows checked — 0 invalid** |
| Duplicate rows / chapters holding both a real row and a placeholder | **0** |
| Script errors when the page loads (headless render) | **0** |
| Landmark Messianic & predictive passages (76 checked) | **75 present**; 1 deliberate exclusion (see below) |

The page's claim — "all 66 KJV books and a row for every chapter from Genesis 1 through
Revelation 22" — is accurate.

## Root cause of the gaps

281 chapters received the **generic auto-fill placeholder**
("No new explicit divine prediction, covenant forecast or prophetic blessing…") instead of a
hand-written entry. They were confined to the early data packs (Exodus–Ecclesiastes);
everything from Isaiah through Revelation is hand-authored and had **no** misses in any check.

Where a chapter was auto-filled but an **identical parallel passage is tracked elsewhere**, the
tracker contradicted itself. Those were the real "missing verse" findings.

## Fixes applied (15 rows)

| Added | Why it was missing | Tracked parallel that proved the gap |
|---|---|---|
| Exodus 7:14–18 (blood) | placeholder chapter | Exodus 9/10/11 plague predictions already tracked |
| Exodus 8:1–4 (frogs) | placeholder chapter | *"frog"* appeared 0 times in the whole tracker |
| Exodus 8:16–19 (lice) | placeholder chapter | *"lice"* appeared 0 times |
| Exodus 8:20–24 (flies + Goshen set apart) | placeholder chapter | *"flies"* / *"Goshen"* appeared 0 times |
| Exodus 13:5, 13:11–16, 13:19 | placeholder chapter | Exodus 12:25 (same promise) — *Restatement* |
| Numbers 35:9–14 (cities of refuge) | placeholder chapter | Numbers 33:50–54 — land-entry command tracked |
| Joshua 20:1–9 (cities appointed) | placeholder chapter | fulfillment of the Numbers 35 command |
| Deuteronomy 14:2 (chosen people) | placeholder chapter | Deuteronomy 7:6 — election tracked |
| Deuteronomy 34:4 ("I will give it") | placeholder chapter | patriarchal land-promise rows |
| 2 Samuel 22:50 | placeholder chapter | Psalm 18:49 — identical line, tracked (Romans 15:9) |
| 1 Kings 8:25 | placeholder chapter | 2 Chronicles 6:16 — identical line, tracked |
| 1 Chronicles 16:15–18 (covenant remembered) | placeholder chapter | Genesis 17:7–8 promise tracked |
| 1 Chronicles 16:31–33 ("he cometh to judge") | placeholder chapter | Psalm 96:10–13 / 98:7–9 — tracked as *Future* |

Result after the fix: **694 chapters with prophecy rows** (was 685), **272 unreviewed
placeholders** (was 281), 2,280 rendered rows, 0 script errors.

## Remaining notes — not gaps

- **Numbers 9:12** (the "no bone broken" detail, John 19:36) — typology, which the stated
  method explicitly excludes.
- **Numbers 28:17** (unleavened bread) reads like Ezekiel 45:21, but Numbers is statute
  while Ezekiel is vision — different genre, not a duplicate.
- **2 Chronicles 11:2** matches Ezekiel 6:1 only in the boilerplate phrase "the word of the
  LORD came…", so it is not evidence of a missing prophecy.
- 272 chapters still carry the generic placeholder. They were each checked for divine
  promise/judgment formulae; the remaining hits were human speech, ritual statute or
  narrative, so they are legitimate "no explicit prophecy" chapters under the stated method.

## Re-running the audit

The audit script set (parses `index.html` with acorn, renders it with jsdom, validates every
citation against the KJV, and diffs placeholder chapters against tracked parallels) lives
outside the repo at `/tmp/audit/` and is not committed.
