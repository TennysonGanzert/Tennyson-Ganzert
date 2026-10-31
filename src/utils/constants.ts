import { BunnySkin, BunnyHat, TrailOption, CropDefinition, MiniGameMeta } from '../types/game';

export const BUNNY_SKINS: BunnySkin[] = [
  {
    id: 'white',
    name: 'Pipoca',
    description: 'Um coelhinho branco alegre e curioso, com bochechas rosadas.',
    price: 0,
    unlockedByDefault: true,
    colors: {
      fur: '#FFFFFF',
      belly: '#FFF5F5',
      innerEar: '#FFB6C1',
      nose: '#FF8095',
      eyes: '#3E2723',
      cheeks: '#FFCAD4'
    }
  },
  {
    id: 'caramel',
    name: 'Canela',
    description: 'Doce como mel e fofinho, adora mastigar brotos frescos.',
    price: 60,
    colors: {
      fur: '#E0A96D',
      belly: '#FBF0DE',
      innerEar: '#D08C50',
      nose: '#A85A32',
      eyes: '#2B170B',
      cheeks: '#F3C292'
    }
  },
  {
    id: 'snow',
    name: 'Floquinho',
    description: 'Tem pelos macios como nuvem de algodão e olhar meigo.',
    price: 120,
    colors: {
      fur: '#CBD5E1',
      belly: '#F1F5F9',
      innerEar: '#E2E8F0',
      nose: '#94A3B8',
      eyes: '#1E293B',
      cheeks: '#E0E7FF'
    }
  },
  {
    id: 'chocolate',
    name: 'Cacau',
    description: 'Esperto, rápido e muito comilão. Especialista em saltos altos.',
    price: 200,
    colors: {
      fur: '#5D4037',
      belly: '#8D6E63',
      innerEar: '#795548',
      nose: '#3E2723',
      eyes: '#1F140E',
      cheeks: '#A1887F'
    }
  },
  {
    id: 'bambi',
    name: 'Bambi',
    description: 'Um coelho todo preto, elegante, misterioso e com pelagem ônix reluzente.',
    price: 0,
    unlockedByDefault: true,
    colors: {
      fur: '#121214',
      belly: '#1c1c22',
      innerEar: '#2d2d35',
      nose: '#09090b',
      eyes: '#f8fafc',
      cheeks: '#1f1f26'
    }
  }
];

export const BUNNY_HATS: BunnyHat[] = [
  {
    id: 'none',
    name: 'Nenhum',
    category: 'hat',
    price: 0,
    description: 'Natural e livre ao vento.'
  },
  {
    id: 'straw_hat',
    name: 'Chapéu de Palha',
    category: 'hat',
    price: 30,
    description: 'Estilo autêntico de fazendeiro colhedor de cenouras.'
  },
  {
    id: 'flower_pin',
    name: 'Florzinha do Bosque',
    category: 'hat',
    price: 45,
    description: 'Uma margarida fresca colhida no gramado da manhã.'
  },
  {
    id: 'pink_bow',
    name: 'Laço Rosa Gracioso',
    category: 'hat',
    price: 50,
    description: 'Um laço de cetim delicado na orelhinha.'
  },
  {
    id: 'sunglasses',
    name: 'Óculos de Sol Estilosos',
    category: 'face',
    price: 75,
    description: 'Para saltar na direção do sol com muito charme.'
  },
  {
    id: 'magic_tophat',
    name: 'Cartola Mágica',
    category: 'hat',
    price: 100,
    description: 'O que sai da cartola? Mais coelhinhos!'
  },
  {
    id: 'chef_hat',
    name: 'Toque de Mestre Chef',
    category: 'hat',
    price: 110,
    description: 'Especialista em tortas de cenoura e saladas.'
  },
  {
    id: 'party_hat',
    name: 'Chapéu Festivo',
    category: 'hat',
    price: 130,
    description: 'Viva a festa da colheita! Cores alegres e pompom.'
  },
  {
    id: 'cozy_scarf',
    name: 'Cachecol Acolhedor',
    category: 'accessory',
    price: 150,
    description: 'Macio e quente para saltar nos céus mais altos e gelados.'
  },
  {
    id: 'royal_crown',
    name: 'Coroa de Ouro Real',
    category: 'hat',
    price: 250,
    description: 'Digna do rei indiscutível dos coelhinhos do reino.'
  }
];

export const TRAILS: TrailOption[] = [
  {
    id: 'none',
    name: 'Padrão',
    price: 0,
    description: 'Rastro leve de saltos limpos.'
  },
  {
    id: 'stars',
    name: 'Chuva de Estrelas',
    price: 80,
    description: 'Pequenas estrelas amarelas cintilam a cada impulso.'
  },
  {
    id: 'hearts',
    name: 'Corações Flutuantes',
    price: 120,
    description: 'Espalha amor e fofura por onde o coelho salta.'
  },
  {
    id: 'carrots',
    name: 'Mini Cenourinhas',
    price: 160,
    description: 'Cenourinhas em miniatura brotam nos seus passos.'
  },
  {
    id: 'rainbow',
    name: 'Arco-Íris Radiante',
    price: 220,
    description: 'Um arco-íris brilhante ilumina o caminho até as nuvens.'
  }
];

export const CROPS: Record<string, CropDefinition> = {
  carrot: {
    type: 'carrot',
    name: 'Cenoura Doce',
    growthTimeSeconds: 12,
    yieldCarrots: 4,
    seedCost: 1,
    icon: '🥕',
    description: 'Cresce super rápido! Perfeita para lanches do coelhinho.'
  },
  lettuce: {
    type: 'lettuce',
    name: 'Alface Crocante',
    growthTimeSeconds: 20,
    yieldCarrots: 8,
    seedCost: 2,
    icon: '🥬',
    description: 'Folhas tenras e orvalhadas que os coelhos adoram mastigar.'
  },
  strawberry: {
    type: 'strawberry',
    name: 'Morango Vermelho',
    growthTimeSeconds: 35,
    yieldCarrots: 16,
    seedCost: 5,
    icon: '🍓',
    description: 'Doce e suculento, atrai borboletas para a horta.'
  },
  clover: {
    type: 'clover',
    name: 'Trevo de Quatro Folhas',
    growthTimeSeconds: 50,
    yieldCarrots: 25,
    seedCost: 8,
    icon: '🍀',
    description: 'Traz muita sorte e aumenta a felicidade do coelho.'
  },
  golden_carrot: {
    type: 'golden_carrot',
    name: 'Cenoura Dourada Lendária',
    growthTimeSeconds: 80,
    yieldCarrots: 50,
    seedCost: 15,
    icon: '✨',
    description: 'O tesouro supremo do reino dos coelhinhos!'
  }
};

export const MINI_GAMES: MiniGameMeta[] = [
  {
    id: 'hopper',
    number: 1,
    title: 'Coelho Saltador',
    badge: 'Original',
    genre: 'Plataforma & Salto Infinito',
    category: 'arcade',
    shortDesc: 'Salte nas nuvens, pise em cogumelos e suba até as estrelas!',
    fullDesc: 'Controle o coelhinho saltando por plataformas de grama fofa, cogumelos pula-pula, molas douradas e nuvens flutuantes. Desvie de ouriços espinhosos e use escudos de dente-de-leão e ímãs para bater recordes de altitude!',
    icon: '🐰',
    controlsSummary: 'Toque nos lados da tela ou Setas Esquerda/Direita'
  },
  {
    id: 'catch',
    number: 2,
    title: 'Chuva de Cenouras',
    badge: 'Reflexos',
    genre: 'Apanhador na Cesta',
    category: 'arcade',
    shortDesc: 'Pegue cenouras e morangos caindo do céu na cestinha!',
    fullDesc: 'Uma deliciosa tempestade de vegetais no pomar! Corra recolhendo cenouras frescas, morangos e cenouras douradas na sua cesta de vime. Mas cuidado: desvie de pedregulhos, lama e carrapatos espinhosos!',
    icon: '🧺',
    controlsSummary: 'Arraste o dedo na tela ou use as setas'
  },
  {
    id: 'maze',
    number: 3,
    title: 'Labirinto da Toca',
    badge: 'Aventura',
    genre: 'Exploração em Túneis',
    category: 'puzzle',
    shortDesc: 'Explore galerias subterrâneas e ache o baú de cenouras!',
    fullDesc: 'Guiando o coelho pelas galerias secretas da toca, cave terra fofa, colete sementes douradas, desvie de toupeiras e alcance o baú do tesouro para ganhar estrelas e cenouras!',
    icon: '⛏️',
    controlsSummary: 'Deslize o dedo (Swipe), toque nos blocos ou no D-pad'
  },
  {
    id: 'whack',
    number: 4,
    title: 'Toca Rápida',
    badge: 'Agilidade',
    genre: 'Toque Rápido',
    category: 'skill',
    shortDesc: 'Toque nos coelhinhos felizes e pegue cenouras que surgem!',
    fullDesc: 'Nove tocas misteriosas no gramado! Toque rapidamente nos coelhinhos felizes e cenouras gigantes assim que espiarem para fora. Não toque na raposinha travessa nem nos ouriços com espinhos!',
    icon: '🕳️',
    controlsSummary: 'Toque direto com o dedo nas tocas'
  },
  {
    id: 'memory',
    number: 5,
    title: 'Memória dos Coelhinhos',
    badge: 'Puzzle',
    genre: 'Cartas & Pares',
    category: 'puzzle',
    shortDesc: 'Encontre os pares de coelhinhos, vegetais e ferramentas!',
    fullDesc: 'Um clássico e relaxante jogo de memória ilustrado com tema do bosque. Encontre os pares de coelhos, trevos da sorte, regadores e cenouras para acumular multiplicadores de combo e bônus de rapidez!',
    icon: '🃏',
    controlsSummary: 'Toque nas cartas para desvirar'
  },
  {
    id: 'runner',
    number: 6,
    title: 'Corrida no Bosque',
    badge: 'Velocidade',
    genre: 'Corrida Infinita & Obstáculos',
    category: 'action',
    shortDesc: 'Corra a toda velocidade pulando cercas, troncos e pedras!',
    fullDesc: 'Uma corrida eletrizante pelo prado! Pule sobre cercas de madeira, riachos e pedras; dê pulo duplo no ar e colete trilhas de cenouras enquanto o ritmo acelera a cada metro percorrido!',
    icon: '🏃',
    controlsSummary: 'Toque na tela para pular (2x para pulo duplo)'
  },
  {
    id: 'flappy',
    number: 7,
    title: 'Coelho Balão',
    badge: 'Física',
    genre: 'Voo Suave & Desvios',
    category: 'skill',
    shortDesc: 'Voe suavemente com balões entre girassóis e moinhos!',
    fullDesc: 'Equipado com balões festivos, mantenha o coelhinho no ar com toques ritmados. Desvie de girassóis gigantes e postes de celeiro enquanto apanha sementes douradas flutuantes!',
    icon: '🎈',
    controlsSummary: 'Toque na tela para dar um impulso no ar'
  },
  {
    id: 'cannon',
    number: 8,
    title: 'Canhão de Cenouras',
    badge: 'Mira & Alvo',
    genre: 'Física & Arremesso',
    category: 'skill',
    shortDesc: 'Puxe o estilingue, mire o ângulo e acerte as cestas móveis!',
    fullDesc: 'Ajuste a mira e a força puxando para trás com o dedo. Lance cenouras certeiras em cestas giratórias, estoure balões de bônus e derrube corvos travessos em cenários dinâmicos!',
    icon: '🎯',
    controlsSummary: 'Puxe para trás para mirar a força e solte'
  },
  {
    id: 'slicer',
    number: 9,
    title: 'Ninja da Horta',
    badge: 'Corte Ágil',
    genre: 'Corte por Gestos (Slash)',
    category: 'action',
    shortDesc: 'Corte cenouras e morangos no ar com o corte do coelho!',
    fullDesc: 'Vegetais frescos são jogados aos montes para o alto! Deslize a lâmina do coelho pela tela para fatiar cenouras, melancias e morangos ao meio. Faça combos cortando múltiplos vegetais, mas cuidado com as bombas!',
    icon: '⚔️',
    controlsSummary: 'Deslize o dedo na tela para fatiar vegetais'
  },
  {
    id: 'stacker',
    number: 10,
    title: 'Torre da Colheita',
    badge: 'Equilíbrio',
    genre: 'Empilhamento & Timing',
    category: 'puzzle',
    shortDesc: 'Solte blocos e fardos no momento certo para criar a maior torre!',
    fullDesc: 'Fardos de feno, caixotes de cenoura e abóboras balançam no topo da tela. Toque no momento exato em que estiverem alinhados para empilhá-los com perfeição sem desmoronar a torre do coelho!',
    icon: '📦',
    controlsSummary: 'Toque para soltar o bloco no momento exato'
  }
];

