import { useState, useCallback } from 'react';
import * as PotCalc from '../utils/potCalculator';

export function useSplitPotGame() {
  const [potPlayers, setPotPlayers] = useState<PotCalc.Player[]>([]);
  const [potAmountAnswers, setPotAmountAnswers] = useState<Record<string, string>>({});
  // userEligible[potName] = set of playerIds user selected
  const [userEligible, setUserEligible] = useState<Record<string, number[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [correctPots, setCorrectPots] = useState<PotCalc.PotStage[]>([]);
  const [scenarioContext, setScenarioContext] = useState<PotCalc.ScenarioContext | null>(null);

  const init = useCallback(() => {
    const { players, context } = PotCalc.generateRealisticScenario();
    const pots = PotCalc.calculatePots(players);
    setPotPlayers(players);
    setCorrectPots(pots);
    setPotAmountAnswers({});
    setUserEligible({});
    setShowResult(false);
    setScenarioContext(context);
  }, []);

  const handleAmountChange = useCallback((potName: string, value: string) => {
    setPotAmountAnswers(prev => ({ ...prev, [potName]: value }));
  }, []);

  const handleToggleEligible = useCallback((potName: string, playerId: number) => {
    setUserEligible(prev => {
      const current = prev[potName] ?? [];
      const next = current.includes(playerId)
        ? current.filter(id => id !== playerId)
        : [...current, playerId];
      return { ...prev, [potName]: next };
    });
  }, []);

  const checkResult = useCallback((): boolean => {
    setShowResult(true);
    return correctPots.every(pot => {
      const amountOk = parseInt(potAmountAnswers[pot.name] || '0') === pot.amount;
      const selected = userEligible[pot.name] ?? [];
      const eligibleOk =
        selected.length === pot.eligiblePlayerIds.length &&
        selected.every(id => pot.eligiblePlayerIds.includes(id));
      return amountOk && eligibleOk;
    });
  }, [correctPots, potAmountAnswers, userEligible]);

  const isAllCorrect = showResult && correctPots.every(pot => {
    const amountOk = parseInt(potAmountAnswers[pot.name] || '0') === pot.amount;
    const selected = userEligible[pot.name] ?? [];
    const eligibleOk =
      selected.length === pot.eligiblePlayerIds.length &&
      selected.every(id => pot.eligiblePlayerIds.includes(id));
    return amountOk && eligibleOk;
  });

  return {
    potPlayers,
    potAmountAnswers,
    userEligible,
    showResult,
    correctPots,
    scenarioContext,
    init,
    handleAmountChange,
    handleToggleEligible,
    checkResult,
    isAllCorrect,
  };
}
