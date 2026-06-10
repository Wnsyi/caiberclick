import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // 加载 .env
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true }); // 加载本地密钥

import express from "express";
import { existsSync } from "fs";

const distPath = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

// 检查 dist/ 目录是否存在（需要先 npm run build）
if (!existsSync(distPath)) {
  console.error("\n  ❌  dist/ 目录不存在，请先执行: npm run build\n");
  process.exit(1);
}

const app = express();
app.use(express.static(distPath));
app.use(express.json());

// ---- AI API 代理 ----
const AI_API_BASE = process.env.AI_API_BASE || '';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'ds';

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, response_format } = req.body;
    if (!AI_API_BASE || !AI_API_KEY) {
      return res.status(500).json({ error: "AI API 未配置" });
    }
    const body = {
      model: AI_MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 2048,
    };
    if (response_format === 'json_object') {
      body.response_format = { type: 'json_object' };
    }
    const aiRes = await fetch(`${AI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${AI_API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return res.status(aiRes.status).json({ error: errText });
    }
    const data = await aiRes.json();
    res.json({ content: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'AI 请求失败' });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`\n  ✅  开药吗 已启动: http://localhost:${PORT}\n`);
  if (AI_API_BASE) console.log(`  🤖 AI 代理已启用: ${AI_API_BASE}\n`);
});

// 端口被占用时的友好提示
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  ❌  端口 ${PORT} 已被占用，换一个: 修改 .env 中的 PORT=3001\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
