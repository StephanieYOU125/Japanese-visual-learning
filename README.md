# ことばの森 v5｜iPhone PWA＋動漫截圖 OCR

## iPhone 使用方式
1. 將全部檔案上傳到 GitHub Pages。
2. 用 iPhone Safari 開啟網站網址。
3. 點「分享」→「加入主畫面」。
4. 之後可像 App 一樣從 iPhone 主畫面開啟。

## 截圖自動辨識流程
1. 點「截圖自動辨識」。
2. 從 iPhone 照片選擇動漫截圖，或直接拍照。
3. 用上下滑桿框選字幕所在範圍。
4. 點「開始辨識日文字幕」。
5. 網站以 Tesseract.js 日文模型執行 OCR。
6. 使用 Kuromoji 自動產生：
   - 逐詞切分
   - 漢字讀音
   - 平假名
   - 片假名
   - 詞性
   - 動詞／形容詞原形（可取得時）
7. 內建規則會提示常見文法。
8. 檢查後帶入動漫學習表單，再補上中文、作品、角色與網址。

## 重要限制
- OCR 不是百分之百準確，特殊字型、直排文字、模糊字幕、黑邊、中文與日文重疊時尤其容易出錯。
- 自動平假名與詞性取自日文詞典，專有名詞可能讀錯。
- 文法功能只做常見句型提示，不能取代完整人工分析。
- 中文翻譯不會在純前端自動產生，避免把不可靠翻譯直接存入。
- OCR 第一次使用需要網路下載辨識模型與日文詞典。
- 內容仍以 localStorage 儲存；要手機與電腦即時同步，需再串接 Firebase／Supabase。

## PWA 檔案
- manifest.json
- sw.js
- assets/icon-192.png
- assets/icon-512.png
- assets/apple-touch-icon.png

## 技術
- Tesseract.js：日文圖片 OCR
- Kuromoji.js：日文斷詞、讀音與詞性
- Service Worker：網站核心檔案快取
- Web App Manifest：iPhone 主畫面 App 顯示

## v6 Firebase cloud sync
- Google Authentication login
- Firestore sync under `users/{uid}/entries/{entryId}`
- Local data is merged into cloud after first login
- Text/metadata sync across devices
- Base64 images remain device-local on Spark plan because Cloud Storage is not enabled; bundled `assets/...` images still work everywhere
- Before GitHub Pages login works, add your GitHub Pages host (for example `stephanieyou125.github.io`) in Firebase Authentication > Settings > Authorized domains.

## v9 cloud image support

This version keeps Firestore for learning records and adds Firebase Storage support for anime screenshots. When a signed-in user saves a data-image, the app uploads it to `users/{uid}/anime/` and stores the download URL in Firestore. Apply the included `STORAGE_RULES.txt` in Firebase Storage Rules before using cloud image sync.

The OCR workspace also includes an **Auto subtitle crop** helper. It estimates a likely subtitle band from bright/high-contrast text density; users can still fine-tune the crop sliders before OCR.


## v10：動漫截圖上傳學習
新增完整流程：
- iPhone／電腦上傳動漫截圖
- 手動裁切字幕範圍
- Tesseract.js 日文 OCR
- Kuromoji 平假名、片假名、詞性、原形
- 單字中文提示
- 常見文法與使用情境
- 中文草稿與 Google 翻譯確認
- Firebase Storage 儲存壓縮截圖
- Firestore 儲存學習內容、imageUrl、storagePath
- Storage 路徑：users/{uid}/anime/{imageId}.jpg

請先發布 STORAGE_RULES.txt 中的規則。
