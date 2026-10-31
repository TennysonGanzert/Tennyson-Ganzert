import React, { useEffect, useRef, useState, useCallback } from 'react';
import { UserSaveData, BunnySkin, BunnyHat } from '../types/game';
import { sound } from '../utils/audio';
import {
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Menu,
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  RotateCcw,
  Compass,
  Zap,
  Skull
} from 'lucide-react';

interface RabbitAdventureProps {
  saveData: UserSaveData;
  activeSkin: BunnySkin;
  activeHat: BunnyHat;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onOpenArcade: () => void;
  onNavigateTab: (tab: 'ADVENTURE' | 'ARCADE' | 'BURROW' | 'CLOSET' | 'STATS') => void;
  onOpenMenu?: () => void;
}

// EXPANDED WORLD: 1500 x 1000
const WORLD_W = 1500;
const WORLD_H = 1000;

// VIEWPORT RENDERED ON CANVAS: 880 x 580
const VIEW_W = 880;
const VIEW_H = 580;

const CONFIG = {
  totalCarrots: 14,
  pointsPerCarrot: 10,
  rabbitSpeed: 220,
  rabbitRadius: 14,
  carrotRadius: 12,
  pickupDistance: 26,
  startHp: 3,
  startAmmo: 5,
  invulnTime: 1.2,
  throwSpeed: 460,
  throwRange: 380,
  throwCooldown: 0.26,
  monsterChaseSpeed: 96,
  monsterWanderSpeed: 38,
  monsterSight: 180,
  monsterKillPoints: 5,
  bossMaxHp: 20,
};

// Map Zones in the expanded world
const START = { x: 560, y: 730 };
const TOCA = { x: 560, y: 810, safeRadius: 85 };
const BOSS_LAIR = { x: 750, y: 220, r: 160 };

// Farm (Bottom Left area with animals)
const FARM = { x: 50, y: 640, w: 420, h: 320 };
const FIELD = { x: 70, y: 660, w: 170, h: 100 };
const BARN = { x: 260, y: 660, w: 150, h: 90 };

const FENCE = [
  { x: 50, y: 640, w: 420, h: 8 },
  { x: 50, y: 952, w: 420, h: 8 },
  { x: 50, y: 640, w: 8, h: 320 },
  { x: 462, y: 640, w: 8, h: 140 },
  { x: 462, y: 840, w: 8, h: 120 }, // open gate between y: 780 and 840
];
const RECTS = [BARN, ...FENCE];

// Monster Patrols in North Forest and Eastern Wood
const MONSTER_SPAWNS = [
  { x: 220, y: 140 },
  { x: 440, y: 120 },
  { x: 1050, y: 130 },
  { x: 1300, y: 160 },
  { x: 1280, y: 420 },
  { x: 450, y: 360 },
  { x: 980, y: 380 },
  { x: 680, y: 460 },
];

const ANIMAL_SPAWNS = [
  { emoji: '🐔', x: 130, y: 880, range: 25 },
  { emoji: '🐄', x: 230, y: 850, range: 25 },
  { emoji: '🐖', x: 330, y: 880, range: 25 },
  { emoji: '🐑', x: 390, y: 840, range: 25 },
];

// Rich Obstacles across the 1500x1000 realm
const OBSTACLES = [
  // Deep Forest Trees (North border)
  ...[80, 200, 340, 480, 620, 880, 1020, 1160, 1300, 1420].map((x, i) => ({
    type: 'tree' as const,
    x,
    y: i % 2 ? 150 : 110,
    r: 28,
  })),
  // Ancient Stone Pillars around Boss Lair
  { type: 'rock' as const, x: BOSS_LAIR.x - 120, y: BOSS_LAIR.y - 70, r: 20 },
  { type: 'rock' as const, x: BOSS_LAIR.x + 120, y: BOSS_LAIR.y - 70, r: 20 },
  { type: 'rock' as const, x: BOSS_LAIR.x - 100, y: BOSS_LAIR.y + 90, r: 20 },
  { type: 'rock' as const, x: BOSS_LAIR.x + 100, y: BOSS_LAIR.y + 90, r: 20 },

  // Central Meadow Trees & Bushes
  { type: 'tree' as const, x: 520, y: 550, r: 28 },
  { type: 'tree' as const, x: 740, y: 620, r: 28 },
  { type: 'tree' as const, x: 920, y: 540, r: 28 },
  { type: 'tree' as const, x: 380, y: 420, r: 28 },
  { type: 'tree' as const, x: 860, y: 780, r: 28 },
  { type: 'tree' as const, x: 620, y: 820, r: 28 },
  { type: 'bush' as const, x: 340, y: 560, r: 22 },
  { type: 'bush' as const, x: 670, y: 480, r: 22 },
  { type: 'bush' as const, x: 880, y: 390, r: 22 },
  { type: 'bush' as const, x: 1140, y: 480, r: 22 },
  { type: 'bush' as const, x: 260, y: 340, r: 22 },
  { type: 'rock' as const, x: 680, y: 680, r: 16 },
  { type: 'rock' as const, x: 560, y: 680, r: 16 },
  { type: 'rock' as const, x: 800, y: 470, r: 16 },
  { type: 'rock' as const, x: 1010, y: 510, r: 16 },
  { type: 'rock' as const, x: 160, y: 560, r: 16 },
];

const FLOWERS = (() => {
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const colors = ['#ff7eb6', '#ffd93b', '#ffffff', '#b98cff', '#ff9a5c'];
  return Array.from({ length: 90 }, () => ({
    x: 30 + rnd() * (WORLD_W - 60),
    y: 80 + rnd() * (WORLD_H - 120),
    color: colors[Math.floor(rnd() * colors.length)],
  }));
})();

function inRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }, pad = 0) {
  return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
}

interface CarrotItem {
  x: number;
  y: number;
  phase: number;
  isBonus?: boolean;
}

interface ShotItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface MonsterItem {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  r: number;
  dying: number;
  gone: boolean;
  wait: number;
  facing: number;
  phase: number;
}

interface BossState {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  tx: number;
  ty: number;
  wait: number;
  r: number;
  hp: number;
  maxHp: number;
  facing: number;
  state: 'IDLE' | 'CHASE' | 'CHARGE_WINDUP' | 'CHARGE' | 'DYING';
  stateTimer: number;
  attackTimer: number;
  enraged: boolean;
  hitFlash: number;
  chargeTarget: { x: number; y: number };
  defeated: boolean;
  dyingTimer: number;
  shockwaves: { x: number; y: number; r: number; maxR: number; alpha: number }[];
  projectiles: { x: number; y: number; vx: number; vy: number; life: number }[];
}

interface AnimalItem {
  emoji: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  tx: number;
  ty: number;
  range: number;
  wait: number;
  facing: number;
}

export const RabbitAdventure: React.FC<RabbitAdventureProps> = ({
  saveData,
  activeSkin,
  activeHat,
  onUpdateSave,
  onOpenArcade,
  onNavigateTab,
  onOpenMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'WON' | 'LOST'>('MENU');
  const [hp, setHp] = useState<number>(CONFIG.startHp);
  const [ammo, setAmmo] = useState<number>(CONFIG.startAmmo);
  const [score, setScore] = useState<number>(0);
  const [collected, setCollected] = useState<number>(0);
  const [monstersSlain, setMonstersSlain] = useState<number>(0);
  const [isInSafeZone, setIsInSafeZone] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(saveData.soundEnabled);
  const [freeRoam, setFreeRoam] = useState<boolean>(false);

  // Boss UI info
  const [bossHp, setBossHp] = useState<number>(CONFIG.bossMaxHp);
  const [isBossNear, setIsBossNear] = useState<boolean>(false);
  const [isBossEnraged, setIsBossEnraged] = useState<boolean>(false);
  const [bossDefeatedBanner, setBossDefeatedBanner] = useState<boolean>(false);

  // Distance Indicators
  const [distToBoss, setDistToBoss] = useState<number>(0);
  const [distToBurrow, setDistToBurrow] = useState<number>(0);
  const [distToFarm, setDistToFarm] = useState<number>(0);

  // Phase 1 Quest Objective: DEFEAT_BOSS -> RETURN_TO_FARM -> COMPLETED
  const [questStep, setQuestStep] = useState<'DEFEAT_BOSS' | 'RETURN_TO_FARM' | 'COMPLETED'>('DEFEAT_BOSS');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Orientation Check
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissRotatePrompt, setDismissRotatePrompt] = useState<boolean>(false);

  // Virtual Joystick Knob
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingJoystickRef = useRef<boolean>(false);
  const joystickTouchIdRef = useRef<number | null>(null);

  const touchDirectionRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Game internal state ref with CAMERA
  const gameRef = useRef<{
    camera: { x: number; y: number };
    rabbit: {
      x: number;
      y: number;
      facing: number;
      moving: boolean;
      dirX: number;
      dirY: number;
      invuln: number;
      cooldown: number;
      heal: number;
      ammoRegen: number;
    };
    boss: BossState;
    carrots: CarrotItem[];
    monsters: MonsterItem[];
    animals: AnimalItem[];
    shots: ShotItem[];
    questStep: 'DEFEAT_BOSS' | 'RETURN_TO_FARM' | 'COMPLETED';
    time: number;
    lastTime: number;
    respawnTimer: number;
    animationId: number | null;
    keys: Set<string>;
  }>({
    camera: { x: 0, y: 0 },
    rabbit: {
      x: START.x,
      y: START.y,
      facing: 1,
      moving: false,
      dirX: 1,
      dirY: 0,
      invuln: 0,
      cooldown: 0,
      heal: 0,
      ammoRegen: 0,
    },
    boss: {
      x: BOSS_LAIR.x,
      y: BOSS_LAIR.y,
      homeX: BOSS_LAIR.x,
      homeY: BOSS_LAIR.y,
      tx: BOSS_LAIR.x,
      ty: BOSS_LAIR.y,
      wait: 0,
      r: 38,
      hp: CONFIG.bossMaxHp,
      maxHp: CONFIG.bossMaxHp,
      facing: 1,
      state: 'IDLE',
      stateTimer: 0,
      attackTimer: 2.5,
      enraged: false,
      hitFlash: 0,
      chargeTarget: { x: 0, y: 0 },
      defeated: false,
      dyingTimer: 0,
      shockwaves: [],
      projectiles: [],
    },
    carrots: [],
    monsters: [],
    animals: [],
    shots: [],
    questStep: 'DEFEAT_BOSS',
    time: 0,
    lastTime: 0,
    respawnTimer: 0,
    animationId: null,
    keys: new Set<string>(),
  });

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;
        setIsPortrait(portrait);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        if ('orientation' in screen && 'lock' in (screen.orientation as unknown as { lock: (s: string) => Promise<void> })) {
          try {
            await (screen.orientation as unknown as { lock: (s: string) => Promise<void> }).lock('landscape');
          } catch {
            // silent fallback
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // silent fallback
    }
  };

  const spawnCarrots = useCallback((): CarrotItem[] => {
    const list: CarrotItem[] = [];
    let tries = 0;
    while (list.length < CONFIG.totalCarrots && tries++ < 3000) {
      const x = 50 + Math.random() * (WORLD_W - 100);
      const y = 80 + Math.random() * (WORLD_H - 140);
      const freeOfObstacles = OBSTACLES.every(o => Math.hypot(x - o.x, y - o.y) > o.r + 28);
      const freeOfCarrots = list.every(c => Math.hypot(x - c.x, y - c.y) > 75);
      const farFromStart = Math.hypot(x - START.x, y - START.y) > 90;
      const outsideZones =
        !inRect(x, y, FARM, 40) &&
        Math.hypot(x - TOCA.x, y - TOCA.y) > 95 &&
        Math.hypot(x - BOSS_LAIR.x, y - BOSS_LAIR.y) > 130;
      const freeOfRects = RECTS.every(r => !inRect(x, y, r, 24));

      if (freeOfObstacles && freeOfCarrots && farFromStart && outsideZones && freeOfRects) {
        list.push({ x, y, phase: Math.random() * 6 });
      }
    }
    return list;
  }, []);

  const spawnMonsters = useCallback((): MonsterItem[] => {
    return MONSTER_SPAWNS.map(p => ({
      homeX: p.x,
      homeY: p.y,
      x: p.x,
      y: p.y,
      tx: p.x,
      ty: p.y,
      r: 16,
      dying: 0,
      gone: false,
      wait: 0,
      facing: 1,
      phase: Math.random() * 6,
    }));
  }, []);

  const spawnAnimals = useCallback((): AnimalItem[] => {
    return ANIMAL_SPAWNS.map(a => ({
      ...a,
      homeX: a.x,
      homeY: a.y,
      tx: a.x,
      ty: a.y,
      wait: Math.random() * 2,
      facing: 1,
    }));
  }, []);

  const startNewGame = useCallback(() => {
    const g = gameRef.current;
    g.rabbit = {
      x: START.x,
      y: START.y,
      facing: 1,
      moving: false,
      dirX: 1,
      dirY: 0,
      invuln: 0,
      cooldown: 0,
      heal: 0,
      ammoRegen: 0,
    };
    g.camera = {
      x: Math.max(0, Math.min(WORLD_W - VIEW_W, START.x - VIEW_W / 2)),
      y: Math.max(0, Math.min(WORLD_H - VIEW_H, START.y - VIEW_H / 2)),
    };
    g.boss = {
      x: BOSS_LAIR.x,
      y: BOSS_LAIR.y,
      homeX: BOSS_LAIR.x,
      homeY: BOSS_LAIR.y,
      tx: BOSS_LAIR.x,
      ty: BOSS_LAIR.y,
      wait: 0,
      r: 38,
      hp: CONFIG.bossMaxHp,
      maxHp: CONFIG.bossMaxHp,
      facing: 1,
      state: 'IDLE',
      stateTimer: 0,
      attackTimer: 2.0,
      enraged: false,
      hitFlash: 0,
      chargeTarget: { x: 0, y: 0 },
      defeated: false,
      dyingTimer: 0,
      shockwaves: [],
      projectiles: [],
    };
    g.carrots = spawnCarrots();
    g.monsters = spawnMonsters();
    g.animals = spawnAnimals();
    g.shots = [];
    g.respawnTimer = 0;
    g.questStep = 'DEFEAT_BOSS';

    setHp(CONFIG.startHp);
    setAmmo(CONFIG.startAmmo);
    setScore(0);
    setCollected(0);
    setMonstersSlain(0);
    setBossHp(CONFIG.bossMaxHp);
    setIsBossNear(false);
    setIsBossEnraged(false);
    setBossDefeatedBanner(false);
    setIsInSafeZone(false);
    setFreeRoam(false);
    setQuestStep('DEFEAT_BOSS');
    setGameState('PLAYING');

    sound.playJump();
  }, [spawnCarrots, spawnMonsters, spawnAnimals]);

  const respawnAtBurrow = useCallback(() => {
    const g = gameRef.current;
    g.rabbit.x = TOCA.x;
    g.rabbit.y = TOCA.y + 10;
    g.rabbit.invuln = 2.0;
    g.rabbit.moving = false;
    g.shots = [];

    setHp(CONFIG.startHp);
    setAmmo(prev => Math.max(prev, CONFIG.startAmmo));
    setGameState('PLAYING');

    sound.playHeal();
  }, []);

  const throwCarrot = useCallback(() => {
    const g = gameRef.current;
    if (g.rabbit.cooldown > 0) return;

    setAmmo(currAmmo => {
      if (currAmmo <= 0) return 0;
      g.rabbit.cooldown = CONFIG.throwCooldown;
      const sp = CONFIG.throwSpeed;
      g.shots.push({
        x: g.rabbit.x,
        y: g.rabbit.y - 4,
        vx: g.rabbit.dirX * sp,
        vy: g.rabbit.dirY * sp,
        life: CONFIG.throwRange / sp,
      });

      sound.playShoot();
      return currAmmo - 1;
    });
  }, []);

  const shootAtTarget = useCallback((targetWorldX: number, targetWorldY: number) => {
    const g = gameRef.current;
    const dx = targetWorldX - g.rabbit.x;
    const dy = targetWorldY - g.rabbit.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 5) {
      g.rabbit.dirX = dx / dist;
      g.rabbit.dirY = dy / dist;
      g.rabbit.facing = dx >= 0 ? 1 : -1;
    }
    throwCarrot();
  }, [throwCarrot]);

  // Keyboard handlers
  useEffect(() => {
    const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'];

    const onKeyDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.includes(e.code)) {
        gameRef.current.keys.add(e.code);
        if (e.code === 'Space') {
          e.preventDefault();
          if (gameState === 'PLAYING') throwCarrot();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys.delete(e.code);
    };

    const onBlur = () => {
      gameRef.current.keys.clear();
      touchDirectionRef.current = { dx: 0, dy: 0 };
      setJoystickKnob({ x: 0, y: 0 });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [gameState, throwCarrot]);

  // Virtual Joystick Handlers
  const handleJoystickStart = (clientX: number, clientY: number, pointerId?: number) => {
    if (!joystickBaseRef.current) return;
    isDraggingJoystickRef.current = true;
    if (pointerId !== undefined) joystickTouchIdRef.current = pointerId;
    updateJoystickPos(clientX, clientY);
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !isDraggingJoystickRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rawDx = clientX - centerX;
    const rawDy = clientY - centerY;
    const dist = Math.hypot(rawDx, rawDy);
    const maxRadius = 45;

    let clampedX = rawDx;
    let clampedY = rawDy;

    if (dist > maxRadius) {
      clampedX = (rawDx / dist) * maxRadius;
      clampedY = (rawDy / dist) * maxRadius;
    }

    setJoystickKnob({ x: clampedX, y: clampedY });
    const normX = clampedX / maxRadius;
    const normY = clampedY / maxRadius;
    touchDirectionRef.current = { dx: normX, dy: normY };
  };

  const handleJoystickEnd = () => {
    isDraggingJoystickRef.current = false;
    joystickTouchIdRef.current = null;
    setJoystickKnob({ x: 0, y: 0 });
    touchDirectionRef.current = { dx: 0, dy: 0 };
  };

  // Main Game Loop with Expanded World, Smooth Camera and Boss Battle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const moveToward = (
      o: { x: number; y: number; facing: number },
      tx: number,
      ty: number,
      speed: number,
      dt: number
    ) => {
      const dx = tx - o.x;
      const dy = ty - o.y;
      const d = Math.hypot(dx, dy);
      if (d < 1) return;
      const step = Math.min(speed * dt, d);
      o.x = Math.min(WORLD_W - 15, Math.max(15, o.x + (dx / d) * step));
      o.y = Math.min(WORLD_H - 15, Math.max(50, o.y + (dy / d) * step));
      if (Math.abs(dx) > 1) o.facing = dx > 0 ? 1 : -1;
    };

    const wander = (
      o: { x: number; y: number; homeX: number; homeY: number; tx: number; ty: number; wait: number; facing: number },
      speed: number,
      radius: number,
      dt: number
    ) => {
      if (o.wait > 0) {
        o.wait -= dt;
        return;
      }
      if (Math.hypot(o.tx - o.x, o.ty - o.y) < 6) {
        o.wait = 0.6 + Math.random() * 2;
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        o.tx = o.homeX + Math.cos(ang) * dist;
        o.ty = o.homeY + Math.sin(ang) * dist;
        return;
      }
      moveToward(o, o.tx, o.ty, speed, dt);
    };

    const ellipse = (x: number, y: number, rx: number, ry: number, fill: string, stroke?: string) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, fill: string) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const loop = (timestamp: number) => {
      if (!isRunning) return;
      const g = gameRef.current;
      if (!g.lastTime) g.lastTime = timestamp;
      const dt = Math.min((timestamp - g.lastTime) / 1000, 0.05);
      g.lastTime = timestamp;
      g.time += dt;

      const safeCheck = Math.hypot(g.rabbit.x - TOCA.x, g.rabbit.y - TOCA.y) < TOCA.safeRadius;
      setIsInSafeZone(safeCheck);

      // Distances to points of interest
      const distBoss = Math.round(Math.hypot(g.rabbit.x - g.boss.x, g.rabbit.y - g.boss.y) / 10);
      const distBurrow = Math.round(Math.hypot(g.rabbit.x - TOCA.x, g.rabbit.y - TOCA.y) / 10);
      const farmCenterX = FARM.x + FARM.w / 2;
      const farmCenterY = FARM.y + FARM.h / 2;
      const distFarm = Math.round(Math.hypot(g.rabbit.x - farmCenterX, g.rabbit.y - farmCenterY) / 10);
      setDistToBoss(distBoss);
      setDistToBurrow(distBurrow);
      setDistToFarm(distFarm);
      setIsBossNear(Math.hypot(g.rabbit.x - g.boss.x, g.rabbit.y - g.boss.y) < 460);

      if (gameState === 'PLAYING') {
        // --- Input Movement ---
        let dx = touchDirectionRef.current.dx;
        let dy = touchDirectionRef.current.dy;

        if (g.keys.has('ArrowLeft') || g.keys.has('KeyA')) dx -= 1;
        if (g.keys.has('ArrowRight') || g.keys.has('KeyD')) dx += 1;
        if (g.keys.has('ArrowUp') || g.keys.has('KeyW')) dy -= 1;
        if (g.keys.has('ArrowDown') || g.keys.has('KeyS')) dy += 1;

        const inputMagnitude = Math.hypot(dx, dy);
        g.rabbit.moving = inputMagnitude > 0.12;

        if (g.rabbit.moving) {
          const normX = dx / inputMagnitude;
          const normY = dy / inputMagnitude;
          const speedFactor = Math.min(1, inputMagnitude);
          g.rabbit.x += normX * CONFIG.rabbitSpeed * speedFactor * dt;
          g.rabbit.y += normY * CONFIG.rabbitSpeed * speedFactor * dt;

          if (Math.abs(normX) > 0.08) g.rabbit.facing = normX > 0 ? 1 : -1;
          g.rabbit.dirX = normX;
          g.rabbit.dirY = normY;
        }

        // Expanded World Boundaries
        const r = CONFIG.rabbitRadius;
        g.rabbit.x = Math.min(WORLD_W - r, Math.max(r, g.rabbit.x));
        g.rabbit.y = Math.min(WORLD_H - r, Math.max(r + 35, g.rabbit.y));

        // Smooth Camera Follow
        const targetCamX = g.rabbit.x - VIEW_W / 2;
        const targetCamY = g.rabbit.y - VIEW_H / 2;
        g.camera.x += (targetCamX - g.camera.x) * 0.12;
        g.camera.y += (targetCamY - g.camera.y) * 0.12;
        g.camera.x = Math.max(0, Math.min(WORLD_W - VIEW_W, g.camera.x));
        g.camera.y = Math.max(0, Math.min(WORLD_H - VIEW_H, g.camera.y));

        // Obstacles collision
        for (const o of OBSTACLES) {
          const dist = Math.hypot(g.rabbit.x - o.x, g.rabbit.y - o.y);
          const minDist = o.r + r;
          if (dist < minDist && dist > 0) {
            g.rabbit.x = o.x + ((g.rabbit.x - o.x) / dist) * minDist;
            g.rabbit.y = o.y + ((g.rabbit.y - o.y) / dist) * minDist;
          }
        }

        // Rectangles collision (Barn & Fences)
        for (const b of RECTS) {
          const cx = Math.max(b.x, Math.min(g.rabbit.x, b.x + b.w));
          const cy = Math.max(b.y, Math.min(g.rabbit.y, b.y + b.h));
          const dist = Math.hypot(g.rabbit.x - cx, g.rabbit.y - cy);
          if (dist < r && dist > 0) {
            g.rabbit.x = cx + ((g.rabbit.x - cx) / dist) * r;
            g.rabbit.y = cy + ((g.rabbit.y - cy) / dist) * r;
          }
        }

        // Collect wild carrots
        g.carrots = g.carrots.filter(c => {
          if (Math.hypot(g.rabbit.x - c.x, g.rabbit.y - c.y) < CONFIG.pickupDistance) {
            sound.playCarrot();
            setCollected(prev => {
              const next = prev + 1;
              if (next === CONFIG.totalCarrots) {
                // All wild carrots gathered bonus
                sound.playGoldenCarrot();
                setScore(s => s + 50);
              }
              return next;
            });

            const pointsAwarded = c.isBonus ? 20 : CONFIG.pointsPerCarrot;
            setScore(s => s + pointsAwarded);
            setAmmo(a => Math.min(15, a + (c.isBonus ? 2 : 1)));

            onUpdateSave(user => ({
              ...user,
              carrots: user.carrots + (c.isBonus ? 3 : 1),
            }));

            return false;
          }
          return true;
        });

        // Check if player returned to Farm in bottom-left after slaying Boss to claim rewards and finish Phase 1!
        if (g.boss.defeated && g.questStep === 'RETURN_TO_FARM') {
          const inFarm = inRect(g.rabbit.x, g.rabbit.y, FARM, 10);
          if (inFarm) {
            g.questStep = 'COMPLETED';
            setQuestStep('COMPLETED');
            sound.playVictory();
            sound.playGoldenCarrot();

            // Save victory rewards directly
            onUpdateSave(user => ({
              ...user,
              carrots: user.carrots + 30,
              totalGames: user.totalGames + 1,
              highScores: {
                ...user.highScores,
                adventure: Math.max(user.highScores?.adventure || 0, score + 300),
              },
            }));

            setGameState('WON');
          }
        }

        // Safe zone healing and slow ammo refill
        if (safeCheck) {
          g.rabbit.heal += dt;
          if (g.rabbit.heal >= 1.5) {
            g.rabbit.heal = 0;
            setHp(currHp => {
              if (currHp < CONFIG.startHp) {
                sound.playHeal();
                return currHp + 1;
              }
              return currHp;
            });
          }

          g.rabbit.ammoRegen += dt;
          if (g.rabbit.ammoRegen >= 2.5) {
            g.rabbit.ammoRegen = 0;
            setAmmo(currAmmo => (currAmmo < 4 ? currAmmo + 1 : currAmmo));
          }
        } else {
          g.rabbit.heal = 0;
          g.rabbit.ammoRegen = 0;
        }

        g.animals.forEach(a => wander(a, 18, a.range, dt));

        g.rabbit.cooldown = Math.max(0, g.rabbit.cooldown - dt);
        g.rabbit.invuln = Math.max(0, g.rabbit.invuln - dt);

        // ==========================================
        // BOSS LOGIC & AI
        // ==========================================
        const b = g.boss;
        if (b.dyingTimer > 0) {
          b.dyingTimer -= dt;
        }
        if (!b.defeated) {
          if (b.hitFlash > 0) b.hitFlash -= dt;

          const distToRabbit = Math.hypot(g.rabbit.x - b.x, g.rabbit.y - b.y);
          b.enraged = b.hp <= CONFIG.bossMaxHp / 2;
          setIsBossEnraged(b.enraged);
          setBossHp(b.hp);

          const bossSpeed = b.enraged ? 135 : 105;
          b.attackTimer -= dt;

          if (b.state === 'IDLE') {
            if (distToRabbit < 380 && !safeCheck) {
              b.state = 'CHASE';
            } else {
              wander(b, 25, 90, dt);
            }
          } else if (b.state === 'CHASE') {
            moveToward(b, g.rabbit.x, g.rabbit.y, bossSpeed, dt);

            // Trigger Special Attack
            if (b.attackTimer <= 0 && !safeCheck) {
              if (distToRabbit < 120) {
                // Stomp Shockwave Attack!
                b.attackTimer = b.enraged ? 2.5 : 3.8;
                sound.playSpring();
                b.shockwaves.push({
                  x: b.x,
                  y: b.y,
                  r: 10,
                  maxR: 130,
                  alpha: 1,
                });
              } else if (Math.random() < 0.5) {
                // Wind-up for Charge Attack
                b.state = 'CHARGE_WINDUP';
                b.stateTimer = 0.75;
                b.chargeTarget = { x: g.rabbit.x, y: g.rabbit.y };
              } else {
                // Shoot 3 Dark Spores
                b.attackTimer = b.enraged ? 2.8 : 4.0;
                sound.playShoot();
                const baseAng = Math.atan2(g.rabbit.y - b.y, g.rabbit.x - b.x);
                [-0.35, 0, 0.35].forEach(offset => {
                  const ang = baseAng + offset;
                  b.projectiles.push({
                    x: b.x,
                    y: b.y,
                    vx: Math.cos(ang) * 220,
                    vy: Math.sin(ang) * 220,
                    life: 2.2,
                  });
                });
              }
            }

            if (distToRabbit > 550 || safeCheck) {
              b.state = 'IDLE';
            }
          } else if (b.state === 'CHARGE_WINDUP') {
            b.stateTimer -= dt;
            if (b.stateTimer <= 0) {
              b.state = 'CHARGE';
              b.stateTimer = 0.9;
              sound.playMushroom();
            }
          } else if (b.state === 'CHARGE') {
            b.stateTimer -= dt;
            moveToward(b, b.chargeTarget.x, b.chargeTarget.y, bossSpeed * 2.2, dt);
            if (b.stateTimer <= 0 || Math.hypot(b.x - b.chargeTarget.x, b.y - b.chargeTarget.y) < 15) {
              b.state = 'CHASE';
              b.attackTimer = b.enraged ? 2.0 : 3.2;
            }
          }

          // Boss Shockwaves expansion
          b.shockwaves.forEach(sw => {
            sw.r += 140 * dt;
            sw.alpha = Math.max(0, 1 - sw.r / sw.maxR);

            // Hit rabbit with shockwave
            const dRabbit = Math.hypot(g.rabbit.x - sw.x, g.rabbit.y - sw.y);
            if (Math.abs(dRabbit - sw.r) < 14 && g.rabbit.invuln <= 0 && !safeCheck) {
              sound.playHurt();
              g.rabbit.invuln = CONFIG.invulnTime;
              setHp(currHp => {
                const next = currHp - 1;
                if (next <= 0) {
                  sound.playGameOver();
                  setGameState('LOST');
                }
                return Math.max(0, next);
              });
            }
          });
          b.shockwaves = b.shockwaves.filter(sw => sw.r < sw.maxR);

          // Boss Projectiles movement
          b.projectiles.forEach(pr => {
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            pr.life -= dt;

            // Hit rabbit with spore
            if (Math.hypot(g.rabbit.x - pr.x, g.rabbit.y - pr.y) < CONFIG.rabbitRadius + 8 && g.rabbit.invuln <= 0 && !safeCheck) {
              pr.life = 0;
              sound.playHurt();
              g.rabbit.invuln = CONFIG.invulnTime;
              setHp(currHp => {
                const next = currHp - 1;
                if (next <= 0) {
                  sound.playGameOver();
                  setGameState('LOST');
                }
                return Math.max(0, next);
              });
            }
          });
          b.projectiles = b.projectiles.filter(pr => pr.life > 0);

          // Boss contact damage
          if (distToRabbit < b.r + CONFIG.rabbitRadius - 2 && g.rabbit.invuln <= 0 && !safeCheck) {
            sound.playHurt();
            g.rabbit.invuln = CONFIG.invulnTime;
            setHp(currHp => {
              const next = currHp - 1;
              if (next <= 0) {
                sound.playGameOver();
                setGameState('LOST');
              }
              return Math.max(0, next);
            });
          }
        }

        // Shots physics & hit detection
        for (const sh of g.shots) {
          sh.x += sh.vx * dt;
          sh.y += sh.vy * dt;
          sh.life -= dt;
          if (sh.x < 0 || sh.x > WORLD_W || sh.y < 0 || sh.y > WORLD_H) sh.life = 0;
          if (
            OBSTACLES.some(o => Math.hypot(sh.x - o.x, sh.y - o.y) < o.r) ||
            RECTS.some(rec => inRect(sh.x, sh.y, rec))
          ) {
            sh.life = 0;
          }

          // Hit Regular Monsters
          for (const m of g.monsters) {
            if (m.dying === 0 && Math.hypot(sh.x - m.x, sh.y - m.y) < m.r + 9) {
              m.dying = 0.5;
              sh.life = 0;
              sound.playMushroom();
              setScore(s => s + CONFIG.monsterKillPoints);
              setMonstersSlain(ms => ms + 1);

              if (Math.random() < 0.5) {
                g.carrots.push({
                  x: m.x,
                  y: m.y,
                  phase: Math.random() * 6,
                  isBonus: true,
                });
              }
            }
          }

          // Hit Boss
          if (!b.defeated && Math.hypot(sh.x - b.x, sh.y - b.y) < b.r + 8) {
            sh.life = 0;
            b.hp -= 1;
            b.hitFlash = 0.2;
            sound.playHit();
            setBossHp(b.hp);

            if (b.hp <= 0) {
              // Boss Defeated!
              b.defeated = true;
              b.state = 'DYING';
              b.dyingTimer = 2.0;
              sound.playVictory();
              setScore(s => s + 150);
              setBossDefeatedBanner(true);
              g.questStep = 'RETURN_TO_FARM';
              setQuestStep('RETURN_TO_FARM');

              // Shower of 5 Golden Carrots!
              for (let i = 0; i < 5; i++) {
                const ang = (i / 5) * Math.PI * 2;
                g.carrots.push({
                  x: b.x + Math.cos(ang) * 45,
                  y: b.y + Math.sin(ang) * 45,
                  phase: i,
                  isBonus: true,
                });
              }

              // A fase só acaba quando voltar para a fazenda no canto inferior esquerdo!
            }
          }
        }
        g.shots = g.shots.filter(sh => sh.life > 0);

        // Monster AI & Chasing
        for (const m of g.monsters) {
          if (m.dying > 0) {
            m.dying -= dt;
            if (m.dying <= 0) m.gone = true;
            continue;
          }

          const d = Math.hypot(g.rabbit.x - m.x, g.rabbit.y - m.y);
          const chasing =
            d < CONFIG.monsterSight &&
            !safeCheck &&
            Math.hypot(m.x - m.homeX, m.y - m.homeY) < 320;

          if (chasing) {
            moveToward(m, g.rabbit.x, g.rabbit.y, CONFIG.monsterChaseSpeed, dt);
          } else {
            wander(m, CONFIG.monsterWanderSpeed, 80, dt);
          }

          if (d < m.r + CONFIG.rabbitRadius - 2 && g.rabbit.invuln <= 0 && !safeCheck) {
            sound.playHurt();
            g.rabbit.invuln = CONFIG.invulnTime;
            setHp(currHp => {
              const nextHp = currHp - 1;
              if (nextHp <= 0) {
                sound.playGameOver();
                setGameState('LOST');
              }
              return Math.max(0, nextHp);
            });
          }
        }
        g.monsters = g.monsters.filter(m => !m.gone);

        // Respawn regular monsters if low
        if (g.monsters.length < 4) {
          g.respawnTimer += dt;
          if (g.respawnTimer > 5.0) {
            g.respawnTimer = 0;
            const freeSpawns = MONSTER_SPAWNS.slice(0, 3);
            freeSpawns.forEach(p => {
              g.monsters.push({
                homeX: p.x,
                homeY: p.y,
                x: p.x,
                y: p.y,
                tx: p.x,
                ty: p.y,
                r: 16,
                dying: 0,
                gone: false,
                wait: 0,
                facing: 1,
                phase: Math.random() * 6,
              });
            });
          }
        }
      }

      // ==========================================
      // RENDERING CANVAS WITH CAMERA TRANSLATION
      // ==========================================
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);

      ctx.save();
      ctx.translate(-g.camera.x, -g.camera.y);

      // 1. Background Grass (World dimensions)
      ctx.fillStyle = '#8ecf68';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);

      // Soft grass stripe bands
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let y = 0; y < WORLD_H; y += 90) ctx.fillRect(0, y, WORLD_W, 45);

      // Flowers
      for (const f of FLOWERS) {
        ctx.fillStyle = f.color;
        for (let a = 0; a < 5; a++) {
          ctx.beginPath();
          ctx.arc(f.x + Math.cos(a * 1.257) * 4, f.y + Math.sin(a * 1.257) * 4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffcf33';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. North Deep Forest Canopy
      ctx.fillStyle = '#4a993b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(WORLD_W, 0);
      for (let x = WORLD_W; x >= 0; x -= 40) ctx.lineTo(x, 150 + Math.sin(x * 0.04) * 16);
      ctx.closePath();
      ctx.fill();

      // 3. Dirt Path connecting Farm, Burrow and North Boss Lair
      ctx.fillStyle = '#e5c58a';
      // Path from Farm Gate (x: 462, y: 800) past Burrow into the central meadow
      ctx.beginPath();
      ctx.moveTo(462, 800);
      ctx.quadraticCurveTo(560, 800, 750, 750);
      ctx.lineTo(1150, 750);
      ctx.lineWidth = 32;
      ctx.strokeStyle = '#e5c58a';
      ctx.stroke();

      // Path leading North to Boss Lair
      ctx.beginPath();
      ctx.moveTo(560, 780);
      ctx.quadraticCurveTo(620, 480, BOSS_LAIR.x, BOSS_LAIR.y + 60);
      ctx.lineWidth = 26;
      ctx.strokeStyle = '#dfbe81';
      ctx.stroke();

      // 4. Boss Lair Arena (Ancient Stone Circle)
      ctx.save();
      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      ctx.arc(BOSS_LAIR.x, BOSS_LAIR.y, BOSS_LAIR.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(75, 45, 95, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      // Rune text
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.fillText('👑 Santuário do Titã da Floresta', BOSS_LAIR.x, BOSS_LAIR.y - 120);
      ctx.restore();

      // 5. Farm grounds, crops & corral (Bottom Left Corner)
      ctx.fillStyle = '#a2d667';
      ctx.fillRect(FARM.x, FARM.y, FARM.w, FARM.h);
      ctx.fillStyle = '#dfcb82';
      ctx.fillRect(FARM.x + 20, FARM.y + 130, FARM.w - 40, 150);
      ctx.fillStyle = '#825224';
      ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
      for (let y = FIELD.y + 14; y < FIELD.y + FIELD.h; y += 18) {
        for (let x = FIELD.x + 14; x < FIELD.x + FIELD.w; x += 16) {
          ellipse(x, y, 5, 7, '#38a14e');
        }
      }

      // Farm Header Sign
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚜 Fazenda dos Animais 🌾', FARM.x + FARM.w / 2, FARM.y + 24);

      // 6. Barn (Red Barn in bottom-left farm)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(BARN.x, BARN.y + 12, BARN.w, BARN.h - 12);
      tri(BARN.x - 10, BARN.y + 14, BARN.x + BARN.w / 2, BARN.y - 24, BARN.x + BARN.w + 10, BARN.y + 14, '#713f12');
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(BARN.x + BARN.w / 2 - 20, BARN.y + 36, 40, 42);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 2;
      ctx.strokeRect(BARN.x + BARN.w / 2 - 20, BARN.y + 36, 40, 42);

      // Celebratory Arrival Beacon when Boss is defeated!
      if (g.questStep === 'RETURN_TO_FARM') {
        const pulse = (Math.sin(g.time * 6) + 1) * 0.5;
        ctx.save();
        ctx.fillStyle = `rgba(251, 191, 36, ${0.28 + pulse * 0.28})`;
        ctx.beginPath();
        ctx.arc(462, 800, 46 + pulse * 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌾 ENTRE NA FAZENDA! ✨', 462, 735);
        ctx.fillText('🎁 Pegar Recompensas', 462, 750);
        ctx.restore();
      }

      // 7. Wooden fences
      for (const f of FENCE) {
        ctx.fillStyle = '#a16207';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = '#78350f';
        if (f.w > f.h) {
          for (let x = f.x; x <= f.x + f.w; x += 28) ctx.fillRect(x - 3, f.y - 6, 6, f.h + 12);
        } else {
          for (let y = f.y; y <= f.y + f.h; y += 28) ctx.fillRect(f.x - 6, y - 3, f.w + 12, 6);
        }
      }

      // 8. Toca Safe Zone (Starting Burrow)
      ctx.save();
      const pulse = Math.sin(g.time * 4) * 4;
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = safeCheck ? 'rgba(74, 222, 128, 0.9)' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = safeCheck ? 3 : 2;
      ctx.beginPath();
      ctx.arc(TOCA.x, TOCA.y, TOCA.safeRadius + (safeCheck ? pulse : 0), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ellipse(TOCA.x, TOCA.y + 8, 52, 34, '#a67846', '#7a4b26');
      ellipse(TOCA.x, TOCA.y + 10, 32, 20, '#2b1a10');
      ellipse(TOCA.x, TOCA.y + 7, 32, 14, '#4a2f1a');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ Toca Segura (Cura)', TOCA.x, TOCA.y + 58);
      ctx.restore();

      // Draw Collectible Carrots
      g.carrots.forEach(c => {
        const bob = Math.sin(g.time * 3 + c.phase) * 3;
        const x = c.x;
        const y = c.y + bob;
        ellipse(c.x, c.y + 14, 10, 3, 'rgba(0,0,0,0.15)');

        ctx.fillStyle = c.isBonus ? '#10b981' : '#22c55e';
        ellipse(x - 4, y - 13, 3, 7, ctx.fillStyle);
        ellipse(x + 4, y - 13, 3, 7, ctx.fillStyle);
        ellipse(x, y - 15, 3, 8, '#4ade80');

        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.quadraticCurveTo(x, y - 14, x + 8, y - 8);
        ctx.lineTo(x, y + 14);
        ctx.closePath();
        ctx.fillStyle = c.isBonus ? '#fbbf24' : '#f97316';
        ctx.fill();
        ctx.strokeStyle = c.isBonus ? '#d97706' : '#ea580c';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 3, y - 3);
        ctx.lineTo(x + 1, y - 3);
        ctx.moveTo(x - 1, y + 3);
        ctx.lineTo(x + 3, y + 3);
        ctx.stroke();
      });

      // Y-Sorted Draw (Obstacles, Monsters, Animals, Boss & Player)
      const drawQueue: { y: number; draw: () => void }[] = [];

      OBSTACLES.forEach(o => {
        drawQueue.push({
          y: o.y,
          draw: () => {
            ellipse(o.x, o.y + o.r * 0.8, o.r * 1.1, o.r * 0.4, 'rgba(0,0,0,0.15)');
            if (o.type === 'tree') {
              ctx.fillStyle = '#78350f';
              ctx.fillRect(o.x - 8, o.y - 2, 16, o.r + 6);
              ellipse(o.x, o.y - 20, 34, 32, '#15803d', '#14532d');
              ellipse(o.x - 12, o.y - 28, 11, 9, '#22c55e');
              ellipse(o.x + 18, o.y - 12, 7, 6, '#ef4444');
            } else if (o.type === 'bush') {
              ellipse(o.x - 12, o.y, 16, 14, '#22c55e', '#15803d');
              ellipse(o.x + 12, o.y, 16, 14, '#22c55e', '#15803d');
              ellipse(o.x, o.y - 10, 18, 15, '#4ade80', '#15803d');
            } else {
              ellipse(o.x, o.y, o.r + 2, o.r - 2, '#9ca3af', '#6b7280');
              ellipse(o.x - 4, o.y - 4, 6, 4, '#d1d5db');
            }
          },
        });
      });

      // Regular Monsters
      g.monsters.forEach(m => {
        drawQueue.push({
          y: m.y,
          draw: () => {
            const bob = Math.sin(g.time * 6 + m.phase) * 2;
            const p = m.dying > 0 ? m.dying / 0.5 : 1;
            ctx.save();
            ctx.translate(m.x, m.y + bob);
            ctx.globalAlpha = p;
            ctx.scale(p, p);
            ellipse(0, 14, 14, 4, 'rgba(0,0,0,0.18)');
            tri(-11, -9, -15, -23, -3, -13, '#ffd93b');
            tri(11, -9, 15, -23, 3, -13, '#ffd93b');
            ellipse(0, 0, 17, 15, '#8e5bd6', '#6a3fb0');
            ellipse(-6, -3, 4.5, 5, '#fff');
            ellipse(6, -3, 4.5, 5, '#fff');
            ellipse(-5 + m.facing, -2, 2, 2.5, '#2b1a4a');
            ellipse(7 + m.facing, -2, 2, 2.5, '#2b1a4a');
            ctx.strokeStyle = '#3b1a5a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-11, -10);
            ctx.lineTo(-3, -7);
            ctx.moveTo(11, -10);
            ctx.lineTo(3, -7);
            ctx.stroke();
            ellipse(0, 7, 7, 3, '#3b1a5a');
            ctx.restore();

            if (m.dying > 0) {
              ctx.fillStyle = `rgba(255,217,59,${p})`;
              for (let i = 0; i < 6; i++) {
                const a = i * 1.047;
                const d = 10 + (1 - p) * 34;
                ctx.beginPath();
                ctx.arc(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, 4 * p + 1, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          },
        });
      });

      // Animals
      g.animals.forEach(a => {
        drawQueue.push({
          y: a.y,
          draw: () => {
            const isCelebrating = g.questStep === 'RETURN_TO_FARM' || g.questStep === 'COMPLETED';
            const extraHop = isCelebrating ? -Math.abs(Math.sin(g.time * 8 + a.x)) * 8 : 0;
            ctx.save();
            ctx.translate(a.x, a.y + extraHop);
            ellipse(0, 12, 13, 4, 'rgba(0,0,0,0.15)');
            ctx.scale(-a.facing, 1);
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.emoji, 0, 0);

            if (isCelebrating) {
              ctx.font = '14px serif';
              ctx.fillText('❤️', 0, -22);
            }
            ctx.restore();
          },
        });
      });

      // THE BOSS: GORGON - O REI CHIFRUDO
      const boss = g.boss;
      if (!boss.defeated || boss.dyingTimer > 0) {
        drawQueue.push({
          y: boss.y,
          draw: () => {
            if (boss.defeated && boss.dyingTimer > 0) {
              const p = Math.max(0, boss.dyingTimer / 2.0);
              ctx.save();
              ctx.translate(boss.x, boss.y);
              ctx.globalAlpha = p;
              ctx.scale(p * 1.25, p * 1.25);
              ctx.rotate((1 - p) * Math.PI * 3);

              ellipse(0, 0, 42, 38, '#fbbf24', '#f59e0b');

              // Bursting gold & ruby stars
              for (let i = 0; i < 8; i++) {
                const a = i * (Math.PI / 4) + (1 - p) * 5;
                const dist = (1 - p) * 65;
                ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#ec4899';
                ctx.beginPath();
                ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 5 * p + 2, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
              return;
            }

            const bob = Math.sin(g.time * 5) * 3;
            ctx.save();
            ctx.translate(boss.x, boss.y + bob);

            // Red charge telegraph line
            if (boss.state === 'CHARGE_WINDUP') {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
              ctx.lineWidth = 5;
              ctx.setLineDash([8, 8]);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(boss.chargeTarget.x - boss.x, boss.chargeTarget.y - boss.y);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Shadow
            ellipse(0, 32, 34, 10, 'rgba(0,0,0,0.25)');

            // Flash effect when hit
            if (boss.hitFlash > 0) {
              ctx.filter = 'brightness(2) contrast(1.5)';
            }

            // Horns (Golden Titan Horns)
            tri(-26, -18, -44, -54, -8, -26, '#eab308');
            tri(26, -18, 44, -54, 8, -26, '#eab308');
            tri(-18, -12, -30, -38, -6, -18, '#fde047');
            tri(18, -12, 30, -38, 6, -18, '#fde047');

            // Boss Body
            const bodyColor = boss.enraged ? '#7e22ce' : '#581c87';
            const strokeColor = boss.enraged ? '#dc2626' : '#3b0764';
            ellipse(0, 0, 38, 34, bodyColor, strokeColor);

            // Spikes on shoulders
            tri(-34, -4, -46, -14, -28, 6, '#4c1d95');
            tri(34, -4, 46, -14, 28, 6, '#4c1d95');

            // Glowing Eyes
            const eyeColor = boss.enraged ? '#ef4444' : '#f59e0b';
            ellipse(-14, -8, 7, 8, '#ffffff');
            ellipse(14, -8, 7, 8, '#ffffff');
            ellipse(-12 + boss.facing * 2, -6, 4, 5, eyeColor);
            ellipse(16 + boss.facing * 2, -6, 4, 5, eyeColor);

            // Angry Eyebrows
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-22, -18);
            ctx.lineTo(-7, -12);
            ctx.moveTo(22, -18);
            ctx.lineTo(7, -12);
            ctx.stroke();

            // Mouth & Fangs
            ellipse(0, 14, 14, 7, '#1e1b4b');
            tri(-7, 10, -5, 16, -3, 10, '#ffffff');
            tri(7, 10, 5, 16, 3, 10, '#ffffff');

            ctx.restore();
          },
        });
      }

      // Boss Shockwaves
      boss.shockwaves.forEach(sw => {
        ctx.save();
        ctx.strokeStyle = `rgba(168, 85, 247, ${sw.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Boss Projectiles (Dark Spores)
      boss.projectiles.forEach(pr => {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ellipse(0, 0, 7, 7, '#a855f7', '#581c87');
        ellipse(-2, -2, 3, 3, '#e9d5ff');
        ctx.restore();
      });

      // Bunny Player
      drawQueue.push({
        y: g.rabbit.y,
        draw: () => {
          const hop = g.rabbit.moving ? -Math.abs(Math.sin(g.time * 14)) * 6 : 0;
          ctx.save();
          ctx.translate(g.rabbit.x, g.rabbit.y + hop);
          ctx.scale(g.rabbit.facing, 1);
          if (g.rabbit.invuln > 0 && Math.floor(g.time * 20) % 2 === 0) {
            ctx.globalAlpha = 0.35;
          }

          ctx.save();
          ctx.translate(0, -hop);
          ellipse(0, 14, 15, 4, 'rgba(0,0,0,0.18)');
          ctx.restore();

          const fur = activeSkin.colors.fur;
          const belly = activeSkin.colors.belly;
          const innerEar = activeSkin.colors.innerEar;
          const nose = activeSkin.colors.nose;
          const eyes = activeSkin.colors.eyes;
          const isBambi = activeSkin.id === 'bambi';
          const line = isBambi ? '#4b5563' : '#b8b0c4';

          ellipse(-14, 6, 6, 6, fur, line);
          ellipse(-3, -26, 5, 14, fur, line);
          ellipse(-3, -25, 2.5, 9, innerEar);
          ellipse(6, -27, 5, 14, fur, line);
          ellipse(6, -26, 2.5, 9, innerEar);
          ellipse(-2, 5, 13, 10, fur, line);
          ellipse(1, 6, 9, 7, belly);
          ellipse(6, -4, 11, 10, fur, line);
          ellipse(8, 12, 5, 3, fur, line);
          ellipse(10, -6, 2, 2.5, isBambi ? '#f8fafc' : eyes);
          ellipse(8, -1, 3, 2, isBambi ? 'rgba(75,85,99,0.35)' : 'rgba(255,140,170,0.55)');
          ellipse(16, -3, 2, 1.6, nose);

          if (activeHat.id === 'magic_tophat') {
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(0, -42, 14, 16);
            ctx.fillRect(-4, -28, 22, 4);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(0, -30, 14, 3);
          } else if (activeHat.id === 'straw_hat') {
            ellipse(6, -28, 18, 5, '#fde047', '#ca8a04');
            ellipse(6, -32, 10, 6, '#fde047', '#ca8a04');
          } else if (activeHat.id === 'flower_pin' || activeHat.id === 'pink_bow') {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(8, -25, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(8, -25, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (activeHat.id === 'royal_crown') {
            ctx.fillStyle = '#eab308';
            tri(0, -32, 4, -40, 8, -32, '#eab308');
            tri(6, -32, 10, -42, 14, -32, '#eab308');
            tri(12, -32, 16, -40, 20, -32, '#eab308');
          } else if (activeHat.id === 'sunglasses') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(7, -8, 7, 5);
          }

          ctx.restore();
        },
      });

      drawQueue.sort((a, b) => a.y - b.y).forEach(i => i.draw());

      // Drawn Shots
      g.shots.forEach(sh => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(Math.atan2(sh.vy, sh.vx));
        tri(-8, -5, -8, 5, 10, 0, '#ff8c1a');
        ellipse(-11, -2, 4, 2, '#2fbf4f');
        ellipse(-11, 2, 4, 2, '#2fbf4f');
        ctx.restore();
      });

      // Aim indicator
      if (ammo > 0 && gameState === 'PLAYING') {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(
          g.rabbit.x + g.rabbit.dirX * 38,
          g.rabbit.y - 4 + g.rabbit.dirY * 38,
          4.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore(); // Restore camera translation

      gameRef.current.animationId = requestAnimationFrame(loop);
    };

    gameRef.current.animationId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (gameRef.current.animationId) cancelAnimationFrame(gameRef.current.animationId);
    };
  }, [gameState, ammo, score, freeRoam, activeSkin, activeHat, onOpenArcade, onUpdateSave]);

  // Touch canvas to aim and shoot (with Camera Offset!)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;

    // Translated to world coordinates via camera!
    const clickWorldX = (e.clientX - rect.left) * scaleX + gameRef.current.camera.x;
    const clickWorldY = (e.clientY - rect.top) * scaleY + gameRef.current.camera.y;

    shootAtTarget(clickWorldX, clickWorldY);
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sound.setSoundEnabled(next);
    onUpdateSave(u => ({ ...u, soundEnabled: next }));
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen bg-stone-950 flex flex-col items-center justify-center overflow-hidden select-none z-30 touch-none"
    >
      {/* LANDSCAPE ADVICE OVERLAY */}
      {isPortrait && !dismissRotatePrompt && (
        <div className="absolute inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 animate-spin">
            <RotateCw className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-amber-300">
            Vire o celular na Horizontal! 🔄
          </h2>
          <p className="text-stone-300 text-xs max-w-xs leading-relaxed">
            O mundo aberto foi expandido! Jogue em tela cheia na horizontal para ter visão panorâmica completa com câmera deslizante e controles táteis de polegar.
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
            <button
              onClick={toggleFullscreen}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-bold text-stone-950 text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Girar para Tela Cheia ⛶</span>
            </button>
            <button
              onClick={() => setDismissRotatePrompt(true)}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl transition-all cursor-pointer"
            >
              Jogar assim mesmo
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TOP COMPACT HUD */}
      <header className="absolute top-2 inset-x-3 z-40 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: Minimized Menu Button + Hearts + Carrots + Ammo */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => onOpenMenu?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/85 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl border border-amber-400/30 backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer"
            aria-label="Abrir Menu de Modos"
          >
            <Menu className="w-4 h-4 text-amber-400" />
            <span className="hidden xs:inline">Menu</span>
          </button>

          {/* Hearts */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-stone-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-md">
            {Array.from({ length: CONFIG.startHp }).map((_, i) => (
              <span key={i} className="text-sm">
                {i < hp ? '❤️' : '🖤'}
              </span>
            ))}
          </div>

          {/* Carrots collected */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-stone-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-md text-xs font-bold text-amber-300">
            <span>🥕</span>
            <span>{collected}/{CONFIG.totalCarrots}</span>
          </div>

          {/* Ammo badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-stone-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-md text-xs font-bold text-amber-400">
            <span>🎒</span>
            <span>{ammo}</span>
          </div>
        </div>

        {/* Center: Mission Objective or Safe Zone Indicator */}
        <div className="flex items-center gap-2">
          {isInSafeZone ? (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 text-stone-950 text-[11px] font-black border border-emerald-300 shadow-lg animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              <span>TOCA: CURANDO!</span>
            </div>
          ) : questStep === 'RETURN_TO_FARM' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-900/90 to-amber-900/90 backdrop-blur-md rounded-xl border-2 border-amber-400 text-[11px] font-black text-amber-300 shadow-xl animate-pulse">
              <span>🌾</span>
              <span>Vá à Fazenda pegar as Recompensas!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/80 backdrop-blur-md rounded-xl border border-purple-500/35 text-[11px] font-bold text-white shadow-md">
              <span className="text-purple-400">👑</span>
              <span className="text-stone-300 hidden sm:inline">Missão:</span>
              <span className="text-amber-300 font-extrabold">Derrotar Gorgon</span>
            </div>
          )}
        </div>

        {/* Right Side: Radar distance indicators & Tools */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Compass Badges */}
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-stone-300">
            {questStep === 'RETURN_TO_FARM' ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border-2 border-emerald-400 text-emerald-300 font-extrabold shadow-lg animate-pulse">
                🌾 Fazenda dos Animais: {distToFarm}m
              </span>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded-lg bg-stone-900/80 border border-purple-500/40 text-purple-300">
                  👑 Boss: {distToBoss}m
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-stone-900/80 border border-amber-500/40 text-amber-300">
                  🌾 Fazenda: {distToFarm}m
                </span>
              </>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
            title="Som"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>
        </div>
      </header>

      {/* BOSS HEALTH BAR (Appears when player is in the Boss region) */}
      {isBossNear && !gameRef.current.boss.defeated && gameState === 'PLAYING' && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 w-72 sm:w-96 bg-stone-900/90 backdrop-blur-md border border-purple-500/60 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between w-full text-xs font-black text-purple-300">
            <span className="flex items-center gap-1.5">
              <span>👑</span>
              <span>Gorgon, o Rei Chifrudo</span>
              {isBossEnraged && (
                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full uppercase font-bold animate-pulse">
                  FÚRIA!
                </span>
              )}
            </span>
            <span className="font-mono text-white text-[11px]">{bossHp}/{CONFIG.bossMaxHp} HP</span>
          </div>
          <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
            <div
              className={`h-full transition-all duration-150 ${
                isBossEnraged
                  ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-rose-600'
                  : 'bg-gradient-to-r from-amber-400 via-purple-500 to-purple-600'
              }`}
              style={{ width: `${Math.max(0, (bossHp / CONFIG.bossMaxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* BOSS DEFEATED NOTIFICATION BANNER */}
      {bossDefeatedBanner && questStep === 'RETURN_TO_FARM' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 text-stone-950 font-black text-xs sm:text-sm shadow-2xl border-2 border-white animate-bounce flex items-center gap-2">
          <span>🏆</span>
          <span>REI CHIFRUDO DERROTADO! VÁ PARA A FAZENDA NO CANTO INFERIOR ESQUERDO! 🌾</span>
        </div>
      )}

      {/* FULLSCREEN HORIZONTAL CANVAS CONTAINER */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onPointerDown={handleCanvasPointerDown}
          className="max-w-full max-h-full aspect-[880/580] object-contain block cursor-crosshair touch-none"
        />

        {/* Overlay: MENU */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-40 space-y-3.5">
            <div className="text-4xl sm:text-5xl animate-bounce">🐰 👑 🌾</div>
            <h1 className="text-2xl sm:text-4xl font-black font-display text-amber-400 drop-shadow-md">
              Fase 1: O Bosque Ancestral
            </h1>
            <p className="text-stone-200 text-xs sm:text-sm max-w-md leading-relaxed">
              Explore o mundo aberto, colha cenouras para sua munição, <strong>derrote o terrível Gorgon, o Rei Chifrudo</strong> no Santuário ao Norte e <strong>retorne para a fazenda dos animais</strong> no canto inferior esquerdo para resgatar as recompensas e vencer a fase!
            </p>

            <button
              onClick={startNewGame}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-base sm:text-lg rounded-2xl shadow-xl border-b-4 border-amber-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>INICIAR FASE 1</span>
              <span>⚔️</span>
            </button>
          </div>
        )}

        {/* Overlay: WON (Triggered ONLY after returning to Farm after boss is defeated) */}
        {gameState === 'WON' && (
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/20 border-2 border-amber-400 rounded-full flex items-center justify-center shadow-2xl text-3xl sm:text-4xl animate-bounce">
              🏆
            </div>
            
            <div className="space-y-1">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-widest block">
                FASE 1 CONCLUÍDA COM SUCESSO! 🌾
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white drop-shadow-md">
                RECOMPENSAS RESGATADAS NA FAZENDA!
              </h2>
            </div>

            <p className="text-stone-300 text-xs sm:text-sm max-w-md leading-relaxed">
              Você derrotou o temível Rei Chifrudo e retornou vitorioso à fazenda dos animais no canto inferior esquerdo! Todos os bichinhos celebram sua bravura.
            </p>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 font-mono text-sm py-1 w-full max-w-sm">
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-purple-500/40">
                <span className="text-purple-300 block text-[10px] uppercase font-bold">Chefe</span>
                <span className="text-white font-bold text-xs sm:text-sm">Vencido! 👑</span>
              </div>
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-amber-400/40">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Cenouras</span>
                <span className="text-amber-300 font-bold text-xs sm:text-sm">{collected}/{CONFIG.totalCarrots} 🥕</span>
              </div>
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-rose-500/40">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Fazenda</span>
                <span className="text-emerald-300 font-bold text-xs sm:text-sm">Salva! 🌾</span>
              </div>
            </div>

            <div className="bg-amber-500/15 border border-amber-400/40 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Recompensa de Vitória: +30 Cenouras adicionadas à sua Horta!</span>
            </div>

            <div className="flex flex-row flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={() => {
                  setFreeRoam(true);
                  setGameState('PLAYING');
                }}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer border border-stone-600"
              >
                Modo Livre 🌲
              </button>
              <button
                onClick={startNewGame}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-stone-950 text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Jogar Novamente 🔄
              </button>
            </div>
          </div>
        )}

        {/* Overlay: LOST */}
        {gameState === 'LOST' && (
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-40 space-y-3.5">
            <div className="text-4xl sm:text-5xl">😵 🐰 💥</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-rose-400">
              O coelhinho foi derrotado...
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm max-w-sm">
              Volte para a segurança da toca para descansar e recuperar suas forças!
            </p>

            <button
              onClick={respawnAtBurrow}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg border-b-4 border-amber-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Voltar para a Toca (Reviver)</span>
            </button>
          </div>
        )}

        {/* VIRTUAL ANALOG JOYSTICK ("Bolinha pra se mover") */}
        <div
          ref={joystickBaseRef}
          onPointerDown={e => {
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            handleJoystickStart(e.clientX, e.clientY, e.pointerId);
          }}
          onPointerMove={e => {
            if (isDraggingJoystickRef.current) {
              e.stopPropagation();
              updateJoystickPos(e.clientX, e.clientY);
            }
          }}
          onPointerUp={e => {
            e.stopPropagation();
            handleJoystickEnd();
          }}
          onPointerCancel={e => {
            e.stopPropagation();
            handleJoystickEnd();
          }}
          className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 z-30 select-none touch-none w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/35 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Controle de Movimentação Virtual"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-full h-0.5 bg-white" />
            <div className="h-full w-0.5 bg-white absolute" />
          </div>

          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border-2 border-white/90 shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
            }}
          >
            <span className="text-base sm:text-lg">🐾</span>
          </div>
        </div>

        {/* ACTION BUTTON: ATIRAR CENOURA */}
        <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-30 flex flex-col items-center select-none touch-none">
          <button
            onPointerDown={e => {
              e.stopPropagation();
              throwCarrot();
            }}
            disabled={ammo <= 0}
            className={`w-22 h-22 sm:w-26 sm:h-26 rounded-3xl font-black flex flex-col items-center justify-center gap-0.5 shadow-2xl active:scale-90 transition-all cursor-pointer ${
              ammo > 0
                ? 'bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 text-stone-950 border-4 border-amber-200 ring-4 ring-amber-500/30'
                : 'bg-stone-800 text-stone-500 border-2 border-stone-700 opacity-60 cursor-not-allowed'
            }`}
            aria-label="Atirar Cenoura"
          >
            <span className="text-2xl sm:text-3xl">🥕</span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">Atirar</span>
            <span className="text-[10px] font-mono bg-black/30 text-amber-100 px-2 py-0.5 rounded-full">
              {ammo}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
