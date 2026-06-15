// 数据库 API 模块
// 通过 REST API 与 Express 服务器通信，替代 CloudBase SDK

// ===== 密码哈希（SHA-256，客户端加盐，与服务端一致） =====
const SALT_PREFIX = "caiber_salt_";

async function hashPassword(password: string): Promise<string> {
  const salted = SALT_PREFIX + password;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ===== 会话管理（localStorage） =====

interface Session {
  email: string;
  username: string;
  token: string;
  isAdmin?: boolean;
}

const SESSION_KEY = "caiber_session";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ===== HTTP 帮助函数 =====

function getAuthHeaders(): Record<string, string> {
  const session = getSession();
  if (session?.token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    };
  }
  return { "Content-Type": "application/json" };
}

async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

// 用于兼容旧代码：初始化不再需要匿名登录，但保留函数
let ready = true;

export async function initCloudBase() {
  if (ready) return;
  const session = getSession();
  if (session?.token) {
    // 验证会话是否仍然有效
    try {
      const data = await apiFetch<{ session: Session | null }>(
        `/api/auth/session?t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      if (data.session) {
        saveSession(data.session);
      } else {
        clearSession();
      }
    } catch {
      // 网络错误不踢用户
    }
  }
  ready = true;
}

// ===== 注册 =====

export async function register(
  email: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hashedPwd = await hashPassword(password);
    const data = await apiFetch<{
      success: boolean;
      error?: string;
      session?: Session;
    }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password: hashedPwd }),
    });

    if (data.success && data.session) {
      saveSession(data.session);
      return { success: true };
    }
    return { success: false, error: data.error || "注册失败" };
  } catch (err: any) {
    return { success: false, error: err.message || "注册失败，请稍后重试" };
  }
}

// ===== 登录 =====

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const hashedInput = await hashPassword(password);
    const data = await apiFetch<{
      success: boolean;
      error?: string;
      session?: Session;
    }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: hashedInput }),
    });

    if (data.success && data.session) {
      saveSession(data.session);
      return { success: true };
    }
    return { success: false, error: data.error || "登录失败" };
  } catch (err: any) {
    return { success: false, error: err.message || "登录失败，请稍后重试" };
  }
}

// ===== 验证会话 =====

export async function validateSession(): Promise<Session | null> {
  const session = getSession();
  if (!session?.email || !session?.token) return null;

  try {
    const data = await apiFetch<{ session: Session | null }>(
      `/api/auth/session?t=${Date.now()}`,
      { headers: { Authorization: `Bearer ${session.token}` } }
    );
    if (data.session) {
      saveSession(data.session);
      return data.session;
    }
    clearSession();
    return null;
  } catch {
    return session; // 网络错误信任本地
  }
}

// ===== 退出登录 =====

export async function logout() {
  try {
    const session = getSession();
    if (session?.token) {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ token: session.token }),
      });
    }
  } catch (err) {
    console.warn("[API] 清除 token 失败:", err);
  }
  clearSession();
}

// ===== 更新用户资料 =====

export async function updateProfile(username: string, bio: string): Promise<boolean> {
  const session = getSession();
  if (!session) return false;

  // 禁止敏感用户名
  const blocked = ["admin", "Admin", "ADMIN", "管理", "版主", "moderator", "Moderator"];
  if (!username.trim()) return false;
  if (!session.isAdmin && blocked.includes(username.trim())) return false;

  try {
    await apiFetch("/api/users/profile", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, bio }),
    });
    session.username = username;
    saveSession(session);
    localStorage.setItem(`caiber_bio_${session.email}`, bio);
    return true;
  } catch (err) {
    console.warn("[API] 更新资料失败:", err);
    return false;
  }
}

// ===== 评论区 =====

export interface CommentDoc {
  _id: string;
  content: string;
  authorEmail: string;
  authorName: string;
  parentId: string | null;
  likes: number;
  likedBy: string[];
  createdAt: number;
}

export async function getComments(): Promise<CommentDoc[]> {
  try {
    return await apiFetch<CommentDoc[]>("/api/comments");
  } catch (err) {
    console.warn("[API] 获取评论失败:", err);
    return [];
  }
}

export async function addComment(
  content: string,
  authorEmail: string,
  authorName: string,
  parentId: string | null
): Promise<CommentDoc | null> {
  try {
    return await apiFetch<CommentDoc>("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, authorEmail, authorName, parentId }),
    });
  } catch (err) {
    console.warn("[API] 发表评论失败:", err);
    return null;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
    return true;
  } catch (err) {
    console.warn("[API] 删除评论失败:", err);
    return false;
  }
}

export function isAdmin(): boolean {
  const session = getSession();
  return session?.isAdmin === true;
}

// 暴露到全局
(window as any).__setAdmin = async (email: string) => {
  try {
    await apiFetch("/api/users/set-admin", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    alert("管理员设置成功！请重新登录。");
  } catch {
    alert("设置失败，请检查邮箱是否正确。");
  }
};

export async function setUserAsAdmin(targetEmail: string): Promise<boolean> {
  try {
    await apiFetch("/api/users/set-admin", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email: targetEmail.toLowerCase() }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function toggleLike(
  commentId: string,
  userEmail: string
): Promise<CommentDoc | null> {
  try {
    return await apiFetch<CommentDoc>(`/api/comments/${commentId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail }),
    });
  } catch (err) {
    console.warn("[API] 点赞失败:", err);
    return null;
  }
}

// ===== 体验卡计数 =====

export async function getCardCounts(): Promise<Record<string, number>> {
  try {
    return await apiFetch<Record<string, number>>("/api/card-counts");
  } catch {
    return {};
  }
}

export async function incrementCardCount(cardId: string) {
  try {
    await apiFetch("/api/card-counts/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
  } catch (err) {
    console.warn("[API] 更新计数失败:", err);
  }
}

// ===== 问诊记录 =====

export async function saveConsultation(data: {
  cardId: string;
  cardTitle: string;
  choicePath: number[];
  personalityId?: number;
  persona?: string;
}) {
  const session = getSession();
  if (!session) return;

  try {
    await apiFetch("/api/consultations", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    console.warn("[API] 保存问诊失败:", err.message);
  }
}

export async function savePrescription(data: {
  cardId: string;
  cardTitle: string;
  personalityId?: number;
  persona?: string;
  dia: string;
  med: string;
  usage: string;
  advice: string;
}) {
  const session = getSession();
  if (!session) return;

  try {
    await apiFetch("/api/prescriptions", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  } catch (err: any) {
    console.warn("[API] 保存处方失败:", err.message);
  }
}

// ===== 类型 =====

interface ConsultationRecord {
  cardId: string;
  cardTitle: string;
  choicePath: number[];
  personalityId?: number;
  persona?: string;
  userEmail: string;
  username: string;
  timestamp: number;
  _id?: string;
}

interface PrescriptionRecord {
  cardId: string;
  cardTitle: string;
  personalityId?: number;
  persona?: string;
  dia: string;
  med: string;
  usage: string;
  advice: string;
  userEmail: string;
  username: string;
  timestamp: number;
}

export async function getMyConsultations(): Promise<ConsultationRecord[]> {
  try {
    return await apiFetch<ConsultationRecord[]>("/api/consultations", {
      headers: getAuthHeaders(),
    });
  } catch {
    return [];
  }
}

export async function deleteConsultation(consultationId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/consultations/${consultationId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function getPrescriptionFor(
  cardId: string,
  ts: number
): Promise<PrescriptionRecord | null> {
  try {
    return await apiFetch<PrescriptionRecord | null>(
      `/api/prescriptions/${cardId}?ts=${ts}`,
      { headers: getAuthHeaders() }
    );
  } catch {
    return null;
  }
}

// ===== 管理员：用户管理 =====

interface UserRecord {
  _id: string;
  email: string;
  username: string;
  name?: string;
  isAdmin?: boolean;
  banned?: boolean;
  mutedUntil?: number;
  createdAt?: number;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  try {
    return await apiFetch<UserRecord[]>("/api/users", { headers: getAuthHeaders() });
  } catch {
    return [];
  }
}

export async function banUser(email: string): Promise<boolean> {
  try {
    await apiFetch("/api/users/ban", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function muteUser(email: string): Promise<boolean> {
  try {
    await apiFetch("/api/users/mute", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function unbanUser(email: string): Promise<boolean> {
  try {
    await apiFetch("/api/users/unban", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function checkCanComment(): Promise<{ ok: boolean; reason: string }> {
  const session = getSession();
  if (!session) return { ok: false, reason: "请先登录后再评论" };
  try {
    return await apiFetch<{ ok: boolean; reason: string }>(
      `/api/comments/check?t=${Date.now()}`,
      { headers: getAuthHeaders() }
    );
  } catch {
    return { ok: true, reason: "" };
  }
}

// ===== 申诉 =====

interface AppealRecord {
  _id: string;
  userEmail: string;
  username: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "replied";
  reply?: string;
  createdAt: number;
  resolvedAt?: number;
}

export async function submitAppeal(reason: string): Promise<boolean> {
  try {
    await apiFetch("/api/appeals", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: reason.trim() }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function getMyAppeals(): Promise<AppealRecord[]> {
  try {
    return await apiFetch<AppealRecord[]>("/api/appeals", { headers: getAuthHeaders() });
  } catch {
    return [];
  }
}

export async function getAllAppeals(): Promise<AppealRecord[]> {
  try {
    return await apiFetch<AppealRecord[]>("/api/appeals/all", { headers: getAuthHeaders() });
  } catch {
    return [];
  }
}

export async function withdrawAppeal(appealId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/appeals/${appealId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function editAppeal(appealId: string, newReason: string): Promise<boolean> {
  try {
    await apiFetch(`/api/appeals/${appealId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "edit", reason: newReason.trim() }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function replyToAppeal(appealId: string, reply: string): Promise<boolean> {
  try {
    await apiFetch(`/api/appeals/${appealId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "reply", reply: reply.trim() }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function resolveAppeal(appealId: string, approved: boolean): Promise<boolean> {
  try {
    await apiFetch(`/api/appeals/${appealId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "resolve", approved }),
    });
    return true;
  } catch {
    return false;
  }
}

// ===== 查看用户公开资料 =====

interface PublicProfile {
  username: string;
  email: string;
  bio: string;
  avatar: string;
  createdAt?: number;
}

export async function getPublicProfile(email: string): Promise<PublicProfile | null> {
  try {
    const profile = await apiFetch<PublicProfile>(`/api/users/profile/${encodeURIComponent(email)}`);
    // 补充 localStorage 中的数据
    return {
      ...profile,
      bio: localStorage.getItem(`caiber_bio_${email}`) || "",
      avatar: localStorage.getItem(`caiber_avatar_${email}`) || "😶",
    };
  } catch {
    return null;
  }
}

// ===== 管理员：卡片管理 =====

export interface CardRecord {
  id: string;
  emoji: string;
  badge: string;
  stars: number;
  reviews: string;
  title: string;
  desc: string;
  imgSrc: string;
  slideClass: string;
  isLove?: boolean;
}

export async function saveCard(card: CardRecord): Promise<boolean> {
  try {
    await apiFetch("/api/cards", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ cardId: card.id, cardData: card }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteCard(cardId: string): Promise<boolean> {
  try {
    await apiFetch(`/api/cards/${cardId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function loadCardEdits<T extends { id: string }>(
  baseCards: T[]
): Promise<{ cards: T[]; deletedIds: Set<string> }> {
  try {
    const data = await apiFetch<{ cards: any[]; deletedIds: string[] }>("/api/cards/edits");

    const deletedIds = new Set<string>(data.deletedIds || []);
    const cardMap = new Map<string, any>();
    for (const c of data.cards || []) {
      cardMap.set(c.id, c);
    }

    const baseMap = new Map(baseCards.map((c) => [c.id, c]));
    for (const [id, cd] of cardMap) {
      baseMap.set(id, { ...baseMap.get(id), ...cd, id } as any);
    }

    const cards = [...baseMap.values()].filter((c) => !deletedIds.has(c.id));
    return { cards, deletedIds };
  } catch {
    return { cards: baseCards, deletedIds: new Set() };
  }
}

// ===== AI 聊天记录存储 =====

export async function saveAIChat(
  cardId: string,
  messages: { role: string; text: string }[],
  result: {
    personalityId: number;
    persona: string;
    dia: string;
    med: string;
    usage: string;
    advice: string;
  }
): Promise<void> {
  try {
    await apiFetch("/api/ai-chat", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ cardId, messages, result }),
    });
  } catch (err) {
    console.warn("[API] 保存AI聊天失败:", err);
  }
}

export type { ConsultationRecord, PrescriptionRecord, UserRecord, AppealRecord };
