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
- **Form:** a summary of your current weight, its latest change and your BMI, with training metrics to come.
- **Profile and BMI:** name, height and body measurements, with BMI calculated from your latest weigh-in. Open it from the ☰ menu.
- **Metric or imperial:** kg/cm or lbs/ft-in throughout, with values stored in metric and converted for display.
- **Clock:** a stopwatch with laps, and a countdown set with hour, minute and second wheels (or 30/60/90-second presets) that runs inside a progress ring. Both keep time if you leave or close the app. On your phone, a running countdown shows its end time on the lock screen and "Time's up" plays your alert sound.
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

To install it on an iPhone as a standalone app, see [Running on iOS](#running-on-ios).

Development checks:

```sh
npm test              # unit tests
npm run typecheck
npm run lint          # also flags unformatted code (Prettier)
npm run format        # format every file
```

## Running on iOS

My Form. can be installed on an iPhone with Xcode and a free Apple ID. Personal testing doesn't need a paid Apple Developer membership.

| Command               | Purpose                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run ios:release` | Build and install the standalone **My Form** app. The JavaScript is bundled in, so it runs without Metro or the Mac. |
| `npm run ios:dev`     | Build and install **My Form Dev**, for testing native features.                                                      |
| `npm run start:dev`   | Start Metro for My Form Dev.                                                                                         |

**My Form** and **My Form Dev** have separate bundle IDs and separate local storage, so development never touches everyday data. Free Apple ID provisioning expires after about 7 days; rerun the same build command to re-sign. It installs over the app and keeps its data.

See the [Development Guide](docs/DEVELOPMENT.md) for prerequisites, signing, updates, data preservation and troubleshooting.

## Project Status 🏗️

My Form. is under active development. Workout session logging and training analytics are coming next; the workout-related gauges on Home are placeholders until then.
