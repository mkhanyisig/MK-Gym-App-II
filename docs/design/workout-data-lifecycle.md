# Workout data lifecycle and integrity

Design note for [#27](https://github.com/mkhanyisig/MK-Gym-App-II/issues/27). It defines how a workout session's data is recorded, restored and kept consistent, and it's the basis for [#18](https://github.com/mkhanyisig/MK-Gym-App-II/issues/18) (data foundation) and [#19](https://github.com/mkhanyisig/MK-Gym-App-II/issues/19) (spontaneous sessions).

**Scope:** what #18 and #19 need. Routines (#20), rest timers (#21), cardio (#22), insights (#23), export (#28), cloud sync and analytics are out of scope.

**Status:** decisions D1–D8 were approved by the owner on 2026-11-28. Two follow-up questions (Q1, Q2) are **pending approval**; see the end of this note.

## Approved decisions

| #   | Decision                 | Approved                                                                                                                                                                                                                                                                         |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Record IDs               | **UUIDs** for the workout tables (#18), generated with `expo-crypto` (dependency approved; not yet installed). Existing weigh-ins are unchanged; #25 decides separately.                                                                                                         |
| D2  | Unfinished sessions      | Detected **on app relaunch**, and also **after 60 minutes with no activity** while running. Stored as status `interrupted`. **Paused sessions are never auto-flagged.**                                                                                                          |
| D3  | Duration                 | **Pause button.** Duration = end − start − total paused time (`paused_at`, `paused_ms_total`). Finishing an interrupted session defaults to **last activity**, with "Finish now" available.                                                                                      |
| D4  | Exercise identity        | **Referenced by ID.** Used exercises can only be **archived**, never deleted. Renames apply to history.                                                                                                                                                                          |
| D5  | Finished sessions in #19 | **View and delete** (confirmed; removes its exercises and sets). Editing finished sessions is a later issue. **Discard deletes the rows.**                                                                                                                                       |
| D6  | Derived values           | **Computed on read**; nothing cached.                                                                                                                                                                                                                                            |
| D7  | Writes                   | **Every action commits immediately**, each in its own transaction, queued one at a time. A set shows ✓ only after the commit.                                                                                                                                                    |
| D8  | Guardrails               | Foreign keys on at open. Deleting a session cascades to its exercises and sets; deleting a used exercise is blocked. **At most one open (`active` or `interrupted`) session**, enforced by a unique index. Single-transaction migration, tested on a v1 database with weigh-ins. |

## Records (draft shape; #18 finalizes it)

- **`exercises`:** `id` (UUID), `name`, `muscle_group`, `equipment`, `kind` (strength/cardio), `is_custom`, `archived_at`.
- **`sessions`:** `id`, `status` (`active` | `interrupted` | `finished`), `started_at`, `ended_at`, `last_activity_at`, `paused_at` (null when running), `paused_ms_total`, `location`, `focus_areas`.
- **`session_exercises`:** `id`, `session_id` (FK, cascade), `exercise_id` (FK, restrict), `planned_exercise_id` (FK, null until #20), `origin` (`added` in #19), `position`, `skipped`.
- **`sets`:** `id`, `session_exercise_id` (FK, cascade), `position`, `reps`, `weight_kg` (full precision), `completed_at`, `skipped`, `target_reps` / `target_weight_kg` (null until #20).
- **Time formats:** instants are UTC ISO 8601 strings, as in `weight_entries`. `paused_ms_total` is an integer in milliseconds.
- **No `discarded` status:** discarded sessions are deleted (D5). Pause is a field, not a status.

## Walkthrough: one session

Tuesday at the gym, focus **Arms + Back**. IDs are shortened UUIDs, `s1` is the session and `t` is `last_activity_at`.

| Time  | Action                            | Committed in one transaction (D7)                                        | Derived (D6)                                  |
| ----- | --------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| 18:05 | Begin Session (Arms+Back, Gym)    | `sessions` + `s1`: `active`, started 18:05, `t` 18:05, paused_ms_total 0 | clock = now − start − paused                  |
| 18:07 | Add Bicep curl                    | `session_exercises` + `e1` (exercise by ID, origin `added`); `t` = 18:07 | prefill from the last Bicep curl sets         |
| 18:09 | Log 25 lb × 10                    | `sets` + (reps 10, weight_kg 11.3398…, completed 18:09); `t` = 18:09     | set count, volume                             |
| 18:12 | Log 25 lb × 8                     | `sets` +; `t` = 18:12                                                    |                                               |
| 18:13 | **Pause** (phone call)            | `paused_at` = 18:13; `t` = 18:13                                         | clock frozen at 8 min                         |
| 18:21 | **Resume**                        | `paused_ms_total` += 8 min; `paused_at` = null; `t` = 18:21              | clock 8 min (paused time excluded)            |
| 18:23 | Add Lat pulldown, log 100 × 10    | `session_exercises` +, `sets` +; `t` = 18:24                             |                                               |
| 18:25 | 🔋 phone dies                     | nothing: every row above is already committed                            |                                               |
| 18:55 | Reopen app                        | `s1` is `active` and not paused → status `interrupted` (D2, relaunch)    | last activity 18:24                           |
| 18:55 | Prompt: Resume / Finish / Discard |                                                                          |                                               |
| → A   | **Finish (default)**              | `finished`, `ended_at` = **18:24** (last activity)                       | duration = 18:24 − 18:05 − 8 min = **11 min** |
| → B   | **Resume**                        | `active`, `t` = 18:55 (gap handling: **pending Q2**)                     |                                               |
| → C   | **Discard** (confirmed)           | delete `s1`; its exercises and sets cascade (D5, D8)                     | nothing remains                               |

## Lifecycle

```
                start
                  │
                  ▼
   ┌────────► active ◄──── unpause ────┐
   │           │  │                     │
   │           │  └──── pause ───► active + paused_at   (never auto-flagged, D2)
   │           │
   │   relaunch, or 60 min with no activity while running (D2)
   │           ▼
   └─ resume ─ interrupted
               │
     finish ───┼─── discard (rows deleted)
               ▼
           finished   (view and delete only in #19, D5)
```

`finish` and `discard` are available from `active` (running or paused) and from `interrupted`.

## Validated details

### 1. Pause across an app relaunch (arithmetic settled; relaunch rule is Q1)

- **Pause:** `paused_at` = now; `last_activity_at` = now.
- **Unpause:** `paused_ms_total += now − paused_at`; `paused_at` = null; `last_activity_at` = now.
- **Both are persisted immediately** (D7), so the totals survive termination: on relaunch, `paused_at` and `paused_ms_total` read back exactly as written.
- **Clock while paused:** frozen at `paused_at − started_at − paused_ms_total`. Timestamps only, as in `src/lib/clock.ts`; no ticking state is stored.
- **Finishing while paused:** `ended_at` = now, and the open pause is added first (`paused_ms_total += now − paused_at`). The duration therefore equals the clock shown when it was paused.
- **Idle rule (D2):** skipped while `paused_at` is set. After an unpause, the 60 minutes count from the unpause, which is an activity.
- **Not decided:** what a relaunch does to a session that is **paused** at the time. See **Q1**.

### 2. What counts as "last activity"

- **Definition:** `last_activity_at` = the time of the last **committed user write** to the session: start, add exercise, log, skip or delete a set, pause, unpause, resume. Viewing, scrolling, opening the app or receiving a notification don't count.
- **Persistence:** it's updated **in the same transaction** as the write (D7), so it can never be later or earlier than the data it describes.
- **Finishing an interrupted session:** the default is `ended_at = last_activity_at` (D3). The duration is then `last_activity_at − started_at − paused_ms_total`, so the outage doesn't count. With "Finish now", `ended_at` = now and the outage counts (unless the session was paused).
- **The idle check (D2)** compares now with `last_activity_at`. It runs on launch, on return to the foreground, and while the session screen is open.
- **Not decided:** whether a **resumed** session counts the outage gap. See **Q2**.

## Invariants

1. A completed set is never lost: it's committed before it shows as done, and a failed write leaves no partial rows.
2. At most one open (`active` or `interrupted`) session at any time (unique index, D8).
3. `finished` sessions have `ended_at ≥ started_at` and `paused_at` = null. Duration is never negative (clamped if the device clock went backwards).
4. Every `session_exercises` row references an existing session and exercise. Used exercises are archived, never deleted (D4, D8).
5. Deleting or discarding a session leaves no orphaned exercises or sets (cascade, D8).
6. Derived values always reflect the current rows (D6).
7. Weigh-in data is untouched by the workout migration.

## Failure and recovery

| Failure                                    | Behavior                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| App killed between actions                 | Everything already committed. On relaunch: running session → `interrupted`; paused → **Q1**.                      |
| App killed during a write                  | The transaction commits fully or not at all; the UI shows ✓ only after the commit.                                |
| Write fails (error, disk full)             | Entered values stay on screen with an error and Retry. Nothing appears saved that isn't.                          |
| Double-tapped Start, or a second session   | Rejected by the open-session unique index. The UI offers the existing session.                                    |
| Left running, forgotten                    | Flagged `interrupted` after 60 min without activity. Finish defaults to last activity.                            |
| Long cardio block (60+ min, logged at end) | May be flagged `interrupted`. Resume continues (gap per **Q2**), or pause during long blocks. Accepted trade-off. |
| New build installed mid-session            | The data persists. The migration must carry open-session rows through unchanged (tested).                         |
| Migration fails partway                    | The transaction rolls back to the previous version; the existing database error screen appears; no data changed.  |
| Device clock moves backwards               | Durations are clamped at ≥ 0. Order is still kept by the insertion sequence.                                      |
| Deleting an exercise used in history       | Blocked by the foreign key (restrict); the UI offers Archive.                                                     |

## Pending owner decisions

**Q1. A paused session when the app is relaunched.**

- **Recommendation:** it **stays paused** and is not flagged `interrupted`. A banner offers Resume or Finish. This keeps "paused is intentional" true in every case, and the paused time is excluded from the duration either way.
- **Alternative:** treat it like any open session on relaunch: flag `interrupted` and show the Resume/Finish/Discard prompt.
- **Trade-off:** the recommendation is consistent with D2's intent, but a paused session can sit open for days unless finished. The alternative surfaces it more forcefully, but contradicts "paused sessions are never auto-flagged".

**Q2. Resuming an interrupted session: does the outage gap count?**

- **Recommendation:** on Resume, **count the gap as paused time**: `paused_ms_total += resume − last_activity_at`. This matches Finish's default (the outage never counts) and the walkthrough.
- **Alternative:** the gap counts as workout time unless you finish instead.
- **Trade-off:** the recommendation gives consistent durations whichever button you press, at the cost of one extra rule. The alternative is simpler, but resuming after a 30-minute outage adds 30 minutes the user didn't train.

#18 and #19 move to **Ready** once Q1 and Q2 are approved.
