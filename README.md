# Digital Design Illustrations

Interactive, gate-level illustrations of digital circuits for students. Open `index.html` and pick a component from the sidebar.

No build step and no dependencies. It works straight from the file system or from any static host (for example GitHub Pages: serve the repo root).

## Components

| Group | Page |
|---|---|
| Foundations | MOS Transistors, CMOS Logic Gates |
| Combinational | Multiplexer, Decoder, Priority Encoder, Half & Full Adder, Ripple-Carry Adder |
| Sequential | SR Latch, Load/Clear Register, Shift Register, Up Counter |
| State Machines | Traffic Light FSM |

## Layout

```
index.html              nav shell: sidebar (dropdown on phones) + the selected page in an iframe
assets/style.css        the shared visual system: color tokens (light + dark), layout, controls, SVG classes
assets/circuit.js       window.DD: gate symbols, wires, input pins, LEDs, timing diagrams, theme sync
assets/components.js    the nav list; add an entry here to publish a page
components/*.html       one page per component; each also works on its own
```

## Conventions for a component page

Use `components/mux.html` as the template.

- **Page skeleton.** Start with `main.page`, then `header.page-head` holding a back link, a `.kicker` with the group name, an `h1` and a short intro. Next comes the **block view** (see below). Below that comes a `.top` grid: the schematic in a `.panel.scroll` on the left, the controls in a `.panel.ctl` on the right. Finish with an optional timing diagram panel and a `.notes` section of three short cards.
- **Block view first.** Every page opens with a `section.panel.blockview`: the component drawn as one symbol (box, mux trapezoid, gate) with its inputs, controls and outputs, next to a short "What it does" column with a `.fn` readout and an "Animate ⏵" button. It shares state with the detailed circuit below, so flipping an input in either view updates both. On every change, animate cause and effect with `DD.token` (a bead travelling along a wire: control beads first, then data, then the output updates) and mark the active internal path with `DD.flow`. Never let the displayed state depend on an animation finishing late: a newer change cancels an older animation (see the `gen` counter in `mux.html`).
- **Colors carry meaning, and only these.** A wire at 0 is `--wire` (grey-blue). A data signal at 1 is `--hi` (orange). A control signal at 1 (select, enable, clock, load, clear, carry-in) is `--ctrl` (teal). Give control wires, gates and pins the class `ctrl` so they light teal. Never hard-code colors: use the tokens so dark mode works.
- **Draw with DD helpers.** Use `DD.gate`, `DD.wire`, `DD.dot`, `DD.pin`, `DD.led`, `DD.block`, `DD.muxShape` and `DD.Timing`. Keep a map from signal name to the wires it drives, and recolor everything in a single `render()` with `DD.setHi`.
- **Inputs work twice.** Every input can be flipped by clicking its square in the schematic (`DD.pin`) and by its button in the controls panel (`.bit`, or `.sw` for control lines).
- **Tables.** Truth and function tables use `table.tt`. The current row gets `.cur` through `DD.markRow`. Make rows clickable (`.pick`) when picking a row should set the inputs.
- **Sequential circuits.** These get a "Pulse clock" primary button, a short animation of the edge, and a `DD.Timing` diagram that records every cycle.
- **Width.** Schematics have a fixed `viewBox` and scale down to fit narrow screens; timing diagrams keep their size and scroll sideways inside `.scroll`. The page body never scrolls horizontally.
