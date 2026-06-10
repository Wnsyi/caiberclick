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
  isAdmin?: boolean;
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

    // 1.5 禁止使用管理员作为用户名
    const blockedNames = ['管理员', 'admin', 'Admin', 'ADMIN', '管理', '版主', 'moderator', 'Moderator'];
    if (blockedNames.includes(username.trim())) {
      return { success: false, error: '该用户名不可使用，请换一个' };
    }

    // 2. 哈希密码 + 生成 session token
    const hashedPwd = await hashPassword(password);
    const token = crypto.randomUUID();

    // 3. 存入数据库
    const isAdminUser = email.toLowerCase() === '1111@qq.com';
    await tcbDb.collection('users').add({
      name: isAdminUser ? '管理员' : username,
      email: email.toLowerCase(),
      username: isAdminUser ? '管理员' : username,
      password: hashedPwd,
      token,
      isAdmin: isAdminUser,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      loginCount: 1,
    });

    // 4. 写入本地会话
    saveSession({
      email: email.toLowerCase(),
      username: isAdminUser ? '管理员' : username,
      token,
      isAdmin: isAdminUser,
    });

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

    // 4. 自动将管理员邮箱用户设为管理员，非管理员邮箱则清除
    let adminFlag = user.isAdmin === true;
    const adminEmail = (user.email || '').toLowerCase();
    if (adminEmail === '1111@qq.com') {
      if (!adminFlag) {
        await tcbDb!.collection('users').doc(user._id).update({
          isAdmin: true,
          username: '管理员',
          name: '管理员',
        });
        adminFlag = true;
        user.username = '管理员';
      }
    } else if (adminFlag || user.username === '管理员' || user.name === '管理员') {
      // 非管理员邮箱但数据库有管理员标记 → 清除
      await tcbDb!.collection('users').doc(user._id).update({
        isAdmin: false,
        username: user.email.split('@')[0],
        name: user.email.split('@')[0],
      });
      adminFlag = false;
      user.username = user.email.split('@')[0];
    }

    // 5. 写入本地会话
    saveSession({
      email: email.toLowerCase(),
      username: user.username || email,
      token,
      isAdmin: adminFlag,
    });

    console.log('[CloudBase] 登录成功:', email, user.isAdmin ? '(管理员)' : '');
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
      isAdmin: user.isAdmin === true,
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

// ===== 更新用户资料 =====

export async function updateProfile(username: string, bio: string): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  await initCloudBase();
  if (!tcbReady || !tcbDb) return false;
  // 禁止空用户名和敏感用户名（管理员可保留自己的名字）
  const blocked = ['admin', 'Admin', 'ADMIN', '管理', '版主', 'moderator', 'Moderator'];
  if (!username.trim()) return false;
  if (!session.isAdmin && blocked.includes(username.trim())) return false;
  try {
    const res = await tcbDb!
      .collection('users')
      .where({ email: session.email })
      .limit(1)
      .get();
    if (!res.data || res.data.length === 0) return false;
    await tcbDb.collection('users').doc(res.data[0]._id).update({
      username,
      name: username,
      avatar: localStorage.getItem(`caiber_avatar_${session.email}`) || '😶',
    });
    // 同步更新该用户所有评论的用户名
    const oldComments = await tcbDb!
      .collection('comments')
      .where({ authorEmail: session.email })
      .limit(500)
      .get();
    for (const c of (oldComments.data || [])) {
      if (c.authorName !== username) {
        await tcbDb!.collection('comments').doc(c._id).update({ authorName: username });
      }
    }
    // 更新本地 session
    session.username = username;
    saveSession(session);
    // 同时存 localStorage 的 bio
    localStorage.setItem(`caiber_bio_${session.email}`, bio);
    console.log('[CloudBase] 资料已更新:', username);
    return true;
  } catch (err) {
    console.warn('[CloudBase] 更新资料失败:', err);
    return false;
  }
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
      _id: res.id || '',
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

/** 删除评论（作者或管理员可删） */
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

/** 检查当前用户是否为管理员 */
export function isAdmin(): boolean {
  const session = getSession();
  return session?.isAdmin === true;
}

// 暴露到全局，方便一次性设置管理员的同学在控制台调用
(window as any).__setAdmin = async (email: string) => {
  await initCloudBase();
  const ok = await setUserAsAdmin(email);
  if (ok) alert('管理员设置成功！请重新登录。');
  else alert('设置失败，请检查邮箱是否正确。');
};

/** 将指定邮箱的用户设为管理员并改名为"管理员"（仅管理员可调用） */
export async function setUserAsAdmin(targetEmail: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    const res = await tcbDb!
      .collection('users')
      .where({ email: targetEmail.toLowerCase() })
      .limit(1)
      .get();
    if (!res.data || res.data.length === 0) return false;
    await tcbDb.collection('users').doc(res.data[0]._id).update({
      isAdmin: true,
      username: '管理员',
      name: '管理员',
    });
    console.log('[CloudBase] 已设置管理员:', targetEmail);
    return true;
  } catch (err) {
    console.warn('[CloudBase] 设置管理员失败:', err);
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
  const session = getSession();
  if (!session) return; // 游客不保存

  const record = {
    ...data,
    userEmail: session.email,
    username: session.username,
    timestamp: Date.now(),
  };

  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('consultations').add(record);
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
  const session = getSession();
  if (!session) return; // 游客不保存

  const record = {
    ...data,
    userEmail: session.email,
    username: session.username,
    timestamp: Date.now(),
  };

  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('prescriptions').add(record);
    console.log('[CloudBase] 处方数据已保存');
  } catch (err: unknown) {
    console.warn('[CloudBase] 保存处方失败:', err instanceof Error ? err.message : err);
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

/** 从 CloudBase 拉取当前登录用户的问诊记录 */
export async function getMyConsultations(): Promise<ConsultationRecord[]> {
  const session = getSession();
  if (!session || !tcbReady || !tcbDb) return [];

  try {
    const res = await tcbDb!
      .collection('consultations')
      .where({ userEmail: session.email })
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();
    return (res.data || []) as ConsultationRecord[];
  } catch {
    return [];
  }
}

/** 根据 cardId + 时间范围 查处方 */
export async function getPrescriptionFor(cardId: string, ts: number): Promise<PrescriptionRecord | null> {
  const session = getSession();
  if (!session || !tcbReady || !tcbDb) return null;

  try {
    const res = await tcbDb!
      .collection('prescriptions')
      .where({ userEmail: session.email, cardId })
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    const list: PrescriptionRecord[] = (res.data || []) as PrescriptionRecord[];
    let best: PrescriptionRecord | null = null;
    let minDiff = 5000;
    for (const p of list) {
      const diff = Math.abs(p.timestamp - ts);
      if (diff < minDiff) { minDiff = diff; best = p; }
    }
    return best;
  } catch { return null; }
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

/** 获取所有用户列表（管理员用） */
export async function getAllUsers(): Promise<UserRecord[]> {
  if (!tcbReady || !tcbDb) return [];
  try {
    const res = await tcbDb.collection('users').limit(500).get();
    return (res.data || []) as UserRecord[];
  } catch { return []; }
}

/** 拉黑用户（永久禁止评论） */
export async function banUser(email: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    const res = await tcbDb!.collection('users').where({ email }).limit(1).get();
    if (!res.data || res.data.length === 0) return false;
    await tcbDb.collection('users').doc(res.data[0]._id).update({
      banned: true,
      mutedUntil: null,
    });
    return true;
  } catch { return false; }
}

/** 禁言用户（1天后自动恢复） */
export async function muteUser(email: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    const res = await tcbDb!.collection('users').where({ email }).limit(1).get();
    if (!res.data || res.data.length === 0) return false;
    await tcbDb.collection('users').doc(res.data[0]._id).update({
      mutedUntil: Date.now() + 24 * 60 * 60 * 1000,
    });
    return true;
  } catch { return false; }
}

/** 解除拉黑/禁言 */
export async function unbanUser(email: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    const res = await tcbDb!.collection('users').where({ email }).limit(1).get();
    if (!res.data || res.data.length === 0) return false;
    await tcbDb.collection('users').doc(res.data[0]._id).update({
      banned: false,
      mutedUntil: null,
    });
    return true;
  } catch { return false; }
}

/** 检查当前用户是否可以评论，返回禁止原因 */
export async function checkCanComment(): Promise<{ ok: boolean; reason: string }> {
  const session = getSession();
  if (!session) return { ok: false, reason: '请先登录后再评论' };
  if (!tcbReady || !tcbDb) return { ok: true, reason: '' };

  try {
    const res = await tcbDb!
      .collection('users')
      .where({ email: session.email })
      .limit(1)
      .get();
    if (!res.data || res.data.length === 0) return { ok: true, reason: '' };

    const user = res.data[0];
    if (user.banned === true) return { ok: false, reason: '你已被管理员拉黑，无法发表评论' };

    if (user.mutedUntil && user.mutedUntil > Date.now()) {
      const remaining = Math.ceil((user.mutedUntil - Date.now()) / (60 * 60 * 1000));
      return { ok: false, reason: `你已被管理员禁言，${remaining} 小时后恢复` };
    }

    // 禁言到期自动清除
    if (user.mutedUntil && user.mutedUntil <= Date.now()) {
      await tcbDb.collection('users').doc(user._id).update({ mutedUntil: null });
    }

    return { ok: true, reason: '' };
  } catch {
    return { ok: true, reason: '' };
  }
}

// ===== 申诉 =====

interface AppealRecord {
  _id: string;
  userEmail: string;
  username: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'replied';
  reply?: string;
  createdAt: number;
  resolvedAt?: number;
}

/** 普通用户发起申诉 */
export async function submitAppeal(reason: string): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  await initCloudBase();
  if (!tcbReady || !tcbDb) return false;
  try {
    await tcbDb.collection('appeals').add({
      userEmail: session.email,
      username: session.username,
      reason: reason.trim(),
      status: 'pending',
      createdAt: Date.now(),
    });
    console.log('[CloudBase] 申诉已提交:', session.email);
    return true;
  } catch (err) {
    console.warn('[CloudBase] 提交申诉失败:', err);
    return false;
  }
}

/** 获取当前用户的申诉列表 */
export async function getMyAppeals(): Promise<AppealRecord[]> {
  const session = getSession();
  if (!session) return [];
  await initCloudBase();
  if (!tcbReady || !tcbDb) return [];
  try {
    const res = await tcbDb!
      .collection('appeals')
      .where({ userEmail: session.email })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    return (res.data || []) as AppealRecord[];
  } catch { return []; }
}

/** 管理员获取所有申诉 */
export async function getAllAppeals(): Promise<AppealRecord[]> {
  await initCloudBase();
  if (!tcbReady || !tcbDb) return [];
  try {
    const res = await tcbDb.collection('appeals').orderBy('createdAt', 'desc').limit(200).get();
    return (res.data || []) as AppealRecord[];
  } catch { return []; }
}

/** 撤回申诉（仅待处理状态可撤回） */
export async function withdrawAppeal(appealId: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    const res = await tcbDb.collection('appeals').doc(appealId).get();
    if (!res.data || res.data.length === 0) return false;
    if (res.data[0].status !== 'pending') return false;
    await tcbDb.collection('appeals').doc(appealId).remove();
    return true;
  } catch { return false; }
}

/** 重新编辑申诉（仅待处理状态可编辑） */
export async function editAppeal(appealId: string, newReason: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    const res = await tcbDb.collection('appeals').doc(appealId).get();
    if (!res.data || res.data.length === 0) return false;
    if (res.data[0].status !== 'pending') return false;
    await tcbDb.collection('appeals').doc(appealId).update({
      reason: newReason.trim(),
      createdAt: Date.now(),
    });
    return true;
  } catch { return false; }
}

/** 管理员回复申诉（回复即已处理） */
export async function replyToAppeal(appealId: string, reply: string): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    await tcbDb.collection('appeals').doc(appealId).update({
      status: 'replied',
      reply: reply.trim(),
      resolvedAt: Date.now(),
    });
    return true;
  } catch { return false; }
}

/** 管理员处理申诉 */
export async function resolveAppeal(appealId: string, approved: boolean): Promise<boolean> {
  if (!tcbReady || !tcbDb) return false;
  try {
    await tcbDb.collection('appeals').doc(appealId).update({
      status: approved ? 'approved' : 'rejected',
      reply: null,
      resolvedAt: Date.now(),
    });
    return true;
  } catch { return false; }
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
  await initCloudBase();
  if (!tcbReady || !tcbDb) return null;
  try {
    const res = await tcbDb!
      .collection('users')
      .where({ email: email.toLowerCase() })
      .limit(1)
      .get();
    if (!res.data || res.data.length === 0) return null;
    const user = res.data[0];
    return {
      username: user.username || user.name || email,
      email: user.email || email,
      bio: localStorage.getItem(`caiber_bio_${user.email}`) || '',
      avatar: localStorage.getItem(`caiber_avatar_${user.email}`) || user.avatar || '😶',
      createdAt: user.createdAt,
    };
  } catch { return null; }
}

export type { ConsultationRecord, PrescriptionRecord, UserRecord, AppealRecord };
