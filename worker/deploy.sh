#!/bin/bash
# 讀取 .env 裡的值，設定Cloudflare Worker的secrets並部署。
# 用法：先 cp .env.example .env，填好值，再執行 ./deploy.sh

set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "找不到 .env，請先執行：cp .env.example .env  並填入實際值"
  exit 1
fi

set -a
source .env
set +a

if [ -z "$MAIAGENT_API_KEY" ] || [ -z "$MAIAGENT_CHATBOT_ID" ]; then
  echo ".env 裡的 MAIAGENT_API_KEY 或 MAIAGENT_CHATBOT_ID 是空的，請填好再執行"
  exit 1
fi

echo "設定 secrets..."
echo "$MAIAGENT_API_KEY" | npx wrangler secret put MAIAGENT_API_KEY
echo "$MAIAGENT_CHATBOT_ID" | npx wrangler secret put MAIAGENT_CHATBOT_ID

if [ -n "$ALLOWED_ORIGIN" ]; then
  # ALLOWED_ORIGIN 寫在 wrangler.toml 的 [vars]，這裡提醒一下，不自動改檔案
  echo "提醒：確認 wrangler.toml 裡的 ALLOWED_ORIGIN 是否為 $ALLOWED_ORIGIN"
fi

echo "部署中..."
npx wrangler deploy
