import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distPath = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

// 检查 dist/ 是否存在（需要先 npm run build）
if (!existsSync(distPath)) {
  console.error("\n  ❌  dist/ 目录不存在，请先执行: npm run build\n");
  process.exit(1);
}

const app = express();
app.use(express.static(distPath));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`\n  ✅  开药吗 已启动: http://localhost:${PORT}\n`);
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
