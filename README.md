# My Form.

_Train with intention._

A personal, offline-first fitness companion for tracking training and physical progress, built with React Native and Expo. Rebuilt from my [original 2021 Gym Buddy app](https://github.com/mkhanyisig/gym_buddy_App).

<p align="center">
  <img src="https://github.com/user-attachments/assets/577fbadb-4a43-4155-bca3-701657bce92d" width="200" alt="My Form — Home Dashboard" />
  <img src="https://github.com/user-attachments/assets/d9ea36f8-c03a-440a-85e2-98d8b706e21d" width="200" alt="My Form — Daily Weight Tracking" />
</p>
<p align="center">
  <sub>Home Dashboard · Daily Weigh-Ins</sub>
</p>

## Current Features

- **Home dashboard:** a personalized greeting and at-a-glance metric gauges, led by your current weight and its latest change.
- **Daily weigh-ins:** log one weight per day, then review, edit or delete your history. Data is stored on the device.
- **Daily reminders:** optional phone notifications at 10:00, 16:00 and 22:00 on days you haven't logged yet.
- **Profile and BMI:** name, height and body measurements, with BMI calculated from your latest weigh-in.
- **Metric or imperial:** kg/cm or lbs/ft-in throughout, with values stored in metric and converted for display.
- **Workout stopwatch:** start, pause, resume and reset a timer for your session.
- **Light and dark themes:** follow the system setting or choose one in Settings.

## Tech Stack

- React Native and [Expo](https://expo.dev) (SDK 58)
- TypeScript
- Expo Router (file-based navigation)
- SQLite via `expo-sqlite` for weigh-in history, and AsyncStorage for profile and settings
- Jest for unit tests

## Getting Started

Requires Node.js and the [Expo Go](https://expo.dev/go) app, or a simulator.

```sh
npm install
npx expo start --go   # scan the QR code with Expo Go
npm run web           # or run it in the browser
```

Development checks:

```sh
npm test              # unit tests
npm run typecheck
npm run lint          # also flags unformatted code (Prettier)
npm run format        # format every file
```

## Project Status 🏗️

My Form. is under active development. Workout session logging and training analytics are coming next; the workout-related gauges on Home are placeholders until then.
