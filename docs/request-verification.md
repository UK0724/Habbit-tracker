# User-request verification

Reviewed 27 September 2026 against the current source, retained test output, and installed Android version 9. This is a scope checklist, not a production certification.

| Request | Evidence and current limit |
| --- | --- |
| Keep habit dialog close/save controls visible | Existing desktop/mobile Chromium and iPhone WebKit dialog regressions passed in `output/web-e2e-v5.log`; the suite has 18 passing scenarios. |
| Improve habit type, reduce boxes, fix mobile expenses/reminder overflow | Implemented web layouts plus browser checks described in `release-readiness.md`. Expenses uses shrinkable grid children; native measurable controls are stacked. Physical Safari picker/keyboard behavior remains unverified. |
| Profile settings icon and 2-by-2 stats | Current `ProfilePage.tsx` has an accessible Settings icon and two-column mobile stats; desktop expands to four columns. Source inspection alone is not a new device visual test. |
| Improve streak-freeze UI | Updated profile layout is present. Purchase/concurrent balance behavior is covered by the database integration checks; final production behavior is not established. |
| Prevent repeated achievement celebrations and order unlocked badges | Web detail/replay checks, native achievement queue checks, and physical v4 undo/recomplete/cold-launch checks passed. Unlocked-first sorting is implemented. |
| Fix Android icon and startup crash | Signed versions through v9 installed on CPH2381; all advertised ABIs verified. Brand asset and router compatibility checks pass. The originally pictured CPH2469 has not been separately tested. |
| Explain and verify Android notifications | Local scheduled notifications, not remote FCM push. Background delivery was observed; edit/archive/restore/delete/sign-out alarm transitions were checked. Android alarms are inexact. |
| XP, gems, streak at the top | Implemented on web and native tabs. Browser width/sticky checks passed; physical Android values, navigation, scrolling and 135% text review passed. |
| Fix MIME/application error | Asset fallback, cache validation and recoverable route error handling implemented; service-worker and browser recovery checks passed. No deployed host has been verified. |
| Test independently and improve reliability | Separate QA account used. Native archive/delete/restore failures and history retry passed physically. Full v8 checks passed; v9 source/build and targeted checks passed. No personal records were used for test mutations. |
| Mobile build over Wi-Fi | v9 installed and `/downloads/pulse-android-v9.apk` returned HTTP 200. Preview API is explicitly `http://192.168.31.217:4000/api`; it requires this computer/network. |
| Expense tracker in Android | Missing from the native implementation: no expense route or native expense service exists. The web expense tracker remains available. This is a feature-parity gap, not a result of the header spacing change; earlier readiness assessments did not make it explicit enough. |
| Production readiness above 8/10 | Not proven. Public HTTPS deployment, production configuration, backup restoration, monitoring, remaining device workflows and physical Safari checks remain open. Existing production URLs have been requested. |

The detailed evidence, APK hashes, and exact tested versions are in [release-readiness.md](release-readiness.md). Do not interpret an older build's tests as coverage of every new path in a later build.
