# My Khata — Expense Tracker (Expo / React Native)

A real, installable mobile app for tracking expenses paid via UPI, cash, card,
net banking, or other methods. Data is saved on-device with AsyncStorage, so
it persists between app launches (unlike the in-chat preview, which resets).

## Features
- Add/edit/delete expenses with amount, category, payment method, UPI app, date, note
- Monthly totals with a budget bar (turns amber near budget, red over budget)
- Category breakdown pie chart
- Payment-method breakdown bar chart
- Passbook-style running ledger, grouped and sorted by date
- All data stored locally on the phone (private, works offline)

## Requirements
- Node.js 18+ installed on your computer
- A phone with the **Expo Go** app installed (free, on Play Store / App Store)

## Run it on your phone in ~5 minutes
```bash
cd mobile-app
npm install
npx expo start
```
This prints a QR code in the terminal. Open the **Expo Go** app on your
phone and scan it — the app loads live on your device. Any code change you
make will hot-reload automatically.

## Building a real installable app (APK / Play Store)
Once you're happy with it, use **EAS Build** (Expo's free/low-cost cloud
build service) to produce an actual APK or an App Store build:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # produces an installable .apk
eas build -p ios                          # produces an .ipa (needs an Apple developer account)
```
EAS gives you a download link for the APK when the build finishes — you can
install it directly on your phone, share it with others, or submit it to
the Play Store with `eas submit`.

## Where to build/host this
- **Expo Go** (fastest): test instantly on your own phone, no build step, free.
- **EAS Build** (Expo's cloud): turns this code into a real .apk/.ipa. Free tier available; https://expo.dev
- **Google Play Console**: $25 one-time fee to publish the APK publicly.
- **Apple App Store**: $99/year developer account, needed only if you want an iPhone App Store release.
- Alternatively, if you don't want to touch code at all, no-code tools like
  **Glide** or **FlutterFlow** can import a similar data model, but you'll
  have less control than with this source.

## Extending it further
- **Real UPI integration**: this app *tracks* UPI payments you log manually.
  To actually *initiate* UPI payments from the app (not just record them),
  you'd integrate a payment gateway SDK (Razorpay, Cashfree, or the UPI
  Intent/Deep Link API) — that's a separate, more involved integration
  requiring a merchant account.
- **Cloud sync across devices**: swap AsyncStorage for Firebase Firestore or
  Supabase so your data syncs across phones/tablets.
- **SMS auto-detection**: Android apps can (with permission) read bank/UPI
  SMS to auto-log transactions — a common feature in apps like Walnut/Fold.
  This needs native Android permissions and isn't available in Expo Go.
- **Recurring bills & reminders**: add expo-notifications for due-date alerts.

## File structure
```
mobile-app/
├── App.js          # entire app — screens, charts, storage logic
├── package.json     # dependencies
└── README.md
```
