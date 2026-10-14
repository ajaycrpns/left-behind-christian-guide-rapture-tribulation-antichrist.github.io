# Prophecy Tracker — Missing Verse Audit

Audit of `index.html` (KJV Prophecy Tracker, Genesis–Revelation), verified against the
canonical KJV text and verse counts (`aruljohn/Bible-kjv`).

**Status: audit complete, fixes applied (35 rows added across three passes).**

## Structural checks — all pass

| Check | Result |
|---|---|
| Books present | **66 / 66** |
| Chapters present (a row for every chapter) | **1,189 / 1,189** — none missing, none out of range |
| Passage citations valid (chapter & verse exist, no reversed ranges) | **2,300 rows checked — 0 invalid** |
| Duplicate rows / chapters holding both a real row and a placeholder | **0** |
| Cross-references written inside the prose columns | **0 invalid; every one resolves to real verses** |
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

## Third pass — deepening the major prophets (this round)

The remaining gaps were found by listing every uncovered verse that carries an oracle
formula ("I will", "thus saith the LORD", "behold, I am against thee") inside the long
prophetic books, then discarding the matches that turned out not to be prophecies:
ritual statute, human speech, temple-song devotion, false prophets' claims, and
retrospective narrative. Fifteen genuine oracles remained.

| Added | Subject |
|---|---|
| Jeremiah 6:9–21 | the remnant gleaned; fury poured out; houses and fields given to others; stumblingblocks laid |
| Jeremiah 9:7–10 | God will melt and try his people; the land made waste |
| Jeremiah 11:14 | God will refuse to hear the people's cry |
| Jeremiah 15:13–14 | treasures given as spoil; the people carried into an unknown land |
| Jeremiah 17:3–4 | substance and treasures to the spoil; serving enemies in a strange land |
| Jeremiah 18:13–17 | scattered as with an east wind; the back and not the face |
| Jeremiah 26:16–19 | Micah's oracle cited as precedent (*Restatement* of Micah 3:12, which is tracked) |
| Jeremiah 35:17 | all the pronounced evil brought on Judah and Jerusalem |
| Jeremiah 44:26–28 | the name no longer invoked in Egypt; the sword, the famine and the escaping remnant |
| Jeremiah 51:20–24 | the battle axe breaking nations; recompense rendered to Babylon |
| Ezekiel 22:13–16 | scattered among the heathen; filthiness consumed |
| Ezekiel 23:46–49 | a company brought up to stone and slay; lewdness caused to cease |
| Ezekiel 33:12–20 | the righteous who sins and the wicked who turns (*Conditional*) |
| Isaiah 41:26–29 | declared beforehand; one given to Jerusalem that brings good tidings |
| Isaiah 46:3–4 | the remnant borne and delivered even to old age |

Coverage is now 2,300 rows, and every chapter that the method treats as prophetic has
its named oracles listed.

### Deliberately not added

Many uncovered verses contained oracle vocabulary but are not prophecies under the stated
method. The largest of these were checked individually and left alone:

- **Ritual statute and covenant obligation** — Leviticus 18:4–6, 20:7–8, 26:1–2.
- **Human speech, including Pharaoh's and Moses' negotiation** — Exodus 8:28–29, 9:28–29,
  10:2–3; 2 Samuel 22:3–4; Ruth 3.
- **Temple-song devotion rather than prediction** — Exodus 15:1–2; Psalms 18:1–3, 34:10–11,
  41:1–3, 86:11–12, 118:10–12.
- **False prophets' claims** — 1 Kings 22:11–12 and its parallel 2 Chronicles 18:10–11
  (the true oracle in that chapter, Micaiah's, is tracked at 1 Kings 22:17–23).
- **Declaration of sovereignty rather than forecast** — Isaiah 43:13, 45:18, 66:1–2.
- **Hezekiah's own lament** — Isaiah 38:10–11, 15.

## Reader feature added with this pass

`kjv-verses.json` carries the full KJV text, verse-by-verse cross-references (`pair[2]`), and
verse-by-verse concordance key words (`pair[3]`) for all **31,102 verses across all 66 books and
1,189 chapters** (6,693 KB raw, 1,975 KB gzipped) and is fetched only when a reader first opens a
row or switches to Bible, Split, Concordance, Harmony, or Study Hub views, so the table still
starts without it. Verified against the whole table: **all 1,805 rows that cite a passage resolve
to stored text (`7,850 / 7,850` prophecy verse-slots and `31,102 / 31,102` Bible verses verified)
— 0 unresolved**. The panel degrades to a readable message if the file is unavailable, and the
table keeps working.

## Fourth pass — the checks are now automatic

Everything this document did by hand is now a script, because the tooling lived only in a
scratch directory and would have been lost.

`tools/audit.mjs` runs with no dependencies and no network, and fails on:

- a book or chapter with no row and no pack declaring it
- a declared chapter count that disagrees with the Bible
- a citation to a chapter or verse that does not exist, or a reversed range
- a reference in the commentary columns that points nowhere
- a chapter holding both a real row and an auto-fill placeholder
- a repeated passage, or several "no prophecy" rows in one chapter
- one verse described as both past and future
- a cited verse with no text in `kjv-verses.json`

It was tested by mutating the tracker in seven ways and confirming each one fails the run.
Two of those mutations caught bugs **in the audit itself**: a mistyped placeholder string
that made the placeholder check a no-op, and a mishandled sub-verse split that reported the
deliberate `61:2a` / `61:2b` division as a contradiction. Both are fixed, and the real
Isaiah 61 split is now reported as an accepted warning rather than a failure.

`tools/scan-oracles.mjs` carries the sweep that found the original gaps — chapters
catalogued as having no prophecy whose text still contains oracle wording. It is advisory:
it currently lists 53 chapters to review, mostly statute and human speech.

## Also in this round: paging, so the table stays fast

Rebuilding all 2,300 rows on every interaction cost roughly half a second and put 21,061
elements in the DOM. The table now draws 200 rows at a time.

| | Before | After |
|---|---|---|
| Initial parse and build | 4,334 ms | **878 ms** |
| Deliberate interaction (select, sort) | 535–699 ms | **26–82 ms** |
| DOM elements | 21,061 | **2,173** |
| Table markup | 1,354 KB | **144 KB** |

Paging did not weaken any check: the summary counters and the CSV export still describe
every row the filters match, printing draws all matching rows, and the whole-table audits
above were re-run with the table set to "All" and still pass.

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
- **Depth of coverage.** The third pass listed the named oracles in the long prophetic
  books. What remains uncovered within a tracked chapter is, on inspection, material the
  method excludes (see "Deliberately not added" above) rather than missing prophecy.

## Re-running the audit

Run the committed verification suite directly from the repository root:

```bash
node tools/audit.mjs
node tools/test-gate.mjs
```
