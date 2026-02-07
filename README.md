# 🎯 DealerPro: 專業撲克荷官練習工具

**DealerPro** 是一款專為職業撲克荷官設計的數位化訓練工具，旨在提升使用者在多玩家 All-in 情況下的底池核算、籌碼分配及不同遊戲變體（Hold'em, Omaha, BIGO）的勝負判定能力。

## 🔗 線上試運行
[https://leon-cypher.github.io/dealerpractice/](https://leon-cypher.github.io/dealerpractice/)

---

## ✅ 核心功能

### 1. 判定引擎 (Showdown Engine)
- **多變體支援**：Hold'em, Omaha (High), BIGO (Big O, Hi-Lo 8-or-better)。
- **專業規則**：嚴格遵守「2張底牌 + 3張公共牌」組牌原則。
- **Hi-Lo 判定**：完整實作 BIGO 的低牌判定（8-or-better）。

### 2. 底池計算系統 (Pot Calculator)
- **邊池產出**：自動根據下注金額產生 Main Pot 與多個 Side Pots。
- **核算練習**：兩階段練習模式（金額核算 -> 最終分配）。
- **智能輔助**：答錯時支援「顯示解答」與「重新輸入」。

### 3. 視覺與體驗 (UI/UX)
- **數位撲克視覺**：採用專業四色牌組設計（Spades:黑, Hearts:紅, Diamonds:藍, Clubs:綠）。
- **全中文化介面**：友善的繁體中文按鈕與規則說明。
- **響應式設計**：適配從桌面到行動裝置的所有螢幕尺寸。

---

## 🛠 技術規格
- **框架**：React 18 + TypeScript + Vite
- **樣式**：Tailwind CSS + 原生專業撲克 CSS 樣式
- **自動化**：GitHub Actions 自動化部署 (CI/CD)

---

## 📅 開發進度紀錄 (2026/02/07)

### 已完成優化
- **UI 同步**：同步 `omaha_hilo_calculator` 專案的高對比色塊化撲克牌樣式。
- **路徑修復**：解決 GitHub Pages 部署時的資源路徑與 TypeScript 編譯錯誤。
- **回饋優化**：移除牌力判斷時輸家標籤的紅色誤導色，改為中性灰色。
- **功能增強**：底池計算階段新增「清除/重填」與「顯示解答」功能。

### 待辦清單 (Future Plans)
- [ ] **Odd Chips 練習**：實作不整除籌碼優先分配給特定位置（如 Button）的邏輯。
- [ ] **計時挑戰**：新增壓力測試模式，記錄計算速度。
- [ ] **荷官檢定**：整合多種情境的連續挑戰模式。

---

## 🚀 本地開發環境
1. 複製此儲存庫。
2. 執行 `npm install` 安裝依賴。
3. 點擊 `Run.bat` 或執行 `npm run dev` 啟動。

---

**報告人：Gemini CLI Agent**
**日期：2026年2月7日**
