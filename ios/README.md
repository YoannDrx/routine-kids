# RoutineKids iOS

The native app targets iPhone and iPad on iOS 17 or newer. `project.yml` is the
source of truth and is generated with XcodeGen:

```bash
brew install xcodegen
cd ios
xcodegen generate
xcodebuild -project RoutineKids.xcodeproj -scheme RoutineKids \
  -destination 'platform=iOS Simulator,OS=26.3.1,name=iPhone 17 Pro' test
```

The release API URL is `https://routine-kids.vercel.app`. Before an archive, select
the Apple Developer team and confirm the bundle ID and StoreKit product IDs. They
must exactly match App Store Connect and the server variables in `.env.example`.

The application uses Better Auth's cookie session, queues task completion
mutations in `UserDefaults`, replays them with server idempotency, schedules
opt-in local reminders, and validates StoreKit 2 transactions again on the
RoutineKids server before granting Family Plus.
