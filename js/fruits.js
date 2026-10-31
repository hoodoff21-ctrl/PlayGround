const TAU = Math.PI * 2;

export const FRUIT_TYPES = {
  watermelon: {
    shape: "round",
    radius: 1.12,
    skin: ["#65b86f", "#2f7e48", "#123b27"],
    flesh: ["#ffd1c9", "#ff6f7d", "#d52f48"],
    rind: "#d5efa9",
    pip: "#321523",
    leaf: "#74b85c",
    juice: ["#ff536b", "#ff9a92", "#ffd0c5", "#7fca70"],
    accent: "#ff7785",
    points: 12
  },
  orange: {
    shape: "round",
    radius: 0.97,
    skin: ["#ffd06e", "#f6932f", "#a84f15"],
    flesh: ["#fff3c5", "#ffc56a", "#e8862f"],
    rind: "#ffe8a0",
    pip: "#d27b28",
    leaf: "#5fa856",
    juice: ["#ffb43d", "#ffd66e", "#ff8a2f"],
    accent: "#ffae3e",
    points: 10
  },
  apple: {
    shape: "apple",
    radius: 0.96,
    skin: ["#ff8d7b", "#cf3549", "#711b30"],
    flesh: ["#fff6d9", "#f4e6b4", "#dec98d"],
    rind: "#ffdfaa",
    pip: "#4d2b1c",
    leaf: "#6aad58",
    juice: ["#ff6579", "#ff9c8f", "#ffe8c7"],
    accent: "#ff7b67",
    points: 10
  },
  kiwi: {
    shape: "kiwi",
    radius: 0.91,
    skin: ["#b68c66", "#806044", "#493321"],
    flesh: ["#f2f8c8", "#9fd35f", "#4d8b37"],
    rind: "#d8e9b0",
    pip: "#252019",
    leaf: "#699a4b",
    juice: ["#9cd45e", "#cce887", "#f0f6c7"],
    accent: "#a6da67",
    points: 10
  },
  lemon: {
    shape: "lemon",
    radius: 0.92,
    skin: ["#fff191", "#f4ce42", "#b7831d"],
    flesh: ["#fffde0", "#ffe98a", "#e5be4a"],
    rind: "#fff6b8",
    pip: "#d9b84b",
    leaf: "#5e9e4f",
    juice: ["#ffe152", "#fff08d", "#f2c93a"],
    accent: "#f8d951",
    points: 10
  },
  plum: {
    shape: "round",
    radius: 0.88,
    skin: ["#b983ce", "#6d397f", "#331d4a"],
    flesh: ["#ffd9a1", "#eaa45e", "#b96a38"],
    rind: "#d9a06b",
    pip: "#6e432a",
    leaf: "#6b9d55",
    juice: ["#b078cf", "#e1a7e9", "#ffce8b"],
    accent: "#bb83d6",
    points: 11
  },
  dragonfruit: {
    shape: "dragon",
    radius: 1.02,
    skin: ["#ff8fb7", "#d83272", "#841b4d"],
    flesh: ["#fffaf4", "#f7e7e9", "#d9c3c9"],
    rind: "#ff9cc0",
    pip: "#251a22",
    leaf: "#8ecb67",
    juice: ["#ff4f8f", "#ff8fb6", "#fff4ee", "#9cda69"],
    accent: "#ff5f9b",
    points: 14
  },
  pomegranate: {
    shape: "pomegranate",
    radius: 0.96,
    skin: ["#f06a55", "#a91f37", "#541124"],
    flesh: ["#ffc8b4", "#e94758", "#9c1534"],
    rind: "#ffa58d",
    pip: "#ffdf68",
    leaf: "#6b9f54",
    juice: ["#d62d47", "#ff5960", "#ffb3a0"],
    accent: "#ed4254",
    points: 12
  }
};

export const FRUIT_KEYS = Object.keys(FRUIT_TYPES);

export function randomFrom(list, random = Math.random) {
  return list[Math.floor(random() * list.length)];
}

export function makeFruit(type, x, y, radius, vx, vy, seed = Math.random() * 1e9) {
  return {
    type,
    x,
    y,
    vx,
    vy,
    radius: radius * FRUIT_TYPES[type].radius,
    rot: (seed % 1000) / 1000 * TAU,
    rotSpeed: ((seed % 17) / 17 - 0.5) * 2.4,
    seed: Math.floor(seed),
    age: 0
  };
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
}

function bodyPath(ctx, r, shape) {
  ctx.beginPath();
  if (shape === "apple") {
    ctx.moveTo(0, -r * 0.73);
    ctx.bezierCurveTo(-r * 0.22, -r * 0.96, -r * 0.58, -r * 0.88, -r * 0.7, -r * 0.52);
    ctx.bezierCurveTo(-r * 1.06, r * 0.12, -r * 0.8, r * 0.98, 0, r);
    ctx.bezierCurveTo(r * 0.8, r * 0.98, r * 1.06, r * 0.12, r * 0.7, -r * 0.52);
    ctx.bezierCurveTo(r * 0.58, -r * 0.88, r * 0.22, -r * 0.96, 0, -r * 0.73);
  } else if (shape === "kiwi") {
    ctx.ellipse(0, 0, r * 0.86, r, 0, 0, TAU);
  } else if (shape === "lemon") {
    ctx.moveTo(-r * 1.06, 0);
    ctx.bezierCurveTo(-r * 0.74, -r * 0.8, r * 0.72, -r * 0.8, r * 1.06, 0);
    ctx.bezierCurveTo(r * 0.72, r * 0.8, -r * 0.74, r * 0.8, -r * 1.06, 0);
  } else if (shape === "dragon") {
    ctx.ellipse(0, 0, r * 0.93, r * 1.02, 0, 0, TAU);
  } else if (shape === "pomegranate") {
    ctx.ellipse(0, r * 0.03, r * 0.95, r * 0.98, 0, 0, TAU);
  } else {
    ctx.ellipse(0, 0, r, r * 0.98, 0, 0, TAU);
  }
  ctx.closePath();
}

function skinGradient(ctx, r, type) {
  const [light, mid, dark] = type.skin;
  const gradient = ctx.createRadialGradient(-r * 0.36, -r * 0.48, r * 0.06, 0, r * 0.08, r * 1.17);
  gradient.addColorStop(0, light);
  gradient.addColorStop(0.46, mid);
  gradient.addColorStop(1, dark);
  return gradient;
}

function drawLeaf(ctx, r, angle, color, offsetY = -r * 0.82) {
  ctx.save();
  ctx.translate(0, offsetY);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(r * 0.06, -r * 0.2, r * 0.42, -r * 0.34, r * 0.62, -r * 0.2);
  ctx.bezierCurveTo(r * 0.48, r * 0.04, r * 0.15, r * 0.1, 0, 0);
  ctx.fill();
  ctx.strokeStyle = "rgba(18, 47, 20, 0.38)";
  ctx.lineWidth = Math.max(1, r * 0.022);
  ctx.beginPath();
  ctx.moveTo(r * 0.06, -r * 0.01);
  ctx.quadraticCurveTo(r * 0.34, -r * 0.18, r * 0.56, -r * 0.2);
  ctx.stroke();
  ctx.restore();
}

function drawStem(ctx, r, bend = 0.16) {
  ctx.strokeStyle = "#57391f";
  ctx.lineWidth = Math.max(2, r * 0.085);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.78);
  ctx.quadraticCurveTo(r * bend, -r * 1.03, r * (bend + 0.1), -r * 1.12);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 220, 165, 0.22)";
  ctx.lineWidth = Math.max(0.8, r * 0.02);
  ctx.beginPath();
  ctx.moveTo(-r * 0.02, -r * 0.79);
  ctx.quadraticCurveTo(r * (bend - 0.03), -r * 1.01, r * (bend + 0.06), -r * 1.1);
  ctx.stroke();
}

function drawRim(ctx, r, shape, color = "rgba(255, 242, 208, 0.17)") {
  ctx.save();
  bodyPath(ctx, r * 0.985, shape);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.026);
  ctx.stroke();
  ctx.restore();
}

function drawGloss(ctx, r, shape, strength = 0.19) {
  ctx.save();
  bodyPath(ctx, r, shape);
  ctx.clip();
  const gloss = ctx.createLinearGradient(-r * 0.7, -r * 0.9, r * 0.18, r * 0.55);
  gloss.addColorStop(0, `rgba(255, 249, 228, ${strength})`);
  gloss.addColorStop(0.4, "rgba(255, 249, 228, 0.035)");
  gloss.addColorStop(1, "rgba(255, 249, 228, 0)");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.38, r * 0.62, r * 0.36, -0.46, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBounceLight(ctx, r, shape) {
  ctx.save();
  bodyPath(ctx, r, shape);
  ctx.clip();
  const bounce = ctx.createRadialGradient(r * 0.34, r * 0.72, 0, r * 0.2, r * 0.55, r * 0.9);
  bounce.addColorStop(0, "rgba(255, 177, 107, 0.17)");
  bounce.addColorStop(0.5, "rgba(255, 153, 97, 0.06)");
  bounce.addColorStop(1, "rgba(255, 153, 97, 0)");
  ctx.fillStyle = bounce;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

function drawDragonScales(ctx, r, seed) {
  const random = seeded(seed + 81);
  for (let i = 0; i < 9; i += 1) {
    const angle = -Math.PI * 0.92 + i * 0.28 + (random() - 0.5) * 0.12;
    const cx = Math.cos(angle) * r * 0.75;
    const cy = Math.sin(angle) * r * 0.84;
    const length = r * (0.33 + random() * 0.22);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI * 0.5);
    ctx.fillStyle = i % 2 ? "#8bcf69" : "#6bab51";
    ctx.beginPath();
    ctx.moveTo(-r * 0.16, r * 0.08);
    ctx.quadraticCurveTo(-r * 0.02, -length * 0.8, 0, -length);
    ctx.quadraticCurveTo(r * 0.11, -length * 0.52, r * 0.16, r * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawSkinDetails(ctx, type, r, seed, shape) {
  const random = seeded(seed + 7);
  ctx.save();
  bodyPath(ctx, r, shape);
  ctx.clip();

  if (type === FRUIT_TYPES.watermelon) {
    for (let i = -3; i <= 3; i += 1) {
      const x = i * r * 0.245;
      ctx.strokeStyle = i % 2 === 0 ? "rgba(9, 48, 28, 0.63)" : "rgba(9, 48, 28, 0.42)";
      ctx.lineWidth = r * (i % 2 === 0 ? 0.105 : 0.06);
      ctx.beginPath();
      ctx.moveTo(x - r * 0.05, -r * 0.96);
      ctx.bezierCurveTo(x + r * 0.12, -r * 0.4, x + r * 0.14, r * 0.35, x - r * 0.08, r * 0.97);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = "rgba(198, 235, 159, 0.16)";
      ellipse(ctx, -r * 0.48 + i * r * 0.4, r * 0.55, r * 0.06, r * 0.14);
      ctx.fill();
    }
  } else if (type === FRUIT_TYPES.orange || type === FRUIT_TYPES.lemon) {
    for (let i = 0; i < 31; i += 1) {
      const angle = random() * TAU;
      const distance = Math.sqrt(random()) * r * 0.88;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      ctx.fillStyle = i % 3 ? "rgba(112, 57, 8, 0.2)" : "rgba(255, 248, 200, 0.26)";
      ellipse(ctx, x, y, r * 0.017, r * 0.013);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(133, 73, 15, 0.18)";
    ctx.lineWidth = r * 0.03;
    ctx.beginPath();
    ctx.arc(r * 0.15, r * 0.08, r * 0.42, -0.8, 1.75);
    ctx.stroke();
  } else if (type === FRUIT_TYPES.apple) {
    for (let i = 0; i < 7; i += 1) {
      const x = (random() - 0.5) * r * 1.4;
      ctx.strokeStyle = "rgba(97, 22, 34, 0.16)";
      ctx.lineWidth = r * 0.025;
      ctx.beginPath();
      ctx.moveTo(x, -r * 0.7);
      ctx.quadraticCurveTo(x + r * 0.13, 0, x + (random() - 0.5) * r * 0.1, r * 0.72);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(91, 20, 35, 0.24)";
    ellipse(ctx, -r * 0.14, -r * 0.7, r * 0.2, r * 0.07);
    ctx.fill();
  } else if (type === FRUIT_TYPES.kiwi) {
    for (let i = 0; i < 54; i += 1) {
      const angle = random() * TAU;
      const distance = r * (0.55 + random() * 0.4);
      const x = Math.cos(angle) * distance * 0.87;
      const y = Math.sin(angle) * distance;
      ctx.strokeStyle = i % 4 ? "rgba(58, 38, 22, 0.36)" : "rgba(222, 194, 157, 0.23)";
      ctx.lineWidth = r * 0.018;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * r * 0.09, y + Math.sin(angle) * r * 0.09);
      ctx.stroke();
    }
  } else if (type === FRUIT_TYPES.plum) {
    const bloom = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 0, -r * 0.25, -r * 0.3, r * 0.9);
    bloom.addColorStop(0, "rgba(220, 194, 238, 0.27)");
    bloom.addColorStop(1, "rgba(220, 194, 238, 0)");
    ctx.fillStyle = bloom;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = "rgba(48, 20, 62, 0.3)";
    ctx.lineWidth = r * 0.02;
    ctx.beginPath();
    ctx.moveTo(-r * 0.06, -r * 0.7);
    ctx.quadraticCurveTo(r * 0.05, 0, -r * 0.02, r * 0.68);
    ctx.stroke();
  } else if (type === FRUIT_TYPES.pomegranate) {
    for (let i = 0; i < 18; i += 1) {
      const x = (random() - 0.5) * r * 1.5;
      const y = (random() - 0.5) * r * 1.5;
      ctx.fillStyle = i % 3 ? "rgba(87, 12, 31, 0.23)" : "rgba(255, 168, 126, 0.14)";
      ellipse(ctx, x, y, r * (0.025 + random() * 0.035), r * 0.02);
      ctx.fill();
    }
  }

  ctx.restore();

  if (type === FRUIT_TYPES.kiwi) {
    for (let i = 0; i < 24; i += 1) {
      const angle = random() * TAU;
      const radius = r * (0.96 + random() * 0.08);
      const x = Math.cos(angle) * radius * 0.86;
      const y = Math.sin(angle) * radius;
      ctx.strokeStyle = i % 2 ? "rgba(213, 181, 143, 0.34)" : "rgba(70, 47, 30, 0.38)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * r * 0.055, y + Math.sin(angle) * r * 0.055);
      ctx.stroke();
    }
  }

  if (type === FRUIT_TYPES.watermelon) {
    drawStem(ctx, r, 0.08);
  } else if (type === FRUIT_TYPES.orange) {
    drawStem(ctx, r * 0.9, 0.12);
    drawLeaf(ctx, r, -0.9, "rgba(67, 127, 58, 0.92)", -r * 0.79);
  } else if (type === FRUIT_TYPES.apple) {
    drawStem(ctx, r * 0.92, 0.16);
    drawLeaf(ctx, r, 0.72, "rgba(74, 134, 61, 0.95)", -r * 0.79);
  } else if (type === FRUIT_TYPES.kiwi) {
    drawStem(ctx, r * 0.8, 0.1);
  } else if (type === FRUIT_TYPES.lemon) {
    drawLeaf(ctx, r * 0.9, -0.8, "rgba(75, 137, 60, 0.9)", -r * 0.77);
  } else if (type === FRUIT_TYPES.plum) {
    drawStem(ctx, r * 0.9, 0.14);
    drawLeaf(ctx, r * 0.9, 0.82, "rgba(72, 126, 57, 0.86)", -r * 0.75);
  } else if (type === FRUIT_TYPES.dragonfruit) {
    drawDragonScales(ctx, r, seed);
  } else if (type === FRUIT_TYPES.pomegranate) {
    ctx.fillStyle = "#7d182d";
    ctx.beginPath();
    ctx.moveTo(-r * 0.27, -r * 0.84);
    ctx.lineTo(-r * 0.18, -r * 1.14);
    ctx.lineTo(-r * 0.04, -r * 0.91);
    ctx.lineTo(0, -r * 1.2);
    ctx.lineTo(r * 0.12, -r * 0.9);
    ctx.lineTo(r * 0.28, -r * 1.1);
    ctx.lineTo(r * 0.3, -r * 0.79);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 180, 137, 0.2)";
    ctx.lineWidth = r * 0.02;
    ctx.stroke();
  }
}

function drawBody(ctx, type, r, seed, shape, shadow = true) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.48)";
    ctx.shadowBlur = r * 0.72;
    ctx.shadowOffsetY = r * 0.28;
  }
  bodyPath(ctx, r, shape);
  ctx.fillStyle = skinGradient(ctx, r, type);
  ctx.fill();
  ctx.restore();

  drawSkinDetails(ctx, type, r, seed, shape);
  drawRim(ctx, r, shape);
  drawGloss(ctx, r, shape, type === FRUIT_TYPES.lemon ? 0.26 : 0.17);
  drawBounceLight(ctx, r, shape);
}

export function drawFruit(ctx, fruit) {
  const type = FRUIT_TYPES[fruit.type];
  ctx.save();
  ctx.translate(fruit.x, fruit.y);
  ctx.rotate(fruit.rot);
  drawBody(ctx, type, fruit.radius, fruit.seed, type.shape, true);
  ctx.restore();
}

function cutFaceGradient(ctx, r, type) {
  const [light, mid, dark] = type.flesh;
  const gradient = ctx.createLinearGradient(-r * 0.7, 0, r * 0.7, 0);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.42, mid);
  gradient.addColorStop(0.56, light);
  gradient.addColorStop(0.78, mid);
  gradient.addColorStop(1, dark);
  return gradient;
}

function drawCutDetails(ctx, type, r, offset, side) {
  const depth = side > 0 ? 1 : -1;
  const y = offset + depth * r * 0.06;
  ctx.save();

  if (type === FRUIT_TYPES.watermelon || type === FRUIT_TYPES.dragonfruit) {
    const count = type === FRUIT_TYPES.watermelon ? 6 : 7;
    for (let i = 0; i < count; i += 1) {
      const x = -r * 0.62 + (i / (count - 1)) * r * 1.24;
      ctx.fillStyle = type.pip;
      ellipse(ctx, x, y + depth * ((i % 2) * r * 0.06), r * 0.032, r * 0.056);
      ctx.fill();
    }
  } else if (type === FRUIT_TYPES.orange || type === FRUIT_TYPES.lemon) {
    ctx.strokeStyle = "rgba(158, 89, 19, 0.34)";
    ctx.lineWidth = Math.max(1, r * 0.018);
    for (let i = 0; i < 7; i += 1) {
      const x = -r * 0.64 + i * r * 0.213;
      ctx.beginPath();
      ctx.moveTo(x, offset);
      ctx.lineTo(x + r * 0.04, offset + depth * r * 0.15);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 255, 236, 0.45)";
    ellipse(ctx, 0, y, r * 0.08, r * 0.028);
    ctx.fill();
  } else if (type === FRUIT_TYPES.kiwi) {
    for (let i = 0; i < 8; i += 1) {
      const x = -r * 0.54 + (i / 7) * r * 1.08;
      ctx.fillStyle = type.pip;
      ellipse(ctx, x, y + depth * ((i % 2) * r * 0.055), r * 0.022, r * 0.043);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 252, 218, 0.54)";
    ellipse(ctx, 0, y, r * 0.16, r * 0.04);
    ctx.fill();
  } else if (type === FRUIT_TYPES.apple) {
    ctx.fillStyle = type.pip;
    ellipse(ctx, -r * 0.11, y + depth * r * 0.03, r * 0.026, r * 0.05);
    ctx.fill();
    ellipse(ctx, r * 0.11, y + depth * r * 0.03, r * 0.026, r * 0.05);
    ctx.fill();
  } else if (type === FRUIT_TYPES.plum) {
    ctx.fillStyle = type.pip;
    ellipse(ctx, 0, y + depth * r * 0.02, r * 0.19, r * 0.055);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 218, 160, 0.18)";
    ctx.lineWidth = Math.max(1, r * 0.018);
    ctx.stroke();
  } else if (type === FRUIT_TYPES.pomegranate) {
    for (let i = 0; i < 12; i += 1) {
      const x = -r * 0.58 + (i / 11) * r * 1.16;
      ctx.fillStyle = i % 3 === 0 ? "#ffd56a" : "#a80f32";
      ellipse(ctx, x, y + depth * ((i % 2) * r * 0.045), r * 0.024, r * 0.035);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawCutFace(ctx, type, r, offset, side) {
  const depth = side > 0 ? 1 : -1;
  const length = r * 0.87;
  const bulge = r * 0.155;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-length, offset);
  ctx.quadraticCurveTo(0, offset + bulge * 1.35 * depth, length, offset);
  ctx.quadraticCurveTo(0, offset + bulge * 0.22 * depth, -length, offset);
  ctx.closePath();
  ctx.fillStyle = cutFaceGradient(ctx, r, type);
  ctx.fill();

  ctx.strokeStyle = type.rind;
  ctx.globalAlpha = 0.88;
  ctx.lineWidth = Math.max(1.5, r * 0.045);
  ctx.beginPath();
  ctx.moveTo(-length, offset);
  ctx.quadraticCurveTo(0, offset + bulge * 1.35 * depth, length, offset);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = Math.max(1, r * 0.014);
  ctx.beginPath();
  ctx.moveTo(-length * 0.9, offset + depth * r * 0.012);
  ctx.quadraticCurveTo(0, offset + bulge * 1.12 * depth, length * 0.9, offset + depth * r * 0.012);
  ctx.stroke();

  drawCutDetails(ctx, type, r, offset, side);
  ctx.restore();
}

export function drawHalf(ctx, half) {
  const type = FRUIT_TYPES[half.type];
  const r = half.radius;
  ctx.save();
  ctx.globalAlpha = half.alpha;
  ctx.translate(half.x, half.y);
  ctx.rotate(half.rot);
  ctx.rotate(half.cutLocal);

  ctx.beginPath();
  if (half.side > 0) {
    ctx.rect(-r * 2, half.offset, r * 4, r * 2.1);
  } else {
    ctx.rect(-r * 2, half.offset - r * 2.1, r * 4, r * 2.1);
  }
  ctx.clip();
  ctx.rotate(-half.cutLocal);

  drawBody(ctx, type, r, half.seed, type.shape, false);

  ctx.rotate(half.cutLocal);
  drawCutFace(ctx, type, r, half.offset, half.side);
  ctx.restore();
}

export function drawBomb(ctx, bomb, time) {
  const r = bomb.radius;
  ctx.save();
  ctx.translate(bomb.x, bomb.y);
  ctx.rotate(bomb.rot);

  const glow = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 2.1);
  glow.addColorStop(0, "rgba(255, 70, 40, 0.18)");
  glow.addColorStop(0.52, "rgba(208, 36, 38, 0.08)");
  glow.addColorStop(1, "rgba(160, 20, 30, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.1, 0, TAU);
  ctx.fill();

  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = r * 0.7;
  ctx.shadowOffsetY = r * 0.22;

  const iron = ctx.createRadialGradient(-r * 0.35, -r * 0.42, r * 0.08, 0, 0, r * 1.15);
  iron.addColorStop(0, "#56505a");
  iron.addColorStop(0.26, "#2c2932");
  iron.addColorStop(0.68, "#16141c");
  iron.addColorStop(1, "#07060a");
  ctx.fillStyle = iron;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "rgba(255, 226, 196, 0.16)";
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.88, -2.65, -0.62);
  ctx.stroke();

  ctx.strokeStyle = "rgba(159, 40, 47, 0.75)";
  ctx.lineWidth = r * 0.11;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = "rgba(209, 48, 52, 0.9)";
  ctx.font = `600 ${Math.round(r * 0.54)}px "Hiragino Mincho ProN", "Yu Mincho", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("爆", 0, r * 0.025);
  ctx.strokeStyle = "rgba(255, 159, 120, 0.28)";
  ctx.lineWidth = Math.max(1, r * 0.018);
  ctx.beginPath();
  ctx.arc(0, r * 0.02, r * 0.46, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = "#5f442f";
  ctx.lineWidth = Math.max(2.5, r * 0.085);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(r * 0.27, -r * 0.88);
  ctx.bezierCurveTo(r * 0.6, -r * 1.14, r * 0.38, -r * 1.36, r * 0.5, -r * 1.55);
  ctx.stroke();
  ctx.strokeStyle = "#d3a36b";
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.beginPath();
  ctx.moveTo(r * 0.28, -r * 0.9);
  ctx.bezierCurveTo(r * 0.6, -r * 1.14, r * 0.4, -r * 1.35, r * 0.5, -r * 1.52);
  ctx.stroke();

  const flicker = 0.68 + Math.sin(time * 23 + bomb.seed) * 0.2 + Math.sin(time * 41) * 0.1;
  const sparkX = r * 0.5;
  const sparkY = -r * 1.58;
  const sparkGlow = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, r * 0.55);
  sparkGlow.addColorStop(0, `rgba(255, 247, 207, ${flicker})`);
  sparkGlow.addColorStop(0.25, `rgba(255, 170, 65, ${flicker * 0.8})`);
  sparkGlow.addColorStop(1, "rgba(255, 80, 20, 0)");
  ctx.fillStyle = sparkGlow;
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, r * 0.55, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#fff8dc";
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, r * 0.085, 0, TAU);
  ctx.fill();

  ctx.restore();
}
