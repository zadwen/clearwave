# Clearwave by zadwen

A responsive, installable web app for iOS Safari and Android Chrome. This is a PWA, not a native IPA/APK.

## Features
- Timed low-frequency sweeps (experimental water tones), 15/30/60 seconds.
- Custom sine tone from 100–1000 Hz and 9-second listening test.
- Adjustable app gain, headphone-disconnection reminder, explicit user-started audio.
- Immediate stop, finite-length PCM media playback, background/interruption stop.
- Optional screen wake lock; local last-session history with deletion.
- Dust care guide with primary-source links; no microphone access.
- Home screen manifest, icons, limited static-asset caching. Navigation requires online access; no offline guarantee.

## Run
No build or npm dependencies are required. Run locally:

```bash
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. To use on a phone, deploy the contents of `dist/` to an HTTPS static host. Installation and wake lock require HTTPS.

## Limitations
Not validated as a water-removal treatment. Tones do not dry internal components, reliably remove stuck dust, or diagnose damage. Frequencies are experimental, not manufacturer-approved. The browser cannot select the phone speaker or change system volume. Follow manufacturer care instructions and never charge a wet phone.

## Validation
JavaScript syntax checked. Mock media / DOM checks cover consent gating, start, manual stop, scheduled completion, modes, and hidden-page shutdown. Physical iPhone/Android playback and visual browser QA were unavailable in the build environment.

Sources: https://support.apple.com/en-us/108039 , https://support.apple.com/en-us/118432 , https://support.apple.com/en-us/108352

## Audio compatibility update
Uses locally generated PCM WAV played through HTMLAudioElement instead of AudioContext. Sets the playback audio-session type where supported, calls play during the user gesture, bakes gain into the PCM samples for iOS, and reports blocked or stalled playback. Controls are timed from the media playback clock. Physical Safari verification remains necessary.
