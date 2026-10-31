import { UserSaveData, GardenPlot, BunnySkinId, BunnyHatId, TrailId } from '../types/game';

const STORAGE_KEY = 'bunny_game_save_v1';

export const DEFAULT_PLOTS: GardenPlot[] = [
  { id: 1, crop: 'carrot', plantedAt: Date.now() - 15000, readyAt: Date.now() - 3000, watered: true },
  { id: 2, crop: 'strawberry', plantedAt: Date.now() - 10000, readyAt: Date.now() + 25000, watered: true },
  { id: 3, crop: null, plantedAt: null, readyAt: null, watered: false },
  { id: 4, crop: null, plantedAt: null, readyAt: null, watered: false },
  { id: 5, crop: null, plantedAt: null, readyAt: null, watered: false },
  { id: 6, crop: null, plantedAt: null, readyAt: null, watered: false },
];

export const INITIAL_SAVE_DATA: UserSaveData = {
  carrots: 25,
  highScore: 0,
  highScores: {
    adventure: 0,
    hopper: 0,
    catch: 0,
    maze: 0,
    whack: 0,
    memory: 0,
    runner: 0,
    flappy: 0,
    cannon: 0,
    slicer: 0,
    stacker: 0
  },
  maxHeight: 0,
  totalJumps: 0,
  totalGames: 0,
  unlockedSkins: ['white', 'bambi'],
  unlockedHats: ['none'],
  unlockedTrails: ['none'],
  customization: {
    skin: 'white',
    hat: 'none',
    trail: 'none'
  },
  gardenPlots: DEFAULT_PLOTS,
  bunnyHappiness: {
    white: 80,
    caramel: 60,
    snow: 50,
    chocolate: 50,
    bambi: 75
  },
  soundEnabled: true,
  musicEnabled: false // off by default until player clicks
};

export function loadSaveData(): UserSaveData {
  if (typeof window === 'undefined') return INITIAL_SAVE_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SAVE_DATA;
    const parsed = JSON.parse(raw);
    const legacyScore = parsed.highScore || 0;

    const loadedUnlockedSkins: BunnySkinId[] = Array.isArray(parsed.unlockedSkins)
      ? Array.from(new Set([...parsed.unlockedSkins, 'bambi' as BunnySkinId]))
      : ['white', 'bambi'];

    return {
      ...INITIAL_SAVE_DATA,
      ...parsed,
      unlockedSkins: loadedUnlockedSkins,
      highScores: {
        ...INITIAL_SAVE_DATA.highScores,
        hopper: legacyScore,
        ...(parsed.highScores || {})
      },
      customization: {
        ...INITIAL_SAVE_DATA.customization,
        ...(parsed.customization || {})
      },
      bunnyHappiness: {
        ...INITIAL_SAVE_DATA.bunnyHappiness,
        ...(parsed.bunnyHappiness || {}),
        bambi: parsed.bunnyHappiness?.bambi ?? 75
      }
    };
  } catch {
    return INITIAL_SAVE_DATA;
  }
}

export function saveUserData(data: UserSaveData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save bunny game data:', err);
  }
}
