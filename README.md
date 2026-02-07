# 🎯 DealerPro: 專業撲克荷官練習工具

**DealerPro** 是一款專為職業撲克荷官設計的數位化訓練工具，旨在提升使用者在多玩家 All-in 情況下的底池核算、籌碼分配及多種遊戲變體（Hold'em, Omaha, BIGO）的勝負判定能力。

## 🔗 線上試運行
[https://leon-cypher.github.io/dealerpractice/](https://leon-cypher.github.io/dealerpractice/)

---

## 🔥 2026/02/07 重大更新：競技系統上線

### 🏆 全球排行榜 (Global Leaderboard)
- **雲端同步**：整合 Supabase 雲端資料庫，即時上傳戰績與全球荷官同台競技。
- **門檻機制**：只有進入全球 **前 10 名** 的高分玩家才能在排行榜上留下稱號。
- **防弊與安全**：實作前端輸入驗證、XSS 過濾，並支援 Supabase RLS 安全政策。

### ⏱️ 計時積分系統 (Scoring System)
- **時間加成**：
  - **10秒內**答對：1.5倍 分數。
  - **15秒內**答對：1.25倍 分數。
- **難度加成**：BIGO (2x) > Omaha (1.5x) > Hold'em (1x)。
- **硬核機制**：實作 **「一錯歸零 (Permadeath)」**，任何階段答錯，總積分與連勝紀錄立即歸零。
- **動態加成**：連勝次數越多，每題獲得的分數將持續加乘。

---

## ✅ 核心功能

### 1. 判定引擎 (Showdown Engine)
- **多變體支援**：Hold'em, Omaha (High), BIGO (Big O, Hi-Lo 8-or-better)。
- **專業規則**：嚴格遵守「2張底牌 + 3張公共牌」組牌原則。

### 2. 底池計算系統 (Pot Calculator)
- **核算練習**：兩階段練習模式（金額核算 -> 最終分配）。
- **智能輔助**：答錯時支援「顯示解答」與「重新輸入」。

### 3. 視覺與體驗 (UI/UX)
- **專業視覺**：同步 `omaha_hilo_calculator` 專業四色牌組，白底高對比設計。
- **極速流暢**：響應式設計，完美適配手機與平板，支援離線練習（不含排行榜）。

---

## 🛠 技術規格
- **前端**：React 18 + TypeScript + Vite
- **資料庫**：Supabase (PostgreSQL)
- **樣式**：Tailwind CSS + 專業級 CSS 動態光澤效果
- **部署**：GitHub Actions 自動化部署

---

## 🚀 本地開發環境
1. 複製此儲存庫。
2. 執行 `npm install`。
3. 執行 `npm run dev` 啟動開發伺服器。

---

**開發團隊：Gemini CLI Agent & Leon Cypher**
**最後更新日期：2026年2月7日**