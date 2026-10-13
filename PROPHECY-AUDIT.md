# Prophecy Tracker — Missing Verse Audit

Audit of `index.html` (KJV Prophecy Tracker, Genesis–Revelation), verified against the
canonical KJV text and verse counts (`aruljohn/Bible-kjv`).

**Status: audit complete, fixes applied on this branch (20 new rows across two passes).**

## Structural checks — all pass

| Check | Result |
|---|---|
| Books present | **66 / 66** |
| Chapters present (a row for every chapter) | **1,189 / 1,189** — none missing, none out of range |
| Passage citations valid (chapter & verse exist, no reversed ranges) | **2,285 rows checked — 0 invalid** |
| Duplicate rows / chapters holding both a real row and a placeholder | **0** |
| Cross-references written inside the prose columns | **455 checked — 0 invalid** |
| Numeric claims in row text vs the verses cited | **0 factual errors** |
| Contradictory statuses on a shared verse | **0** |
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

## Second pass — verse-by-verse re-check (this round)

Five more rows added, again from the "tracked in a parallel or neighbouring verse but
missing here" class:

| Added | Evidence |
|---|---|
| Exodus 9:1–7 (murrain) | *"murrain"* appeared **0 times** in the tracker. A dated prediction — "To morrow the LORD shall do this thing" (9:5) — with a distinction clause, "the LORD shall sever between the cattle of Israel and the cattle of Egypt" (9:4), exactly parallel to the Goshen clause already tracked for the flies |
| Exodus 9:8–12 (boils) | the remaining unlisted plague sign; same literary form as the lice row (instruction with stated outcome) |
| Exodus 10:21–23 (darkness) | same form again; 10:23 adds the light-in-Israel clause |
| Jeremiah 9:25–26 | "Behold, the days come… I will punish all them which are circumcised with the uncircumcised" — a distinct oracle sitting between covered verses |
| Jeremiah 23:7–8 | "Behold, the days come… brought them out of the north country" — sits in the gap between the tracked 23:5–6 and 23:9–32 |

**All ten plagues are now represented**, each with its own row:

`blood 7:14–18 · frogs 8:1–4 · lice 8:16–19 · flies 8:20–24 · murrain 9:1–7 · boils 9:8–12 ·
hail 9:13–19 · locusts 10:4–6 · darkness 10:21–23 · firstborn 11:4–8`

### One misinterpretation fixed

**Isaiah 61:2 was labelled both *Fulfilled* and *Future*.** Two rows claimed the same verse —
"61:1–2" (Fulfilled in Christ's ministry) and "61:2" (the day of vengeance, Future). Both
readings are defensible, but the overlapping ranges asserted that the whole of verse 2 was
simultaneously past and future. The rows now read **"61:1–2a — the acceptable year"** and
**"61:2b — the day of vengeance"**, matching the tracker's existing em-dash qualifier style
(such as "49:8–12 — Judah"). A scan for past-vs-future conflicts on shared verses now returns
zero.

### Checks that came back clean

- **455 cross-references written inside the prose columns** (prophecy, category, status,
  fulfillment) all point at chapters and verses that exist.
- **Numeric claims** in the prose (ages, counts, durations) agree with the verses cited. The
  only three flags are paraphrase artifacts: Isaiah 7:16's "both her kings" (= two),
  Matthew 26's "the twelve" (at verse 20, one verse before the cited 26:21–25), and the
  twelve tribes of Revelation 7, which are listed by name.
- **28 same-chapter passage overlaps** were checked for contradiction — they are deliberate
  splits of one passage into distinct predictions (e.g. Revelation 5:1–5 and 5:1–7). Only the
  Isaiah 61 case was a genuine conflict.

## Remaining notes — not gaps

- **Numbers 9:12** (the "no bone broken" detail, John 19:36) — typology, which the stated
  method explicitly excludes.
- **Numbers 28:17** (unleavened bread) reads like Ezekiel 45:21, but Numbers is statute
  while Ezekiel is vision — different genre, not a duplicate.
- **2 Chronicles 11:2** matches Ezekiel 6:1 only in the boilerplate phrase "the word of the
  LORD came…", so it is not evidence of a missing prophecy.
- 272 chapters still carry the generic placeholder. They were each checked for divine
  promise/judgment formulae; the remaining hits were human speech, ritual statute,
  retrospective history or narrative, so they are legitimate "no explicit prophecy" chapters
  under the stated method. Chapters marked "no prophecy" that do contain oracle language were
  reviewed individually: Exodus 5:1 (Egypt's release demanded, not predicted), Leviticus 10:11
  and Numbers 15:22 (statute), 1 Kings 12:24 and 2 Chronicles 11:2–4 (a command restraining
  the war, and a statement that the division was God's doing rather than a new prediction),
  Ezekiel 1:3 (call narrative), Jonah 1:1 (commission) and Zechariah 7 (retrospective).
- **Depth of coverage.** Within long prophetic chapters the tracker is curated rather than
  exhaustive: it lists representative oracles per chapter, not every verse. Uncovered
  divine-prediction blocks remaining after this pass are small (2–4 verses) and largely
  restate themes already carried by a neighbouring row — the largest are Jeremiah 9:22–25,
  Jeremiah 6:11–16 and Isaiah 66:1–2. Expanding to full verse-by-verse saturation would add
  well over a hundred rows across Jeremiah, Ezekiel and Isaiah, so it was left as a curation
  decision rather than applied.

## Re-running the audit

The audit script set (parses `index.html` with acorn, renders it with jsdom, validates every
citation against the KJV, and diffs placeholder chapters against tracked parallels) lives
outside the repo at `/tmp/audit/` and is not committed.
