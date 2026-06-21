import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { HomePage } from './pages/HomePage';
import { GameMenuPage } from './pages/GameMenuPage';
import { TestSelectPage } from './pages/TestSelectPage';
import { TestModePage } from './pages/TestModePage';
import { TdaTestModePage } from './pages/TdaTestModePage';
import { GamePlayPage } from './pages/GamePlayPage';
import { AchievementPage } from './pages/AchievementPage';
import { LeaderboardPage } from './pages/LeaderboardPage';

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game-menu" element={<GameMenuPage />} />
          <Route path="/test-mode" element={<TestSelectPage />} />
          <Route path="/test-basic" element={<TestModePage />} />
          <Route path="/tda-test" element={<TdaTestModePage />} />
          <Route path="/play" element={<GamePlayPage />} />
          <Route path="/achievements" element={<AchievementPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;
