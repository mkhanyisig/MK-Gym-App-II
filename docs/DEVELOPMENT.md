# Native iPhone development (free Apple ID)

My Form. is built and installed locally with Xcode and a free Apple ID (Personal Team). There's no paid Apple Developer account, no TestFlight and no cloud builds.

## Two apps, kept separate

| App             | Bundle ID                       | Built with            | Use                                                     |
| --------------- | ------------------------------- | --------------------- | ------------------------------------------------------- |
| **My Form**     | `com.mkhanyisig.gymbuddyv2`     | `npm run ios:release` | Everyday use. Standalone; the JavaScript is bundled in. |
| **My Form Dev** | `com.mkhanyisig.gymbuddyv2.dev` | `npm run ios:dev`     | Development. Loads code from Metro on the Mac.          |

Each app has its own data, so experiments never touch real history. `app.config.ts` switches the dev identity on with `APP_VARIANT=development`; everything else comes from `app.json`.

> **Never change `com.mkhanyisig.gymbuddyv2`.** iOS ties an app's data to its bundle ID.

## One-time setup

1. Install **Xcode** from the Mac App Store, then:
   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   xcodebuild -runFirstLaunch
   brew install cocoapods
   ```
2. Open **Xcode › Settings › Accounts** and add your Apple ID. A "(Personal Team)" appears.
3. Connect the iPhone by cable, unlock it and tap **Trust This Computer**. Wait for **Xcode › Window › Devices and Simulators** to finish preparing it.
4. On the iPhone, turn on **Settings › Privacy & Security › Developer Mode**, then restart and confirm.
5. Build: `npm run ios:release` (pick the iPhone; choose your Personal Team if asked).
6. On the iPhone, open **Settings › General › VPN & Device Management**, tap your Apple Development profile, and tap **Trust**.

If signing fails, open `ios/*.xcworkspace` in Xcode, go to the **MyForm** target › Signing & Capabilities, select your Personal Team, then run the script again.

## Everyday workflow

- **Developing (feature branch):** run `npm run start:dev` and open **My Form Dev** on the iPhone (same Wi-Fi). Changes reload instantly. Rebuild with `npm run ios:dev` only when native modules or app config change, or after it expires.
- **Releasing to yourself:** merge the PR, check out `main`, and run `npm run ios:release`. It installs over **My Form** and keeps its data.

Both build scripts regenerate the gitignored `ios/` folder with `expo prebuild --clean`, so the two identities never mix. Expo may ask to confirm if you have uncommitted changes; build from a clean tree when you can.

## Free Apple ID limits

- **Signing expires after 7 days.** The app then won't open, but its data stays on the phone.
- At most **3 sideloaded apps** per device, and **10 new app IDs per week**.
- No paid-only capabilities. **Push notifications are disabled** (`enableRemoteNotifications: false`). The app only uses **local** notifications (countdown alerts, weigh-in reminders), which work without push.

## Renewing safely (keeping your data)

When an app expires, or weekly to stay ahead of it: connect the iPhone and run the **same** script again (`ios:release` for My Form, `ios:dev` for My Form Dev). Installing over the existing app keeps its SQLite and AsyncStorage data.

The following delete or orphan the app's data:

- deleting the app from the iPhone
- changing its bundle ID
- signing it with a different team. That includes a future paid account: iOS won't update an app signed by another team, so it would have to be reinstalled.

Before anything risky, make an encrypted iPhone backup in Finder, which includes app data. Data entered in **Expo Go** stays in Expo Go; it doesn't move to these apps.

## Testing checklist (native build)

- **First launch:** icon, splash, fonts, light and dark themes, safe areas.
- **Weight:** log, edit and delete a weigh-in; force-quit and reopen; check that Profile and BMI and the Home and Form values agree.
- **Clock:**
  - the stopwatch and laps stay correct after locking the phone and after force-quitting
  - the countdown wheels and progress ring
  - "Time's up" plays a sound when the app is open, locked and closed
  - the lock-screen countdown note
- **Notifications:** the prompt names **My Form**, and settings live under Settings › Notifications › My Form. The Notifications screen shows the next reminder.
- **Offline:** repeat the flows in Airplane Mode.
- **Data survives a rebuild:** add data, run `npm run ios:release` again, and check that everything is still there. Do this before any release that changes the database.
