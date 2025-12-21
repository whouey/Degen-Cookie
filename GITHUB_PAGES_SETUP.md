# GitHub Pages 部署指南

## ✅ 已完成的配置

### 1. Vite 配置更新
- ✅ 設置 `base: "/Degen-Cookie/"` 在 `cookie-frontend/vite.config.mts`
- ✅ 創建 `.nojekyll` 文件在 `cookie-frontend/public/`

### 2. GitHub Actions 工作流
- ✅ 創建 `.github/workflows/deploy.yml`
- ✅ 自動構建和部署到 GitHub Pages

---

## 📋 接下來的步驟

### 步驟 1: 提交更改
```bash
git add .
git commit -m "配置 GitHub Pages 部署"
git push
```

### 步驟 2: 在 GitHub 上啟用 GitHub Pages

1. 前往你的 GitHub 儲存庫: https://github.com/whouey/Degen-Cookie

2. 點擊 **Settings** (設置)

3. 在左側邊欄找到 **Pages**

4. 在 **Build and deployment** 部分:
   - **Source**: 選擇 **GitHub Actions**
   - (不要選擇 "Deploy from a branch")

5. 點擊 **Save** (保存)

### 步驟 3: 觸發部署

選項 A - 自動部署 (推薦):
```bash
git push
```
每次推送到 main 分支時自動部署

選項 B - 手動觸發:
1. 前往 **Actions** 標籤
2. 選擇 **Deploy to GitHub Pages** 工作流
3. 點擊 **Run workflow** 按鈕
4. 選擇 **main** 分支
5. 點擊綠色的 **Run workflow** 按鈕

### 步驟 4: 查看部署狀態

1. 前往儲存庫的 **Actions** 標籤
2. 你會看到 "Deploy to GitHub Pages" 工作流正在運行
3. 等待 ✅ 綠色勾號 (通常需要 2-5 分鐘)
4. 部署完成後，訪問:

**🎮 你的遊戲 URL:**
```
https://whouey.github.io/Degen-Cookie/
```

---

## 🔧 故障排除

### 問題 1: Actions 標籤中看不到工作流
**解決方案:**
- 確保你已經推送了 `.github/workflows/deploy.yml` 文件
- 檢查文件路徑是否正確
- 刷新 GitHub 頁面

### 問題 2: 構建失敗
**解決方案:**
1. 查看 Actions 日誌中的錯誤信息
2. 確保本地可以成功構建:
   ```bash
   cd cookie-frontend
   npm install
   npm run build
   ```
3. 如果本地構建成功但 GitHub Actions 失敗，檢查 Node 版本

### 問題 3: 頁面顯示 404
**解決方案:**
- 確認 GitHub Pages 設置為 **GitHub Actions** 模式
- 檢查 `vite.config.mts` 中的 `base` 路徑是否正確
- 等待 5-10 分鐘讓 GitHub Pages 生效
- 清除瀏覽器緩存並刷新

### 問題 4: 頁面加載但樣式錯誤
**解決方案:**
- 確認 `base: "/Degen-Cookie/"` 設置正確（注意大小寫）
- 重新構建並部署

---

## 📁 文件結構

```
Degen-Cookie/
├── .github/
│   └── workflows/
│       └── deploy.yml          ✅ GitHub Actions 工作流
├── cookie-frontend/
│   ├── public/
│   │   └── .nojekyll           ✅ 禁用 Jekyll 處理
│   ├── vite.config.mts         ✅ 已配置 base path
│   └── package.json
└── GITHUB_PAGES_SETUP.md       ✅ 本文檔
```

---

## 🚀 部署後

部署成功後，你可以:

1. **分享遊戲鏈接**: https://whouey.github.io/Degen-Cookie/
2. **更新遊戲**: 只需 `git push` 即可自動重新部署
3. **查看部署歷史**: 在 Actions 標籤查看所有部署記錄

---

## 🎯 生產環境檢查清單

部署前確認:
- [ ] 智能合約已部署到 IOTA 測試網
- [ ] `constants.ts` 中的合約地址正確
- [ ] IOTA 錢包擴展可正常連接
- [ ] 本地測試遊戲功能正常
- [ ] 所有文檔已更新

---

## 🔗 有用的鏈接

- **你的遊戲**: https://whouey.github.io/Degen-Cookie/
- **GitHub Actions**: https://github.com/whouey/Degen-Cookie/actions
- **儲存庫設置**: https://github.com/whouey/Degen-Cookie/settings/pages
- **IOTA 測試網水龍頭**: https://faucet.testnet.iota.cafe/

---

祝部署順利！🍪
