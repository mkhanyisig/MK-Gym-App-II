# Gym Buddy 💪

Track workouts during a session and log body health data. A modern rebuild of the
[original 2021 Gym Buddy app](https://github.com/mkhanyisig/gym_buddy_App) (Expo SDK 42 → SDK 58).

## Run it

```sh
npm install
npx expo start      # press i / a / w for iOS simulator, Android, or web — or scan the QR with Expo Go
```

## Checks

```sh
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npx expo-doctor
```

## Stack

- Expo SDK 58, React Native 0.88, React 19, TypeScript (strict)
- Expo Router (file-based routes, typed routes)
- AsyncStorage for on-device persistence

## Structure

```
src/
  app/                 # routes (every file is a screen)
    _layout.tsx        # root stack; About is a modal
    about.tsx
    (tabs)/            # bottom tabs: Home, Workouts, Timer, Profile
  components/          # Screen, AppButton, Card, FormField, MeasurementsForm, BmiCard
  hooks/               # useProfile (persisted), useStopwatch (drift-free)
  lib/                 # bmi, unit conversion, formatting, storage helpers
  data/                # seed workout log from the original app
  theme.ts             # colors, spacing, typography tokens
```

## What changed from v1

- Upgraded from Expo SDK 42 / React 16 to SDK 58 / React 19, JS → TypeScript.
- React Navigation stack → Expo Router with a bottom tab bar.
- The 648-line `Profile.js` split into a screen, a `useProfile` hook and reusable form components.
- Profile fields are now actually editable; imperial inputs work and convert to metric for storage.
- BMI handles missing values instead of showing `NaN`; categories use standard cut-offs.
- Stopwatch display updates live and is timestamp-based (no drift).
- Removed hardcoded personal defaults from the profile.

## Next up

Workout logging with sets/reps/weight, progress charts, routines and rest timer.
