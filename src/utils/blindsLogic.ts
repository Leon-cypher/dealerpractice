export type BlindsQuestionType = 'NL_MIN_RAISE' | 'PL_MAX_RAISE' | 'REOPEN_ACTION';

export interface BlindsQuestion {
  id: number;
  type: BlindsQuestionType;
  badge: string;
  scenarioLines: string[];
  question: string;
  hint: string;
  answerType: 'number' | 'boolean';
  answer: number | boolean;
  explanation: string;
}

let _idCounter = 0;

// ── NL Min Raise ────────────────────────────────────────────────────────────

function generateNLMinRaise(id: number): BlindsQuestion {
  const BB = [100, 200, 500][Math.floor(Math.random() * 3)];
  const scenario = Math.floor(Math.random() * 5);

  if (scenario === 0) {
    // Pre-flop open: answer = BB × 2
    const answer = BB * 2;
    return {
      id,
      type: 'NL_MIN_RAISE',
      badge: 'NL 最小加注',
      scenarioLines: [
        `大盲注（BB）：${BB}`,
        '翻牌前，無人加注，輪到你行動',
      ],
      question: '你最少要開注到多少？',
      hint: '第一次開注，級距等於 BB',
      answerType: 'number',
      answer,
      explanation: `上一個下注額 0，當前下注額 ${BB}（大盲），\n級距 = ${BB} − 0 = ${BB}，\n最小加注 = ${BB} + ${BB} = ${answer}`,
    };
  }

  if (scenario === 1) {
    // Pre-flop single raise: answer = openTo + (openTo − BB)
    const mult = [2, 3][Math.floor(Math.random() * 2)];
    const openTo = BB * mult;
    const D = openTo - BB;
    const answer = openTo + D;
    return {
      id,
      type: 'NL_MIN_RAISE',
      badge: 'NL 最小加注',
      scenarioLines: [
        `大盲注（BB）：${BB}`,
        `翻牌前，玩家 A 開注到 ${openTo}`,
        '輪到你行動',
      ],
      question: '你最少要加注到多少？',
      hint: '最小加注 = 當前下注額 + 級距',
      answerType: 'number',
      answer,
      explanation: `上一個下注額 ${BB}（BB），當前下注額 ${openTo}，\n級距 = ${openTo} − ${BB} = ${D}，\n最小加注 = ${openTo} + ${D} = ${answer}`,
    };
  }

  if (scenario === 2) {
    // Pre-flop 3-bet: answer = raise2 + (raise2 − raise1)
    const raise1 = BB * 3;
    const raise2 = raise1 * [2, 3][Math.floor(Math.random() * 2)];
    const D = raise2 - raise1;
    const answer = raise2 + D;
    return {
      id,
      type: 'NL_MIN_RAISE',
      badge: 'NL 最小加注',
      scenarioLines: [
        `大盲注（BB）：${BB}`,
        `翻牌前，玩家 A 開注到 ${raise1}`,
        `玩家 B 3-bet 到 ${raise2}`,
        '輪到你行動',
      ],
      question: '你最少要 4-bet 到多少？',
      hint: '最小加注 = 當前下注額 + 級距',
      answerType: 'number',
      answer,
      explanation: `上一個下注額 ${raise1}，當前下注額 ${raise2}，\n級距 = ${raise2} − ${raise1} = ${D}，\n最小加注 = ${raise2} + ${D} = ${answer}`,
    };
  }

  if (scenario === 3) {
    // Post-flop first bet: answer = bet × 2
    const bet = [100, 200, 300, 400, 500, 600, 800, 1000][Math.floor(Math.random() * 8)];
    const answer = bet * 2;
    return {
      id,
      type: 'NL_MIN_RAISE',
      badge: 'NL 最小加注',
      scenarioLines: [
        '翻牌後，無人下注',
        `玩家 A 下注 ${bet}`,
        '輪到你行動',
      ],
      question: '你最少要加注到多少？',
      hint: '第一次下注，級距等於下注額本身',
      answerType: 'number',
      answer,
      explanation: `上一個下注額 0（無人下注），當前下注額 ${bet}，\n級距 = ${bet} − 0 = ${bet}，\n最小加注 = ${bet} + ${bet} = ${answer}`,
    };
  }

  // scenario === 4: Post-flop raise: answer = raiseTo + (raiseTo − bet)
  const bet = [100, 200, 300][Math.floor(Math.random() * 3)];
  const raiseTo = bet * [2, 3][Math.floor(Math.random() * 2)];
  const D = raiseTo - bet;
  const answer = raiseTo + D;
  return {
    id,
    type: 'NL_MIN_RAISE',
    badge: 'NL 最小加注',
    scenarioLines: [
      `翻牌後，玩家 A 下注 ${bet}`,
      `玩家 B 加注到 ${raiseTo}`,
      '輪到你行動',
    ],
    question: '你最少要加注到多少？',
    hint: '最小加注 = 當前下注額 + 級距',
    answerType: 'number',
    answer,
    explanation: `上一個下注額 ${bet}，當前下注額 ${raiseTo}，\n級距 = ${raiseTo} − ${bet} = ${D}，\n最小加注 = ${raiseTo} + ${D} = ${answer}`,
  };
}

// ── PL Max Raise ─────────────────────────────────────────────────────────────

function generatePLMaxRaise(id: number): BlindsQuestion {
  const pOptions = [400, 600, 800, 1000, 1200, 1500, 2000];
  const bOptions = [100, 200, 300, 400, 500, 600];
  const P = pOptions[Math.floor(Math.random() * pOptions.length)];
  const B = bOptions[Math.floor(Math.random() * bOptions.length)];
  const afterCall = P + 2 * B;
  const answer = B + afterCall; // = P + 3B

  return {
    id,
    type: 'PL_MAX_RAISE',
    badge: 'PL 最大加注',
    scenarioLines: [
      '底池限注（Pot-Limit）遊戲',
      `底池（不含當前下注）：${P}`,
      `玩家 A 下注：${B}`,
      '輪到你行動',
    ],
    question: '你最多可以加注到多少？',
    hint: 'PL 最大加注 = 跟注 + 跟注後的底池大小',
    answerType: 'number',
    answer,
    explanation: `跟注後底池 = ${P}（原底池）+ ${B}（跟注）+ ${B}（玩家A下注）= ${afterCall}\n最大加注 = 跟注 ${B} + 底池 ${afterCall} = ${answer}\n（即 P + 3B = ${P} + 3×${B} = ${answer}）`,
  };
}

// ── Reopen Action ─────────────────────────────────────────────────────────────

function generateReopenAction(id: number): BlindsQuestion {
  const BB = [100, 200, 500][Math.floor(Math.random() * 3)];
  const X = BB * [2, 3, 4][Math.floor(Math.random() * 3)]; // Player A raises to X
  const D = X - BB; // minimum raise increment

  const isFullRaise = Math.random() >= 0.5;
  let Y: number;
  if (isFullRaise) {
    Y = X + D * [1, 2][Math.floor(Math.random() * 2)];
  } else {
    const halfD = Math.max(1, Math.floor(D / 2));
    Y = halfD < D ? X + halfD : X + D; // fallback if D=1
  }

  const increment = Y - X;
  const answer = increment >= D;

  return {
    id,
    type: 'REOPEN_ACTION',
    badge: '全下重開',
    scenarioLines: [
      `大盲注（BB）：${BB}`,
      `玩家 A 加注到 ${X}，加注級距 = ${D}`,
      `玩家 B 全下 ${Y}`,
    ],
    question: '玩家 A 是否可以再加注？',
    hint: '玩家B全下增量 ≥ 加注級距 → 重開行動，玩家 A 可再加注',
    answerType: 'boolean',
    answer,
    explanation: `玩家B全下增量 = ${Y} − ${X} = ${increment}\n加注級距 = ${D}\n${increment} ${answer ? '≥' : '<'} ${D}，${answer ? '構成完整加注，重開行動，玩家 A 可再加注' : '短碼全下，不重開行動，玩家 A 不可再加注（只能跟注或棄牌）'}`,
  };
}

// ── Per-mode Generators ───────────────────────────────────────────────────────

/** NL 最小加注 + 全下重開（70 / 30） */
export function generateBlindsNLQuestion(): BlindsQuestion {
  _idCounter++;
  return Math.random() < 0.7
    ? generateNLMinRaise(_idCounter)
    : generateReopenAction(_idCounter);
}

/** PL 最大加注（恆定） */
export function generateBlindsPLQuestion(): BlindsQuestion {
  _idCounter++;
  return generatePLMaxRaise(_idCounter);
}

/** @deprecated 保留相容性，請改用 generateBlindsNLQuestion / generateBlindsPLQuestion */
export function generateBlindsQuestion(): BlindsQuestion {
  _idCounter++;
  const r = Math.random();
  if (r < 0.5) return generateNLMinRaise(_idCounter);
  if (r < 0.8) return generatePLMaxRaise(_idCounter);
  return generateReopenAction(_idCounter);
}
