# 🎰 Leon-lab - 專業荷官訓練中心

[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://leon-lab-7066b.web.app/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🔗 **線上體驗**: [https://leon-lab-7066b.web.app/](https://leon-lab-7066b.web.app/)

這是一個專為德州撲克荷官與玩家設計的全方位培訓平台，結合了理論題庫、底池核算模擬與牌力判定競技。

---

## ✨ 核心特色

### 🔥 1. 競技挑戰模式 (Challenge Mode)
- **限時衝刺**：5 分鐘極限倒數，考驗在高壓下的反應速度與準確度
- **手速優化**：挑戰模式下答對即自動跳轉下一題（0.8 秒延遲），極大化答題效率
- **公平鎖定**：挑戰中模式與種類將被鎖定，確保排行榜的公平競爭基準

### 🏆 2. 五大獨立排行榜
- **底池計算**：複雜多邊池 All-in 分配
- **德州判斷**：傳統德州撲克勝負判讀
- **奧馬哈判斷**：強制 2+3 規則判讀
- **BIGO 判斷**：5 張 Hi-Lo 高低牌判讀
- **理論測驗**：110 題專業規則知識
- **門檻機制**：僅限挑戰模式產生的前 10 名成績可登錄全球排行

### ⚖️ 3. 計分與加成系統
- **連勝加成 (Streak)**：每連續答對一題，下一題得分增加 **20%**
- **速度獎勵 (Time Bonus)**：10 秒內答對享有 **1.5 倍** 加成
- **難度權重**：BIGO (2.0x) > Omaha (1.5x) > Quiz (1.2x) > Hold'em (1.0x)

### 📚 4. 專業題庫系統
- **110 題大全**：涵蓋 TDA 規則判定、發牌程序與特殊情境
- **隨機排序**：每次進入自動重新洗牌，確保訓練多樣性
- **即時解析**：答錯立即顯示規則詳解，強化正確觀念

### 👤 5. 使用者系統
- **Google 快速登入**：一鍵登入，支援跨設備同步
- **個人資料管理**：自訂暱稱與頭像
- **成績追蹤**：挑戰紀錄與排行榜即時更新

---

## 🛠️ 技術架構

### 前端
- **Framework**: React 18.3 + Vite 5.4
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **State Management**: React Hooks

### 後端服務
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore (排行榜 + 使用者資料)
- **Storage**: Firebase Storage (頭像上傳)
- **Hosting**: Firebase Hosting

### 安全性
- **Firestore Rules**: 防止作弊和未授權存取
- **Composite Indexes**: 優化查詢效能
- **Input Validation**: 前後端雙重驗證

---

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 或 yarn

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/Leon-cypher/dealerpractice.git
cd dealerpractice

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 在瀏覽器開啟
# http://localhost:5173
```

### 部署到 Firebase

```bash
# 1. 編譯專案
npm run build

# 2. 部署到 Firebase Hosting
firebase deploy --only hosting

# 3. 部署 Firestore 規則和索引
firebase deploy --only firestore
```

---

## 📱 瀏覽器支援

| 瀏覽器 | 支援狀態 | 登入方式 |
|--------|---------|----------|
| Chrome / Edge | ✅ 完整支援 | Popup |
| Safari | ✅ 完整支援 | Redirect |
| Firefox | ✅ 完整支援 | Redirect |
| LINE 內建瀏覽器 | ⚠️ 需開啟外部瀏覽器 | 提示引導 |
| Facebook / IG | ⚠️ 需開啟外部瀏覽器 | 提示引導 |

> 💡 **提示**: 在 LINE 等 App 內建瀏覽器中，點選右上角選單 → 「在瀏覽器中開啟」即可正常登入

---

## 📂 專案結構

```
split-pot-pro/
├── src/
│   ├── components/        # React 元件
│   │   └── AvatarUpload.tsx
│   ├── utils/            # 工具函數
│   │   ├── pokerLogic.ts
│   │   ├── potCalculator.ts
│   │   ├── quizData.ts
│   │   └── quizLogic.ts
│   ├── firebase.ts       # Firebase 設定
│   ├── App.tsx           # 主應用程式
│   └── main.tsx          # 入口點
├── public/               # 靜態資源
├── firestore.rules       # Firestore 安全規則
├── firestore.indexes.json # Firestore 索引
├── firebase.json         # Firebase 設定
└── package.json
```

---

## 🎨 UI/UX 特色

### 響應式設計
- ✅ 手機優先設計
- ✅ 平板/桌面完美適配
- ✅ 高對比度配色（WCAG 2.1 AA）

### 動畫與互動
- ✅ 流暢的頁面轉場
- ✅ 按鈕 hover/active 效果
- ✅ 成績提交動畫

### 無障礙設計
- ✅ 語意化 HTML
- ✅ ARIA 標籤
- ✅ 鍵盤導航支援

---

## 🔒 資料庫結構

### Profiles Collection
```typescript
{
  id: string,           // = user.uid
  nickname: string,
  avatar_url: string | null,
  updated_at: timestamp
}
```

### Leaderboard Collection
```typescript
{
  name: string,         // 玩家暱稱
  score: number,        // 分數
  streak: number,       // 連勝次數
  type: string,         // 類型（SPLIT_POT, SHOWDOWN_HOLDEM等）
  user_id: string,      // = user.uid
  avatar_url: string | null,
  created_at: timestamp
}
```

---

## 📊 成績計算公式

```
基礎分數 = 100 分

連勝加成 = 1 + (連勝次數 × 0.2)
速度加成 = (答題時間 < 10秒) ? 1.5 : 1.0
難度倍率 = BIGO: 2.0 | Omaha: 1.5 | Quiz: 1.2 | Holdem: 1.0

最終得分 = 基礎分數 × 連勝加成 × 速度加成 × 難度倍率
```

---

## 🤝 貢獻指南

歡迎提出 Issue 或 Pull Request！

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📝 版本歷史

### v2.0.0 (2026-02-08)
- ✨ 整合 Firebase Authentication、Firestore、Storage
- 🎨 UI/UX 大幅優化（手機版、顏色對比度）
- 🔒 新增 Firestore 安全規則和索引
- 📚 題庫從 50 題擴充至 110 題
- 🌐 支援多種瀏覽器環境（Safari、LINE 等）
- 🚀 從 GitHub Pages 遷移至 Firebase Hosting

### v1.0.0
- 🎉 初始版本發布
- 📊 底池計算、勝負判斷、理論測驗
- 🏆 排行榜系統

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 👨‍💻 作者

**Leon**
- GitHub: [@Leon-cypher](https://github.com/Leon-cypher)
- 專案: [DealerPractice](https://github.com/Leon-cypher/dealerpractice)

---

## 🙏 致謝

- TDA (Tournament Directors Association) 規則參考
- Firebase 提供的優質後端服務
- React 與 Vite 開發團隊

---

<div align="center">
  
**Professional Dealer Training Utility • 2026**

[🌐 立即體驗](https://leon-lab-7066b.web.app/) | [📖 回報問題](https://github.com/Leon-cypher/dealerpractice/issues) | [⭐ 給顆星星](https://github.com/Leon-cypher/dealerpractice)

</div>