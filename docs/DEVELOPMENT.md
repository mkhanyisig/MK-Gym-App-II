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

### Rebuild My Form (Release) from `main`

```sh
git switch main && git pull
npm install            # also reapplies the dependency patch
npm run ios:release    # iPhone connected and unlocked; pick it when asked
```

The Release build **bundles the JavaScript into the app**. Once it's installed, My Form runs on its own: no USB cable, no Metro, and no Mac needed. The cable is only for installing.

### Test a feature branch with My Form Dev

```sh
git switch <feature-branch> && npm install
npm run ios:dev        # once, and again when native modules or app config change
npm run start:dev      # each session; open My Form Dev on the iPhone (same Wi-Fi as the Mac)
```

Code changes reload instantly in My Form Dev, which keeps its own data, separate from My Form.

### Install an updated build without losing data

Run the **same** script for the same app (`ios:release` for My Form, `ios:dev` for My Form Dev). The new build installs **over** the existing app, and its SQLite and AsyncStorage data are kept. **Don't delete the app first.**

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

## Troubleshooting

- **App won't open after about a week ("no longer available"):** free provisioning has expired. Your data is still on the phone. Connect the iPhone, unlock it, and rerun the same build script; it re-signs and installs over the app. If Xcode reports an expired or missing profile, open **Xcode › Settings › Accounts**, check that your Apple ID is still signed in, then rerun.
- **Repeated keychain prompts, or `errSecInternalComponent` in "[CP] Embed Pods Frameworks":** `codesign` asks to use your signing key once per framework, and the stacked prompts can look frozen. Clicking **Deny** fails the build. Authorize it once, with a single signing run in **Terminal.app**:
  ```sh
  cp /usr/bin/true /tmp/sign-test
  codesign --force --sign "Apple Development" /tmp/sign-test   # enter your login keychain password, click Always Allow
  rm /tmp/sign-test
  ```
  Then rerun the build. If several Apple Development identities exist, pass the one from `security find-identity -v -p codesigning` (its SHA-1) instead of the name. Don't delete or regenerate certificates for this. If the prompt still misbehaves, `security set-key-partition-list -S apple-tool:,apple:,teamid:59GAB85EFG -s -l "<private key label>" ~/Library/Keychains/login.keychain-db` grants the same access for that one key. Always pass `-l` (without it, every key in the keychain changes), and leave out `-k` so you're asked for the password.
- **"Untrusted Developer":** go to **Settings › General › VPN & Device Management**, tap your Apple Development profile, and tap **Trust**.
- **iPhone not offered as a destination:** unlock it, confirm **Trust This Computer**, check that **Developer Mode** is on, and wait for **Xcode › Window › Devices and Simulators** to finish preparing it.

## Dependency patch: Xcode 26.2+ build fix (temporary)

Expo SDK 58's `expo-modules-jsi` doesn't compile with Xcode 26.2 or newer (Swift 6.2). The error is `JavaScriptObject.swift:946: sending 'slot' risks causing data races`. Upstream: [expo/expo#52754](https://github.com/expo/expo/issues/52754), with a proposed fix in [expo/expo#54073](https://github.com/expo/expo/pull/54073).

Until Expo releases the fix, `patches/expo-modules-jsi+58.0.24.patch` applies that proposed one-line change: the pointer is wrapped in the module's own `UncheckedSendable`. [`patch-package`](https://github.com/ds300/patch-package) reapplies it on every `npm install`, through the `postinstall` script. It changes no app behaviour. Never edit `node_modules` or the generated `ios/` folder by hand.

**When to remove it:** once an `expo-modules-jsi` release includes the fix (check the issue or the package changelog). To remove it, upgrade with `npx expo install --fix`, delete the patch file, and run `npm run ios:release` to confirm the build. If an upgrade makes `npm install` report that the patch failed to apply, check whether the new version already has the fix (then delete the patch) or regenerate it with `npx patch-package expo-modules-jsi`.

## Testing checklist (native build)

- **First launch:** opens from the home screen with no Mac connected; icon, splash, fonts, light and dark themes, safe areas.
- **Weight:** log, edit and delete a weigh-in; force-quit and reopen; check that Profile and BMI and the Home and Form values agree.
- **Clock:**
  - the stopwatch and laps stay correct after locking the phone and after force-quitting
  - the countdown wheels and progress ring
  - "Time's up" plays a sound when the app is open, locked and closed
  - the lock-screen countdown note
- **Notifications:** the prompt names **My Form**, and settings live under Settings › Notifications › My Form. The Notifications screen shows the next reminder.
- **Offline:** repeat the flows in Airplane Mode.
- **Data survives a rebuild:** add data, run `npm run ios:release` again, and check that everything is still there. Do this before any release that changes the database.
