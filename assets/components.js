/* The list the nav shell (index.html) is built from. Add a page here to make it appear. */
window.DD_COMPONENTS = [
  { group: 'Foundations', items: [
    { id: 'transistors',   title: 'MOS Transistors',      sub: 'NMOS and PMOS as switches',     file: 'components/transistors.html' },
    { id: 'cmos-gates',    title: 'CMOS Logic Gates',     sub: 'NOT, NAND, NOR, AND, OR',       file: 'components/cmos-gates.html' }
  ]},
  { group: 'Combinational', items: [
    { id: 'mux',           title: 'Multiplexer',          sub: '4-to-1, gate level',            file: 'components/mux.html' },
    { id: 'decoder',       title: 'Decoder',              sub: '2-to-4 with enable',            file: 'components/decoder.html' },
    { id: 'encoder',       title: 'Priority Encoder',     sub: '4-to-2 with valid bit',         file: 'components/encoder.html' },
    { id: 'full-adder',    title: 'Half & Full Adder',    sub: 'sum and carry from gates',      file: 'components/full-adder.html' },
    { id: 'ripple-adder',  title: 'Ripple-Carry Adder',   sub: '4-bit, carry propagation',      file: 'components/ripple-adder.html' }
  ]},
  { group: 'Sequential', items: [
    { id: 'sr-latch',      title: 'SR Latch',             sub: 'cross-coupled NOR gates',       file: 'components/sr-latch.html' },
    { id: 'register',      title: 'Load/Clear Register',  sub: '3-bit, mux-based',              file: 'components/register.html' },
    { id: 'shift-register',title: 'Shift Register',       sub: '4-bit shift right',             file: 'components/shift-register.html' },
    { id: 'counter',       title: 'Up Counter',           sub: '4-bit with terminal count',     file: 'components/counter.html' }
  ]},
  { group: 'State Machines', items: [
    { id: 'traffic-fsm',   title: 'Traffic Light FSM',    sub: 'Moore machine, two timers',     file: 'components/traffic-fsm.html' }
  ]}
];
