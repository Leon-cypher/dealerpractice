export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GameVariant = 'HOLDEM' | 'OMAHA' | 'BIGO';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣'
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Helper to get combinations
function getCombinations<T>(array: T[], n: number): T[][] {
  if (n === 0) return [[]];
  if (array.length === 0) return [];
  const [first, ...rest] = array;
  const withFirst = getCombinations(rest, n - 1).map(c => [first, ...c]);
  const withoutFirst = getCombinations(rest, n);
  return [...withFirst, ...withoutFirst];
}

function getHandScore(cards: Card[]) {
  const values = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  
  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const freq = Object.values(counts).sort((a, b) => b - a);
  
  const isFlush = new Set(suits).size === 1;
  const isStraight = new Set(values).size === 5 && (values[0] - values[4] === 4);
  const isWheel = values.join(',') === '14,5,4,3,2';
  
  // Use a large base for category and base 15 for tie-breakers
  // (category * 15^5) + (card1 * 15^4) + (card2 * 15^3) + ...
  const CATEGORY_BASE = Math.pow(15, 5);
  
  const getTieBreaker = (sortedValues: number[]) => {
    return sortedValues.reduce((score, val, idx) => score + val * Math.pow(15, 4 - idx), 0);
  };

  if (isFlush && (isStraight || isWheel)) {
    return 9 * CATEGORY_BASE + (isWheel ? 5 : values[0]);
  }
  
  if (freq[0] === 4) {
    const quad = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 4)!);
    const kicker = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 1)!);
    return 8 * CATEGORY_BASE + quad * 15 + kicker;
  }
  
  if (freq[0] === 3 && freq[1] === 2) {
    const trips = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 3)!);
    const pair = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 2)!);
    return 7 * CATEGORY_BASE + trips * 15 + pair;
  }
  
  if (isFlush) {
    return 6 * CATEGORY_BASE + getTieBreaker(values);
  }
  
  if (isStraight || isWheel) {
    return 5 * CATEGORY_BASE + (isWheel ? 5 : values[0]);
  }
  
  if (freq[0] === 3) {
    const trips = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 3)!);
    const kickers = values.filter(v => v !== trips);
    return 4 * CATEGORY_BASE + trips * Math.pow(15, 2) + kickers[0] * 15 + kickers[1];
  }
  
  if (freq[0] === 2 && freq[1] === 2) {
    const pairs = Object.keys(counts).filter(k => counts[parseInt(k)] === 2).map(Number).sort((a, b) => b - a);
    const kicker = values.filter(v => !pairs.includes(v))[0];
    return 3 * CATEGORY_BASE + pairs[0] * Math.pow(15, 2) + pairs[1] * 15 + kicker;
  }
  
  if (freq[0] === 2) {
    const pair = parseInt(Object.keys(counts).find(k => counts[parseInt(k)] === 2)!);
    const kickers = values.filter(v => v !== pair);
    return 2 * CATEGORY_BASE + pair * Math.pow(15, 3) + getTieBreaker(kickers.concat([0, 0, 0]).slice(0, 3));
  }
  
  return 1 * CATEGORY_BASE + getTieBreaker(values);
}

function getHandDescription(score: number): string {
  const CATEGORY_BASE = Math.pow(15, 5);
  if (score >= 9 * CATEGORY_BASE) return "同花順 (Straight Flush)";
  if (score >= 8 * CATEGORY_BASE) return "四條 (Four of a Kind)";
  if (score >= 7 * CATEGORY_BASE) return "葫蘆 (Full House)";
  if (score >= 6 * CATEGORY_BASE) return "同花 (Flush)";
  if (score >= 5 * CATEGORY_BASE) return "順子 (Straight)";
  if (score >= 4 * CATEGORY_BASE) return "三條 (Three of a Kind)";
  if (score >= 3 * CATEGORY_BASE) return "兩對 (Two Pair)";
  if (score >= 2 * CATEGORY_BASE) return "一對 (One Pair)";
  return "高牌 (High Card)";
}

// Low Hand Evaluation (8 or better)
// Returns a numeric score where LOWER is BETTER (standard for low)
// or null if no qualifying low.
function getLowScore(cards: Card[]) {
  // Low hand must have 5 unique cards 8 or lower (A is 14, but in low it's 1)
  const lowValues = Array.from(new Set(cards.map(c => {
    const v = RANK_VALUE[c.rank];
    return v === 14 ? 1 : v;
  }))).filter(v => v <= 8).sort((a, b) => a - b);

  if (lowValues.length < 5) return null;
  
  // The best 5 cards for low are the 5 smallest unique ones.
  // We compare from the highest card down (8,5,4,3,2 is better than 8,6,4,3,2).
  const targetLow = lowValues.slice(0, 5).sort((a, b) => b - a);
  
  // Score is basically the digits: 85432
  return targetLow[0] * 10000 + targetLow[1] * 1000 + targetLow[2] * 100 + targetLow[3] * 10 + targetLow[4];
}

function formatLowScore(score: number | null): string {
  if (score === null) return "No Low";
  const s = score.toString().padStart(5, '0');
  return `Low: ${s[0]},${s[1]},${s[2]},${s[3]},${s[4]}`;
}

export function generateShowdownScenario(playerCount: number = 2, variant: GameVariant = 'HOLDEM') {
  const deck = shuffle(createDeck());
  const communityCards = deck.splice(0, 5);
  
  const holeCardCount = variant === 'BIGO' ? 5 : (variant === 'OMAHA' ? 4 : 2);
  
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    const holeCards = deck.splice(0, holeCardCount);
    let bestHigh = -1;
    let bestLow: number | null = null;
    
    if (variant === 'HOLDEM') {
      // Any 5 from 7
      const combinations = getCombinations([...communityCards, ...holeCards], 5);
      combinations.forEach(combo => {
        const score = getHandScore(combo);
        if (score > bestHigh) bestHigh = score;
      });
    } else {
      // Omaha/BIGO: Exactly 2 from hand, 3 from board
      const handCombos = getCombinations(holeCards, 2);
      const boardCombos = getCombinations(communityCards, 3);
      
      handCombos.forEach(hCombo => {
        boardCombos.forEach(bCombo => {
          const combo = [...hCombo, ...bCombo];
          const score = getHandScore(combo);
          if (score > bestHigh) bestHigh = score;
          
          // Only BIGO has Low evaluation
          if (variant === 'BIGO') {
            const lScore = getLowScore(combo);
            if (lScore !== null) {
              if (bestLow === null || lScore < bestLow) bestLow = lScore;
            }
          }
        });
      });
    }

    players.push({
      id: i + 1,
      name: `Player ${String.fromCharCode(65 + i)}`,
      cards: holeCards,
      highScore: bestHigh,
      lowScore: bestLow,
      handDescription: getHandDescription(bestHigh),
      lowDescription: formatLowScore(bestLow)
    });
  }

  const maxHighScore = Math.max(...players.map(p => p.highScore));
  
  // For Hi-Lo (Omaha/BIGO), determine low winners
  const validLowScores = players
    .map(p => p.lowScore)
    .filter(score => score !== null) as number[];
    
  const minLowScore = validLowScores.length > 0 ? Math.min(...validLowScores) : null;

  return {
    variant,
    communityCards,
    players: players.map(p => ({
      ...p,
      isHighWinner: p.highScore === maxHighScore,
      isLowWinner: minLowScore !== null && p.lowScore === minLowScore
    }))
  };
}
