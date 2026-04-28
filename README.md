# Roland GO: Presets — TouchOSC Templates

## Credits & Inspiration

This project would not exist without the pioneering work of:

- **Jaan Angerpikk** (GitHub: [waldt](https://github.com/waldt), Reddit: u/Extra_Ad_655) — Original discoverer of the hidden Juno-DS-style synth engine inside Roland GO:PIANO and GO:KEYS hardware. Creator of the [GO:Plus](https://github.com/waldt/goplus) Python tool and TouchOSC templates that first demonstrated practical access to these hidden capabilities.

- **dctucker** — For the [roland-junods](https://github.com/dctucker/roland-junods) project and Juno-DS memory map, which provided crucial reference data for understanding the shared synth architecture.

The spark for this project came from the r/synthesizers thread ["Your 'Beginner' Roland Might Be Hiding a SERIOUS Synth Engine"](https://www.reddit.com/r/synthesizers/comments/1bkbn0n/your_beginner_roland_might_be_hiding_a_serious/) (March 2024), which brought this discovery to the wider community.

---

## What This Is

Roland's GO:PIANO and GO:KEYS keyboards ship with a small number of exposed sounds, but the underlying synth engine — closely related to the Roland Juno-DS — contains well over a thousand additional patches accessible via standard MIDI bank select and program change commands. They're present in every unit; Roland simply doesn't surface them in the UI.

This repo provides tools to access them properly.

---

## Part 1 — Preset Browser (Web App)

A browser-based (or locally hosted) interface that connects directly to a Roland GO series keyboard over **USB MIDI** or **Bluetooth MIDI** and lets you browse and trigger the full hidden preset library without any additional software.

### Goals

- Connect to the keyboard via the Web MIDI API (USB) or Web Bluetooth MIDI, with no drivers or DAW required
- Browse the full preset list by category, name, or bank (MSB/LSB/PC values)
- Send the correct bank select + program change sequence to instantly audition any preset
- Provide a UI that feels good — fast, tactile, more like a hardware panel than a settings screen
- Work equally well hosted on a web server or run locally from a file

### What we're _not_ spending time on

The MIDI command logic itself is straightforward — the patch list is known and the protocol is standard. The real work here is the interface: layout, navigation, search, favourites, and making it feel like a proper instrument tool rather than a developer utility.

### Tested on

macOS Sonoma + Chrome. USB and Bluetooth MIDI both confirmed working.

### Connecting your keyboard

**USB**
Plug in and skip to the browser step — it appears automatically.

**Bluetooth MIDI (macOS)**

macOS Ventura/Sonoma removed the BLE MIDI pairing UI from Audio MIDI Setup. You need a helper app to register the device with Core MIDI:

1. Install **[Bluetooth MIDI Connect](https://apps.apple.com/app/bluetooth-midi-connect/id1108321878)** (free, Mac App Store) — a small utility by Mathieu Routhier purpose-built for this.
2. Open the app, find your Roland GO in the list, click **Connect**.
3. The keyboard is now registered as a Core MIDI port system-wide — no further configuration needed.

> The macOS Bluetooth settings panel won't show BLE MIDI devices. That's normal — use Bluetooth MIDI Connect instead.

**In the browser**
Open the app, allow MIDI access when prompted. Your keyboard appears in the output dropdown (top-right). Select it, select the MIDI channel (default 1), then click any preset row to send it to the keyboard.

### Setup

> Requires **Node.js ≥ 18** and **npm**. The app must be served (not opened as a file) because Web MIDI requires a secure context — `localhost` qualifies.

```bash
cd app
npm install
npm run dev
```

Then open `http://localhost:5173` in **Chrome** or **Edge** (Web MIDI is not supported in Firefox or Safari).

To refresh the preset data from the upstream [goplus](https://github.com/waldt/goplus) source:

```bash
cd app
npm run generate-presets
```

### Build for static hosting

```bash
cd app
npm run build   # output in app/dist/
```

Drop the `dist/` folder on any static host (GitHub Pages, Netlify, etc.).

---

## Part 2

_To be defined — likely patch editing and/or performance/split/layer configuration._

---

## Attribution & Licensing

The GO:Plus project by Jaan Angerpikk is licensed under the [Apache License 2.0](https://github.com/waldt/goplus/blob/main/LICENSE). Where any content in this repository derives from that work, the Apache 2.0 copyright notice and attribution apply.

Patch and sound data accessed by these templates is based on the Roland Juno-DS Parameter Guide, © Roland Corporation. This project uses only standard MIDI protocol (bank select + program change) to communicate with hardware you own — no firmware modification or circumvention is involved.
