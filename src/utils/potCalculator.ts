export interface Player {
  id: number;
  name: string;        // position name: 'UTG', 'SB', 'BB', etc.
  position?: string;
  bet: number;
  isAllIn: boolean;
  rank: number; // 1 = Winner, 2 = 2nd, etc.
  rankName: string;
}

export interface PotStage {
  name: string;
  amount: number;
  eligiblePlayerIds: number[];
}

export interface ScenarioContext {
  blindLabel: string; // e.g. "$25/$50"
  sb: number;
  bb: number;
}

export function calculatePots(players: Player[]): PotStage[] {
  const activePlayers = players.filter(p => p.bet > 0);
  if (activePlayers.length === 0) return [];

  const sortedBets = Array.from(new Set(activePlayers.map(p => p.bet))).sort((a, b) => a - b);

  const pots: PotStage[] = [];
  let previousBetFloor = 0;

  sortedBets.forEach((currentBetFloor) => {
    const eligiblePlayers = activePlayers.filter(p => p.bet >= currentBetFloor);

    const potAmount = activePlayers.reduce((sum, p) => {
      const contribution = Math.min(p.bet, currentBetFloor) - Math.min(p.bet, previousBetFloor);
      return sum + contribution;
    }, 0);

    if (potAmount > 0 && eligiblePlayers.length >= 2) {
      pots.push({
        name: pots.length === 0 ? "Main Pot" : `Side Pot ${pots.length}`,
        amount: potAmount,
        eligiblePlayerIds: eligiblePlayers.map(p => p.id)
      });
    }
    previousBetFloor = currentBetFloor;
  });

  return pots;
}

export function calculatePayouts(players: Player[], pots: PotStage[]): Record<number, number> {
  const payouts: Record<number, number> = {};
  players.forEach(p => payouts[p.id] = 0);

  pots.forEach(pot => {
    const eligiblePlayers = players.filter(p => pot.eligiblePlayerIds.includes(p.id));
    const bestRank = Math.min(...eligiblePlayers.map(p => p.rank));
    const winners = eligiblePlayers.filter(p => p.rank === bestRank)
      .sort((a, b) => a.id - b.id);

    const winAmount = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;

    winners.forEach((w, index) => {
      payouts[w.id] += winAmount + (index < remainder ? 1 : 0);
    });
  });

  return payouts;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Round to nearest realistic chip denomination */
function chipAmount(bb: number, multiplier: number): number {
  const raw = bb * multiplier;
  if (raw < 500)   return Math.max(100, Math.round(raw / 100) * 100);
  if (raw < 2000)  return Math.round(raw / 500) * 500;
  if (raw < 10000) return Math.round(raw / 1000) * 1000;
  return Math.round(raw / 5000) * 5000;
}

// ── Realistic scenario generator ──────────────────────────────────────────────
const BLIND_LEVELS = [
  { sb: 25,   bb: 50,   label: '$25/$50'         },
  { sb: 100,  bb: 200,  label: '$100/$200'        },
  { sb: 500,  bb: 1000, label: '$500/$1,000'      },
  { sb: 1000, bb: 2000, label: '$1,000/$2,000'    },
];

// 6-max positions in pre-flop action order (UTG acts first, BB acts last)
const POSITION_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

/**
 * Generates a realistic pre-flop all-in scenario with at most 2 side pots.
 * Uses poker position names (UTG / HJ / CO / BTN / SB / BB) and
 * realistic chip amounts relative to the chosen blind level.
 */
export function generateRealisticScenario(): { players: Player[]; context: ScenarioContext } {
  const blind = BLIND_LEVELS[Math.floor(Math.random() * BLIND_LEVELS.length)];
  const { bb } = blind;

  // ── Pick a scenario archetype → determines how many players and unique bet tiers ──
  // Each archetype returns a sorted-ascending array of bet amounts.
  // Max 3 unique values → max 2 side pots.
  type Arch = () => number[];
  const archetypes: Arch[] = [
    // 3-player: 2 unique → 1 side pot
    () => { const a = chipAmount(bb, rand(5, 12));  const b = chipAmount(bb, rand(20, 60)); return [a, a, b]; },
    () => { const a = chipAmount(bb, rand(5, 12));  const b = chipAmount(bb, rand(20, 60)); return [a, b, b]; },
    // 3-player: 3 unique → 2 side pots
    () => { const a = chipAmount(bb, rand(5, 10));  const b = chipAmount(bb, rand(15, 35)); const c = chipAmount(bb, rand(40, 90)); return [a, b, c]; },
    // 4-player: 2 unique → 1 side pot
    () => { const a = chipAmount(bb, rand(5, 12));  const b = chipAmount(bb, rand(25, 60)); return [a, a, b, b]; },
    () => { const a = chipAmount(bb, rand(5, 12));  const b = chipAmount(bb, rand(25, 60)); return [a, b, b, b]; },
    () => { const a = chipAmount(bb, rand(5, 12));  const b = chipAmount(bb, rand(25, 60)); return [a, a, a, b]; },
    // 4-player: 3 unique → 2 side pots
    () => { const a = chipAmount(bb, rand(5, 10));  const b = chipAmount(bb, rand(15, 30)); const c = chipAmount(bb, rand(40, 90)); return [a, b, b, c]; },
    () => { const a = chipAmount(bb, rand(5, 10));  const b = chipAmount(bb, rand(15, 30)); const c = chipAmount(bb, rand(40, 90)); return [a, a, b, c]; },
    () => { const a = chipAmount(bb, rand(5, 10));  const b = chipAmount(bb, rand(15, 30)); const c = chipAmount(bb, rand(40, 90)); return [a, b, c, c]; },
  ];

  const sortedBets = archetypes[Math.floor(Math.random() * archetypes.length)]()
    .sort((x, y) => x - y);
  const playerCount = sortedBets.length;

  // ── Pick positions ──────────────────────────────────────────────────────────
  const selectedPositions = shuffle(POSITION_ORDER).slice(0, playerCount);
  // Sort by pre-flop action order so "revealed" order matches the real table sequence
  selectedPositions.sort((a, b) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b));

  // ── Assign amounts to positions (shuffle amounts so short-stack ≠ always UTG) ──
  const shuffledBets = shuffle(sortedBets);

  // ── Build players ───────────────────────────────────────────────────────────
  const players: Player[] = selectedPositions.map((pos, i) => ({
    id: i + 1,
    name: pos,
    position: pos,
    bet: shuffledBets[i],
    isAllIn: true,
    rank: 0,
    rankName: '',
  }));

  // ── Assign ranks ────────────────────────────────────────────────────────────
  const ranks = Array.from({ length: playerCount }, (_, i) => i + 1);
  // 25% chance of a tie at rank 1
  if (Math.random() < 0.25 && playerCount >= 3) {
    const tieIdx = Math.floor(Math.random() * (playerCount - 1));
    ranks[tieIdx + 1] = ranks[tieIdx];
  }
  const shuffledRanks = shuffle(ranks);

  const getRankName = (r: number, allR: number[]) => {
    const count = allR.filter(x => x === r).length;
    if (r === 1) return count > 1 ? '第一名（平手）' : '第一名（最強）';
    if (r === Math.max(...allR)) return '墊底（最弱）';
    return `第 ${r} 名`;
  };

  players.forEach((p, i) => {
    p.rank     = shuffledRanks[i];
    p.rankName = getRankName(shuffledRanks[i], shuffledRanks);
  });

  return {
    players,
    context: { blindLabel: blind.label, sb: blind.sb, bb: blind.bb },
  };
}

/** Legacy wrapper — kept so nothing else breaks */
export function generateRandomScenario(): Player[] {
  return generateRealisticScenario().players;
}
