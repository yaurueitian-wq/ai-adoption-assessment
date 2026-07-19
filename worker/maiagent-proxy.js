/**
 * Cloudflare Worker：MaiAgent API 代理
 *
 * 用途：前端（GitHub Pages，公開靜態網站）不能直接呼叫MaiAgent的
 * /completions/ 端點，因為那需要機密的 Api-Key。這個Worker夾在中間，
 * 金鑰只存在Cloudflare的環境變數（secret）裡，不會出現在任何前端原始碼或git紀錄中。
 *
 * 環境變數（用 wrangler secret put 設定，不寫在這個檔案裡）：
 *   MAIAGENT_API_KEY    - MaiAgent的Api-Key
 *   MAIAGENT_CHATBOT_ID - MaiAgent的Chatbot ID
 *
 * 環境變數（可直接寫在 wrangler.toml 的 [vars]，非機密）：
 *   ALLOWED_ORIGIN       - 允許呼叫的前端網域（CORS），例如
 *                          https://yaurueitian-wq.github.io
 */

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = body && body.content;
    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "content" string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!env.MAIAGENT_API_KEY || !env.MAIAGENT_CHATBOT_ID) {
      return new Response(JSON.stringify({ error: 'Worker not configured (missing secrets)' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const upstream = await fetch(
        `https://api.maiagent.ai/api/chatbots/${env.MAIAGENT_CHATBOT_ID}/completions/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Api-Key ${env.MAIAGENT_API_KEY}`,
          },
          body: JSON.stringify({ message: { content } }),
        }
      );

      const data = await upstream.json();
      return new Response(JSON.stringify(data), {
        status: upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Upstream request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
