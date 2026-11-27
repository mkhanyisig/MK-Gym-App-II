export type WorkoutLog = {
  id: string;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
};

// Seed data carried over from the original 2021 app.
const raw: [string, string][] = [
  ['Leg day', '2021-09-20'],
  ['Back day', '2021-09-21'],
  ['Core', '2021-09-25'],
  ['Cardio', '2021-09-30'],
  ['Core + Cardio', '2021-10-02'],
  ['Back day', '2021-10-03'],
  ['Leg day', '2021-10-05'],
  ['Arm day', '2021-10-08'],
  ['Chest day', '2021-10-11'],
  ['Core day', '2021-10-14'],
  ['Chest day', '2021-10-16'],
  ['Stretch day', '2021-10-18'],
  ['Back day', '2021-10-19'],
  ['Back day', '2021-10-21'],
  ['Leg day', '2021-10-22'],
  ['Leg day', '2021-10-25'],
  ['Cardio day', '2021-10-27'],
  ['Lift day', '2021-10-28'],
  ['Lift day', '2021-10-29'],
  ['Chest day', '2021-10-30'],
  ['Soccer day', '2021-10-31'],
  ['Core day', '2021-11-01'],
  ['Deadlift day', '2021-11-02'],
  ['Back day', '2021-11-05'],
  ['Arms day', '2021-11-06'],
  ['Leg day', '2021-11-08'],
  ['Chest day', '2021-11-10'],
  ['Strength day', '2021-11-12'],
  ['Core day', '2021-11-14'],
  ['Back day', '2021-11-16'],
  ['Cardio day', '2021-11-17'],
  ['Cardio day', '2021-11-18'],
];

export const sampleWorkouts: WorkoutLog[] = raw
  .map(([title, date], i) => ({ id: String(i), title, date }))
  .reverse(); // newest first
