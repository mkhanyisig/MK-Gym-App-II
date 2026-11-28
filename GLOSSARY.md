# My Form. glossary

The shared language for issues, specs, code and design notes. Use the **term** in bold when writing specs and code.

- **Status tags:** _implemented_ means it exists in the app today; _planned (#n)_ means it's approved design, not built yet; _future_ means it's an idea only.
- **_Avoid_ lists are guidance, not rules.** They name words that are ambiguous or mean something else here. User-facing copy may still use natural language (for example "workout" for a Session) where it reads better.
- When a feature adds or changes a term, update this file in the feature's first commit.

## Product

**My Form.** · _implemented_
The app. Written with the full stop in product copy, and as "My Form" where punctuation would be odd (e.g. the home-screen name).
_Avoid_: Gym Buddy (the 2021 app)

**Form tab** · _implemented_
The tab that summarizes the user's recorded metrics. Say "the Form tab" in specs, so it isn't confused with the product name.
_Avoid_: Stats, Progress, Dashboard

**Clock** · _implemented_
The tab with a **Stopwatch** and a **Countdown**, usable on its own and, later, during a Session.
_Avoid_: Timer (except the "Set timer" screen label)

## Body weight

**Weigh-in** · _implemented_ (one per Day today; several per Day, #25)
One recorded body-weight reading: weight (stored in kg at full precision), the time it was taken, and its local Day. Stored in `weight_entries` today. #25 proposes a `weigh_ins` table, and the existing structure stays until #25 is implemented.
_Avoid_: Measurement, weight entry (in prose; `weight_entries` remains the current table name)

**Day** · _implemented_
A local calendar day, stored as a day key (`YYYY-MM-DD`) when a Weigh-in is recorded, so travel or time-zone changes never move it.
_Avoid_: Date (when it means the calendar day), UTC day

**Daily average** · _planned (#25)_
The mean of a Day's Weigh-ins, from unrounded kg. Days without Weigh-ins have none: they're gaps, never filled.
_Avoid_: Daily weight, mean weight

**Profile weight** · _implemented_
The undated weight entered in Profile. A fallback, used until the first Weigh-in exists.
_Avoid_: Starting weight, default weight

**Current weight** · _implemented_ (rule changes with #25)
The value shown as "your weight": the latest Weigh-in (the latest Daily average once #25 lands), otherwise the Profile weight, otherwise none.
_Avoid_: Latest weight

**Body details** · _implemented_
Profile's height and Profile weight. The UI card is labelled "Body measurements" today; changing that label is a separate decision.
_Avoid_: Measurements (for Weigh-ins)

## Workouts

**Session** · _planned (#18, #19)_
One workout, from Start to Finish, recorded in `sessions`. The internal domain term: specs and code say Session. User-facing copy may say "workout" where natural ("Last workout", "Workout Log").
_Avoid_: Training, visit, log entry

**Focus area** · _planned (#18, #19)_
What a Session targets: Arms, Chest, Back, Shoulders, Legs/Glutes, Core, Cardio, Stretch. A Session has one or more, stored as a JSON list and validated against this set.
_Avoid_: Muscle group (that's an Exercise property), category, split

**Location** · _planned (#19)_
Where a Session happens: **Gym** or **Home**.
_Avoid_: Venue, place, environment

**Exercise** · _planned (#18)_
A movement in the library, such as "Bicep curl", with a name, muscle group, equipment and kind (strength or cardio). Built-in or **Custom**. Never deleted once used; **Archived** instead: hidden from the picker, kept in history, and a rename applies to history.
_Avoid_: Move, activity, workout (for a single movement)

**Session exercise** · _planned (#18)_
An Exercise as performed in one Session, in order. Its origin is **Added**, **Planned** (#20) or **Substituted** (#21).
_Avoid_: Entry, item

**Set** · _planned (#18)_
One performed effort of a Session exercise: reps and weight, completed at a time. It can carry a **Target** (#20) and can be **Skipped**.
_Avoid_: Rep (a single repetition), round, lap

**Routine** · _planned (#20)_
A saved, reusable list of Exercises with Targets. Starting from a Routine copies its Targets into the Session, so later edits never change history.
_Avoid_: Template, program, plan (for the saved object)

**Target** · _planned (#20)_
A planned value for a Set: reps and weight, copied from a Routine and kept beside the actual values.
_Avoid_: Goal, quota

**Planned vs actual** · _planned (#20)_
What a Routine's Targets asked for, versus what was recorded. Both are kept; neither overwrites the other.

**Substitution** · _planned (#21)_
Doing a different Exercise in place of a planned one. The UI action is **Swap**, and the record keeps the planned Exercise.
_Avoid_: Replacement (the suggested options are "alternatives")

**Rest countdown** · _planned (#21)_
The countdown that starts after a completed Set, separate from the Clock's Countdown.
_Avoid_: Rest timer, break

## Session lifecycle

Planned in #18 and #19; the rules are approved in [#27](https://github.com/mkhanyisig/MK-Gym-App-II/issues/27) and the workout data lifecycle design note.

**Active**
A Session in progress. It may be **Paused**.

**Paused**
An Active Session the user paused on purpose. Paused time is excluded from Duration. Never flagged Interrupted, including across an app relaunch (D2, Q1).
_Avoid_: Stopped, on hold

**Interrupted**
An Active, running Session found open after an app relaunch, or after 60 minutes without activity (D2). The user can Resume, Finish or Discard it.
_Avoid_: Unfinished, abandoned, crashed

**Resume**
Continue an Interrupted Session. The gap since Last activity counts as paused time (Q2).
_Avoid_: Restart (the Countdown's action)

**Finish**
End a Session and keep it (status `finished`). A Session with no completed Sets isn't kept: Finish explains that it will be discarded and asks first; Cancel keeps it open.
_Avoid_: Complete, end, stop, save

**Discard**
Remove an open Session without keeping it. Its rows are deleted, after confirmation.
_Avoid_: Cancel (that dismisses a dialog), delete (for open Sessions)

**Delete**
Remove a finished Session from history, after confirmation. Editing finished Sessions comes later (D5).
_Avoid_: Discard (for finished Sessions), archive

**Last activity**
The time of the last committed user action in a Session: start, add Exercise, log, skip or delete a Set, pause, unpause, resume. Saved with that action. Finishing an Interrupted Session ends at Last activity by default (D3).
_Avoid_: Last seen, last opened

**Duration**
End − start − paused time (D3). Rests and waits count; pauses and outages don't.
_Avoid_: Active time, elapsed (for a finished Session)

## Clock and notifications

**Stopwatch** · _implemented_
Counts up, with **Laps**. Shows mm:ss.cc, then hh:mm:ss from an hour.
_Avoid_: Timer

**Countdown** · _implemented_
Counts down from a chosen duration, shown in a progress ring. It ends at **Time's up** and can be started again with **Restart**.
_Avoid_: Timer, alarm

**Time's up** · _implemented_
The moment a Countdown reaches zero, and its alert, with the default iOS sound.
_Avoid_: Alarm, finished (for the Countdown)

**Restart** · _implemented_
Run a finished Countdown again with the same duration.
_Avoid_: Resume (the Session's action)

**Status note** · _implemented_
The static lock-screen notification while a Countdown runs ("Countdown running · Ends at 3:45 PM"). It doesn't tick.
_Avoid_: Widget, Live Activity (for this note)

**Live Activity** · _future_
A live, ticking lock-screen and Dynamic Island countdown. Needs a development build.

**Weigh-in reminder** · _implemented_
The daily notification at set times, skipped for the rest of the Day once a Weigh-in exists.
_Avoid_: Alert, nudge

## Planning

**Decision**
An owner-approved answer to a numbered open question, recorded in one Decisions comment along with the rejected alternatives.

**Spec**
The implementation contract for a feature: user stories, acceptance criteria, engineering constraints, test strategy and device checks.

**Ready for agent**
The `ready-for-agent` label. Only the owner applies it, once the Spec's approval checklist is complete. Claude implements only labelled issues.

**Device check**
A check the owner runs on the iPhone. Each unexpected result is classed **Fix** (our bug), **Reopen** (a Decision's assumption failed: open a new issue from the fallback and pause only the dependent work) or **Measure** (record the number).

**Engineering reflection**
The owner's short written answers at a significant feature's closure. Claude doesn't answer them.
