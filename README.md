# Roland GO: Hidden Preset Browser

A web app that connects to a Roland GO:PIANO or GO:KEYS over USB or Bluetooth and lets you browse and trigger over a thousand hidden presets not exposed in the keyboard's own UI. No drivers, no DAW, no additional software — just a browser.

> **⚠️ Browser requirement:** This app uses the **Web MIDI API**, which is only supported in **Chrome and Edge** (desktop). It will not work in Firefox, Safari, or any mobile browser on iPhone/iPad. If nothing happens when you open the app, check your browser first.

> Tested on macOS Sonoma + Chrome.

---

## Requirements

- **Node.js ≥ 18** — [download from nodejs.org](https://nodejs.org) (choose the LTS version). npm is included.
- **Chrome** or **Edge** — Web MIDI is not supported in Firefox or Safari
- **Git** — [download from git-scm.com](https://git-scm.com) if you don't have it

---

## Getting started

### 1. Install the requirements above if you haven't already

After installing Node.js, open a terminal and check it worked:

```bash
node --version   # should print v18 or higher
npm --version
```

### 2. Clone the repository

```bash
git clone https://github.com/seanthebear/Roland_Go_Presets.git
cd Roland_Go_Presets
```

### 3. Install dependencies and start the app

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge.

---

## Connecting your keyboard

### USB

Plug the keyboard in, then open the app. It will appear automatically in the MIDI output dropdown.

### Bluetooth (macOS)

macOS Ventura/Sonoma no longer includes a BLE MIDI pairing UI in Audio MIDI Setup. You need a helper app that connects BLE MIDI devices into Core MIDI — any app that does this will work. The one used during development is:

**[Bluetooth MIDI Connect](https://apps.apple.com/app/bluetooth-midi-connect/id1108321878)** (free, Mac App Store)

1. Install and open it
2. Find your Roland GO in the list, click **Connect**
3. Open the browser app — the keyboard will appear in the output dropdown

> Note: BLE MIDI devices don't appear in the macOS Bluetooth settings panel — that's normal. You only need to do this pairing step once; macOS remembers it.

---

## Using the app

1. Select your keyboard from the **output dropdown** (top right)
2. Set the **MIDI channel** if needed (default is 1)
3. Click a **category** to filter, or use the **search box** to find a preset by name
4. **Click any preset row** to send it to the keyboard instantly

---

## TouchOSC Templates

_Notes to follow — work in progress._

---

## What's planned for V2

The current app only uses a small part of what the MIDI protocol and the GO's underlying Juno-DS engine can do. The three numbers (MSB/LSB/PC) just select a patch — everything about how it sounds can be shaped further in real time.

**Real-time sound control (standard MIDI — expected to work)**

These are General MIDI controllers the Juno-DS engine almost certainly responds to:

| Control | CC | What it does |
|---|---|---|
| Reverb depth | 91 | How much reverb on the current patch |
| Chorus depth | 93 | Chorus/ensemble effect amount |
| Filter cutoff | 74 | Brightness — open/close the filter |
| Filter resonance | 71 | Adds edge/bite to the filter |
| Attack | 73 | How fast the sound fades in |
| Release | 72 | How long it rings after you release |
| Volume | 7 | MIDI channel volume |
| Pan | 10 | Stereo position |
| Modulation | 1 | Vibrato/modulation depth |

V2 will add a row of sliders for these beneath the preset list, plus a **Reset** button (`CC121 — Reset All Controllers`) to snap everything back to the patch's defaults.

**Multi-timbral layering (needs testing)**

MIDI supports 16 simultaneous channels, each with its own patch. The Juno-DS engine is 16-part multi-timbral. If the GO honours multiple active channels at once — which is untested — you could layer sounds (e.g. a piano on Ch1 with a pad on Ch2) or create splits across the keyboard. V2 will test this and add a layer/split UI if it works.

**Deeper sound editing via SysEx (speculative)**

The [roland-junods](https://github.com/dctucker/roland-junods) project mapped the Juno-DS parameter memory space. If the GO shares this address space — likely given the shared engine — it may be possible to reach individual oscillator, envelope, LFO, and multi-effects parameters for real patch editing, not just preset selection. This is exploratory and may not work, but worth investigating.

**Unexplored patch banks**

The current preset list covers the documented PRST bank and GO native sounds. The MSB/LSB address space is large and not fully charted — there may be additional banks yet to be discovered.

**SysEx patch injection (experimental)**

The most ambitious possibility: using Roland's SysEx Data Set protocol to write custom patch data directly into the keyboard's temporary tone memory. Rather than just selecting an existing preset, you would assemble the raw parameter bytes for a sound (oscillator waveform, filter settings, envelope, effects) and transmit them to the keyboard as a SysEx message — the instrument receives them and plays your custom sound immediately, without any of it needing to exist on the keyboard beforehand.

This survives only until power-off (temporary memory), but it opens up things like:

- Designing sounds in the browser and hearing them on the keyboard instantly
- Interpolating between two existing presets to create hybrids
- Storing personal patches in the app, not on the keyboard
- Exporting and sharing patches as simple JSON

The Juno-DS SysEx format is documented and the memory map is partially mapped by the dctucker project. Whether the GO honours DT1 write messages to the same addresses is unknown — this needs hardware testing. It does not modify firmware or permanent memory; everything is volatile and reverting is as simple as selecting a different preset.

---

## Credits

- **Jaan Angerpikk** (GitHub: [waldt](https://github.com/waldt), Reddit: [u/Extra_Ad_655](https://www.reddit.com/r/synthesizers/comments/1bkbn0n/your_beginner_roland_might_be_hiding_a_serious/)) — original discoverer of the hidden synth engine in the Roland GO series and creator of the [GO:Plus](https://github.com/waldt/goplus) tool that first mapped the full preset list. The preset data in this app is derived from that work (Apache 2.0).
- **dctucker** — [roland-junods](https://github.com/dctucker/roland-junods) Juno-DS memory map reference.

This project uses only standard MIDI protocol (bank select + program change) to communicate with hardware you own — no firmware modification or circumvention is involved.
