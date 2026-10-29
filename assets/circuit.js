/* Digital Design Illustrations: shared drawing helpers.
   Exposes window.DD. Every component page uses these so gates, pins, wires and
   timing diagrams look identical everywhere. All geometry is in SVG user units. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, str, cls, anchor) {
    var e = el('text', { x: x, y: y, 'class': cls || 'lbl', 'text-anchor': anchor || 'middle' }, parent);
    e.textContent = str;
    return e;
  }
  /* points: [[x,y],...] or an SVG path string */
  function wire(parent, points, cls) {
    var d = typeof points === 'string' ? points
      : points.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join('');
    return el('path', { d: d, 'class': 'wire' + (cls ? ' ' + cls : '') }, parent);
  }
  function dot(parent, x, y, cls) { return el('circle', { cx: x, cy: y, r: 3.5, 'class': 'node' + (cls ? ' ' + cls : '') }, parent); }
  /* bus-width marker: a short slash with the width written above */
  function slash(parent, x, y, n) {
    el('line', { x1: x - 4, y1: y + 6, x2: x + 4, y2: y - 6, 'class': 'slash' }, parent);
    return text(parent, x + 6, y - 8, String(n), 'lbl small', 'start');
  }
  /* toggle "hi" on one element or a list. ctrl wires get class "ctrl" at creation. */
  function setHi(els, v) {
    if (!els) return;
    if (els.length === undefined || els.tagName) els = [els];
    for (var i = 0; i < els.length; i++) els[i].classList.toggle('hi', !!v);
  }
  /* value text that colors itself green for 0, orange for 1 */
  function setVal(t, v, prefix) {
    t.textContent = (prefix || '') + v;
    t.classList.remove('v0', 'v1');
    if (v === 0 || v === 1) t.classList.add(v ? 'v1' : 'v0');
  }
  function bin(v, n) { return (v >>> 0).toString(2).padStart(n, '0'); }
  function bitsOf(v, n) { var a = []; for (var i = n - 1; i >= 0; i--) a.push((v >> i) & 1); return a; } /* MSB first */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function restart(e, cls) { e.classList.remove(cls); void e.getBoundingClientRect(); e.classList.add(cls); }

  /* ---------- gate symbols ----------
     gate(parent, type, x, y, opts) draws a left-to-right gate whose body's top-left is (x, y).
     type: 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor' | 'not' | 'buf'
     opts: { n: inputs (default 2, 1 for not/buf), w, h, cls, label }
     Returns { g, body, bubble, ins: [[x,y], ...] (top to bottom), out: [x,y] }.
     Draw wires right up to ins[i] and from out. For other orientations wrap in a <g transform>. */
  function gate(parent, type, x, y, opts) {
    opts = opts || {};
    var unary = type === 'not' || type === 'buf';
    var n = opts.n || (unary ? 1 : 2);
    var h = opts.h || (unary ? 28 : Math.max(36, 14 * n + 8));
    var w = opts.w || (unary ? 32 : Math.round(h * 1.3));
    var inv = type === 'not' || type === 'nand' || type === 'nor' || type === 'xnor';
    var R = 4.5;                          /* bubble radius */
    var bw = inv ? w - 2 * R : w;         /* width of the body without the bubble */
    var g = el('g', { 'class': 'gate-g' + (opts.cls ? ' ' + opts.cls : '') }, parent);
    var d, ins = [], i, t, yy;
    var kind = type === 'nand' ? 'and' : type === 'nor' ? 'or' : type === 'xnor' ? 'xor' : type;
    var cls = 'gate' + (opts.cls ? ' ' + opts.cls : '');
    var xo = x;                           /* x where the main body starts */
    if (kind === 'xor') xo = x + 7;
    var bodyW = bw - (xo - x);
    if (kind === 'and') {
      var r = h / 2;
      d = 'M' + xo + ',' + y + 'H' + (xo + bodyW - r) + 'A' + r + ',' + r + ' 0 0 1 ' + (xo + bodyW - r) + ',' + (y + h) + 'H' + xo + 'Z';
    } else if (kind === 'or' || kind === 'xor') {
      d = 'M' + xo + ',' + y + 'Q' + (xo + bodyW * .55) + ',' + y + ' ' + (xo + bodyW) + ',' + (y + h / 2) +
          'Q' + (xo + bodyW * .55) + ',' + (y + h) + ' ' + xo + ',' + (y + h) +
          'Q' + (xo + bodyW * .25) + ',' + (y + h / 2) + ' ' + xo + ',' + y + 'Z';
    } else { /* not / buf triangle */
      d = 'M' + x + ',' + y + 'L' + (x + bw) + ',' + (y + h / 2) + 'L' + x + ',' + (y + h) + 'Z';
    }
    var body = el('path', { d: d, 'class': cls }, g);
    if (kind === 'xor') {
      el('path', { d: 'M' + x + ',' + y + 'Q' + (x + bodyW * .25) + ',' + (y + h / 2) + ' ' + x + ',' + (y + h), 'class': cls, fill: 'none', style: 'fill:none' }, g);
    }
    for (i = 0; i < n; i++) {
      t = (i + 1) / (n + 1);
      yy = y + h * t;
      if (kind === 'or' || kind === 'xor') {
        /* the back curve is a quadratic: x(t) = x + 0.5*depth*t*(1-t) with depth = 0.25*bodyW */
        ins.push([+(x + 0.5 * bodyW * t * (1 - t)).toFixed(1), +yy.toFixed(1)]);
      } else ins.push([x, +yy.toFixed(1)]);
    }
    var bubble = null;
    if (inv) bubble = el('circle', { cx: x + bw + R, cy: y + h / 2, r: R, 'class': 'bubble' + (opts.cls ? ' ' + opts.cls : '') }, g);
    if (opts.label) text(g, xo + bodyW * (kind === 'and' ? .4 : .45), y + h / 2 + 4, opts.label, 'lbl small');
    var api = { g: g, body: body, bubble: bubble, ins: ins, out: [x + w, y + h / 2] };
    /* gate.set(v): outline the gate in the "hi" color when its output is 1 */
    api.set = function (v) { body.classList.toggle('hi', !!v); if (bubble) bubble.classList.toggle('hi', !!v); };
    api.flash = function () { restart(body, 'flash'); setTimeout(function () { body.classList.remove('flash'); }, 300); };
    return api;
  }

  /* ---------- rectangular block (mux, decoder, register, flip-flop...) ----------
     block(parent, x, y, w, h, { title, sub, clk: y-offset of clock triangle on the left edge }) */
  function block(parent, x, y, w, h, opts) {
    opts = opts || {};
    var g = el('g', null, parent);
    var rect = el('rect', { x: x, y: y, width: w, height: h, rx: 3, 'class': 'box' + (opts.cls ? ' ' + opts.cls : '') }, g);
    if (opts.title) text(g, x + w / 2, y + (opts.sub ? h / 2 - 2 : h / 2 + 5), opts.title, 'lbl title');
    if (opts.sub) text(g, x + w / 2, y + h / 2 + 14, opts.sub, 'lbl small');
    if (opts.clk !== undefined) {
      var cy = y + opts.clk;
      el('polyline', { points: x + ',' + (cy - 8) + ' ' + (x + 11) + ',' + cy + ' ' + x + ',' + (cy + 8), 'class': 'clk-tri' }, g);
    }
    return { g: g, rect: rect, hot: function (v) { rect.classList.toggle('hot', !!v); } };
  }
  /* mux trapezoid, inputs on the left, output on the right. Returns ins spaced over its height. */
  function muxShape(parent, x, y, w, h, n, opts) {
    opts = opts || {};
    var g = el('g', null, parent), s = Math.min(18, h * .15);
    var body = el('path', { d: 'M' + x + ',' + y + 'L' + (x + w) + ',' + (y + s) + 'L' + (x + w) + ',' + (y + h - s) + 'L' + x + ',' + (y + h) + 'Z', 'class': 'box' }, g);
    var ins = [];
    for (var i = 0; i < n; i++) ins.push([x, y + h * (i + 1) / (n + 1)]);
    if (opts.title) text(g, x + w / 2, y + h / 2 + 5, opts.title, 'lbl title');
    return { g: g, body: body, ins: ins, out: [x + w, y + h / 2], selX: x + w / 2, top: y + s / 2, bottom: y + h - s / 2 };
  }

  /* ---------- input pin: a clickable 0/1 square with a name ----------
     pin(parent, x, y, name, { ctrl, onToggle, side: 'left'|'top', value })
     (x, y) is where the pin's wire starts (right edge, vertical middle).
     Returns { g, set(v), value }. */
  function pin(parent, x, y, name, opts) {
    opts = opts || {};
    var g = el('g', { 'class': 'pin' + (opts.ctrl ? ' ctrl' : ''), tabindex: 0, role: 'switch', 'aria-label': name + ' input', 'aria-checked': 'false' }, parent);
    var s = 24;
    el('rect', { x: x - s, y: y - s / 2, width: s, height: s, rx: 4 }, g);
    var t = text(g, x - s / 2, y + 5, '0', 'lbl val');
    if (name) {
      if (opts.side === 'top') text(parent, x - s / 2, y - s / 2 - 6, name, 'lbl');
      else text(parent, x - s - 6, y + 4, name, 'lbl', 'end');
    }
    var api = { g: g, value: 0 };
    api.set = function (v) {
      api.value = v ? 1 : 0; t.textContent = api.value;
      g.classList.toggle('on', !!v); g.setAttribute('aria-checked', v ? 'true' : 'false');
    };
    function fire() { if (opts.onToggle) opts.onToggle(api.value ? 0 : 1); }
    g.addEventListener('click', fire);
    g.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fire(); } });
    api.set(opts.value || 0);
    return api;
  }
  /* output lamp; opts.ctrl lights it teal (carry, enable) instead of orange */
  function led(parent, cx, cy, r, name, opts) {
    opts = opts || {};
    var c = el('circle', { cx: cx, cy: cy, r: r || 11, 'class': 'led' + (opts.ctrl ? ' ctrl' : '') }, parent);
    if (name) text(parent, cx + (r || 11) + 8, cy + 4, name, 'lbl', 'start');
    return { el: c, set: function (v) { c.classList.toggle('hi', !!v); } };
  }

  /* ---------- HTML control helpers ---------- */
  /* bind a <button class="bit"> to a value; returns setter */
  function bitButton(btn, get, onToggle) {
    btn.addEventListener('click', function () { onToggle(get() ? 0 : 1); });
    return function (v) { btn.classList.toggle('on', !!v); var s = btn.querySelector('.v'); (s || btn).textContent = v; btn.setAttribute('aria-pressed', v ? 'true' : 'false'); };
  }
  /* bind a <button class="sw"><span class="dot"></span><code>name</code> <span class="st">0</span></button> */
  function swButton(btn, get, onToggle) {
    btn.addEventListener('click', function () { onToggle(get() ? 0 : 1); });
    return function (v) { btn.classList.toggle('on', !!v); btn.querySelector('.st').textContent = v; btn.setAttribute('aria-pressed', v ? 'true' : 'false'); };
  }
  /* highlight the table row whose data-k equals key */
  function markRow(table, key) {
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i < rows.length; i++) rows[i].classList.toggle('cur', rows[i].dataset.k === String(key));
  }

  /* ---------- timing diagram ----------
     new DD.Timing(svg).render({ rows, cycles, edges, x0, cw })
     Time is drawn in half-cycle slots: cycle c spans slots 2c and 2c+1, and the
     rising clock edge sits between them (the middle of the column).
     rows: [{ label, kind: 'clk' | 'bit' | 'bus', values: [...] }]
       - 'clk' needs no values.
       - 'bit' / 'bus' values: one entry per half-cycle slot (length 2*cycles); null leaves it blank.
         Use DD.Timing.full(perCycle) when a signal is held for the whole cycle, and
         DD.Timing.registered(before, after) for a register whose value changes at the edge.
     edges: how many rising edges have actually happened (dots are drawn on those).
     pending: true shades the last column as "next edge". */
  function Timing(svg) { this.svg = svg; }
  Timing.full = function (perCycle) { var a = []; perCycle.forEach(function (v) { a.push(v, v); }); return a; };
  /* states[c] = value during cycle c before its edge; value after the edge is states[c+1] */
  Timing.registered = function (states, cycles) {
    var a = [];
    for (var c = 0; c < cycles; c++) { a.push(states[c] === undefined ? null : states[c]); a.push(states[c + 1] === undefined ? null : states[c + 1]); }
    return a;
  };
  Timing.prototype.render = function (o) {
    var svg = this.svg, rows = o.rows, N = o.cycles, x0 = o.x0 || 64, cw = o.cw || 60, rh = o.rowH || 36, h = 16, top = 16;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = Math.max(o.minWidth || 760, x0 + N * cw + 16), H = top + rows.length * rh + 18;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.classList.add('timing');
    if (o.pending) el('rect', { x: x0 + (N - 1) * cw, y: 4, width: cw, height: H - 14, 'class': 't-now' }, svg);
    for (var c = 0; c <= N; c++) el('line', { x1: x0 + c * cw, y1: 6, x2: x0 + c * cw, y2: H - 14, 'class': 't-grid' }, svg);
    if (o.pending) text(svg, x0 + (N - .5) * cw, H - 3, 'next edge', 't-small');
    var half = cw / 2;
    rows.forEach(function (row, ri) {
      var yc = top + ri * rh + rh / 2, hi = yc - h / 2, lo = yc + h / 2;
      text(svg, x0 - 8, yc + 4, row.label, 't-lab', 'end');
      if (row.kind === 'clk') {
        for (var c = 0; c < N; c++) {
          var x = x0 + c * cw, m = x + half;
          el('polyline', { points: x + ',' + lo + ' ' + m + ',' + lo + ' ' + m + ',' + hi + ' ' + (x + cw) + ',' + hi + ' ' + (x + cw) + ',' + lo, 'class': 't-sig' }, svg);
          if (c < (o.edges || 0)) el('circle', { cx: m, cy: yc, r: 4, 'class': 't-edge' }, svg);
        }
        return;
      }
      var v = row.values || [], prev = null, s;
      if (row.kind === 'bus') {
        /* merge equal neighbouring slots into one hexagon */
        s = 0;
        while (s < v.length) {
          if (v[s] === null || v[s] === undefined) { s++; continue; }
          var e = s; while (e + 1 < v.length && v[e + 1] === v[s]) e++;
          var xa = x0 + s * half, xb = x0 + (e + 1) * half;
          el('polygon', { points: [[xa + 4, hi], [xb - 4, hi], [xb, yc], [xb - 4, lo], [xa + 4, lo], [xa, yc]].map(function (p) { return p.join(','); }).join(' '), 'class': 't-bus' }, svg);
          text(svg, (xa + xb) / 2, yc + 4, String(v[s]), 't-lab');
          s = e + 1;
        }
        return;
      }
      for (s = 0; s < v.length; s++) {
        if (v[s] === null || v[s] === undefined) { prev = null; continue; }
        var xs = x0 + s * half, y = v[s] ? hi : lo;
        if (prev !== null && prev !== v[s]) el('line', { x1: xs, y1: prev ? hi : lo, x2: xs, y2: y, 'class': 't-sig' }, svg);
        el('line', { x1: xs, y1: y, x2: xs + half, y2: y, 'class': 't-sig' + (v[s] ? ' hi' : '') }, svg);
        prev = v[s];
      }
    });
  };

  /* ---------- page chrome ---------- */
  var embedded = false;
  try { embedded = window.self !== window.top; } catch (e) { embedded = true; }
  document.documentElement.classList.toggle('embedded', embedded);
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  try { var q = new URLSearchParams(location.search).get('theme'); if (q) applyTheme(q); } catch (e) {}
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'dd-theme') applyTheme(e.data.theme);
  });
  document.addEventListener('DOMContentLoaded', function () {
    /* inside the nav shell the shell provides navigation, so hide the per-page back link */
    if (embedded) { var b = document.querySelectorAll('.backlink'); for (var i = 0; i < b.length; i++) b[i].hidden = true; }
  });

  window.DD = {
    NS: NS, el: el, text: text, wire: wire, dot: dot, slash: slash, setHi: setHi, setVal: setVal,
    bin: bin, bitsOf: bitsOf, sleep: sleep, restart: restart,
    gate: gate, block: block, muxShape: muxShape, pin: pin, led: led,
    bitButton: bitButton, swButton: swButton, markRow: markRow, Timing: Timing,
    embedded: embedded
  };
})();
