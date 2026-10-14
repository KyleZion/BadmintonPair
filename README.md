# 羽球雙打配對

手機優先的純前端網頁應用（Vue 3 + Vite）。輸入球員名單（名稱、性別）與場地數後，產生上場區、等待區與休息區，再用點選的方式把球員排入場地。資料存在瀏覽器的 localStorage，不需要後端。

## 開發

需要 Node.js 18 以上。

```bash
npm install
npm run dev       # 開發伺服器，手機要測試可用 npm run dev -- --host 再用同網段 IP 連線
npm test          # 執行單元測試（utils 的純函式）
npm run build     # 建置到 dist/
npm run preview   # 預覽建置結果
```

## 專案結構

```
src/
├── main.js                     進入點：掛載 App、載入全域樣式
├── App.vue                     最外層：分頁列 + 目前分頁 + 浮動提示
├── styles/
│   ├── tokens.css              顏色、字型、尺寸 token（含深色模式）
│   └── base.css                全域重設與共用 class（.btn、.card、.seg…）
├── utils/                      純函式，不依賴 Vue，可以直接寫測試
│   ├── players.js              名單解析、去重、男雙／女雙／混雙判斷、範例名單
│   ├── board.js                場地資料操作：放入、互換、放回、上場、調整面數、開始新的一天
│   ├── timer.js                場地計時：排滿開始、未排滿清除、分:秒格式
│   ├── matches.js              已結束的比賽紀錄：建立、刪除、上限、摘要、時間格式
│   ├── stats.js                球員統計：今天、過去某一天、全部累計（含出席天數）與排序
│   ├── days.js                 過去的日子：封存、同日合併、保留 120 天、摘要
│   ├── pairs.js                搭檔與對手次數、個人關係、場地重複組合提醒
│   └── storage.js              localStorage 讀寫與資料檢查
├── stores/
│   └── board.js                全域狀態（單例 store）：state、推導資料、所有動作
├── composables/
│   ├── useToast.js             浮動提示
│   ├── useConfirm.js           「再點一次確認」
│   └── useMedia.js             判斷螢幕寬度（手機寬度 < 720px 時切換成精簡看板）
├── views/
│   ├── SetupView.vue           名單與場地分頁
│   ├── BoardView.vue           配對看板分頁
│   └── StatsView.vue           統計數據分頁
└── components/
    ├── AppTabBar.vue           手機底部分頁列／桌機頁首
    ├── common/                 GenderMark、GameCount（已打場次）、NewDayButton（開始新的一天）、AppIcon、ToastMessage
    ├── stats/                  DateBar（日期列）、MatchRow（一筆比賽紀錄）、PlayerStatsTable（三種模式的統計表）、
                                DayCard（歷史卡片）、DayDetail（某一天）、AllStats（全部累計）、KpiRow（摘要數字）、
                                PlayerDetail（點名字看搭檔與對手）
    ├── setup/                  RosterEditor（名單）、CourtSettings（場地數）
    └── board/                  平板／桌機：CourtZone（區域）、CourtCard（完整球場）、CourtLines（球場線）
                                提醒：PairWarning（今天同隊／對手 2 次以上）
                                手機：CompactBoard（上場與等待並排）、MiniCourt（迷你球場）
                                共用：PlayerSlot（一格）、RestPanel（休息區 + 選取提示）
tests/
├── board.test.js               場地操作與名單的單元測試
├── timer.test.js               場地計時的單元測試
├── matches.test.js             比賽紀錄的單元測試
├── stats.test.js               球員統計、復原與刪除紀錄的單元測試
├── newday.test.js              開始新的一天的單元測試
├── days.test.js                過去的日子與累計統計的單元測試
└── pairs.test.js               搭檔與對手的單元測試
```

### 資料流

- 所有狀態都在 `stores/board.js`。元件只讀取 store 的資料、呼叫 store 的動作，不自己修改場地陣列。
- 實際的資料操作寫在 `utils/board.js`（純函式，方便測試），store 負責把結果套用到畫面狀態並顯示提示。
- 休息區不另外存資料：**不在任何場地上的球員就是休息區**。新增球員自動出現在休息區，刪除球員自動從場地移除。
- `state` 有變動就自動存到 localStorage；`ui`（目前分頁、選取中的球員）不存檔。

### 新增功能時放哪裡

| 要做的事 | 放在 |
| --- | --- |
| 新的排程演算法（自動補位、輪替） | `utils/` 新增檔案寫純函式 + `tests/` 寫測試，再從 store 呼叫 |
| 新的操作按鈕 | store 新增動作，元件呼叫 |
| 新的畫面區塊 | `components/<分頁>/` 新增元件 |
| 新的顏色 | `styles/tokens.css`，淺色與兩個深色區塊都要加 |
| 改資料格式 | `utils/storage.js` 的 `STORE_KEY` 換新版本號，避免讀到舊資料 |

## 部署

`vite.config.js` 設定了 `base: "./"`，建置出來的 `dist/` 用相對路徑，放在任何靜態主機或子目錄都能運作。

- **GitHub Pages**：已附 `.github/workflows/deploy.yml`。把專案推到 GitHub 的 `main` 分支，到 repo 的 Settings → Pages → Source 選「GitHub Actions」，之後每次推送都會自動測試、建置、部署。
- **Netlify / Vercel / Cloudflare Pages**：建置指令 `npm run build`，輸出目錄 `dist`。
- **任何靜態主機**：執行 `npm run build`，把 `dist/` 整個資料夾上傳即可。
