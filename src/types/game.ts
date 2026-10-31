export type BunnySkinId = 'white' | 'caramel' | 'snow' | 'chocolate' | 'bambi';

export interface BunnySkin {
  id: BunnySkinId;
  name: string;
  description: string;
  price: number;
  unlockedByDefault?: boolean;
  colors: {
    fur: string;
    belly: string;
    innerEar: string;
    nose: string;
    eyes: string;
    cheeks: string;
  };
}

export type BunnyHatId = 
  | 'none'
  | 'straw_hat'
  | 'flower_pin'
  | 'pink_bow'
  | 'sunglasses'
  | 'magic_tophat'
  | 'royal_crown'
  | 'party_hat'
  | 'chef_hat'
  | 'cozy_scarf';

export interface BunnyHat {
  id: BunnyHatId;
  name: string;
  category: 'hat' | 'face' | 'accessory';
  price: number;
  description: string;
}

export type TrailId = 'none' | 'stars' | 'hearts' | 'carrots' | 'rainbow';

export interface TrailOption {
  id: TrailId;
  name: string;
  price: number;
  description: string;
}

export type CropType = 'carrot' | 'golden_carrot' | 'strawberry' | 'lettuce' | 'clover';

export interface CropDefinition {
  type: CropType;
  name: string;
  growthTimeSeconds: number;
  yieldCarrots: number;
  seedCost: number;
  icon: string;
  description: string;
}

export interface GardenPlot {
  id: number;
  crop: CropType | null;
  plantedAt: number | null; // timestamp ms
  readyAt: number | null; // timestamp ms
  watered: boolean;
}

export interface PlayerCustomization {
  skin: BunnySkinId;
  hat: BunnyHatId;
  trail: TrailId;
}

export type GameId = 
  | 'adventure'
  | 'hopper' 
  | 'catch' 
  | 'maze' 
  | 'memory' 
  | 'whack'
  | 'runner'
  | 'flappy'
  | 'cannon'
  | 'slicer'
  | 'stacker';

export type GameCategory = 'all' | 'arcade' | 'action' | 'puzzle' | 'skill';

export interface MiniGameMeta {
  id: GameId;
  number: number;
  title: string;
  badge: string;
  genre: string;
  category: GameCategory;
  shortDesc: string;
  fullDesc: string;
  icon: string;
  controlsSummary: string;
}

export interface UserSaveData {
  carrots: number;
  highScore: number; // legacy hopper score
  highScores: Record<GameId, number>;
  maxHeight: number;
  totalJumps: number;
  totalGames: number;
  unlockedSkins: BunnySkinId[];
  unlockedHats: BunnyHatId[];
  unlockedTrails: TrailId[];
  customization: PlayerCustomization;
  gardenPlots: GardenPlot[];
  bunnyHappiness: Record<BunnySkinId, number>; // 0 to 100
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface GameMetrics {
  score: number;
  height: number;
  carrotsCollected: number;
  jumps: number;
  hasShield: boolean;
  hasMagnet: boolean;
  magnetTimer: number;
  hasGlider: boolean;
  gliderTimer: number;
}
