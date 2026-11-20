# ACLS Teaching

ACLS 講師教學用的 HTML 投影片，依教科書章節整理，逐項對照最新指引。

**線上首頁：** https://hh4832.github.io/acls-teaching/

| 章節 | 資料夾 | 線上播放 |
|---|---|---|
| 第 3 章 成人基本救命術（BLS） | [`ch03-bls/`](ch03-bls/) | https://hh4832.github.io/acls-teaching/ch03-bls/ |
| 第 4 章 呼吸道、呼吸動力的處置及氧氣治療 | [`ch04-airway/`](ch04-airway/) | https://hh4832.github.io/acls-teaching/ch04-airway/ |
| 第 5 章 重要危急心電圖判讀 | [`ch05-ecg/`](ch05-ecg/) | https://hh4832.github.io/acls-teaching/ch05-ecg/ |
| 第 6 章 心臟停止之治療 | [`ch06-cardiac-arrest/`](ch06-cardiac-arrest/) | https://hh4832.github.io/acls-teaching/ch06-cardiac-arrest/ |
| 第 9 章 急性冠狀動脈症候群（ACS） | [`ch09-acs/`](ch09-acs/) | https://hh4832.github.io/acls-teaching/ch09-acs/ |
| 第 11 章 急性腦中風 | [`ch11-stroke/`](ch11-stroke/) | https://hh4832.github.io/acls-teaching/ch11-stroke/ |

## 結構

```
index.html          首頁（各章入口）
shared/
  deck.css          共用版型：1600×900 舞台、字型與色彩、卡片、表格、講者備註、手機閱讀版、列印
  deck.js           共用功能：翻頁、全螢幕、備註、猜猜看（點擊揭曉、A 全部揭曉）、目錄跳頁、滑動、列印
  flow.js           SVG 流程圖繪製工具（flow(id, nodes, edges)）
  ecg.js            動態心電圖：<canvas class="ecg" data-r="vt">，監視器式掃描動畫（第 5、6 章使用）
chNN-topic/
  index.html        該章投影片；只放內容與該章專用樣式
  assets/           該章圖片
  README.md         該章說明與來源
```

每章 `index.html` 以 `../shared/deck.css`、`../shared/deck.js` 載入共用版型，改一次三章一起更新。該章專用的元件（例如 BLS 的生存之鏈、中風的流程盒）寫在該章的 `<style>` 裡。

## 新增一章

1. 複製任一章資料夾，改名為 `chNN-topic`（NN 為教科書章節號）。
2. 保留 `<head>` 的共用樣式連結與 `</body>` 前的 `deck.js`，換掉 `<section class="slide">` 內容。
3. 在首頁 `index.html` 加一張卡片，並在上表加一列。

## 操作

← → 翻頁 · F 全螢幕 · N 講者備註 · P 列印（16:9 PDF）· A 揭曉本頁所有答案 · 網址加 `#頁碼` 直接跳頁。手機或直向螢幕自動切換為單欄閱讀版。

## 歷史

三章原本各自在 `hh4832/ACLS_teaching_BLS`、`hh4832/acs-teaching`、`hh4832/stroke-teaching`，以 `git subtree` 匯入並保留完整 commit 紀錄。舊網址會自動轉到這裡。

> 本投影片供教學使用。實際處置依最新指引、藥品仿單與院內規範。

## 部署（Vercel 展示版）

公開網站由 Vercel 從本 repo（private）自動部署，只發布**展示版**：

- `npm run build`（`build.mjs`）把 `index.html`、`chNN-*/`、`shared/` 打包到 `dist/`：去除講者備註與 HTML 註解、壓縮混淆 JS / CSS、停用列印、加上版權列。
- README、`build.mjs`、`.md` 講師提醒、git 紀錄都不會出現在網站上。
- 設定在 `vercel.json`（build 指令、輸出資料夾、安全標頭）。
- 本機預覽展示版：`npm install && npm run build`，再開 `dist/index.html`。

講者備註只在原始檔（本 repo）裡；上課時用本機或 GitHub 上的原始 `index.html` 開啟即可按 N 看備註。

版權：見 [LICENSE](LICENSE)，保留所有權利。
