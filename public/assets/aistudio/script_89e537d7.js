/* ============================================================
   Rabbit Garden - v1
   Seções: 1) Config  2) Estado  3) Entrada  4) Lógica  5) Desenho  6) Loop/UI
   ============================================================ */

// ---------- 1) CONFIG ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const CONFIG = {
  totalCarrots: 10,
  pointsPerCarrot: 10,
  rabbitSpeed: 200,   // pixels por segundo
  rabbitRadius: 14,
  carrotRadius: 12,
  pickupDistance: 24,
  startHp: 3,
  startAmmo: 3,
  invulnTime: 1.2,       // segundos sem levar dano após ser atingido
  throwSpeed: 420,
  throwRange: 340,
  throwCooldown: 0.3,
  monsterChaseSpeed: 95,
  monsterWanderSpeed: 35,
  monsterSight: 170,
  monsterKillPoints: 5,
};

// ---------- Mundo: zonas do mapa ----------
// Floresta (topo, y < 150) | Jardim (centro) | Toca (esquerda-baixo) | Fazenda (direita-baixo)
const START = { x: 250, y: 300 };
const TOCA = { x: 85, y: 480, safeRadius: 55 };   // ponto seguro (cura e protege)
const FARM = { x: 540, y: 330, w: 240, h: 200 };
const FIELD = { x: 556, y: 346, w: 120, h: 70 };  // área de cultivo
const BARN = { x: 690, y: 340, w: 80, h: 60 };
// Cerca com portão aberto na esquerda (entre y 425 e 475)
const FENCE = [
  { x: 540, y: 330, w: 240, h: 6 }, { x: 540, y: 524, w: 240, h: 6 },
  { x: 774, y: 330, w: 6, h: 200 }, { x: 540, y: 330, w: 6, h: 95 },
  { x: 540, y: 475, w: 6, h: 55 },
];
const RECTS = [BARN, ...FENCE]; // obstáculos retangulares

// Onde os monstros moram (floresta e borda do jardim)
const MONSTER_SPAWNS = [
  { x: 110, y: 75 }, { x: 310, y: 65 }, { x: 520, y: 70 }, { x: 720, y: 70 }, { x: 420, y: 190 },
];
// Animais da fazenda (o emoji olha para a esquerda por padrão)
const ANIMAL_SPAWNS = [
  { emoji: '🐔', x: 595, y: 485, range: 22 },
  { emoji: '🐄', x: 645, y: 470, range: 22 },
  { emoji: '🐖', x: 695, y: 485, range: 22 },
  { emoji: '🐑', x: 735, y: 468, range: 22 },
];

// Obstáculos fixos do mapa (círculos de colisão)
const OBSTACLES = [
  // floresta
  ...[60, 160, 260, 370, 480, 590, 690, 765].map((x, i) => ({ type: 'tree', x, y: i % 2 ? 125 : 100, r: 26 })),
  // jardim
  { type: 'tree', x: 330, y: 320, r: 26 }, { type: 'tree', x: 500, y: 390, r: 26 },
  { type: 'tree', x: 630, y: 290, r: 26 }, { type: 'tree', x: 740, y: 285, r: 26 },
  { type: 'bush', x: 230, y: 200, r: 20 }, { type: 'bush', x: 430, y: 250, r: 20 },
  { type: 'bush', x: 610, y: 210, r: 20 }, { type: 'bush', x: 170, y: 340, r: 20 },
  { type: 'rock', x: 340, y: 200, r: 14 }, { type: 'rock', x: 500, y: 300, r: 14 },
  { type: 'rock', x: 260, y: 390, r: 14 }, { type: 'rock', x: 80, y: 300, r: 14 },
  { type: 'rock', x: 430, y: 400, r: 14 },
];

// Flores decorativas (posições fixas, geradas com gerador pseudoaleatório simples)
const FLOWERS = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const colors = ['#ff7eb6', '#ffd93b', '#ffffff', '#b98cff', '#ff9a5c'];
  return Array.from({ length: 45 }, () => ({
    x: 20 + rnd() * (W - 40),
    y: 50 + rnd() * (H - 70),
    color: colors[Math.floor(rnd() * colors.length)],
  }));
})();

// ---------- 2) ESTADO ----------
let state = 'menu'; // 'menu' | 'playing' | 'won'
let rabbit, carrots, score, collected, time = 0;
let hp, ammo, monsters = [], animals = [], shots = [];

function newGame() {
  rabbit = { x: START.x, y: START.y, facing: 1, moving: false, dirX: 1, dirY: 0, invuln: 0, cooldown: 0, heal: 0 };
  hp = CONFIG.startHp;
  ammo = CONFIG.startAmmo;
  monsters = spawnMonsters();
  animals = spawnAnimals();
  shots = [];
  score = 0;
  collected = 0;
  carrots = spawnCarrots();
  updateHud();
}

function spawnCarrots() {
  const list = [];
  let tries = 0;
  while (list.length < CONFIG.totalCarrots && tries++ < 2000) {
    const x = 30 + Math.random() * (W - 60);
    const y = 60 + Math.random() * (H - 90);
    const freeOfObstacles = OBSTACLES.every(o => Math.hypot(x - o.x, y - o.y) > o.r + 26);
    const freeOfCarrots = list.every(c => Math.hypot(x - c.x, y - c.y) > 60);
    const farFromStart = Math.hypot(x - START.x, y - START.y) > 90;
    const outsideZones = !inRect(x, y, FARM, 30) && Math.hypot(x - TOCA.x, y - TOCA.y) > 80;
    const freeOfRects = RECTS.every(r => !inRect(x, y, r, 22));
    if (freeOfObstacles && freeOfCarrots && farFromStart && outsideZones && freeOfRects) {
      list.push({ x, y, phase: Math.random() * 6 });
    }
  }
  return list;
}

// ---------- 3) ENTRADA ----------
const keys = new Set();
const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];

window.addEventListener('keydown', e => {
  if (GAME_KEYS.includes(e.code)) {
    keys.add(e.code);
    if (state === 'playing') e.preventDefault();
  }
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

// ---------- 4) LÓGICA ----------
function update(dt) {
  // Direção
  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
  if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;

  rabbit.moving = dx !== 0 || dy !== 0;
  if (rabbit.moving) {
    const len = Math.hypot(dx, dy); // normaliza a diagonal
    rabbit.x += (dx / len) * CONFIG.rabbitSpeed * dt;
    rabbit.y += (dy / len) * CONFIG.rabbitSpeed * dt;
    if (dx !== 0) rabbit.facing = dx > 0 ? 1 : -1;
    rabbit.dirX = dx / len; rabbit.dirY = dy / len; // direção do arremesso
  }

  // Limites do mapa
  const r = CONFIG.rabbitRadius;
  rabbit.x = Math.min(W - r, Math.max(r, rabbit.x));
  rabbit.y = Math.min(H - r, Math.max(r + 40, rabbit.y)); // 40px livres para o HUD

  // Colisão com obstáculos (empurra o coelho para fora)
  for (const o of OBSTACLES) {
    const dist = Math.hypot(rabbit.x - o.x, rabbit.y - o.y);
    const minDist = o.r + r;
    if (dist < minDist && dist > 0) {
      rabbit.x = o.x + ((rabbit.x - o.x) / dist) * minDist;
      rabbit.y = o.y + ((rabbit.y - o.y) / dist) * minDist;
    }
  }

  // Colisão com retângulos (celeiro e cerca)
  for (const b of RECTS) {
    const cx = Math.max(b.x, Math.min(rabbit.x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(rabbit.y, b.y + b.h));
    const dist = Math.hypot(rabbit.x - cx, rabbit.y - cy);
    if (dist < r && dist > 0) {
      rabbit.x = cx + ((rabbit.x - cx) / dist) * r;
      rabbit.y = cy + ((rabbit.y - cy) / dist) * r;
    }
  }

  // Coleta de cenouras
  carrots = carrots.filter(c => {
    if (Math.hypot(rabbit.x - c.x, rabbit.y - c.y) < CONFIG.pickupDistance) {
      collected++;
      score += CONFIG.pointsPerCarrot;
      ammo++; // cada cenoura coletada também vira munição
      updateHud();
      return false;
    }
    return true;
  });

  updateCombat(dt);
  if (state !== 'playing') return; // derrota neste quadro

  if (collected >= CONFIG.totalCarrots) winGame();
}

// ---------- 4b) COMBATE, MONSTROS E ANIMAIS ----------
function inRect(x, y, r, pad = 0) {
  return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
}
function inSafeZone() { return Math.hypot(rabbit.x - TOCA.x, rabbit.y - TOCA.y) < TOCA.safeRadius; }

function spawnMonsters() {
  return MONSTER_SPAWNS.map(p => ({ homeX: p.x, homeY: p.y, x: p.x, y: p.y, tx: p.x, ty: p.y,
    r: 16, dying: 0, gone: false, wait: 0, facing: 1, phase: Math.random() * 6 }));
}
function spawnAnimals() {
  return ANIMAL_SPAWNS.map(a => ({ ...a, homeX: a.x, homeY: a.y, tx: a.x, ty: a.y,
    wait: Math.random() * 2, facing: 1 }));
}

function moveToward(o, tx, ty, speed, dt) {
  const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
  if (d < 1) return;
  const step = Math.min(speed * dt, d);
  o.x = Math.min(W - 10, Math.max(10, o.x + (dx / d) * step));
  o.y = Math.min(H - 10, Math.max(50, o.y + (dy / d) * step));
  if (Math.abs(dx) > 1) o.facing = dx > 0 ? 1 : -1;
}

// Movimento aleatório simples: escolhe um ponto perto de casa, anda até lá e descansa
function wander(o, speed, radius, dt) {
  if (o.wait > 0) { o.wait -= dt; return; }
  if (Math.hypot(o.tx - o.x, o.ty - o.y) < 4) {
    o.wait = 0.5 + Math.random() * 2;
    const ang = Math.random() * Math.PI * 2, dist = Math.random() * radius;
    o.tx = o.homeX + Math.cos(ang) * dist;
    o.ty = o.homeY + Math.sin(ang) * dist;
    return;
  }
  moveToward(o, o.tx, o.ty, speed, dt);
}

function throwCarrot() {
  if (ammo <= 0 || rabbit.cooldown > 0) return;
  ammo--;
  rabbit.cooldown = CONFIG.throwCooldown;
  const sp = CONFIG.throwSpeed;
  shots.push({ x: rabbit.x, y: rabbit.y - 4, vx: rabbit.dirX * sp, vy: rabbit.dirY * sp, life: CONFIG.throwRange / sp });
  updateHud();
}

function hurt() {
  hp--;
  rabbit.invuln = CONFIG.invulnTime;
  updateHud();
  if (hp <= 0) loseGame();
}

function updateCombat(dt) {
  rabbit.cooldown = Math.max(0, rabbit.cooldown - dt);
  rabbit.invuln = Math.max(0, rabbit.invuln - dt);
  if (keys.has('Space')) throwCarrot();

  // Toca: cura 1 vida a cada 1,5s
  if (inSafeZone() && hp < CONFIG.startHp) {
    rabbit.heal += dt;
    if (rabbit.heal >= 1.5) { rabbit.heal = 0; hp++; updateHud(); }
  }

  animals.forEach(a => wander(a, 18, a.range, dt));

  // Cenouras lançadas
  for (const sh of shots) {
    sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
    if (sh.x < 0 || sh.x > W || sh.y < 0 || sh.y > H) sh.life = 0;
    if (OBSTACLES.some(o => Math.hypot(sh.x - o.x, sh.y - o.y) < o.r) || RECTS.some(r => inRect(sh.x, sh.y, r))) sh.life = 0;
    for (const m of monsters) {
      if (m.dying === 0 && Math.hypot(sh.x - m.x, sh.y - m.y) < m.r + 8) {
        m.dying = 0.5; sh.life = 0;
        score += CONFIG.monsterKillPoints;
        updateHud();
      }
    }
  }
  shots = shots.filter(sh => sh.life > 0);

  // Monstros: perseguem quando o coelho está perto; senão vagam perto de casa
  for (const m of monsters) {
    if (m.dying > 0) { m.dying -= dt; if (m.dying <= 0) m.gone = true; continue; }
    const d = Math.hypot(rabbit.x - m.x, rabbit.y - m.y);
    const chasing = d < CONFIG.monsterSight && !inSafeZone() && Math.hypot(m.x - m.homeX, m.y - m.homeY) < 260;
    if (chasing) moveToward(m, rabbit.x, rabbit.y, CONFIG.monsterChaseSpeed, dt);
    else wander(m, CONFIG.monsterWanderSpeed, 70, dt);
    if (d < m.r + CONFIG.rabbitRadius - 2 && rabbit.invuln <= 0 && !inSafeZone()) hurt();
  }
  monsters = monsters.filter(m => !m.gone);
}



// ---------- 5) DESENHO ----------
function ellipse(x, y, rx, ry, fill, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function drawBackground() {
  ctx.fillStyle = '#8fd16a';
  ctx.fillRect(0, 0, W, H);
  // listras suaves de grama
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 0; y < H; y += 80) ctx.fillRect(0, y, W, 40);
  // flores
  for (const f of FLOWERS) {
    ctx.fillStyle = f.color;
    for (let a = 0; a < 5; a++) {
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(a * 1.257) * 4, f.y + Math.sin(a * 1.257) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffcf33';
    ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawObstacle(o) {
  // sombra
  ellipse(o.x, o.y + o.r * 0.8, o.r * 1.1, o.r * 0.4, 'rgba(0,0,0,0.15)');
  if (o.type === 'tree') {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(o.x - 7, o.y - 2, 14, o.r + 4);
    ellipse(o.x, o.y - 18, 32, 30, '#2f9e44', '#237a34');
    ellipse(o.x - 10, o.y - 26, 10, 8, '#52c26a');
    ellipse(o.x + 16, o.y - 10, 6, 5, '#ff5c5c'); // frutinha
  } else if (o.type === 'bush') {
    ellipse(o.x - 10, o.y, 15, 13, '#3fae55', '#2b8a3e');
    ellipse(o.x + 10, o.y, 15, 13, '#3fae55', '#2b8a3e');
    ellipse(o.x, o.y - 8, 16, 14, '#57c46e', '#2b8a3e');
  } else {
    ellipse(o.x, o.y, o.r + 2, o.r - 2, '#a7adb5', '#7d848d');
    ellipse(o.x - 4, o.y - 4, 5, 3, '#d3d7dc');
  }
}

function drawCarrot(c) {
  const bob = Math.sin(time * 3 + c.phase) * 2.5;
  const x = c.x, y = c.y + bob;
  ellipse(c.x, c.y + 14, 10, 3, 'rgba(0,0,0,0.15)');
  // folhas
  ctx.fillStyle = '#2fbf4f';
  ellipse(x - 4, y - 13, 3, 7, '#2fbf4f');
  ellipse(x + 4, y - 13, 3, 7, '#2fbf4f');
  ellipse(x, y - 15, 3, 8, '#43d060');
  // corpo
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 8);
  ctx.quadraticCurveTo(x, y - 14, x + 8, y - 8);
  ctx.lineTo(x, y + 14);
  ctx.closePath();
  ctx.fillStyle = '#ff8c1a';
  ctx.fill();
  ctx.strokeStyle = '#d96a00';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#d96a00';
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 1, y - 3);
  ctx.moveTo(x - 1, y + 3); ctx.lineTo(x + 3, y + 3);
  ctx.stroke();
}

function drawRabbit() {
  const hop = rabbit.moving ? -Math.abs(Math.sin(time * 14)) * 6 : 0;
  ctx.save();
  ctx.translate(rabbit.x, rabbit.y + hop);
  ctx.scale(rabbit.facing, 1);
  if (rabbit.invuln > 0 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.35; // pisca ao levar dano

  // sombra (fica no chão)
  ctx.save();
  ctx.translate(0, -hop);
  ellipse(0, 14, 15, 4, 'rgba(0,0,0,0.18)');
  ctx.restore();

  const line = '#c9c2d6';
  // rabinho
  ellipse(-14, 6, 6, 6, '#fff', line);
  // orelhas
  ellipse(-3, -26, 5, 14, '#fff', line);
  ellipse(-3, -25, 2.5, 9, '#ffb3c6');
  ellipse(6, -27, 5, 14, '#fff', line);
  ellipse(6, -26, 2.5, 9, '#ffb3c6');
  // corpo e cabeça
  ellipse(-2, 5, 13, 10, '#fff', line);
  ellipse(6, -4, 11, 10, '#fff', line);
  // patinha da frente
  ellipse(8, 12, 5, 3, '#fff', line);
  // olho, bochecha e nariz
  ellipse(10, -6, 2, 2.5, '#3b2f4a');
  ellipse(8, -1, 3, 2, 'rgba(255,140,170,0.55)');
  ellipse(16, -3, 2, 1.6, '#ff7a9c');

  ctx.restore();
}

function tri(x1, y1, x2, y2, x3, y3, fill) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

// Áreas do mapa: floresta, caminho, fazenda e toca (desenhadas sob os personagens)
function drawZones() {
  // floresta
  ctx.fillStyle = '#5fae4f';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0);
  for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, 150 + Math.sin(x * 0.05) * 12);
  ctx.closePath(); ctx.fill();
  // caminho da toca até a fazenda
  ctx.fillStyle = '#e6c88f';
  ctx.fillRect(120, 436, 425, 30);
  // fazenda: chão, área de cultivo e curral
  ctx.fillStyle = '#a8d86e'; ctx.fillRect(FARM.x, FARM.y, FARM.w, FARM.h);
  ctx.fillStyle = '#e3cf8a'; ctx.fillRect(556, 430, 208, 90);
  ctx.fillStyle = '#8a5a2b'; ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
  for (let y = FIELD.y + 12; y < FIELD.y + FIELD.h; y += 16) {
    for (let x = FIELD.x + 12; x < FIELD.x + FIELD.w; x += 14) ellipse(x, y, 4, 6, '#3fae55');
  }
  // celeiro
  ctx.fillStyle = '#c0392b'; ctx.fillRect(BARN.x, 352, BARN.w, 48);
  tri(BARN.x - 8, 354, BARN.x + 40, 322, BARN.x + BARN.w + 8, 354, '#7a4b26');
  ctx.fillStyle = '#f5e6cf'; ctx.fillRect(BARN.x + 26, 370, 28, 30);
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.strokeRect(BARN.x + 26, 370, 28, 30);
  // cerca
  for (const f of FENCE) {
    ctx.fillStyle = '#b07a45'; ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.fillStyle = '#8a5a2b';
    if (f.w > f.h) for (let x = f.x; x <= f.x + f.w; x += 24) ctx.fillRect(x - 3, f.y - 5, 6, f.h + 10);
    else for (let y = f.y; y <= f.y + f.h; y += 24) ctx.fillRect(f.x - 5, y - 3, f.w + 10, 6);
  }
  drawBurrow();
}

function drawBurrow() {
  ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(TOCA.x, TOCA.y, TOCA.safeRadius, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ellipse(TOCA.x, TOCA.y + 6, 44, 30, '#a67846', '#7a4b26');
  ellipse(TOCA.x, TOCA.y + 8, 27, 17, '#2b1a10');
  ellipse(TOCA.x, TOCA.y + 5, 27, 12, '#4a2f1a');
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Toca', TOCA.x, TOCA.y + 50);
}

function drawMonster(m) {
  const bob = Math.sin(time * 6 + m.phase) * 2;
  const p = m.dying > 0 ? m.dying / 0.5 : 1; // 1 = vivo, 0 = sumiu
  ctx.save();
  ctx.translate(m.x, m.y + bob);
  ctx.globalAlpha = p;
  ctx.scale(p, p);
  ellipse(0, 14, 14, 4, 'rgba(0,0,0,0.18)');
  tri(-11, -9, -15, -23, -3, -13, '#ffd93b');
  tri(11, -9, 15, -23, 3, -13, '#ffd93b');
  ellipse(0, 0, 17, 15, '#8e5bd6', '#6a3fb0');
  ellipse(-6, -3, 4.5, 5, '#fff'); ellipse(6, -3, 4.5, 5, '#fff');
  ellipse(-5 + m.facing, -2, 2, 2.5, '#2b1a4a'); ellipse(7 + m.facing, -2, 2, 2.5, '#2b1a4a');
  ctx.strokeStyle = '#3b1a5a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-11, -10); ctx.lineTo(-3, -7); ctx.moveTo(11, -10); ctx.lineTo(3, -7); ctx.stroke();
  ellipse(0, 7, 7, 3, '#3b1a5a');
  ctx.restore();
  if (m.dying > 0) { // efeito de estrelinhas ao ser derrotado
    ctx.fillStyle = `rgba(255,217,59,${p})`;
    for (let i = 0; i < 6; i++) {
      const a = i * 1.047, d = 10 + (1 - p) * 34;
      ctx.beginPath(); ctx.arc(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, 4 * p + 1, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawAnimal(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ellipse(0, 12, 13, 4, 'rgba(0,0,0,0.15)');
  ctx.scale(-a.facing, 1); // emojis olham para a esquerda
  ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(a.emoji, 0, 0);
  ctx.restore();
}

function drawShot(sh) {
  ctx.save();
  ctx.translate(sh.x, sh.y);
  ctx.rotate(Math.atan2(sh.vy, sh.vx));
  tri(-8, -5, -8, 5, 10, 0, '#ff8c1a');
  ellipse(-11, -2, 4, 2, '#2fbf4f'); ellipse(-11, 2, 4, 2, '#2fbf4f');
  ctx.restore();
}

function drawAim() { // bolinha mostrando para onde a cenoura vai
  if (ammo <= 0) return;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(rabbit.x + rabbit.dirX * 36, rabbit.y - 4 + rabbit.dirY * 36, 4, 0, Math.PI * 2); ctx.fill();
}

function draw() {
  drawBackground();
  drawZones();
  if (state === 'menu') return;

  carrots.forEach(drawCarrot);

  // Desenha obstáculos e coelho ordenados por Y (dá noção de profundidade)
  const items = OBSTACLES.map(o => ({ y: o.y, draw: () => drawObstacle(o) }));
  monsters.forEach(m => items.push({ y: m.y, draw: () => drawMonster(m) }));
  animals.forEach(a => items.push({ y: a.y, draw: () => drawAnimal(a) }));
  items.push({ y: rabbit.y, draw: drawRabbit });
  items.sort((a, b) => a.y - b.y).forEach(i => i.draw());
  shots.forEach(drawShot);
  drawAim();
}

// ---------- 6) LOOP E INTERFACE ----------
const $ = id => document.getElementById(id);
const menuEl = $('menu'), winEl = $('win'), hudEl = $('hud'), loseEl = $('lose');

function updateHud() {
  $('hud-carrots').textContent = `🥕 Cenouras: ${collected}/${CONFIG.totalCarrots}`;
  $('hud-score').textContent = `⭐ Pontos: ${score}`;
  $('hud-hearts').textContent = '❤️'.repeat(hp) + '🖤'.repeat(CONFIG.startHp - hp);
  $('hud-ammo').textContent = `🎒 Munição: ${ammo}`;
}

function startGame() {
  newGame();
  state = 'playing';
  menuEl.classList.add('hidden');
  winEl.classList.add('hidden');
  loseEl.classList.add('hidden');
  hudEl.classList.remove('hidden');
}

function winGame() {
  state = 'won';
  keys.clear();
  $('win-score').textContent = `⭐ Pontos: ${score}`;
  winEl.classList.remove('hidden');
}

function loseGame() {
  state = 'lost';
  keys.clear();
  loseEl.classList.remove('hidden');
}

// Respawn simples na toca (ponto único para melhorar depois)
function respawnAtBurrow() {
  rabbit.x = TOCA.x; rabbit.y = TOCA.y + 8;
  rabbit.invuln = 1.5;
  hp = CONFIG.startHp;
  ammo = Math.max(ammo, CONFIG.startAmmo);
  monsters = spawnMonsters();
  shots = [];
  state = 'playing';
  loseEl.classList.add('hidden');
  updateHud();
}

$('btn-play').addEventListener('click', startGame);
$('btn-respawn').addEventListener('click', respawnAtBurrow);
$('btn-again').addEventListener('click', startGame);

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); // evita saltos se a aba ficar em segundo plano
  last = now;
  time += dt;
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}

newGame(); // prepara o estado inicial (a tela de menu cobre o canvas)
requestAnimationFrame(loop);
