import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // 加载 .env
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true }); // 加载本地密钥

import express from "express";
import { existsSync } from "fs";
import pool from "./server/db.js";

const distPath = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;

// 检查 dist/ 目录是否存在
if (!existsSync(distPath)) {
  console.error("\n  ❌  dist/ 目录不存在，请先执行: npm run build\n");
  process.exit(1);
}

const app = express();
app.use(express.static(distPath));
app.use(express.json());

// ============================================================
// 密码哈希工具（与前端保持一致：SHA-256 + 静态盐）
// ============================================================
import crypto from "crypto";

function hashPassword(password) {
  const salted = "caiber_salt_" + password;
  return crypto.createHash("sha256").update(salted).digest("hex");
}

// ============================================================
// 会话中间件：从 Authorization header 或 body 中提取 token
// ============================================================
function getToken(req) {
  // 优先从 Authorization header 读取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // 回退到 body 中的 token
  return req.body?.token || null;
}

async function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "未登录" });
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE token = ?", [token]);
    if (rows.length === 0) return res.status(401).json({ error: "会话已过期，请重新登录" });
    req.user = rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: "服务器错误" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "需要管理员权限" });
  }
  next();
}

// ============================================================
// AI API 代理（本地开发 / 不支持直连时使用）
// ============================================================
const AI_API_BASE = process.env.AI_API_BASE || "";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, response_format } = req.body;
    if (!AI_API_BASE || !AI_API_KEY) {
      return res.status(500).json({ error: "AI API 未配置" });
    }
    const body = { model: AI_MODEL, messages, temperature: 0.85, max_tokens: 2048 };
    if (response_format === "json_object") {
      body.response_format = { type: "json_object" };
    }
    const aiRes = await fetch(`${AI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return res.status(aiRes.status).json({ error: errText });
    }
    const data = await aiRes.json();
    res.json({ content: data.choices?.[0]?.message?.content || "" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "AI 请求失败" });
  }
});

// ============================================================
// AUTH 路由
// ============================================================

// 注册
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: "请填写所有字段" });
    }
    const normalizedEmail = email.toLowerCase();

    // 禁止管理员用户名
    const blockedNames = ["管理员", "admin", "Admin", "ADMIN", "管理", "版主", "moderator", "Moderator"];
    if (blockedNames.includes(username.trim())) {
      return res.status(400).json({ success: false, error: "该用户名不可使用，请换一个" });
    }

    // 检查是否已存在
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: "该邮箱已被注册，请直接登录" });
    }

    const hashedPwd = hashPassword(password);
    const token = crypto.randomUUID();
    const isAdminUser = normalizedEmail === "1111@qq.com";
    const now = Date.now();

    await pool.query(
      "INSERT INTO users (email, username, password, token, is_admin, created_at, last_login_at, login_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [normalizedEmail, isAdminUser ? "管理员" : username, hashedPwd, token, isAdminUser ? 1 : 0, now, now, 1]
    );

    res.json({
      success: true,
      session: { email: normalizedEmail, username: isAdminUser ? "管理员" : username, token, isAdmin: isAdminUser },
    });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ success: false, error: "注册失败，请稍后重试" });
  }
});

// 登录
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "请填写邮箱和密码" });
    }
    const normalizedEmail = email.toLowerCase();
    const hashedInput = hashPassword(password);

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, error: "该邮箱尚未注册，请先注册" });
    }

    const user = users[0];
    if (user.password !== hashedInput) {
      return res.status(400).json({ success: false, error: "密码错误，请重试" });
    }

    const token = crypto.randomUUID();
    const now = Date.now();

    // 管理员自动提升
    let isAdmin = user.is_admin === 1;
    let username = user.username;
    if (normalizedEmail === "1111@qq.com" && !isAdmin) {
      isAdmin = true;
      username = "管理员";
    }
    // 非管理员但之前被标记为管理员的，降级
    if (normalizedEmail !== "1111@qq.com" && (isAdmin || username === "管理员")) {
      isAdmin = false;
      username = normalizedEmail.split("@")[0];
    }

    await pool.query(
      "UPDATE users SET token = ?, last_login_at = ?, login_count = login_count + 1, is_admin = ?, username = ? WHERE email = ?",
      [token, now, isAdmin ? 1 : 0, username, normalizedEmail]
    );

    res.json({ success: true, session: { email: normalizedEmail, username, token, isAdmin } });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ success: false, error: "登录失败，请稍后重试" });
  }
});

// 退出登录
app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = getToken(req);
    if (token) {
      await pool.query("UPDATE users SET token = '' WHERE token = ?", [token]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[logout]", err);
    res.status(500).json({ success: false, error: "退出失败" });
  }
});

// 验证会话
app.get("/api/auth/session", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.json({ session: null });
    const [users] = await pool.query("SELECT email, username, token, is_admin FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json({ session: null });
    const u = users[0];
    res.json({ session: { email: u.email, username: u.username, token: u.token, isAdmin: u.is_admin === 1 } });
  } catch (err) {
    console.error("[session]", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// ============================================================
// USER 路由
// ============================================================

// 获取用户公开资料
app.get("/api/users/profile/:email", async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT email, username, created_at FROM users WHERE email = ?",
      [req.params.email.toLowerCase()]
    );
    if (users.length === 0) return res.status(404).json({ error: "用户不存在" });
    const u = users[0];
    res.json({ username: u.username, email: u.email, bio: "", avatar: "😶", createdAt: u.created_at });
  } catch (err) {
    console.error("[profile]", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 更新个人资料
app.put("/api/users/profile", requireAuth, async (req, res) => {
  try {
    const { username, bio } = req.body;
    const blocked = ["admin", "Admin", "ADMIN", "管理", "版主", "moderator", "Moderator"];
    if (!username || !username.trim()) return res.status(400).json({ success: false });
    if (!req.user.is_admin && blocked.includes(username.trim())) return res.status(400).json({ success: false });

    await pool.query("UPDATE users SET username = ? WHERE email = ?", [username, req.user.email]);
    // 同步更新评论中的用户名
    await pool.query("UPDATE comments SET author_name = ? WHERE author_email = ?", [username, req.user.email]);

    res.json({ success: true });
  } catch (err) {
    console.error("[updateProfile]", err);
    res.status(500).json({ success: false });
  }
});

// 获取所有用户（管理员）
app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, email, username, is_admin, banned, muted_until, created_at FROM users ORDER BY created_at DESC");
    // 处理禁言过期
    const now = Date.now();
    const result = users.map(u => ({
      _id: String(u.id),
      email: u.email,
      username: u.username,
      isAdmin: u.is_admin === 1,
      banned: u.banned === 1,
      mutedUntil: u.muted_until && u.muted_until > now ? u.muted_until : undefined,
      createdAt: u.created_at,
    }));
    res.json(result);
  } catch (err) {
    console.error("[getAllUsers]", err);
    res.status(500).json({ error: "服务器错误" });
  }
});

// 拉黑用户
app.post("/api/users/ban", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    await pool.query("UPDATE users SET banned = 1, muted_until = NULL WHERE email = ?", [email]);
    await pool.query("INSERT INTO admin_actions (action, target_email, timestamp) VALUES ('ban', ?, ?)", [email, Date.now()]);
    res.json({ success: true });
  } catch (err) {
    console.error("[ban]", err);
    res.status(500).json({ success: false });
  }
});

// 禁言用户
app.post("/api/users/mute", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const mutedUntil = Date.now() + 24 * 60 * 60 * 1000;
    await pool.query("UPDATE users SET banned = 0, muted_until = ? WHERE email = ?", [mutedUntil, email]);
    await pool.query("INSERT INTO admin_actions (action, target_email, muted_until, timestamp) VALUES ('mute', ?, ?, ?)", [email, mutedUntil, Date.now()]);
    res.json({ success: true });
  } catch (err) {
    console.error("[mute]", err);
    res.status(500).json({ success: false });
  }
});

// 解除拉黑/禁言
app.post("/api/users/unban", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    await pool.query("UPDATE users SET banned = 0, muted_until = NULL WHERE email = ?", [email]);
    await pool.query("INSERT INTO admin_actions (action, target_email, timestamp) VALUES ('unban', ?, ?)", [email, Date.now()]);
    res.json({ success: true });
  } catch (err) {
    console.error("[unban]", err);
    res.status(500).json({ success: false });
  }
});

// 设为管理员
app.post("/api/users/set-admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    await pool.query("UPDATE users SET is_admin = 1, username = '管理员' WHERE email = ?", [email]);
    res.json({ success: true });
  } catch (err) {
    console.error("[setAdmin]", err);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// COMMENT 路由
// ============================================================

// 获取所有评论
app.get("/api/comments", async (req, res) => {
  try {
    const [comments] = await pool.query("SELECT * FROM comments ORDER BY created_at DESC");
    const [deletions] = await pool.query("SELECT comment_id FROM comment_deletions");
    const deletedIds = new Set(deletions.map(d => d.comment_id));

    const [likes] = await pool.query("SELECT * FROM comment_likes ORDER BY timestamp ASC");
    const likeState = new Map();
    for (const l of likes) {
      likeState.set(`${l.comment_id}:${l.user_email}`, l.action);
    }

    const result = comments
      .filter(c => !deletedIds.has(c.id))
      .map(c => {
        let likeCount = 0;
        const likedBy = [];
        for (const [key, action] of likeState) {
          const [commentId, userEmail] = key.split(":");
          if (parseInt(commentId) === c.id && action === "like") {
            likeCount++;
            likedBy.push(userEmail);
          }
        }
        return {
          _id: String(c.id),
          content: c.content,
          authorEmail: c.author_email,
          authorName: c.author_name,
          parentId: c.parent_id,
          likes: likeCount,
          likedBy,
          createdAt: c.created_at,
        };
      });

    res.json(result);
  } catch (err) {
    console.error("[getComments]", err);
    res.status(500).json([]);
  }
});

// 发表评论
app.post("/api/comments", async (req, res) => {
  try {
    const { content, authorEmail, authorName, parentId } = req.body;
    if (!content || !authorEmail || !authorName) {
      return res.status(400).json(null);
    }
    const [result] = await pool.query(
      "INSERT INTO comments (content, author_email, author_name, parent_id, created_at) VALUES (?, ?, ?, ?, ?)",
      [content, authorEmail, authorName, parentId || null, Date.now()]
    );
    res.json({
      _id: String(result.insertId),
      content,
      authorEmail,
      authorName,
      parentId: parentId || null,
      likes: 0,
      likedBy: [],
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("[addComment]", err);
    res.status(500).json(null);
  }
});

// 删除评论
app.delete("/api/comments/:id", async (req, res) => {
  try {
    await pool.query("INSERT INTO comment_deletions (comment_id, timestamp) VALUES (?, ?)", [parseInt(req.params.id), Date.now()]);
    res.json({ success: true });
  } catch (err) {
    console.error("[deleteComment]", err);
    res.status(500).json({ success: false });
  }
});

// 点赞/取消点赞
app.post("/api/comments/:id/like", async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).json(null);

    // 查当前状态
    const [existing] = await pool.query(
      "SELECT * FROM comment_likes WHERE comment_id = ? AND user_email = ? ORDER BY timestamp DESC LIMIT 1",
      [commentId, userEmail]
    );
    const curAction = existing.length > 0 ? existing[0].action : "unlike";
    const newAction = curAction === "like" ? "unlike" : "like";

    await pool.query(
      "INSERT INTO comment_likes (comment_id, user_email, action, timestamp) VALUES (?, ?, ?, ?)",
      [commentId, userEmail, newAction, Date.now()]
    );

    // 重新计算
    const [allLikes] = await pool.query("SELECT user_email, action FROM comment_likes WHERE comment_id = ? ORDER BY timestamp ASC", [commentId]);
    const userMap = new Map();
    for (const l of allLikes) userMap.set(l.user_email, l.action);
    let likes = 0;
    const likedBy = [];
    for (const [email, action] of userMap) {
      if (action === "like") { likes++; likedBy.push(email); }
    }
    res.json({ _id: String(commentId), content: "", authorEmail: "", authorName: "", parentId: null, likes, likedBy, createdAt: 0 });
  } catch (err) {
    console.error("[toggleLike]", err);
    res.status(500).json(null);
  }
});

// 检查是否可以评论
app.get("/api/comments/check", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.json({ ok: false, reason: "请先登录后再评论" });

    const [users = []] = await pool.query("SELECT * FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json({ ok: false, reason: "请先登录后再评论" });
    const user = users[0];

    if (user.banned) return res.json({ ok: false, reason: "你已被管理员拉黑，无法发表评论" });
    if (user.muted_until && user.muted_until > Date.now()) {
      const hours = Math.ceil((user.muted_until - Date.now()) / 3600000);
      return res.json({ ok: false, reason: `你已被管理员禁言，${hours} 小时后恢复` });
    }
    res.json({ ok: true, reason: "" });
  } catch (err) {
    console.error("[checkComment]", err);
    res.json({ ok: true, reason: "" });
  }
});

// ============================================================
// CARD 路由
// ============================================================

// 获取体验卡计数
app.get("/api/card-counts", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT card_id, COUNT(*) as cnt FROM card_counters GROUP BY card_id");
    const counts = {};
    for (const r of rows) counts[r.card_id] = r.cnt;
    res.json(counts);
  } catch (err) {
    console.error("[getCardCounts]", err);
    res.status(500).json({});
  }
});

// 增加计数
app.post("/api/card-counts/increment", async (req, res) => {
  try {
    const { cardId } = req.body;
    await pool.query("INSERT INTO card_counters (card_id, timestamp) VALUES (?, ?)", [cardId, Date.now()]);
    res.json({ success: true });
  } catch (err) {
    console.error("[incrementCardCount]", err);
    res.status(500).json({ success: false });
  }
});

// 加载卡片编辑
app.get("/api/cards/edits", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM card_data ORDER BY timestamp ASC");
    const deletedIds = [];
    const cardMap = {};
    for (const r of rows) {
      if (r.action === "delete") {
        deletedIds.push(r.card_id);
        delete cardMap[r.card_id];
      } else if (r.action === "save" && r.card_data) {
        const cd = typeof r.card_data === "string" ? JSON.parse(r.card_data) : r.card_data;
        cardMap[r.card_id] = cd;
      }
    }
    res.json({ cards: Object.values(cardMap), deletedIds });
  } catch (err) {
    console.error("[loadCardEdits]", err);
    res.json({ cards: [], deletedIds: [] });
  }
});

// 保存卡片编辑
app.post("/api/cards", async (req, res) => {
  try {
    const { cardId, cardData } = req.body;
    await pool.query(
      "INSERT INTO card_data (card_id, card_data, action, timestamp) VALUES (?, ?, 'save', ?)",
      [cardId, JSON.stringify(cardData), Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[saveCard]", err);
    res.status(500).json({ success: false });
  }
});

// 删除卡片
app.delete("/api/cards/:id", async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO card_data (card_id, card_data, action, timestamp) VALUES (?, NULL, 'delete', ?)",
      [req.params.id, Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[deleteCard]", err);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// CONSULTATION 路由
// ============================================================

// 保存问诊记录
app.post("/api/consultations", async (req, res) => {
  try {
    const { cardId, cardTitle, choicePath, personalityId, persona } = req.body;
    const token = getToken(req);
    if (!token) return res.json(null); // 游客不保存

    const [users] = await pool.query("SELECT email, username FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json(null);

    await pool.query(
      "INSERT INTO consultations (card_id, card_title, choice_path, personality_id, persona, user_email, username, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [cardId, cardTitle, JSON.stringify(choicePath || []), personalityId || null, persona || "", users[0].email, users[0].username, Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[saveConsultation]", err);
    res.status(500).json(null);
  }
});

// 获取我的问诊记录
app.get("/api/consultations", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.json([]);

    const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json([]);

    const [rows] = await pool.query(
      "SELECT * FROM consultations WHERE user_email = ? ORDER BY timestamp DESC LIMIT 200",
      [users[0].email]
    );
    const [deletions] = await pool.query(
      "SELECT consultation_id FROM consultation_deletions WHERE user_email = ?",
      [users[0].email]
    );
    const deletedIds = new Set(deletions.map(d => d.consultation_id));

    res.json(rows.filter(r => !deletedIds.has(r.id)).map(r => ({
      ...r,
      _id: String(r.id),
      choicePath: typeof r.choice_path === "string" ? JSON.parse(r.choice_path) : r.choice_path,
    })));
  } catch (err) {
    console.error("[getConsultations]", err);
    res.status(500).json([]);
  }
});

// 删除问诊记录
app.delete("/api/consultations/:id", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false });

    const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.status(401).json({ success: false });

    await pool.query(
      "INSERT INTO consultation_deletions (consultation_id, user_email, timestamp) VALUES (?, ?, ?)",
      [parseInt(req.params.id), users[0].email, Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[deleteConsultation]", err);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// PRESCRIPTION 路由
// ============================================================

// 保存处方
app.post("/api/prescriptions", async (req, res) => {
  try {
    const { cardId, cardTitle, personalityId, persona, dia, med, usage, advice } = req.body;
    const token = getToken(req);
    if (!token) return res.json(null);

    const [users] = await pool.query("SELECT email, username FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json(null);

    await pool.query(
      "INSERT INTO prescriptions (card_id, card_title, personality_id, persona, dia, med, `usage`, advice, user_email, username, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cardId, cardTitle, personalityId || null, persona || "", dia || "", med || "", usage || "", advice || "", users[0].email, users[0].username, Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[savePrescription]", err);
    res.status(500).json(null);
  }
});

// 获取与时间戳最接近的处方
app.get("/api/prescriptions/:cardId", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.json(null);

    const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json(null);

    const [rows] = await pool.query(
      "SELECT * FROM prescriptions WHERE user_email = ? AND card_id = ? ORDER BY timestamp DESC LIMIT 50",
      [users[0].email, req.params.cardId]
    );
    const ts = parseInt(req.query.ts) || 0;

    let best = null;
    let minDiff = 5000;
    for (const p of rows) {
      const diff = Math.abs(p.timestamp - ts);
      if (diff < minDiff) { minDiff = diff; best = p; }
    }
    res.json(best);
  } catch (err) {
    console.error("[getPrescription]", err);
    res.status(500).json(null);
  }
});

// ============================================================
// APPEAL 路由
// ============================================================

// 获取我的申诉
app.get("/api/appeals", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.json([]);

    const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.json([]);

    const [rows] = await pool.query(
      "SELECT * FROM appeals WHERE user_email = ? ORDER BY created_at DESC LIMIT 50",
      [users[0].email]
    );
    res.json(rows.map(r => ({ ...r, _id: String(r.id) })));
  } catch (err) {
    console.error("[getMyAppeals]", err);
    res.status(500).json([]);
  }
});

// 获取所有申诉（管理员）
app.get("/api/appeals/all", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM appeals ORDER BY created_at DESC LIMIT 200");
    res.json(rows.map(r => ({ ...r, _id: String(r.id) })));
  } catch (err) {
    console.error("[getAllAppeals]", err);
    res.status(500).json([]);
  }
});

// 提交申诉
app.post("/api/appeals", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false });

    const [users] = await pool.query("SELECT email, username FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.status(401).json({ success: false });

    await pool.query(
      "INSERT INTO appeals (user_email, username, reason, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
      [users[0].email, users[0].username, req.body.reason?.trim() || "", Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[submitAppeal]", err);
    res.status(500).json({ success: false });
  }
});

// 处理申诉（回复 / 批准 / 拒绝）
app.put("/api/appeals/:id", requireAuth, async (req, res) => {
  try {
    const { action, reply, reason } = req.body;
    const id = parseInt(req.params.id);

    if (action === "reply" || action === "resolve") {
      if (!req.user.is_admin) return res.status(403).json({ success: false });
    }
    if (action === "reply") {
      await pool.query("UPDATE appeals SET status = 'replied', reply = ?, resolved_at = ? WHERE id = ?", [reply?.trim() || "", Date.now(), id]);
    } else if (action === "resolve") {
      const approved = req.body.approved;
      await pool.query("UPDATE appeals SET status = ?, reply = NULL, resolved_at = ? WHERE id = ?", [approved ? "approved" : "rejected", Date.now(), id]);
    } else if (action === "edit") {
      // 用户编辑申诉
      const token = getToken(req);
      const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
      if (users.length === 0) return res.status(401).json({ success: false });
      await pool.query("UPDATE appeals SET reason = ?, created_at = ? WHERE id = ? AND user_email = ? AND status = 'pending'", [reason?.trim() || "", Date.now(), id, users[0].email]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[resolveAppeal]", err);
    res.status(500).json({ success: false });
  }
});

// 撤回申诉
app.delete("/api/appeals/:id", async (req, res) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false });

    const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
    if (users.length === 0) return res.status(401).json({ success: false });

    // 只能撤回待处理状态的申诉
    await pool.query("DELETE FROM appeals WHERE id = ? AND user_email = ? AND status = 'pending'", [parseInt(req.params.id), users[0].email]);
    res.json({ success: true });
  } catch (err) {
    console.error("[withdrawAppeal]", err);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// AI CHAT 存储路由
// ============================================================

app.post("/api/ai-chat", async (req, res) => {
  try {
    const { cardId, messages, result } = req.body;
    const token = getToken(req);

    let userEmail = "";
    if (token) {
      const [users] = await pool.query("SELECT email FROM users WHERE token = ?", [token]);
      if (users.length > 0) userEmail = users[0].email;
    }

    await pool.query(
      "INSERT INTO ai_chats (card_id, user_email, messages, result, timestamp) VALUES (?, ?, ?, ?, ?)",
      [cardId, userEmail, JSON.stringify(messages || []), JSON.stringify(result || {}), Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[saveAIChat]", err);
    res.status(500).json({ success: false });
  }
});

// ============================================================
// SPA fallback
// ============================================================
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ============================================================
// 启动服务器
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`\n  ✅  CaiberClick 已启动: http://localhost:${PORT}\n`);
  if (AI_API_BASE) console.log(`  🤖 AI 代理已启用: ${AI_API_BASE}\n`);
  console.log(`  🗄️  MySQL: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${process.env.DB_DATABASE || "CaiberClick_db"}\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  ❌  端口 ${PORT} 已被占用，换一个: 修改 .env 中的 PORT\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
