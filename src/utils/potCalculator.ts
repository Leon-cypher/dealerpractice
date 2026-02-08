export interface Player {
  id: number;
  name: string;
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
      .sort((a, b) => a.id - b.id); // 排序 ID 以決定零錢分配順序
    
    const winAmount = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;
    
    winners.forEach((w, index) => {
      // 餘數由 index 較小（ID 較小）的贏家先拿 1 元
      payouts[w.id] += winAmount + (index < remainder ? 1 : 0);
    });
  });

  return payouts;
}

export function generateRandomScenario(): Player[] {
  const playerCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 players
  const players: Player[] = [];
  const baseBets = [1000, 2000, 3000, 4000, 5000];
  
  // Create a pool of ranks [1, 2, 3, 4, 5] and shuffle/assign
  // Some players might have the same rank (tie)
  const ranks = [1, 2, 3, 4, 5].slice(0, playerCount);
  // Randomly decide if there's a tie (30% chance)
  if (Math.random() < 0.3) {
    const tieAt = Math.floor(Math.random() * (playerCount - 1)) + 1;
    ranks[tieAt] = ranks[tieAt - 1];
  }
  
  // Shuffle ranks
  for (let i = ranks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
  }

  const getRankName = (r: number, allRanks: number[]) => {
    const count = allRanks.filter(x => x === r).length;
    if (r === 1) return count > 1 ? "第一名 (平手)" : "第一名 (最贏)";
    if (r === Math.max(...allRanks)) return "最後一名 (最輸)";
    return `第 ${r} 名`;
  };

  for (let i = 0; i < playerCount; i++) {
    const bet = baseBets[Math.floor(Math.random() * baseBets.length)];
    const rank = ranks[i];
    
    players.push({
      id: i + 1,
      name: `Player ${String.fromCharCode(65 + i)}`,
      bet: bet,
      isAllIn: true,
      rank: rank,
      rankName: getRankName(rank, ranks)
    });
  }
  
  return players;
}
