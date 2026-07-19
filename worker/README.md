# MaiAgent Proxy Worker — 部署步驟

這個Worker的唯一功能：安全保管MaiAgent的Api-Key，代替前端呼叫MaiAgent的
`/completions/` 端點，回傳結果給前端。**金鑰只存在Cloudflare的環境變數，不會出現在任何git紀錄裡。**

> 先決條件：先到MaiAgent後台**重新產生一組新的Api-Key**（因為舊的那組已經在對話中曝光過，視同外洩，不要再用）。

## 1. 登入 Cloudflare（沒有帳號的話會引導你免費註冊）

```bash
cd worker
npx wrangler login
```

會開瀏覽器讓你登入/授權，完成後回到終端機即可。

## 2. 設定你的實際值

```bash
cp .env.example .env
```

打開 `.env`，填入：
- `MAIAGENT_API_KEY`：MaiAgent的Api-Key（建議先在MaiAgent後台重新產生一組新的）
- `MAIAGENT_CHATBOT_ID`：MaiAgent的Chatbot ID
- `ALLOWED_ORIGIN`：預設已填好GitHub Pages網址，通常不用改

**`.env` 不會被git追蹤**（已加進 `.gitignore`），可以放心填入真實金鑰，不會不小心推上公開repo。

之後想調整這些值，直接編輯 `.env` 再重新執行 `./deploy.sh` 即可，不需要每次手動一步步跑指令。

## 3. 部署

```bash
./deploy.sh
```

這個腳本會自動讀取 `.env`、設定Cloudflare的secrets、並部署。

部署完成後，終端機會印出一個網址，長得像：

```
https://maiagent-proxy.你的cloudflare帳號.workers.dev
```

**把這個網址給我**，我會把它填進前端的 `MAIAGENT_CONFIG.workerUrl`，接上整條串接。

## 之後要更新程式碼時

改完 `maiagent-proxy.js` 後，重新執行一次 `wrangler deploy` 即可，網址不會變。

## 之後要更換金鑰時

```bash
wrangler secret put MAIAGENT_API_KEY
```
重新貼上新的金鑰即可，不需要重新deploy。
