import cloudbase from '@cloudbase/js-sdk';

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV_ID || 'game-one-d1gx1gwhbee34fff7';

const app = cloudbase.init({ env: ENV_ID });

let tcbReady = false;
let tcbDb: ReturnType<typeof app.database> | null = null;

// ===== 数据库初始化（匿名登录，仅用于访问数据库） =====

export async function initCloudBase() {
  try {
    const auth = app.auth();
    const loginState = await auth.getLoginState();
    if (!loginState) {
      await auth.signInAnonymously();
    }
    tcbDb = app.database();
    tcbReady = true;
  } catch (err) {
    console.warn('[CloudBase] 初始化失败:', err);
  }
}

// ===== 密码哈希（SHA-256，客户端加盐） =====

const SALT_PREFIX = 'caiber_salt_';

async function hashPassword(password: string): Promise<string> {
  const salted = SALT_PREFIX + password;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ===== 会话管理（localStorage） =====

interface Session {
  email: string;
  username: string;
  token: string;
}

const SESSION_KEY = 'caiber_session';

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

// ===== 注册 =====

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!tcbReady || !tcbDb) {
    await initCloudBase();
    if (!tcbReady || !tcbDb) {
      return { success: false, error: '数据库未就绪，请刷新页面后重试' };
    }
  }

  try {
    // 1. 查询数据库中是否已有该邮箱
    const existing = await tcbDb!
      .collection('users')
      .where({ email: email.toLowerCase() })
      .limit(1)
      .get();

    if (existing.data && existing.data.length > 0) {
      return { success: false, error: '该邮箱已被注册，请直接登录' };
    }

    // 2. 哈希密码 + 生成 session token
    const hashedPwd = await hashPassword(password);
    const token = crypto.randomUUID();

    // 3. 存入数据库
    await tcbDb.collection('users').add({
      email: email.toLowerCase(),
      username,
      password: hashedPwd,
      token,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      loginCount: 1,
    });

    // 4. 写入本地会话
    saveSession({ email: email.toLowerCase(), username, token });

    console.log('[CloudBase] 注册成功:', email);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '注册失败';
    const code = (err as any)?.code || '';
    console.error('[CloudBase] 注册失败 — 完整错误:', err);
    if (code === 'PERMISSION_DENIED' || msg.includes('permission') || msg.includes('unauthorized')) {
      return { success: false, error: '数据库权限不足。请去 CloudBase 控制台 → 数据库 → 安全规则 → 设为「所有用户可读写」' };
    }
    return { success: false, error: msg || '注册失败，请稍后重试' };
  }
}

// ===== 登录 =====

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!tcbReady || !tcbDb) {
    await initCloudBase();
    if (!tcbReady || !tcbDb) {
      return { success: false, error: '数据库未就绪，请刷新页面后重试' };
    }
  }

  try {
    // 1. 查询数据库中是否有该邮箱
    const res = await tcbDb!
      .collection('users')
      .where({ email: email.toLowerCase() })
      .limit(1)
      .get();

    if (!res.data || res.data.length === 0) {
      return { success: false, error: '该邮箱尚未注册，请先注册' };
    }

    const user = res.data[0];

    // 2. 验证密码
    const hashedInput = await hashPassword(password);
    if (user.password !== hashedInput) {
      return { success: false, error: '密码错误，请重试' };
    }

    // 3. 生成新 token 并更新数据库
    const token = crypto.randomUUID();
    await tcbDb.collection('users').doc(user._id).update({
      token,
      lastLoginAt: Date.now(),
      loginCount: (user.loginCount || 0) + 1,
    });

    // 4. 写入本地会话
    saveSession({ email: email.toLowerCase(), username: user.username || email, token });

    console.log('[CloudBase] 登录成功:', email);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '登录失败';
    const code = (err as any)?.code || '';
    console.error('[CloudBase] 登录失败 — 完整错误:', err);
    if (code === 'PERMISSION_DENIED' || msg.includes('permission') || msg.includes('unauthorized')) {
      return { success: false, error: '数据库权限不足。请去 CloudBase 控制台 → 数据库 → 安全规则 → 设为「所有用户可读写」' };
    }
    return { success: false, error: msg || '登录失败，请稍后重试' };
  }
}

// ===== 验证会话（页面刷新时自动登录） =====

export async function validateSession(): Promise<Session | null> {
  const session = getSession();
  if (!session || !session.email || !session.token) return null;
  if (!tcbReady || !tcbDb) return null;

  try {
    const res = await tcbDb
      .collection('users')
      .where({ email: session.email })
      .limit(1)
      .get();

    if (!res.data || res.data.length === 0) {
      clearSession();
      return null;
    }

    const user = res.data[0];
    if (user.token !== session.token) {
      clearSession();
      return null;
    }

    // Token 有效 → 更新会话中的 username（可能已变更）
    const updated: Session = {
      email: session.email,
      username: user.username || session.email,
      token: session.token,
    };
    saveSession(updated);
    return updated;
  } catch {
    // 查询失败不踢用户，信任本地会话
    return session;
  }
}

// ===== 退出登录 =====

export async function logout() {
  const session = getSession();
  if (session && tcbReady && tcbDb) {
    try {
      const res = await tcbDb
        .collection('users')
        .where({ email: session.email })
        .limit(1)
        .get();
      if (res.data && res.data.length > 0) {
        // 清空数据库中的 token（使该设备下线）
        await tcbDb.collection('users').doc(res.data[0]._id).update({ token: '' });
      }
    } catch (err) {
      console.warn('[CloudBase] 清除 token 失败:', err);
    }
  }
  clearSession();
  console.log('[CloudBase] 已退出登录');
}

// ===== 以下不变 =====

// ===== 评论区 =====

export interface CommentDoc {
  _id: string;
  content: string;
  authorEmail: string;
  authorName: string;
  parentId: string | null;  // null = 顶层评论, string = 回复某条评论
  likes: number;
  likedBy: string[];
  createdAt: number;
}

/** 获取所有评论 */
export async function getComments(): Promise<CommentDoc[]> {
  if (!tcbReady || !tcbDb) return [];
  try {
    const res = await tcbDb.collection('comments').orderBy('createdAt', 'desc').limit(500).get();
    return (res.data || []) as CommentDoc[];
  } catch (err) {
    console.warn('[CloudBase] 获取评论失败:', err);
    return [];
  }
}

/** 发表评论或回复 */
export async function addComment(
  content: string,
  authorEmail: string,
  authorName: string,
  parentId: string | null,
): Promise<CommentDoc | null> {
  if (!tcbReady || !tcbDb) return null;
  try {
    const res = await tcbDb.collection('comments').add({
      content,
      authorEmail,
      authorName,
      parentId,
      likes: 0,
      likedBy: [],
      createdAt: Date.now(),
    });
    return {
      _id: res.id,
      content,
      authorEmail,
      authorName,
      parentId,
      likes: 0,
      likedBy: [],
      createdAt: Date.now(),
    };
  } catch (err) {
    console.warn('[CloudBase] 发表评论失败:', err);
    return null;
  }
}

/** 删除评论（仅作者可删） */
export async function deleteComment(commentId: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    await tcbDb.collection('comments').doc(commentId).remove();
    // 同时删除该评论下的所有回复
    const replies = await tcbDb.collection('comments').where({ parentId: commentId }).get();
    for (const reply of (replies.data || [])) {
      await tcbDb.collection('comments').doc(reply._id).remove();
    }
    return true;
  } catch (err) {
    console.warn('[CloudBase] 删除评论失败:', err);
    return false;
  }
}

/** 点赞/取消点赞 */
export async function toggleLike(commentId: string, userEmail: string): Promise<CommentDoc | null> {
  if (!tcbReady || !tcbDb) return null;
  try {
    const res = await tcbDb.collection('comments').doc(commentId).get();
    if (!res.data || res.data.length === 0) return null;
    const doc = res.data[0] as CommentDoc;
    const likedBy: string[] = doc.likedBy || [];
    const already = likedBy.includes(userEmail);
    const newLikedBy = already ? likedBy.filter((e) => e !== userEmail) : [...likedBy, userEmail];
    const newLikes = already ? Math.max(0, (doc.likes || 0) - 1) : (doc.likes || 0) + 1;
    await tcbDb.collection('comments').doc(commentId).update({ likes: newLikes, likedBy: newLikedBy });
    return { ...doc, likes: newLikes, likedBy: newLikedBy };
  } catch (err) {
    console.warn('[CloudBase] 点赞失败:', err);
    return null;
  }
}

export async function getCardCounts(): Promise<Record<string, number>> {
  if (!tcbReady || !tcbDb) return {};
  try {
    const res = await tcbDb.collection('card_counters').limit(1000).get();
    const counts: Record<string, number> = {};
    if (res.data) {
      for (const doc of res.data) {
        const cid = doc.cardId;
        if (cid) counts[cid] = (counts[cid] || 0) + 1;
      }
    }
    return counts;
  } catch (err) {
    console.warn('[CloudBase] 读取计数失败:', err);
    return {};
  }
}

export async function incrementCardCount(cardId: string) {
  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('card_counters').add({
      cardId,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[CloudBase] 更新计数失败:', err);
  }
}

export async function saveConsultation(data: {
  cardId: string;
  cardTitle: string;
  choicePath: number[];
  personalityId?: number;
  persona?: string;
}) {
  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('consultations').add({ ...data, timestamp: Date.now() });
    console.log('[CloudBase] 问诊记录已保存');
  } catch (err: unknown) {
    console.warn('[CloudBase] 保存问诊失败:', err instanceof Error ? err.message : err);
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
  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('prescriptions').add({ ...data, timestamp: Date.now() });
    console.log('[CloudBase] 处方数据已保存');
  } catch (err: unknown) {
    console.warn('[CloudBase] 保存处方失败:', err instanceof Error ? err.message : err);
  }
}
