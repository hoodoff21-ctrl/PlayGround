const TAU = Math.PI * 2;

function seeded(seed = 17) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function glow(ctx, x, y, radius, color, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color.replace("ALPHA", String(alpha)));
  gradient.addColorStop(0.38, color.replace("ALPHA", String(alpha * 0.4)));
  gradient.addColorStop(1, color.replace("ALPHA", "0"));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function drawStar(ctx, x, y, size, alpha) {
  ctx.fillStyle = `rgba(255, 239, 208, ${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, TAU);
  ctx.fill();
  if (size > 1.1) {
    ctx.strokeStyle = `rgba(255, 239, 208, ${alpha * 0.4})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - size * 3.4, y);
    ctx.lineTo(x + size * 3.4, y);
    ctx.moveTo(x, y - size * 3.4);
    ctx.lineTo(x, y + size * 3.4);
    ctx.stroke();
  }
}

function drawMoon(ctx, w, h, random, scale) {
  const x = w * 0.775;
  const y = h * 0.205;
  const r = Math.min(w, h) * 0.094 * scale;

  glow(ctx, x, y, r * 4.4, "rgba(255, 196, 128, ALPHA)", 0.11);
  glow(ctx, x, y, r * 2.1, "rgba(255, 222, 172, ALPHA)", 0.19);
  glow(ctx, x, y, r * 1.18, "rgba(255, 240, 203, ALPHA)", 0.22);

  const moon = ctx.createRadialGradient(x - r * 0.3, y - r * 0.36, r * 0.04, x, y, r * 1.02);
  moon.addColorStop(0, "#fffaf0");
  moon.addColorStop(0.42, "#f8e3ba");
  moon.addColorStop(0.78, "#e9c58d");
  moon.addColorStop(0.95, "#cfa16a");
  moon.addColorStop(1, "#b98754");
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.99, 0, TAU);
  ctx.clip();

  // Broad, nearly invisible maria give the disc depth without reading as bands.
  for (let i = 0; i < 4; i += 1) {
    const cx = x + (random() - 0.5) * r * 0.95;
    const cy = y + (random() - 0.5) * r * 0.95;
    const cr = r * (0.34 + random() * 0.3);
    const maria = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    maria.addColorStop(0, "rgba(150, 109, 70, 0.07)");
    maria.addColorStop(0.55, "rgba(150, 109, 70, 0.035)");
    maria.addColorStop(1, "rgba(150, 109, 70, 0)");
    ctx.fillStyle = maria;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.fill();
  }

  // Soft craters: a shaded bowl with a faint lit rim.
  for (let i = 0; i < 9; i += 1) {
    const angle = random() * TAU;
    const distance = Math.sqrt(random()) * r * 0.78;
    const cx = x + Math.cos(angle) * distance;
    const cy = y + Math.sin(angle) * distance;
    const cr = r * (0.035 + random() * 0.075);
    const bowl = ctx.createRadialGradient(
      cx - cr * 0.4, cy - cr * 0.4, cr * 0.05,
      cx, cy, cr
    );
    bowl.addColorStop(0, "rgba(132, 92, 58, 0.08)");
    bowl.addColorStop(0.65, "rgba(138, 97, 61, 0.055)");
    bowl.addColorStop(1, "rgba(255, 242, 209, 0)");
    ctx.fillStyle = bowl;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 246, 218, 0.09)";
    ctx.lineWidth = Math.max(0.6, cr * 0.1);
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 0.82, Math.PI * 1.04, Math.PI * 1.78);
    ctx.stroke();
  }

  const limb = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
  limb.addColorStop(0, "rgba(126, 82, 46, 0)");
  limb.addColorStop(1, "rgba(112, 69, 38, 0.2)");
  ctx.fillStyle = limb;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);

  const haze = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  haze.addColorStop(0, "rgba(255, 249, 228, 0.05)");
  haze.addColorStop(0.5, "rgba(255, 246, 222, 0)");
  haze.addColorStop(1, "rgba(120, 77, 44, 0.08)");
  ctx.fillStyle = haze;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 235, 195, 0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.6, 0, TAU);
  ctx.stroke();
}

function drawMountains(ctx, w, h, random) {
  const layers = [
    {
      y: h * 0.63,
      color: "#171523",
      edge: "rgba(205, 132, 91, 0.08)",
      amplitude: 0.15,
      step: 0.09
    },
    {
      y: h * 0.72,
      color: "#12121c",
      edge: "rgba(225, 154, 103, 0.06)",
      amplitude: 0.11,
      step: 0.13
    },
    {
      y: h * 0.81,
      color: "#0b0b13",
      edge: "rgba(225, 154, 103, 0.04)",
      amplitude: 0.07,
      step: 0.18
    }
  ];

  layers.forEach((layer, index) => {
    ctx.beginPath();
    ctx.moveTo(-10, h + 10);
    ctx.lineTo(-10, layer.y);
    let x = -10;
    let peak = false;
    while (x < w + 20) {
      const step = w * (layer.step * (0.55 + random() * 0.8));
      x += step;
      const y = layer.y - (peak ? h * layer.amplitude * (0.45 + random() * 0.8) : h * layer.amplitude * 0.07);
      ctx.lineTo(x, y);
      peak = !peak;
    }
    ctx.lineTo(w + 20, h + 10);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();

    ctx.strokeStyle = layer.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let sx = -10;
    let sy = layer.y;
    for (let i = 0; i < 11; i += 1) {
      sx += w / 10 * (0.75 + random() * 0.5);
      sy = layer.y - h * layer.amplitude * (0.16 + random() * 0.38);
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  });
}

function drawTorii(ctx, w, h, scale) {
  const x = w * 0.175;
  const baseY = h * 0.845;
  const height = h * 0.31 * scale;
  const topY = baseY - height;
  const half = w * 0.088 * scale;

  ctx.save();
  ctx.translate(x, 0);

  const body = ctx.createLinearGradient(-half, topY, half, baseY);
  body.addColorStop(0, "#100a10");
  body.addColorStop(0.46, "#2b1720");
  body.addColorStop(0.68, "#1a1018");
  body.addColorStop(1, "#08070b");
  ctx.fillStyle = body;

  ctx.beginPath();
  ctx.moveTo(-half * 0.62, topY + height * 0.08);
  ctx.lineTo(-half * 0.42, topY);
  ctx.lineTo(-half * 0.24, topY + height * 0.08);
  ctx.lineTo(-half * 0.24, baseY);
  ctx.lineTo(-half * 0.43, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(half * 0.62, topY + height * 0.08);
  ctx.lineTo(half * 0.42, topY);
  ctx.lineTo(half * 0.24, topY + height * 0.08);
  ctx.lineTo(half * 0.24, baseY);
  ctx.lineTo(half * 0.43, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(7, 6, 10, 0.55)";
  ctx.fillRect(-half * 0.62, baseY - height * 0.04, half * 0.38, height * 0.04);
  ctx.fillRect(half * 0.24, baseY - height * 0.04, half * 0.38, height * 0.04);

  ctx.strokeStyle = "rgba(218, 151, 102, 0.16)";
  ctx.lineWidth = Math.max(1, w * 0.0009);
  ctx.beginPath();
  ctx.moveTo(-half * 0.62, topY + height * 0.09);
  ctx.lineTo(-half * 0.27, topY + height * 0.09);
  ctx.moveTo(half * 0.27, topY + height * 0.09);
  ctx.lineTo(half * 0.62, topY + height * 0.09);
  ctx.stroke();

  ctx.fillStyle = "#21131a";
  ctx.beginPath();
  ctx.moveTo(-half * 1.28, topY + height * 0.08);
  ctx.quadraticCurveTo(-half * 0.78, topY - height * 0.045, 0, topY - height * 0.015);
  ctx.quadraticCurveTo(half * 0.78, topY - height * 0.045, half * 1.28, topY + height * 0.08);
  ctx.lineTo(half * 1.19, topY + height * 0.13);
  ctx.quadraticCurveTo(half * 0.6, topY + height * 0.025, 0, topY + height * 0.04);
  ctx.quadraticCurveTo(-half * 0.6, topY + height * 0.025, -half * 1.19, topY + height * 0.13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1d1118";
  ctx.beginPath();
  ctx.moveTo(-half * 1.07, topY + height * 0.19);
  ctx.lineTo(half * 1.07, topY + height * 0.19);
  ctx.lineTo(half * 1.0, topY + height * 0.24);
  ctx.lineTo(-half * 1.0, topY + height * 0.24);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(242, 178, 116, 0.22)";
  ctx.lineWidth = Math.max(1, w * 0.0012);
  ctx.beginPath();
  ctx.moveTo(-half * 1.2, topY + height * 0.083);
  ctx.quadraticCurveTo(0, topY - height * 0.012, half * 1.2, topY + height * 0.083);
  ctx.stroke();

  ctx.fillStyle = "#1d1118";
  ctx.fillRect(-half * 0.085, topY + height * 0.24, half * 0.17, height * 0.11);
  ctx.fillRect(-half * 0.7, topY + height * 0.48, half * 1.4, height * 0.028);

  ctx.fillStyle = "rgba(8, 6, 9, 0.55)";
  ctx.beginPath();
  ctx.ellipse(-half * 0.34, baseY - height * 0.014, half * 0.34, height * 0.045, 0, 0, TAU);
  ctx.ellipse(half * 0.34, baseY - height * 0.014, half * 0.34, height * 0.045, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#24141a";
  ctx.fillRect(-half * 0.115, topY + height * 0.24, half * 0.23, height * 0.1);
  ctx.strokeStyle = "rgba(233, 183, 99, 0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-half * 0.115, topY + height * 0.24, half * 0.23, height * 0.1);
  ctx.fillStyle = "rgba(233, 183, 99, 0.32)";
  ctx.font = `600 ${Math.max(9, height * 0.019)}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("龍", 0, topY + height * 0.292);

  const lanternY = topY + height * 0.4;
  ctx.strokeStyle = "rgba(30, 20, 17, 0.75)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, topY + height * 0.33);
  ctx.lineTo(0, lanternY - height * 0.055);
  ctx.stroke();
  glow(ctx, 0, lanternY, height * 0.13, "rgba(255, 166, 88, ALPHA)", 0.2);
  const lantern = ctx.createRadialGradient(
    -height * 0.008, lanternY - height * 0.012,
    0,
    0, lanternY,
    height * 0.032
  );
  lantern.addColorStop(0, "#ffd6a0");
  lantern.addColorStop(0.55, "#dc8850");
  lantern.addColorStop(1, "#6e2f2b");
  ctx.fillStyle = lantern;
  ctx.beginPath();
  ctx.ellipse(0, lanternY, height * 0.024, height * 0.032, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(45, 20, 16, 0.6)";
  ctx.fillRect(-height * 0.014, lanternY - height * 0.037, height * 0.028, height * 0.006);
  ctx.fillRect(-height * 0.014, lanternY + height * 0.031, height * 0.028, height * 0.006);

  glow(ctx, 0, topY + height * 0.39, height * 0.18, "rgba(255, 153, 74, ALPHA)", 0.055);

  ctx.restore();
}

function drawBamboo(ctx, w, h, random) {
  const clusters = [
    { x: w * 0.045, scale: 1.1, alpha: 0.7 },
    { x: w * 0.075, scale: 0.82, alpha: 0.42 },
    { x: w * 0.965, scale: 1.0, alpha: 0.5 }
  ];
  clusters.forEach((cluster) => {
    const stalks = 5;
    for (let i = 0; i < stalks; i += 1) {
      const x = cluster.x + (random() - 0.5) * w * 0.055 * cluster.scale;
      const top = h * (0.65 - random() * 0.32) - (cluster.x > w * 0.9 ? h * 0.08 : 0);
      const bottom = h * 0.92;
      const width = (2.2 + random() * 2.1) * cluster.scale;
      ctx.strokeStyle = `rgba(31, 39, 30, ${cluster.alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.quadraticCurveTo(x + (random() - 0.5) * 8, (top + bottom) / 2, x + (random() - 0.5) * 20, top);
      ctx.stroke();

      for (let leaf = 0; leaf < 4; leaf += 1) {
        const ly = top + random() * (bottom - top) * 0.48;
        const dir = random() > 0.5 ? 1 : -1;
        ctx.fillStyle = `rgba(25, 35, 26, ${cluster.alpha * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(
          x + dir * (8 + random() * 24),
          ly,
          16 + random() * 19,
          2.3 + random() * 2,
          dir * (0.24 + random() * 0.4),
          0,
          TAU
        );
        ctx.fill();
      }
    }
  });
}

function drawPavilion(ctx, w, h) {
  const x = w * 0.86;
  const y = h * 0.77;
  const s = Math.min(w, h) * 0.001;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#090910";
  ctx.fillRect(-70 * s, 5 * s, 140 * s, 100 * s);
  for (let i = 0; i < 4; i += 1) {
    const yy = i * 18 * s;
    ctx.fillStyle = "#0b0b13";
    ctx.beginPath();
    ctx.moveTo(-90 * s, yy);
    ctx.quadraticCurveTo(0, yy - 19 * s, 90 * s, yy);
    ctx.lineTo(72 * s, yy + 6 * s);
    ctx.quadraticCurveTo(0, yy - 8 * s, -72 * s, yy + 6 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(220, 149, 94, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-90 * s, 0);
  ctx.quadraticCurveTo(0, -16 * s, 90 * s, 0);
  ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    const wx = (-48 + i * 48) * s;
    const wy = 26 * s;
    const windowGlow = ctx.createRadialGradient(wx, wy, 0, wx, wy, 34 * s);
    windowGlow.addColorStop(0, "rgba(255, 175, 91, 0.38)");
    windowGlow.addColorStop(0.5, "rgba(240, 137, 74, 0.12)");
    windowGlow.addColorStop(1, "rgba(255, 165, 83, 0)");
    ctx.fillStyle = windowGlow;
    ctx.fillRect(wx - 32 * s, wy - 32 * s, 64 * s, 64 * s);
    ctx.fillStyle = "rgba(255, 201, 132, 0.54)";
    ctx.fillRect(wx - 5 * s, wy - 8 * s, 10 * s, 13 * s);
    ctx.fillStyle = "rgba(255, 229, 181, 0.5)";
    ctx.fillRect(wx - 4 * s, wy - 7 * s, 4 * s, 6 * s);
  }
  ctx.restore();
}

function drawEnso(ctx, w, h, random) {
  const cx = w * 0.5;
  const cy = h * 0.45;
  const radius = Math.min(w, h) * 0.285;
  const start = -2.42;
  const sweep = 4.72;

  ctx.save();
  ctx.lineCap = "round";
  const steps = 86;
  for (let i = 0; i < steps; i += 1) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const a0 = start + sweep * t0;
    const a1 = start + sweep * t1;
    const brush = 0.35 + Math.sin(t0 * Math.PI) * 0.65;
    const alpha = (0.005 + brush * 0.013) * (i > steps * 0.88 ? 0.2 : 1);
    ctx.strokeStyle = `rgba(230, 184, 124, ${alpha})`;
    ctx.lineWidth = Math.max(1, radius * 0.055 * brush * (0.7 + random() * 0.5));
    ctx.beginPath();
    ctx.arc(cx, cy, radius + Math.sin(t0 * 5.1) * radius * 0.012, a0, a1 + 0.012);
    ctx.stroke();
  }

  // Faint ink ghosts around the main stroke.
  for (let i = 0; i < 9; i += 1) {
    const angle = start + random() * sweep;
    const rr = radius + (random() - 0.5) * radius * 0.06;
    ctx.strokeStyle = `rgba(215, 160, 108, ${0.008 + random() * 0.012})`;
    ctx.lineWidth = Math.max(0.8, radius * (0.004 + random() * 0.01));
    ctx.beginPath();
    ctx.arc(cx, cy, rr, angle, angle + 0.22 + random() * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMist(ctx, w, h, random) {
  ctx.save();
  for (let i = 0; i < 9; i += 1) {
    const x = random() * w;
    const y = h * (0.65 + random() * 0.2);
    const rx = w * (0.09 + random() * 0.19);
    const ry = h * (0.012 + random() * 0.028);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const mist = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    mist.addColorStop(0, `rgba(216, 146, 108, ${0.028 + random() * 0.028})`);
    mist.addColorStop(0.48, `rgba(172, 111, 104, ${0.014 + random() * 0.012})`);
    mist.addColorStop(1, "rgba(130, 77, 88, 0)");
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBranch(ctx, w, h, random) {
  ctx.save();
  ctx.strokeStyle = "rgba(18, 14, 22, 0.88)";
  ctx.lineCap = "round";
  const startX = -w * 0.015;
  const startY = h * 0.08;
  ctx.lineWidth = w * 0.007;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(w * 0.1, h * 0.075, w * 0.16, h * 0.18, w * 0.29, h * 0.15);
  ctx.stroke();

  ctx.lineWidth = w * 0.0035;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.105);
  ctx.bezierCurveTo(w * 0.17, h * 0.05, w * 0.24, h * 0.055, w * 0.28, h * 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.135);
  ctx.quadraticCurveTo(w * 0.18, h * 0.21, w * 0.23, h * 0.25);
  ctx.stroke();

  const blossoms = [
    [0.055, 0.095], [0.078, 0.12], [0.105, 0.087], [0.13, 0.125], [0.165, 0.083],
    [0.17, 0.155], [0.205, 0.12], [0.23, 0.09], [0.248, 0.155], [0.265, 0.05],
    [0.205, 0.205], [0.225, 0.235], [0.29, 0.14]
  ];
  blossoms.forEach(([px, py], index) => {
    const x = w * px + (random() - 0.5) * 10;
    const y = h * py + (random() - 0.5) * 10;
    const r = 3.2 + random() * 4.4;
    const alpha = 0.22 + random() * 0.3;
    ctx.fillStyle = `rgba(243, 173, 181, ${alpha})`;
    for (let p = 0; p < 5; p += 1) {
      const angle = (p / 5) * TAU + index * 0.31;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(angle) * r * 0.7, y + Math.sin(angle) * r * 0.7, r * 0.62, r * 0.38, angle, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(247, 213, 155, ${alpha * 1.25})`;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.2, 0, TAU);
    ctx.fill();
  });
  ctx.restore();
}

function drawLanterns(ctx, w, h) {
  const lanterns = [
    { x: w * 0.325, y: h * 0.18, r: 10, glow: 44 },
    { x: w * 0.36, y: h * 0.33, r: 7, glow: 33 },
    { x: w * 0.685, y: h * 0.12, r: 7, glow: 31 }
  ];

  ctx.save();
  ctx.strokeStyle = "rgba(24, 17, 21, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.31, 0);
  ctx.quadraticCurveTo(w * 0.31, h * 0.12, w * 0.325, h * 0.165);
  ctx.moveTo(w * 0.348, 0);
  ctx.quadraticCurveTo(w * 0.35, h * 0.22, w * 0.36, h * 0.315);
  ctx.moveTo(w * 0.68, 0);
  ctx.quadraticCurveTo(w * 0.68, h * 0.08, w * 0.685, h * 0.105);
  ctx.stroke();

  lanterns.forEach((lantern) => {
    glow(ctx, lantern.x, lantern.y, lantern.glow, "rgba(255, 151, 80, ALPHA)", 0.2);
    const body = ctx.createRadialGradient(
      lantern.x - lantern.r * 0.3,
      lantern.y - lantern.r * 0.35,
      0,
      lantern.x,
      lantern.y,
      lantern.r
    );
    body.addColorStop(0, "#ffd49e");
    body.addColorStop(0.45, "#f39a5c");
    body.addColorStop(0.8, "#ac4931");
    body.addColorStop(1, "#6e2826");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(lantern.x, lantern.y, lantern.r * 0.9, lantern.r, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 225, 174, 0.25)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lantern.x - lantern.r * 0.62, lantern.y - lantern.r * 0.62);
    ctx.quadraticCurveTo(lantern.x, lantern.y + lantern.r * 0.3, lantern.x + lantern.r * 0.62, lantern.y - lantern.r * 0.62);
    ctx.stroke();
    ctx.fillStyle = "rgba(50, 22, 19, 0.55)";
    ctx.fillRect(lantern.x - lantern.r * 0.36, lantern.y - lantern.r * 1.09, lantern.r * 0.72, lantern.r * 0.18);
    ctx.fillRect(lantern.x - lantern.r * 0.36, lantern.y + lantern.r * 0.91, lantern.r * 0.72, lantern.r * 0.18);
  });
  ctx.restore();
}

function drawGround(ctx, w, h, random) {
  const ground = ctx.createLinearGradient(0, h * 0.79, 0, h);
  ground.addColorStop(0, "rgba(9, 9, 16, 0)");
  ground.addColorStop(0.32, "rgba(10, 9, 15, 0.34)");
  ground.addColorStop(1, "rgba(5, 5, 9, 0.92)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.76, w, h * 0.24);

  const haze = ctx.createLinearGradient(0, h * 0.74, 0, h * 0.9);
  haze.addColorStop(0, "rgba(222, 131, 83, 0)");
  haze.addColorStop(0.55, "rgba(186, 101, 71, 0.055)");
  haze.addColorStop(1, "rgba(222, 131, 83, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.72, w, h * 0.2);

  for (let i = 0; i < 28; i += 1) {
    const x = random() * w;
    const y = h * (0.83 + random() * 0.16);
    const width = 20 + random() * 90;
    ctx.strokeStyle = `rgba(187, 133, 93, ${0.018 + random() * 0.04})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + 0.5);
    ctx.stroke();
  }

  ctx.lineWidth = 1;
  for (let i = 0; i < 36; i += 1) {
    const x = random() * w;
    const hh = 8 + random() * 45;
    ctx.strokeStyle = "rgba(7, 8, 11, 0.9)";
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + (random() - 0.5) * 14, h - hh * 0.5, x + (random() - 0.5) * 30, h - hh);
    ctx.stroke();
  }
}

function drawDust(ctx, w, h, random) {
  for (let i = 0; i < 90; i += 1) {
    const x = random() * w;
    const y = random() * h;
    const r = 0.4 + random() * 1.5;
    const alpha = 0.025 + random() * 0.07;
    ctx.fillStyle = `rgba(255, 223, 172, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
}

export function makeBackground(width, height, dpr = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const random = seeded(Math.round(width * 7 + height * 13));
  const w = width;
  const h = height;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#06070e");
  sky.addColorStop(0.3, "#0c0c18");
  sky.addColorStop(0.58, "#1a1220");
  sky.addColorStop(0.79, "#2a1822");
  sky.addColorStop(1, "#0b0911");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const upperGlow = ctx.createRadialGradient(w * 0.72, h * 0.11, 0, w * 0.72, h * 0.11, w * 0.6);
  upperGlow.addColorStop(0, "rgba(126, 73, 70, 0.16)");
  upperGlow.addColorStop(0.5, "rgba(59, 36, 49, 0.06)");
  upperGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = upperGlow;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 145; i += 1) {
    const x = random() * w;
    const y = random() * h * 0.65;
    const big = random() > 0.955;
    drawStar(ctx, x, y, big ? 1.6 + random() * 1.2 : 0.25 + random() * 0.9, 0.1 + random() * (big ? 0.52 : 0.3));
  }

  drawMoon(ctx, w, h, random, 1);
  drawMountains(ctx, w, h, random);
  drawEnso(ctx, w, h, random);
  drawMist(ctx, w, h, random);
  drawPavilion(ctx, w, h);
  drawTorii(ctx, w, h, 1);
  drawBamboo(ctx, w, h, random);
  drawBranch(ctx, w, h, random);
  drawLanterns(ctx, w, h);
  drawGround(ctx, w, h, random);

  const shrineGlow = ctx.createRadialGradient(w * 0.2, h * 0.73, 0, w * 0.2, h * 0.73, w * 0.34);
  shrineGlow.addColorStop(0, "rgba(214, 125, 70, 0.085)");
  shrineGlow.addColorStop(0.45, "rgba(173, 83, 59, 0.035)");
  shrineGlow.addColorStop(1, "rgba(120, 48, 44, 0)");
  ctx.fillStyle = shrineGlow;
  ctx.fillRect(0, h * 0.4, w * 0.7, h * 0.6);

  const pathGlow = ctx.createLinearGradient(w * 0.2, h * 0.8, w * 0.5, h);
  pathGlow.addColorStop(0, "rgba(221, 144, 89, 0)");
  pathGlow.addColorStop(0.5, "rgba(221, 144, 89, 0.05)");
  pathGlow.addColorStop(1, "rgba(221, 144, 89, 0)");
  ctx.fillStyle = pathGlow;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.81);
  ctx.lineTo(w * 0.3, h * 0.81);
  ctx.lineTo(w * 0.58, h);
  ctx.lineTo(w * 0.19, h);
  ctx.closePath();
  ctx.fill();

  drawDust(ctx, w, h, random);

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * 0.12, w * 0.5, h * 0.46, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(2, 2, 5, 0)");
  vignette.addColorStop(0.62, "rgba(2, 2, 5, 0.1)");
  vignette.addColorStop(1, "rgba(2, 2, 5, 0.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}
