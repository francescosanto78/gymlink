import React, { useEffect, useRef } from 'react';

/**
 * Riproduzione fedele del motore Canvas "spacesky" di FMDB (stanleygurvich.github.io/FMDB_FM1_FirmwareDatabase):
 * - Nebulose soffuse in lento movimento (smeraldo, viola felucca, rosa melodee, azzurro smk37)
 * - 420 particelle di polvere stellare in deriva continua (1.6 px/s)
 * - Up to 260 stelle con parallasse in base alla profondità z (2.5..9.5 px/s) + bagliore a 4 punte sulle più luminose
 * - Stella cadente (shooting star) con scia luminosa ogni 8.5s nella fascia alta
 * - 4 satelliti con alone che attraversano il cielo su traiettorie diagonali
 * - Vignettatura radiale morbida ai bordi, 30 fps stabili
 */
export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) return;

    const TAU = Math.PI * 2;
    const STARS = [];
    const DUST = [];
    const SATS = [];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    // Generatore pseudo-random identico a FMDB (Lehmer LCG seed = 7)
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    for (let i = 0; i < 260; i++) {
      const tint = rnd() < 0.18;
      const z = rnd();
      STARS.push({
        tint,
        z,
        x: rnd(),
        y: rnd(),
        r: (1.2 + z * z * 2.4) / 2,
        dur: 8 + rnd() * 9,
        del: rnd() * 17,
        o: 0.5 + z * 0.5,
      });
    }

    for (let i = 0; i < 420; i++) {
      DUST.push({
        x: rnd(),
        y: rnd(),
        r: 0.3 + rnd() * 0.35,
        o: 0.12 + rnd() * 0.3,
      });
    }

    [
      [-5, 18, 105, 34, 70],
      [105, 62, -5, 40, 95],
      [30, -5, 58, 105, 110],
      [-5, 80, 105, 66, 85],
    ].forEach(([x0, y0, x1, y1, sec], k) =>
      SATS.push({
        x0: x0 / 100,
        y0: y0 / 100,
        x1: x1 / 100,
        y1: y1 / 100,
        sec,
        del: sec * (0.15 + k * 0.23),
      })
    );

    // Coordinate e intensità delle 5 nebulose di FMDB
    const NEB = [
      [0.2, 0.28, 0.62, 0, 0.15],
      [0.8, 0.64, 0.66, 1, 0.075],
      [0.58, 0.14, 0.48, 2, 0.06],
      [0.38, 0.9, 0.58, 0, 0.1],
      [0.92, 0.2, 0.4, 3, 0.06],
    ];

    // Palette SPACE_FW di FMDB
    const C = {
      bg: [7, 16, 13],
      fg: [230, 242, 236],
      accent: [62, 230, 160],
      star: [208, 219, 214],
      light: false,
      neb: [
        [62, 230, 160],   // emerald
        [165, 143, 216],  // felucca violet
        [236, 127, 163],  // melodee rose
        [111, 182, 242],  // smk37 blue
      ],
    };

    const eo = (x) => 1 - Math.pow(1 - x, 3);
    const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    const t0 = performance.now();

    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.round(W * d);
      cv.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
      if (reduce?.matches) draw(17);
    }

    function draw(amb) {
      const M = Math.max(W, H);
      const n = Math.round(Math.min(260, Math.max(70, (W * H) / 6000)));
      const quiet = C.light ? 0.6 : 1;

      g.clearRect(0, 0, W, H);

      // Bagliore radiale principale ("a breath of light")
      const gr = g.createRadialGradient(W * 0.68, H * 0.32, 0, W * 0.68, H * 0.32, M * 0.55);
      gr.addColorStop(0, rgba(C.accent, C.light ? 0.1 : 0.085));
      gr.addColorStop(1, rgba(C.accent, 0));
      g.globalAlpha = 1;
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);

      // Nebulose in rotazione e deriva lenta
      NEB.forEach(([x, y, r, ci, a], i) => {
        const col = C.neb[ci] || C.accent;
        const cx = (x + 0.035 * Math.sin(amb * 0.021 + i * 1.7)) * W;
        const cy = (y + 0.025 * Math.cos(amb * 0.017 + i)) * H;
        const R0 = r * M;
        g.save();
        g.translate(cx, cy);
        g.rotate(0.35 * Math.sin(i * 2.1) + amb * 0.002);
        g.scale(1, 0.5);
        const ng = g.createRadialGradient(0, 0, 0, 0, 0, R0);
        ng.addColorStop(0, rgba(col, a));
        ng.addColorStop(0.5, rgba(col, a * 0.4));
        ng.addColorStop(1, rgba(col, 0));
        g.fillStyle = ng;
        g.globalAlpha = quiet;
        g.fillRect(-R0, -R0, R0 * 2, R0 * 2);
        g.restore();
      });

      // Polvere stellare fine in scorrimento continuo
      g.fillStyle = rgba(C.star, 1);
      for (let i = 0; i < Math.round(n * 1.6); i++) {
        const d = DUST[i % DUST.length];
        const x = (((d.x * W - amb * 1.6) % W) + W) % W;
        const y = d.y * H;
        g.globalAlpha = d.o * quiet * (C.light ? 0.7 : 1);
        g.fillRect(x, y, d.r * 2, d.r * 2);
      }

      // Stelle con movimento parallasse (più vicine = più veloci) + scintillio + croce a 4 punte
      for (let i = 0; i < n; i++) {
        const st = STARS[i];
        const p = (amb + st.del) / st.dur;
        const k = Math.floor(p);
        let f = p - k;
        if (k & 1) f = 1 - f;
        const v = f < 0.35 ? 0 : eio((f - 0.35) / 0.65);
        const o = st.o * (0.2 + 0.8 * v) * (C.light ? 0.8 : 1);
        const r = st.r * (0.8 + 0.3 * v);
        const sy = st.y * H;
        const sx = (((st.x * W - amb * (2.5 + 7 * st.z)) % W) + W) % W;
        const col = st.tint ? C.accent : C.star;

        g.fillStyle = rgba(col, 1);
        g.globalAlpha = o;
        g.beginPath();
        g.arc(sx, sy, r, 0, TAU);
        g.fill();

        if (v > 0.6) {
          g.globalAlpha = (o * 0.2 * (v - 0.6)) / 0.4;
          g.beginPath();
          g.arc(sx, sy, r * 2.6, 0, TAU);
          g.fill();
        }

        // Le più vicine e luminose: glint a 4 punte
        if (st.z > 0.9 && v > 0.3) {
          const gl = r * (7 + 7 * v);
          g.lineWidth = 0.8;
          g.globalAlpha = (o * 0.55 * (v - 0.3)) / 0.7;
          for (const [ax, ay] of [
            [1, 0],
            [0, 1],
          ]) {
            const lg = g.createLinearGradient(sx - ax * gl, sy - ay * gl, sx + ax * gl, sy + ay * gl);
            lg.addColorStop(0, rgba(col, 0));
            lg.addColorStop(0.5, rgba(col, 1));
            lg.addColorStop(1, rgba(col, 0));
            g.strokeStyle = lg;
            g.beginPath();
            g.moveTo(sx - ax * gl, sy - ay * gl);
            g.lineTo(sx + ax * gl, sy + ay * gl);
            g.stroke();
          }
        }
      }

      // Stella cadente periodica nella parte alta dello schermo
      {
        const PER = 8.5;
        const k = Math.floor(amb / PER);
        const f = (amb - k * PER) / 1.1;
        if (f > 0 && f < 1 && !reduce?.matches) {
          let sd = ((k * 7919) % 2147483646) + 1;
          const r2 = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
          const x0 = W * (0.25 + 0.7 * r2());
          const y0 = H * (0.04 + 0.3 * r2());
          const an = Math.PI * (0.78 + 0.1 * r2());
          const len = M * (0.16 + 0.1 * r2());
          const e = eo(f);
          const hx = x0 + Math.cos(an) * len * e;
          const hy = y0 + Math.sin(an) * len * e;
          const tl = len * 0.45 * (1 - 0.5 * f);
          const sg = g.createLinearGradient(hx, hy, hx - Math.cos(an) * tl, hy - Math.sin(an) * tl);
          sg.addColorStop(0, rgba(C.star, 0.85));
          sg.addColorStop(1, rgba(C.star, 0));
          g.strokeStyle = sg;
          g.lineWidth = 1.4;
          g.lineCap = 'round';
          g.globalAlpha = Math.sin(Math.PI * f) * quiet;
          g.beginPath();
          g.moveTo(hx, hy);
          g.lineTo(hx - Math.cos(an) * tl, hy - Math.sin(an) * tl);
          g.stroke();
        }
      }

      // Satelliti in transito lineare
      g.fillStyle = rgba(C.star, 1);
      for (const st of SATS) {
        const f = ((amb + st.del) / st.sec) % 1;
        const x = (st.x0 + (st.x1 - st.x0) * f) * W;
        const y = (st.y0 + (st.y1 - st.y0) * f) * H;
        g.globalAlpha = 0.75;
        g.beginPath();
        g.arc(x, y, 1.1, 0, TAU);
        g.fill();
        g.globalAlpha = 0.12;
        g.beginPath();
        g.arc(x, y, 3.2, 0, TAU);
        g.fill();
      }

      // Vignettatura morbida ai bordi
      const vg = g.createRadialGradient(W / 2, H * 0.46, M * 0.32, W / 2, H * 0.46, M * 0.82);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.42)');
      g.globalAlpha = 1;
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 33) return;
      last = now;
      draw((now - t0) / 1000);
    }

    size();
    window.addEventListener('resize', size);
    if (reduce?.matches) {
      draw(17);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener('resize', size);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="gl-starfield-canvas fixed inset-0 w-screen h-screen z-0 pointer-events-none transition-opacity duration-500"
      aria-hidden="true"
    />
  );
}
