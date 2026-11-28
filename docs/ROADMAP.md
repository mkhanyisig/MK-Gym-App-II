# My Form. — Roadmap

A personal, offline-first fitness companion. This roadmap lists what's built, what's next and the questions still open. GitHub issues track each item.

## Principles

- **Offline-first.** Data stays on the device (SQLite and AsyncStorage). No accounts or cloud.
- **Log reality.** Record what actually happened. Never invent workouts, progress or estimates. Anything estimated is labelled.
- **Flexible, not prescriptive.** Spontaneous workouts are first-class. Routines and recommendations help but never block.
- **Small, reviewable PRs.** Each one is independently testable.

## Done

- **Foundation:** Expo SDK 58, TypeScript, Expo Router, light and dark themes, editorial design system.
- **Body weight:** daily weigh-ins in SQLite with history, edit and delete, Home gauge and change, Profile and BMI integration, and daily reminders.
- **Clock and Form (#17):**
  - **Stopwatch:** laps, with a timestamp-based timing model.
  - **Countdown:** a wheel picker, a progress ring, a static lock-screen status note and an audible "Time's up".
  - **Form tab:** a summary of real body metrics.
  - **Navigation:** Profile moved to the ☰ menu.
- **Native iPhone builds (#26):** local Xcode builds with a free Apple ID; see [docs/DEVELOPMENT.md](DEVELOPMENT.md).

## Priorities and workflow

Issues carry one priority label:

| Label         | Meaning                                  |
| ------------- | ---------------------------------------- |
| `priority:P0` | Blocking design or reliability decisions |
| `priority:P1` | Next essential product capabilities      |
| `priority:P2` | Planned enhancements                     |
| `priority:P3` | Future research and improvements         |

Workflow: **Backlog → Refinement → Ready → In Progress → Review → Done**. Statuses are meant to live on a GitHub Project board, not in labels. An issue becomes **Ready** only once its open design decisions are approved.

## Next up

| Priority | Issue                                                                                                                      | Why                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P0       | [#27](https://github.com/mkhanyisig/MK-Gym-App-II/issues/27) Research: workout data lifecycle and integrity                | Decides source of truth, session lifecycle, atomic writes and history integrity **before** #18 and #19 start.       |
| P1       | [#28](https://github.com/mkhanyisig/MK-Gym-App-II/issues/28) Offline data export, import and recovery                      | Protects on-device history from reinstalls and device loss. The contract comes first; implementation is a later PR. |
| P1       | [#18](https://github.com/mkhanyisig/MK-Gym-App-II/issues/18), [#19](https://github.com/mkhanyisig/MK-Gym-App-II/issues/19) | First two workout steps, once #27's decisions are approved.                                                         |
| P1       | [#25](https://github.com/mkhanyisig/MK-Gym-App-II/issues/25) Multiple daily weigh-ins with daily averages                  | Independent weight-tracking improvement; shares the next migration number with #18, so agree the migration order.   |
| P3       | [#29](https://github.com/mkhanyisig/MK-Gym-App-II/issues/29) Research: personalized insights and recommendation strategy   | Rule-based, explainable recommendations; research only.                                                             |

## Now: Workout journal MVP

The goal is a gym-ready journal for flexible, mixed sessions: strength, cardio and warm-ups, at the gym or at home.

**Core ideas**

- **Starting:** pick a focus (Arms, Chest, Back, Shoulders, Legs/Glutes, Core, Cardio, Stretch) and Gym or Home. Then either start an **empty, spontaneous session** or start from a **saved routine**. A finished session can be saved as a routine.
- **Planned vs actual:** what was planned (routine targets) and what was done (sets, weights, reps, skips, added exercises, **substitutions**) are stored separately and never overwritten.
- **Logging:** − / + steppers prefilled from last time, and tick to complete a set. A rest countdown starts after each set. The session clock never resets.
- **Interrupted sessions:** a session left open (app closed or forgotten) becomes **interrupted and resumable**. On the next open you choose Resume, Finish or Discard. It's never auto-completed. The exact rules are a research item.
- **Insights:**
  - **Summary:** completion against the plan (only when a plan exists), personal bests, volume per muscle group, and **estimated** calories, labelled as estimates.
  - **Focus picker:** a gentle weekly-balance hint.

**Delivery: six PRs, in order** (one issue each)

| Step | Issue                                                        | Scope                                                                                                                                                                                                                                     | Depends on                    | Priority |
| ---- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| 1    | [#18](https://github.com/mkhanyisig/MK-Gym-App-II/issues/18) | Workout data foundation: a **minimal, extensible** schema (exercises, sessions, session exercises, sets) with planned vs actual built in; repositories; session state model; small starter library. Later steps add their own migrations. | #27 decisions                 | P1       |
| 2    | [#19](https://github.com/mkhanyisig/MK-Gym-App-II/issues/19) | Spontaneous sessions: focus + Gym/Home, empty session, add exercises, log sets, finish, discard, interrupted/resume, history                                                                                                              | #18                           | P1       |
| 3    | [#20](https://github.com/mkhanyisig/MK-Gym-App-II/issues/20) | Routines: build and edit, start from a routine, plan-vs-actual tick-off, save a session as a routine                                                                                                                                      | #18, #19                      | P2       |
| 4    | [#21](https://github.com/mkhanyisig/MK-Gym-App-II/issues/21) | Rest countdown and substitutions                                                                                                                                                                                                          | #19 (#20 for planned targets) | P2       |
| 5    | [#22](https://github.com/mkhanyisig/MK-Gym-App-II/issues/22) | Cardio and Home equipment                                                                                                                                                                                                                 | #19                           | P2       |
| 6    | [#23](https://github.com/mkhanyisig/MK-Gym-App-II/issues/23) | Summary and insights: completion vs plan, PBs, volume, estimated calories, weekly-balance hint, Form training metrics                                                                                                                     | #19–#22                       | P2       |

## Open research items

Each one is settled in, or before, the step shown, and recorded in that PR's description. The issues list the same items.

| ID  | Question                                                                                                                                                                                                                | Issue    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R1  | **Interrupted sessions** (researched in #27): when is a session considered interrupted (app killed, idle time, a day boundary)? How is its end time chosen (last activity vs now)? Is idle time excluded from duration? | #18–#19  |
| R2  | **Weight steppers:** small and large increments per equipment and units, and long-press behaviour.                                                                                                                      | #19      |
| R3  | **Rest timer:** default rest per exercise, and how a rest alert coexists with a running Clock countdown.                                                                                                                | #21      |
| R4  | **Starter exercise library:** which exercises to seed first (start small, grow later), muscle and equipment tags, and alternative groupings for swaps.                                                                  | #18, #21 |
| R5  | **Calorie estimates:** method (MET × body weight × time?), a sourced MET table, labelling, and how they relate to machine readouts.                                                                                     | #23      |
| R6  | **Personal bests:** heaviest weight, most reps at a weight, or estimated 1RM, and how substitutions count.                                                                                                              | #23      |
| R7  | **Volume:** primary muscle only, or weighted across secondary muscles; sets vs weight × reps.                                                                                                                           | #23      |
| R8  | **Cardio fields:** which fields per machine type (time, distance, level, incline, machine calories).                                                                                                                    | #22      |
| R9  | **Weekly balance:** what counts as "trained" for a focus, and the time window.                                                                                                                                          | #23      |
| R10 | **Sample data:** retire the 2021 sample workouts when real history arrives.                                                                                                                                             | #19      |

## Later

- **Custom countdown "ding":** an original sound asset bundled via the notification plugin. Needs a development build.
- **iOS Live Activities:** a live, interactive lock-screen and Dynamic Island countdown. Needs a development build and a widget extension.
- **Weight trends:** a weight-history chart on Form with date-range filters, using real entries only.
- **Training trends:** frequency, time trained and exercise progression on Form.
- **Personalized recommendations:** after #29's research, starting with transparent rules (no ML, no tracking).
