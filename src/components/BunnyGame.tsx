import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sound } from '../utils/audio';
import { BUNNY_SKINS, BUNNY_HATS, TRAILS } from '../utils/constants';
import { BunnySkinId, BunnyHatId, TrailId, UserSaveData } from '../types/game';
import { 
  Play, 
  RotateCcw, 
  Pause, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Trophy,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';

interface BunnyGameProps {
  saveData: UserSaveData;
  onUpdateSave: (updater: (prev: UserSaveData) => UserSaveData) => void;
  onGoToBurrow?: () => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'standard' | 'mushroom' | 'moving' | 'fragile' | 'spring';
  vx?: number;
  broken?: boolean;
  springActive?: boolean;
  hasHazard?: boolean;
  hazardX?: number;
  hazardDir?: number;
}

interface Item {
  x: number;
  y: number;
  type: 'carrot' | 'golden_carrot' | 'strawberry' | 'balloon' | 'shield';
  collected?: boolean;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'star' | 'heart' | 'carrot';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export const BunnyGame: React.FC<BunnyGameProps> = ({
  saveData,
  onUpdateSave,
  onGoToBurrow
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State for HUD & Overlays
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'>('MENU');
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentHeight, setCurrentHeight] = useState<number>(0);
  const [carrotsThisRun, setCarrotsThisRun] = useState<number>(0);
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [magnetSeconds, setMagnetSeconds] = useState<number>(0);
  const [gliderSeconds, setGliderSeconds] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Sound toggles
  const [isMuted, setIsMuted] = useState<boolean>(!saveData.soundEnabled);
  const [isMusicActive, setIsMusicActive] = useState<boolean>(saveData.musicEnabled);

  // Touch control indicators
  const [touchLeft, setTouchLeft] = useState<boolean>(false);
  const [touchRight, setTouchRight] = useState<boolean>(false);

  // Game internals in ref to avoid frame drops
  const gameRef = useRef<{
    score: number;
    highestY: number;
    carrots: number;
    jumps: number;
    combo: number;
    cameraY: number;
    cameraTargetY: number;
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      width: number;
      height: number;
      facing: 'left' | 'right';
      squash: number; // 1 = normal, < 1 = squished, > 1 = stretched
      hasShield: boolean;
      magnetTimer: number;
      gliderTimer: number;
      invincibleTimer: number;
    };
    platforms: Platform[];
    items: Item[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    nextPlatformY: number;
    keys: { left: boolean; right: boolean };
    lastTimestamp: number;
    animationFrameId: number | null;
  }>({
    score: 0,
    highestY: 0,
    carrots: 0,
    jumps: 0,
    combo: 0,
    cameraY: 0,
    cameraTargetY: 0,
    player: {
      x: 240,
      y: 550,
      vx: 0,
      vy: 0,
      width: 44,
      height: 48,
      facing: 'right',
      squash: 1,
      hasShield: false,
      magnetTimer: 0,
      gliderTimer: 0,
      invincibleTimer: 0
    },
    platforms: [],
    items: [],
    particles: [],
    floatingTexts: [],
    nextPlatformY: 550,
    keys: { left: false, right: false },
    lastTimestamp: 0,
    animationFrameId: null
  });

  const activeSkin = BUNNY_SKINS.find(s => s.id === saveData.customization.skin) || BUNNY_SKINS[0];
  const activeHat = BUNNY_HATS.find(h => h.id === saveData.customization.hat) || BUNNY_HATS[0];
  const activeTrail = saveData.customization.trail;

  // Toggle Sound
  const toggleSound = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    sound.setSoundEnabled(!nextVal);
    onUpdateSave(prev => ({ ...prev, soundEnabled: !nextVal }));
  };

  // Toggle Music
  const toggleMusic = () => {
    const nextVal = !isMusicActive;
    setIsMusicActive(nextVal);
    sound.setMusicEnabled(nextVal);
    onUpdateSave(prev => ({ ...prev, musicEnabled: nextVal }));
  };

  // Initialize fresh game session
  const startNewGame = useCallback(() => {
    sound.setSoundEnabled(!isMuted);
    if (isMusicActive) sound.startMusic();

    const g = gameRef.current;
    g.score = 0;
    g.carrots = 0;
    g.jumps = 0;
    g.combo = 0;
    g.cameraY = 0;
    g.cameraTargetY = 0;
    g.highestY = 560;

    g.player.x = 240;
    g.player.y = 540;
    g.player.vx = 0;
    g.player.vy = -12; // Initial hop
    g.player.squash = 1;
    g.player.hasShield = false;
    g.player.magnetTimer = 0;
    g.player.gliderTimer = 0;
    g.player.invincibleTimer = 0;

    g.particles = [];
    g.floatingTexts = [];
    g.platforms = [];
    g.items = [];

    // Starting solid ground base
    g.platforms.push({
      x: 140,
      y: 600,
      width: 200,
      height: 18,
      type: 'standard'
    });

    // Generate initial platforms
    let currentY = 520;
    for (let i = 0; i < 10; i++) {
      currentY -= 55 + Math.random() * 25;
      const width = Math.max(68, 95 - (i * 2));
      const x = 30 + Math.random() * (480 - 60 - width);

      const randType = Math.random();
      let type: Platform['type'] = 'standard';
      if (randType < 0.2) type = 'mushroom';
      else if (randType < 0.35) type = 'moving';
      else if (randType < 0.45) type = 'spring';

      g.platforms.push({
        x,
        y: currentY,
        width,
        height: 16,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 1.5 : -1.5) : undefined
      });

      // Spawn item chance
      if (Math.random() < 0.45) {
        const itemRoll = Math.random();
        let itemType: Item['type'] = 'carrot';
        if (itemRoll < 0.12) itemType = 'golden_carrot';
        else if (itemRoll < 0.25) itemType = 'strawberry';
        else if (itemRoll < 0.32) itemType = 'balloon';
        else if (itemRoll < 0.4) itemType = 'shield';

        g.items.push({
          x: x + width / 2 - 12,
          y: currentY - 26,
          type: itemType,
          width: 24,
          height: 24
        });
      }
    }

    g.nextPlatformY = currentY;

    setCurrentScore(0);
    setCurrentHeight(0);
    setCarrotsThisRun(0);
    setHasShield(false);
    setMagnetSeconds(0);
    setGliderSeconds(0);
    setIsNewRecord(false);
    setGameState('PLAYING');
    sound.playJump();
  }, [isMuted, isMusicActive]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = true;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
      if ((e.key === ' ' || e.key === 'Enter') && gameState === 'MENU') {
        startNewGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startNewGame]);

  // Main Canvas Render & Game Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const spawnPlatform = (y: number) => {
      const g = gameRef.current;
      const heightIndex = Math.abs(g.cameraY) / 1000;
      // Platforms get slightly narrower and slightly further apart as you climb
      const minW = Math.max(52, 85 - heightIndex * 5);
      const width = minW + Math.random() * 25;
      const x = 20 + Math.random() * (480 - 40 - width);

      const roll = Math.random();
      let type: Platform['type'] = 'standard';
      let hasHazard = false;

      if (roll < 0.18) type = 'mushroom';
      else if (roll < 0.38) type = 'moving';
      else if (roll < 0.52) type = 'spring';
      else if (roll < 0.65 && heightIndex > 0.5) type = 'fragile';

      // Hazard chance on standard platforms above 300m
      if (type === 'standard' && heightIndex > 0.3 && Math.random() < 0.15) {
        hasHazard = true;
      }

      g.platforms.push({
        x,
        y,
        width,
        height: 16,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 1.8 : -1.8) : undefined,
        hasHazard,
        hazardX: x + 15,
        hazardDir: 1
      });

      // Item spawning
      const itemRoll = Math.random();
      if (itemRoll < 0.42 && !hasHazard) {
        let itype: Item['type'] = 'carrot';
        if (itemRoll < 0.08) itype = 'balloon';
        else if (itemRoll < 0.15) itype = 'golden_carrot';
        else if (itemRoll < 0.24) itype = 'shield';
        else if (itemRoll < 0.32) itype = 'strawberry';

        g.items.push({
          x: x + width / 2 - 12,
          y: y - 26,
          type: itype,
          width: 24,
          height: 24
        });
      }
    };

    const addParticle = (p: Particle) => {
      if (gameRef.current.particles.length < 90) {
        gameRef.current.particles.push(p);
      }
    };

    const addFloatingText = (text: string, x: number, y: number, color = '#F59E0B') => {
      gameRef.current.floatingTexts.push({
        text,
        x,
        y,
        color,
        alpha: 1,
        scale: 1.2
      });
    };

    const loop = (timestamp: number) => {
      if (!isRunning) return;

      const g = gameRef.current;
      if (!g.lastTimestamp) g.lastTimestamp = timestamp;
      const dt = Math.min((timestamp - g.lastTimestamp) / 1000, 0.05); // cap dt
      g.lastTimestamp = timestamp;

      // Only update physics when PLAYING
      if (gameState === 'PLAYING') {
        const p = g.player;

        // Timers
        if (p.invincibleTimer > 0) p.invincibleTimer -= dt;
        if (p.magnetTimer > 0) {
          p.magnetTimer -= dt;
          setMagnetSeconds(Math.ceil(p.magnetTimer));
        } else {
          setMagnetSeconds(0);
        }

        if (p.gliderTimer > 0) {
          p.gliderTimer -= dt;
          setGliderSeconds(Math.ceil(p.gliderTimer));
          // Glider gently carries bunny upward
          p.vy = -7.5;
        } else {
          setGliderSeconds(0);
          // Standard Gravity
          p.vy += 22 * dt;
        }

        // Horizontal Movement (Keys or touch buttons)
        const moveLeft = g.keys.left || touchLeft;
        const moveRight = g.keys.right || touchRight;

        if (moveLeft) {
          p.vx -= 32 * dt;
          p.facing = 'left';
        } else if (moveRight) {
          p.vx += 32 * dt;
          p.facing = 'right';
        } else {
          // Friction
          p.vx *= 0.88;
        }

        // Speed limit
        p.vx = Math.max(-7.5, Math.min(7.5, p.vx));
        p.x += p.vx;
        p.y += p.vy;

        // Screen wrap (left <-> right)
        if (p.x < -p.width / 2) {
          p.x = 480 + p.width / 2;
        } else if (p.x > 480 + p.width / 2) {
          p.x = -p.width / 2;
        }

        // Squash & stretch physics relaxation
        p.squash += (1 - p.squash) * 8 * dt;

        // Trail particles when hopping
        if (activeTrail !== 'none' && Math.random() < 0.6) {
          addParticle({
            x: p.x + (Math.random() - 0.5) * 16,
            y: p.y + 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 1.5 + 0.5,
            size: 4 + Math.random() * 4,
            color: activeTrail === 'stars' ? '#FBBF24' : activeTrail === 'hearts' ? '#F43F5E' : activeTrail === 'rainbow' ? '#A855F7' : '#F97316',
            alpha: 0.85,
            decay: 0.03,
            shape: activeTrail === 'stars' ? 'star' : activeTrail === 'hearts' ? 'heart' : activeTrail === 'carrots' ? 'carrot' : 'circle'
          });
        }

        // Magnet attraction logic
        if (p.magnetTimer > 0) {
          g.items.forEach(item => {
            if (item.collected) return;
            const dx = p.x - item.x;
            const dy = p.y - item.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 220) {
              item.x += (dx / dist) * 7;
              item.y += (dy / dist) * 7;
            }
          });
        }

        // Check platform collisions (only when bunny is falling down)
        if (p.vy > 0 && p.gliderTimer <= 0) {
          const bunnyBottom = p.y + p.height / 2;
          const bunnyLeft = p.x - p.width / 3;
          const bunnyRight = p.x + p.width / 3;

          for (const plat of g.platforms) {
            if (plat.broken) continue;

            const platTop = plat.y;
            const platBottom = plat.y + plat.height;

            // Check if feet are crossing the platform surface
            if (
              bunnyBottom >= platTop &&
              bunnyBottom - p.vy <= platTop + 14 &&
              bunnyRight >= plat.x &&
              bunnyLeft <= plat.x + plat.width
            ) {
              // Bounced!
              g.jumps++;

              if (plat.type === 'mushroom') {
                p.vy = -16.5; // Super high mushroom bounce
                p.squash = 0.5;
                sound.playMushroom();
                addFloatingText('COGUMELO BOING! +50', p.x, p.y - 30, '#EF4444');
                g.score += 50;

                // Spores burst
                for (let i = 0; i < 8; i++) {
                  addParticle({
                    x: p.x + (Math.random() - 0.5) * 30,
                    y: plat.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 3,
                    size: 3 + Math.random() * 3,
                    color: '#F87171',
                    alpha: 0.9,
                    decay: 0.04
                  });
                }
              } else if (plat.type === 'spring') {
                plat.springActive = true;
                p.vy = -20; // Massive spring rocket
                p.squash = 0.4;
                sound.playSpring();
                addFloatingText('SUPER MOLA! +100', p.x, p.y - 30, '#F59E0B');
                g.score += 100;
              } else {
                p.vy = -12; // Normal grass jump
                p.squash = 0.65;
                sound.playJump();
                g.score += 10;
              }

              // Grass puff particles
              for (let i = 0; i < 5; i++) {
                addParticle({
                  x: p.x + (Math.random() - 0.5) * 20,
                  y: plat.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -Math.random() * 2,
                  size: 2.5,
                  color: '#86EFAC',
                  alpha: 0.8,
                  decay: 0.04
                });
              }

              if (plat.type === 'fragile') {
                plat.broken = true;
                sound.playHurt();
                // Broken branch particles
                for (let i = 0; i < 6; i++) {
                  addParticle({
                    x: plat.x + Math.random() * plat.width,
                    y: plat.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: Math.random() * 3,
                    size: 4,
                    color: '#B45309',
                    alpha: 0.8,
                    decay: 0.05
                  });
                }
              }
              break;
            }
          }
        }

        // Platform Movement & Hazards update
        g.platforms.forEach(plat => {
          if (plat.type === 'moving' && plat.vx) {
            plat.x += plat.vx;
            if (plat.x < 15 || plat.x + plat.width > 465) {
              plat.vx = -plat.vx;
            }
          }

          // Move platform hazards (hedgehogs)
          if (plat.hasHazard && plat.hazardX !== undefined && plat.hazardDir !== undefined) {
            plat.hazardX += plat.hazardDir * 0.8;
            if (plat.hazardX < plat.x + 8) {
              plat.hazardDir = 1;
            } else if (plat.hazardX > plat.x + plat.width - 24) {
              plat.hazardDir = -1;
            }

            // Hazard collision with bunny
            if (p.invincibleTimer <= 0) {
              const hDist = Math.hypot(p.x - plat.hazardX, p.y - plat.y);
              if (hDist < 26) {
                if (p.hasShield) {
                  // Shield absorbs hit
                  p.hasShield = false;
                  setHasShield(false);
                  p.invincibleTimer = 1.2;
                  p.vy = -10;
                  sound.playHurt();
                  addFloatingText('ESCUDO PROTEGEU!', p.x, p.y - 25, '#10B981');
                } else {
                  // Hit hedgehog: bump down
                  p.vy = 8;
                  p.invincibleTimer = 1.5;
                  sound.playHurt();
                  addFloatingText('AI! OURiÇO ESPINHOSO!', p.x, p.y - 25, '#DC2626');
                }
              }
            }
          }
        });

        // Collect item logic
        g.items.forEach(item => {
          if (item.collected) return;
          const dist = Math.hypot(p.x - item.x, p.y - item.y);
          if (dist < 28) {
            item.collected = true;

            if (item.type === 'carrot') {
              g.carrots += 1;
              g.score += 15;
              sound.playCarrot();
              addFloatingText('+1 🥕', item.x, item.y, '#F97316');
            } else if (item.type === 'golden_carrot') {
              g.carrots += 5;
              g.score += 75;
              p.magnetTimer = 8; // 8 seconds of carrot magnet!
              sound.playGoldenCarrot();
              addFloatingText('ÍMÃ DOURADO! +5 🥕', item.x, item.y, '#EAB308');
            } else if (item.type === 'strawberry') {
              g.carrots += 3;
              g.score += 40;
              sound.playCarrot();
              addFloatingText('+3 🍓', item.x, item.y, '#F43F5E');
            } else if (item.type === 'shield') {
              p.hasShield = true;
              setHasShield(true);
              sound.playGoldenCarrot();
              addFloatingText('ESCUDO DE DENTE-DE-LEÃO! 🛡️', item.x, item.y, '#10B981');
            } else if (item.type === 'balloon') {
              p.gliderTimer = 5; // 5s balloon float!
              sound.playSpring();
              addFloatingText('VOANDO COM BALÃO! 🎈', item.x, item.y, '#8B5CF6');
            }

            // Collection sparkle particles
            for (let i = 0; i < 7; i++) {
              addParticle({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 3.5,
                color: item.type === 'golden_carrot' ? '#FACC15' : '#FB923C',
                alpha: 1,
                decay: 0.05
              });
            }
          }
        });

        // Track highest altitude
        if (p.y < g.highestY) {
          const delta = g.highestY - p.y;
          g.highestY = p.y;
          g.score += Math.round(delta);
        }

        // Camera smoothly follows player upward
        const targetCamY = p.y - 320;
        if (targetCamY < g.cameraY) {
          g.cameraY += (targetCamY - g.cameraY) * 0.12;
        }

        // Generate new platforms ahead
        while (g.nextPlatformY > g.cameraY - 200) {
          g.nextPlatformY -= 55 + Math.random() * 28;
          spawnPlatform(g.nextPlatformY);
        }

        // Clean up platforms & items way below screen
        g.platforms = g.platforms.filter(plat => plat.y < g.cameraY + 800);
        g.items = g.items.filter(item => item.y < g.cameraY + 800 && !item.collected);

        // Update score & height in HUD state
        const currentAltitudeMeters = Math.max(0, Math.floor((560 - g.highestY) / 10));
        setCurrentScore(g.score);
        setCurrentHeight(currentAltitudeMeters);
        setCarrotsThisRun(g.carrots);

        // Check Game Over condition (bunny falls off the bottom of the camera)
        if (p.y > g.cameraY + 700) {
          if (p.hasShield) {
            // Shield emergency save: catapults bunny up!
            p.hasShield = false;
            setHasShield(false);
            p.vy = -18;
            p.y = g.cameraY + 620;
            sound.playSpring();
            addFloatingText('RESGATADO PELO ESCUDO!', p.x, p.y - 40, '#10B981');
          } else {
            // Game Over
            sound.playGameOver();
            setGameState('GAME_OVER');

            // Save persistent data
            const finalScore = g.score;
            const isRecord = finalScore > saveData.highScore;
            setIsNewRecord(isRecord);

            onUpdateSave(prev => ({
              ...prev,
              carrots: prev.carrots + g.carrots,
              highScore: Math.max(prev.highScore, finalScore),
              maxHeight: Math.max(prev.maxHeight, currentAltitudeMeters),
              totalJumps: prev.totalJumps + g.jumps,
              totalGames: prev.totalGames + 1,
              bunnyHappiness: {
                ...prev.bunnyHappiness,
                [prev.customization.skin]: Math.min(100, (prev.bunnyHappiness[prev.customization.skin] || 50) + 5)
              }
            }));
          }
        }
      }

      // Update Particles
      g.particles.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
      });
      g.particles = g.particles.filter(pt => pt.alpha > 0);

      // Update Floating Texts
      g.floatingTexts.forEach(ft => {
        ft.y -= 1;
        ft.alpha -= 0.02;
        ft.scale = Math.max(1, ft.scale - 0.01);
      });
      g.floatingTexts = g.floatingTexts.filter(ft => ft.alpha > 0);

      // --- RENDERING ---
      ctx.clearRect(0, 0, 480, 680);

      // Dynamic Sky Gradient based on Altitude
      const altitude = Math.max(0, (560 - g.highestY) / 10);
      let skyTop = '#E0F2FE'; // Light sky blue
      let skyBottom = '#FEF3C7'; // Meadow sunlight

      if (altitude > 2500) {
        // Space / Starry Night
        skyTop = '#090D16';
        skyBottom = '#1E1B4B';
      } else if (altitude > 1400) {
        // Sunset / Dusk
        skyTop = '#4C1D95';
        skyBottom = '#FDE047';
      } else if (altitude > 600) {
        // High Atmosphere
        skyTop = '#38BDF8';
        skyBottom = '#BAE6FD';
      }

      const grad = ctx.createLinearGradient(0, 0, 0, 680);
      grad.addColorStop(0, skyTop);
      grad.addColorStop(1, skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 480, 680);

      // Draw Twinkling Stars if high up
      if (altitude > 1200) {
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 35; i++) {
          const starX = (i * 73 + timestamp * 0.005) % 480;
          const starY = (i * 97) % 680;
          const starAlpha = 0.3 + 0.5 * Math.sin(timestamp * 0.003 + i);
          ctx.globalAlpha = starAlpha;
          ctx.beginPath();
          ctx.arc(starX, starY, (i % 3 === 0) ? 2 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Parallax Decorative Fluffy Clouds in background
      const parallaxY = g.cameraY * 0.25;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 5; i++) {
        const cloudX = ((i * 140) + timestamp * 0.015) % 560 - 40;
        const cloudY = (i * 160 - parallaxY) % 760 - 80;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 32, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY - 10, 38, 0, Math.PI * 2);
        ctx.arc(cloudX + 55, cloudY, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Apply Camera Translation
      ctx.save();
      ctx.translate(0, -g.cameraY);

      // Draw Platforms
      g.platforms.forEach(plat => {
        if (plat.broken) return;

        if (plat.type === 'mushroom') {
          // Bouncy Mushroom Cap
          const capGrad = ctx.createLinearGradient(plat.x, plat.y - 12, plat.x, plat.y + plat.height);
          capGrad.addColorStop(0, '#EF4444');
          capGrad.addColorStop(1, '#B91C1C');

          ctx.fillStyle = capGrad;
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y - 4, plat.width, plat.height + 4, [10, 10, 4, 4]);
          ctx.fill();

          // White spots
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(plat.x + plat.width * 0.25, plat.y + 2, 4, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.width * 0.5, plat.y, 5, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.width * 0.75, plat.y + 2, 4, 0, Math.PI * 2);
          ctx.fill();

          // Mushroom stem
          ctx.fillStyle = '#FEF3C7';
          ctx.beginPath();
          ctx.roundRect(plat.x + plat.width / 2 - 8, plat.y + plat.height, 16, 8, [0, 0, 4, 4]);
          ctx.fill();
        } else if (plat.type === 'spring') {
          // Platform with bouncy metal spring
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
          ctx.fill();

          // Spring coil
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const sx = plat.x + plat.width / 2;
          const sy = plat.y;
          const springH = plat.springActive ? 18 : 8;
          ctx.moveTo(sx - 8, sy);
          ctx.lineTo(sx + 8, sy - springH * 0.33);
          ctx.lineTo(sx - 8, sy - springH * 0.66);
          ctx.lineTo(sx + 8, sy - springH);
          ctx.stroke();
          // Spring red top cap
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(sx - 9, sy - springH - 3, 18, 4);
        } else if (plat.type === 'moving') {
          // Cloud platform with soft cyan glow
          ctx.fillStyle = '#E0F2FE';
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 10);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Cute cloud bumps
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(plat.x + 14, plat.y + 2, 8, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.width - 14, plat.y + 2, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (plat.type === 'fragile') {
          // Brittle branch / dry leaf
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height - 2, 5);
          ctx.fill();

          // Crack lines
          ctx.strokeStyle = '#78350F';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.width * 0.4, plat.y);
          ctx.lineTo(plat.x + plat.width * 0.5, plat.y + 7);
          ctx.lineTo(plat.x + plat.width * 0.6, plat.y + 14);
          ctx.stroke();
        } else {
          // Standard Meadow Grass Platform
          const grassGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
          grassGrad.addColorStop(0, '#22C55E');
          grassGrad.addColorStop(1, '#15803D');

          ctx.fillStyle = grassGrad;
          ctx.beginPath();
          ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 8);
          ctx.fill();

          // Dirt underside
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.roundRect(plat.x + 4, plat.y + plat.height - 4, plat.width - 8, 4, [0, 0, 4, 4]);
          ctx.fill();

          // Cute grass blades tufts on top
          ctx.fillStyle = '#4ADE80';
          for (let gx = plat.x + 8; gx < plat.x + plat.width - 8; gx += 16) {
            ctx.beginPath();
            ctx.moveTo(gx, plat.y);
            ctx.lineTo(gx + 3, plat.y - 4);
            ctx.lineTo(gx + 6, plat.y);
            ctx.fill();
          }
        }

        // Draw Spiky Hedgehog hazard if present
        if (plat.hasHazard && plat.hazardX !== undefined) {
          const hx = plat.hazardX;
          const hy = plat.y - 12;

          // Hedgehog body
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.ellipse(hx + 10, hy + 6, 12, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Spikes
          ctx.fillStyle = '#451A03';
          for (let s = 0; s < 5; s++) {
            ctx.beginPath();
            ctx.moveTo(hx + 2 + s * 4, hy + 4);
            ctx.lineTo(hx + 4 + s * 4, hy - 4);
            ctx.lineTo(hx + 6 + s * 4, hy + 4);
            ctx.fill();
          }

          // Cute little snout
          ctx.fillStyle = '#FED7AA';
          ctx.beginPath();
          ctx.arc(hx + (plat.hazardDir === 1 ? 20 : 0), hy + 7, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(hx + (plat.hazardDir === 1 ? 21 : -1), hy + 6, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Collectible Items
      g.items.forEach(item => {
        if (item.collected) return;
        const bob = Math.sin(timestamp * 0.006 + item.x) * 3;
        const ix = item.x;
        const iy = item.y + bob;

        if (item.type === 'carrot') {
          // Orange Carrot
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.moveTo(ix, iy - 6);
          ctx.lineTo(ix + 14, iy - 6);
          ctx.lineTo(ix + 7, iy + 14);
          ctx.closePath();
          ctx.fill();

          // Green carrot top leaves
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.ellipse(ix + 7, iy - 9, 3, 6, 0, 0, Math.PI * 2);
          ctx.ellipse(ix + 4, iy - 8, 2, 5, -0.4, 0, Math.PI * 2);
          ctx.ellipse(ix + 10, iy - 8, 2, 5, 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'golden_carrot') {
          // Sparkling Golden Carrot with aura
          ctx.shadowColor = '#FDE047';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.moveTo(ix - 2, iy - 7);
          ctx.lineTo(ix + 16, iy - 7);
          ctx.lineTo(ix + 7, iy + 16);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;

          // Golden leaf
          ctx.fillStyle = '#84CC16';
          ctx.beginPath();
          ctx.ellipse(ix + 7, iy - 10, 4, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'strawberry') {
          // Juicy Red Strawberry
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.ellipse(ix + 7, iy + 4, 8, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          // Strawberry leaves
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.ellipse(ix + 7, iy - 4, 5, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'shield') {
          // Dandelion Flower Shield
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(ix + 7, iy + 5, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#A7F3D0';
          ctx.beginPath();
          ctx.arc(ix + 7, iy + 5, 6, 0, Math.PI * 2);
          ctx.fill();
          // Clover icon
          ctx.fillStyle = '#047857';
          ctx.beginPath();
          ctx.arc(ix + 7, iy + 2, 2.5, 0, Math.PI * 2);
          ctx.arc(ix + 4, iy + 6, 2.5, 0, Math.PI * 2);
          ctx.arc(ix + 10, iy + 6, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'balloon') {
          // Pastel Flying Balloon
          ctx.fillStyle = '#A855F7';
          ctx.beginPath();
          ctx.ellipse(ix + 7, iy, 9, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          // String
          ctx.strokeStyle = '#6B7280';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ix + 7, iy + 12);
          ctx.lineTo(ix + 7, iy + 22);
          ctx.stroke();
        }
      });

      // Draw Particles
      g.particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;

        if (pt.shape === 'star') {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(
              pt.x + pt.size * Math.cos(((18 + i * 72) * Math.PI) / 180),
              pt.y - pt.size * Math.sin(((18 + i * 72) * Math.PI) / 180)
            );
            ctx.lineTo(
              pt.x + (pt.size / 2) * Math.cos(((54 + i * 72) * Math.PI) / 180),
              pt.y - (pt.size / 2) * Math.sin(((54 + i * 72) * Math.PI) / 180)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else if (pt.shape === 'heart') {
          ctx.beginPath();
          ctx.arc(pt.x - pt.size / 3, pt.y - pt.size / 3, pt.size / 2.5, 0, Math.PI * 2);
          ctx.arc(pt.x + pt.size / 3, pt.y - pt.size / 3, pt.size / 2.5, 0, Math.PI * 2);
          ctx.moveTo(pt.x - pt.size * 0.7, pt.y - pt.size / 3);
          ctx.lineTo(pt.x, pt.y + pt.size * 0.7);
          ctx.lineTo(pt.x + pt.size * 0.7, pt.y - pt.size / 3);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // --- Draw Player Bunny ---
      const p = g.player;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Squish & stretch scaling transform
      const scaleX = (p.facing === 'left' ? -1 : 1) * (2 - p.squash);
      const scaleY = p.squash;
      ctx.scale(scaleX, scaleY);

      // Flashing if invincible
      if (p.invincibleTimer > 0 && Math.floor(timestamp / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Draw Glider Balloon if active
      if (p.gliderTimer > 0) {
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-12, -50);
        ctx.moveTo(0, -20);
        ctx.lineTo(12, -50);
        ctx.stroke();

        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.ellipse(-12, -62, 13, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B5CF6';
        ctx.beginPath();
        ctx.ellipse(12, -62, 13, 17, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Shield Aura if active
      if (p.hasShield) {
        ctx.save();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Magnet Aura if active
      if (p.magnetTimer > 0) {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 36, timestamp * 0.005, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const { fur, belly, innerEar, nose, eyes, cheeks } = activeSkin.colors;

      // Bunny Tail
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.arc(-18, 8, 7, 0, Math.PI * 2);
      ctx.fill();

      // Bunny Ears (dynamic ear physics with vy)
      const earTilt = Math.max(-0.4, Math.min(0.4, p.vy * 0.03));

      // Left Ear
      ctx.save();
      ctx.translate(-7, -18);
      ctx.rotate(-0.15 + earTilt);
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, -14, 5.5, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.ellipse(0, -13, 2.8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right Ear
      ctx.save();
      ctx.translate(7, -18);
      ctx.rotate(0.15 + earTilt);
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, -14, 5.5, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = innerEar;
      ctx.beginPath();
      ctx.ellipse(0, -13, 2.8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bunny Body
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy Belly
      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(2, 6, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bunny Head
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.arc(0, -10, 16, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.fillStyle = cheeks;
      ctx.beginPath();
      ctx.arc(-10, -6, 4, 0, Math.PI * 2);
      ctx.arc(10, -6, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const isBambi = activeSkin.id === 'bambi';
      if (isBambi) {
        ctx.fillStyle = '#3f3f46';
        ctx.beginPath();
        ctx.arc(-5, -11, 4, 0, Math.PI * 2);
        ctx.arc(6, -11, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isBambi ? '#09090b' : eyes;
      ctx.beginPath();
      ctx.arc(-5, -11, 3, 0, Math.PI * 2);
      ctx.arc(6, -11, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye reflections
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-6, -12, 1.2, 0, Math.PI * 2);
      ctx.arc(5, -12, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Nose & Mouth
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.arc(1, -7, 2, 0, Math.PI * 2);
      ctx.fill();

      const faceStroke = isBambi ? '#71717a' : eyes;
      ctx.strokeStyle = faceStroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-1, -4, 2.5, 0, Math.PI);
      ctx.arc(3, -4, 2.5, 0, Math.PI);
      ctx.stroke();

      // Whiskers
      ctx.strokeStyle = faceStroke;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-11, -7); ctx.lineTo(-20, -9);
      ctx.moveTo(-11, -5); ctx.lineTo(-19, -4);
      ctx.moveTo(11, -7); ctx.lineTo(20, -9);
      ctx.moveTo(11, -5); ctx.lineTo(19, -4);
      ctx.stroke();

      // Paws
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.ellipse(-7, 18, 6, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(7, 18, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Hat on Bunny
      if (activeHat.id === 'straw_hat') {
        ctx.fillStyle = '#FDE047';
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -22, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-9, -30, 18, 9, 3);
        ctx.fill();
        ctx.stroke();
        // Red band
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-9, -24, 18, 2.5);
      } else if (activeHat.id === 'magic_tophat') {
        ctx.fillStyle = '#18181B';
        ctx.beginPath();
        ctx.ellipse(0, -24, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-8, -38, 16, 15, 2);
        ctx.fill();
        // Purple ribbon
        ctx.fillStyle = '#A855F7';
        ctx.fillRect(-8, -27, 16, 3);
      } else if (activeHat.id === 'royal_crown') {
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-11, -22);
        ctx.lineTo(-12, -32);
        ctx.lineTo(-5, -26);
        ctx.lineTo(0, -34);
        ctx.lineTo(5, -26);
        ctx.lineTo(12, -32);
        ctx.lineTo(11, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (activeHat.id === 'flower_pin') {
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.arc(8 + Math.cos(a) * 4, -22 + Math.sin(a) * 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(8, -22, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeHat.id === 'sunglasses') {
        ctx.fillStyle = '#18181B';
        ctx.fillRect(-10, -14, 9, 6);
        ctx.fillRect(1, -14, 9, 6);
        ctx.strokeStyle = '#18181B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-1, -11); ctx.lineTo(1, -11);
        ctx.stroke();
      } else if (activeHat.id === 'pink_bow') {
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.moveTo(8, -22);
        ctx.lineTo(2, -26);
        ctx.lineTo(2, -18);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -22);
        ctx.lineTo(14, -26);
        ctx.lineTo(14, -18);
        ctx.fill();
        ctx.fillStyle = '#FB7185';
        ctx.beginPath();
        ctx.arc(8, -22, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeHat.id === 'chef_hat') {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-8, -25, 16, 5, 1);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-5, -28, 5, 0, Math.PI * 2);
        ctx.arc(0, -32, 6, 0, Math.PI * 2);
        ctx.arc(5, -28, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeHat.id === 'party_hat') {
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.lineTo(-8, -23);
        ctx.lineTo(8, -23);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.arc(0, -39, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeHat.id === 'cozy_scarf') {
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.roundRect(-14, 0, 28, 6, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(4, 4, 6, 12, 2);
        ctx.fill();
      }

      ctx.restore();

      // Draw Floating Scores
      g.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = `bold ${Math.round(15 * ft.scale)}px 'Outfit', sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x - 20, ft.y);
        ctx.fillText(ft.text, ft.x - 20, ft.y);
        ctx.restore();
      });

      // Restore camera
      ctx.restore();

      gameRef.current.animationFrameId = requestAnimationFrame(loop);
    };

    gameRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (gameRef.current.animationFrameId) cancelAnimationFrame(gameRef.current.animationFrameId);
    };
  }, [gameState, activeSkin, activeHat, activeTrail, touchLeft, touchRight, onUpdateSave, saveData.highScore]);

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Top Game HUD Bar - Compact for Mobile */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2.5 mb-2 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-700/70 block">
              Pontuação
            </span>
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-stone-900">
              {currentScore.toLocaleString()}
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-emerald-700/70 block">
              Altura
            </span>
            <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-emerald-700">
              {currentHeight}m
            </span>
          </div>

          <span className="text-stone-300 font-light" aria-hidden="true">|</span>

          <div className="flex items-center gap-1">
            <span className="text-base sm:text-lg" role="img" aria-label="cenoura">🥕</span>
            <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-amber-900">
              {carrotsThisRun}
            </span>
          </div>
        </div>

        {/* Audio & Pause Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            aria-label={isMuted ? "Ativar efeitos sonoros" : "Silenciar efeitos sonoros"}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-amber-100/60 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <button
            onClick={toggleMusic}
            aria-label={isMusicActive ? "Desativar melodia de fundo" : "Ativar melodia de fundo"}
            className={`p-1.5 rounded-lg transition-colors ${
              isMusicActive ? 'text-amber-700 bg-amber-100' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {gameState === 'PLAYING' && (
            <button
              onClick={() => setGameState('PAUSED')}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-amber-100/60 transition-colors"
              title="Pausar jogo"
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Game Screen Canvas Container (Portrait Optimized for Mobile) */}
      <div className="relative w-full aspect-[480/680] max-h-[72vh] sm:max-h-[640px] bg-amber-100 rounded-3xl overflow-hidden shadow-xl border-4 border-amber-200/90">
        <canvas
          ref={canvasRef}
          width={480}
          height={680}
          className="w-full h-full object-cover block cursor-pointer touch-none"
          onClick={() => {
            if (gameState === 'MENU') startNewGame();
          }}
          onPointerDown={(e) => {
            if (gameState === 'MENU') {
              startNewGame();
              return;
            }
          }}
        />

        {/* ON-SCREEN TACTILE TOUCH CONTROLS (Left & Right corner buttons matching user screenshot) */}
        {gameState === 'PLAYING' && (
          <>
            {/* Left Button */}
            <div className="absolute bottom-4 left-4 z-30 select-none touch-none">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTouchLeft(true);
                  setTouchRight(false);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setTouchLeft(false);
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  setTouchLeft(false);
                }}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all backdrop-blur-md cursor-pointer ${
                  touchLeft
                    ? 'bg-amber-500 text-stone-950 scale-95 border-2 border-amber-300 ring-4 ring-amber-400/40'
                    : 'bg-stone-900/80 text-white border-2 border-stone-700/80 hover:bg-stone-800'
                }`}
                aria-label="Mover para a esquerda"
              >
                <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
              </button>
            </div>

            {/* Right Button */}
            <div className="absolute bottom-4 right-4 z-30 select-none touch-none">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTouchRight(true);
                  setTouchLeft(false);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  setTouchRight(false);
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  setTouchRight(false);
                }}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl transition-all backdrop-blur-md cursor-pointer ${
                  touchRight
                    ? 'bg-amber-500 text-stone-950 scale-95 border-2 border-amber-300 ring-4 ring-amber-400/40'
                    : 'bg-stone-900/80 text-white border-2 border-stone-700/80 hover:bg-stone-800'
                }`}
                aria-label="Mover para a direita"
              >
                <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
              </button>
            </div>
          </>
        )}

        {/* Active Power-up Badges on Top Screen */}
        <div className="absolute top-3 left-4 flex flex-col gap-1 pointer-events-none">
          {hasShield && (
            <div className="flex items-center gap-1.5 bg-emerald-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-md animate-pulse">
              <span>🛡️ Escudo Ativo</span>
            </div>
          )}
          {magnetSeconds > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-md">
              <span>🧲 Ímã Dourado ({magnetSeconds}s)</span>
            </div>
          )}
          {gliderSeconds > 0 && (
            <div className="flex items-center gap-1.5 bg-purple-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-md">
              <span>🎈 Balão Subindo ({gliderSeconds}s)</span>
            </div>
          )}
        </div>

        {/* Title Screen Overlay */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-20 h-20 mb-3 bg-amber-100 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-300">
              <span className="text-4xl animate-bounce">🐰</span>
            </div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-white drop-shadow-md mb-2">
              Coelho Saltador
            </h2>
            <p className="text-amber-100/90 text-sm max-w-xs mb-6">
              Salte nas plataformas, mastigue cenouras e alcance as nuvens mais altas do reino!
            </p>

            <button
              onClick={startNewGame}
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-base rounded-2xl shadow-lg transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              Começar Aventura
            </button>

            <div className="mt-6 flex items-center gap-4 text-xs text-amber-200/90">
              <span>⬅️ ➡️ Setas ou Teclas A / D</span>
              <span aria-hidden="true">·</span>
              <span>📱 Toque nos botões</span>
            </div>

            {saveData.highScore > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-300 font-medium bg-black/30 px-3 py-1 rounded-full">
                <Trophy className="w-3.5 h-3.5" />
                <span>Seu Recorde: {saveData.highScore.toLocaleString()} pts ({saveData.maxHeight}m)</span>
              </div>
            )}
          </div>
        )}

        {/* Paused Screen Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <h3 className="text-2xl font-bold font-display mb-2">Jogo Pausado</h3>
            <p className="text-stone-300 text-sm mb-6">O coelhinho está tirando um cochilo rápido no feno.</p>
            <div className="flex flex-col gap-3 w-48">
              <button
                onClick={() => setGameState('PLAYING')}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 font-semibold text-stone-950 rounded-xl transition-all"
              >
                Continuar
              </button>
              <button
                onClick={startNewGame}
                className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 font-semibold text-white rounded-xl transition-all"
              >
                Reiniciar
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">🥕</span>
            </div>

            {isNewRecord ? (
              <div className="mb-2 inline-flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                Novo Recorde!
              </div>
            ) : (
              <span className="text-amber-200/80 text-xs uppercase tracking-wider font-semibold mb-1">
                Fim do Salto
              </span>
            )}

            <h3 className="text-3xl font-extrabold font-display mb-4">
              Ótimo Salto!
            </h3>

            {/* Score Breakdown Box */}
            <div className="w-full max-w-xs bg-stone-900/80 border border-stone-800 rounded-2xl p-4 mb-6 text-left space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Pontos Finais:</span>
                <span className="font-mono font-bold text-white tabular-nums text-base">
                  {currentScore.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Altura Atingida:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {currentHeight} metros
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-400">Cenouras Colhidas:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums flex items-center gap-1">
                  +{carrotsThisRun} 🥕
                </span>
              </div>
              <div className="border-t border-stone-800 pt-2 flex justify-between items-center text-xs text-stone-400">
                <span>Recorde Geral:</span>
                <span className="font-mono tabular-nums text-stone-300">{saveData.highScore.toLocaleString()} pts</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={startNewGame}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold rounded-xl shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Jogar Novamente
              </button>

              {onGoToBurrow && (
                <button
                  onClick={onGoToBurrow}
                  className="w-full py-2.5 bg-stone-800/80 hover:bg-stone-800 text-stone-300 font-medium text-sm rounded-xl border border-stone-700 transition-colors"
                >
                  Ir para a Toca & Horta 🏡
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
