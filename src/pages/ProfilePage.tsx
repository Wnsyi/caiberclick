import { useState, useEffect, useCallback } from 'react';
import { useGameDispatch } from '../contexts/GameContext';
import { getSession, initCloudBase, getMyConsultations, isAdmin, getAllUsers, banUser, muteUser, unbanUser, submitAppeal, getMyAppeals, getAllAppeals, resolveAppeal, replyToAppeal, updateProfile, withdrawAppeal, editAppeal, type ConsultationRecord, type UserRecord, type AppealRecord } from '../cloudbase';
import { PERSONALITIES, PERSONALITY_CHARACTERS } from '../data/personalities';
import { EXPERIENCE_CARDS } from '../data/experienceCards';
import { LOVE_CARDS } from '../data/loveCards';

const LOCAL_BIO_KEY = 'caiber_guest_bio';
const LOCAL_NICK_KEY = 'caiber_guest_nick';
const ALL_CARDS = [...EXPERIENCE_CARDS, ...LOVE_CARDS];

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return '刚刚';
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export function ProfilePage() {
  const dispatch = useGameDispatch();
  const session = getSession();
  const isLoggedIn = !!session;

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // 测试记录（仅登录用户）
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 游客编辑资料弹提示
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [testRecordsOpen, setTestRecordsOpen] = useState(true);

  // 管理员：用户管理
  const admin = isAdmin();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const loadUsers = useCallback(async () => {
    const list = await getAllUsers();
    setUsers(list);
    setUsersLoaded(true);
  }, []);

  const handleBan = useCallback(async (email: string) => {
    await banUser(email);
    await loadUsers();
  }, [loadUsers]);

  const handleMute = useCallback(async (email: string) => {
    await muteUser(email);
    await loadUsers();
  }, [loadUsers]);

  const handleUnban = useCallback(async (email: string) => {
    await unbanUser(email);
    await loadUsers();
  }, [loadUsers]);

  // 申诉
  const [myAppeals, setMyAppeals] = useState<AppealRecord[]>([]);
  const [allAppeals, setAllAppeals] = useState<AppealRecord[]>([]);
  const [appealReason, setAppealReason] = useState('');
  const [appealOpen, setAppealOpen] = useState(false);
  const [adminAppealOpen, setAdminAppealOpen] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);

  const loadMyAppeals = useCallback(async () => {
    const list = await getMyAppeals();
    setMyAppeals(list);
  }, []);

  const loadAllAppeals = useCallback(async () => {
    const list = await getAllAppeals();
    setAllAppeals(list);
  }, []);

  const handleSubmitAppeal = useCallback(async () => {
    if (!appealReason.trim()) return;
    setAppealLoading(true);
    const ok = await submitAppeal(appealReason.trim());
    if (!ok) { setAppealLoading(false); return; }
    setAppealReason('');
    setAppealLoading(false);
    await loadMyAppeals();
  }, [appealReason, loadMyAppeals]);

  const [replyAppealId, setReplyAppealId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleResolveAppeal = useCallback(async (appealId: string, approved: boolean) => {
    await resolveAppeal(appealId, approved);
    setReplyAppealId(null);
    setReplyText('');
    await loadAllAppeals();
  }, [loadAllAppeals]);

  const handleReplyAppeal = useCallback(async () => {
    if (!replyAppealId || !replyText.trim()) return;
    await replyToAppeal(replyAppealId, replyText.trim());
    setReplyAppealId(null);
    setReplyText('');
    await loadAllAppeals();
  }, [replyAppealId, replyText, loadAllAppeals]);

  // 编辑申诉
  const [editingAppealId, setEditingAppealId] = useState<string | null>(null);
  const [editingAppealReason, setEditingAppealReason] = useState('');

  const handleWithdraw = useCallback(async (appealId: string) => {
    await withdrawAppeal(appealId);
    await loadMyAppeals();
  }, [loadMyAppeals]);

  const handleEditAppeal = useCallback(async () => {
    if (!editingAppealId || !editingAppealReason.trim()) return;
    await editAppeal(editingAppealId, editingAppealReason.trim());
    setEditingAppealId(null);
    setEditingAppealReason('');
    await loadMyAppeals();
  }, [editingAppealId, editingAppealReason, loadMyAppeals]);

  // 初始化
  useEffect(() => {
    initCloudBase();

    if (isLoggedIn && session) {
      setNickname(session.username || session.email);
      setBio(localStorage.getItem(`caiber_bio_${session.email}`) || '');
    } else {
      setNickname(localStorage.getItem(LOCAL_NICK_KEY) || '游客');
      setBio(localStorage.getItem(LOCAL_BIO_KEY) || '');
    }

    // 登录用户加载测试记录和申诉
    if (isLoggedIn) {
      getMyConsultations().then(setConsultations);
      getMyAppeals().then(setMyAppeals);
    } else {
      setConsultations([]);
      setMyAppeals([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleSave = useCallback(async () => {
    if (!nickname.trim()) return;
    if (!admin) {
      const blocked = ['管理员', 'admin', 'Admin', 'ADMIN', '管理', '版主'];
      if (blocked.includes(nickname.trim())) return;
    }
    if (isLoggedIn && session) {
      // 管理员不改用户名
      const saveName = admin ? session.username : nickname.trim();
      const ok = await updateProfile(saveName, bio);
      if (!ok) return;
    } else {
      localStorage.setItem(LOCAL_BIO_KEY, bio);
      localStorage.setItem(LOCAL_NICK_KEY, nickname);
    }
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }, [bio, nickname, isLoggedIn, admin, session]);

  const handleEditClick = useCallback(() => {
    if (!isLoggedIn) return;
    setEditing(true);
  }, [isLoggedIn]);

  const handleEditAvatar = useCallback(async () => {
    if (!isLoggedIn || !session) return;
    const emojis = ['🐱', '🐶', '🐼', '🦊', '🐰', '🐨', '🐯', '🐸', '🦁', '🐮', '🐷', '🐙'];
    const key = `caiber_avatar_${session.email}`;
    const current = localStorage.getItem(key);
    let next: string;
    do {
      next = emojis[Math.floor(Math.random() * emojis.length)];
    } while (next === current && emojis.length > 1);
    localStorage.setItem(key, next);
    setAvatarEmoji(next);
    // 同步到 CloudBase
    await updateProfile(session.username, bio || '');
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, session, bio]);

  // 展开 / 收起测试详情
  const toggleExpand = useCallback((rec: ConsultationRecord) => {
    const key = `${rec.cardId}_${rec.timestamp}`;
    if (expandedId === key) {
      setExpandedId(null);
    } else {
      setExpandedId(key);
    }
  }, [expandedId]);

  const [avatarEmoji, setAvatarEmoji] = useState(() => {
    if (isLoggedIn && session) {
      return localStorage.getItem(`caiber_avatar_${session.email}`) || '😶';
    }
    return '😶';
  });

  // 登录状态变化时同步头像
  useEffect(() => {
    if (isLoggedIn && session) {
      setAvatarEmoji(localStorage.getItem(`caiber_avatar_${session.email}`) || '😶');
    } else {
      setAvatarEmoji('😶');
    }
  }, [isLoggedIn, session?.email]);

  const getPersonaDetail = (pid?: number) => {
    if (!pid || pid < 1 || pid > PERSONALITIES.length) return null;
    return PERSONALITIES[pid - 1];
  };

  return (
    <div className="page active" id="page-profile" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#faf7f2' }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(139,125,104,0.12)', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ fontFamily: "'Ma Shan Zheng','KaiTi',cursive", fontSize: '1.4rem', color: '#5D4E37', margin: 0 }}>👤 我的</h2>
        <button onClick={() => dispatch({ type: 'GO_HOME' })} style={{ background: 'rgba(139,125,104,0.08)', border: 'none', borderRadius: '0', padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: '#5D4E37' }}>
          ✕ 返回
        </button>
      </div>

      <div style={{ flex: 1, padding: '24px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        {/* ===== 头像区域 ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 20px' }}>
          <div
            onClick={handleEditAvatar}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: isLoggedIn ? '#B6563A' : '#c0b9a8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', cursor: isLoggedIn ? 'pointer' : 'default', position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            title={isLoggedIn ? '点击随机换头像' : '登录后可换头像'}
          >
            {avatarEmoji}
            {isLoggedIn && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 24, height: 24, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)', fontSize: '0.65rem',
              }}>📷</div>
            )}
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            {isLoggedIn ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3D3020' }}>{nickname || session.username}</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '0', background: 'rgba(0,168,107,0.1)', color: '#00A86B', fontWeight: 600 }}>已登录</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(139,125,104,0.5)', marginTop: '2px' }}>{session.email}</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#3D3020' }}>未登录</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(139,125,104,0.5)', marginTop: '2px' }}>登录后可查看测试记录</div>
                <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'page-landing' })} style={{
                  marginTop: '8px', padding: '6px 20px', borderRadius: '0', border: 'none',
                  background: '#B6563A', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}>去登录 →</button>
              </>
            )}
          </div>
        </div>

        {/* ===== 编辑资料 ===== */}
        <details
          onToggle={(e) => setProfileOpen((e.target as HTMLDetailsElement).open)}
          style={{
            background: '#fff', borderRadius: '0', padding: '20px 24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '16px',
          }}>
          <summary style={{ fontWeight: 700, fontSize: '0.95rem', color: '#5D4E37', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            📝 编辑资料
            <span style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.4)' }}>{profileOpen ? '收起' : '展开'}</span>
          </summary>

          {!isLoggedIn ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(139,125,104,0.45)', fontSize: '0.85rem' }}>
              🔒 请先登录后再编辑个人资料
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              {saved && (
                <div style={{ textAlign: 'center', padding: '6px', color: '#00A86B', fontSize: '0.8rem', marginBottom: '8px' }}>✅ 已保存</div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.6)', display: 'block', marginBottom: '4px' }}>用户名{admin ? '（管理员不可修改）' : ''}</label>
                {admin ? (
                  <div style={{ fontSize: '0.9rem', color: '#5D4E37', padding: '10px 14px', background: 'rgba(139,125,104,0.04)', borderRadius: '0' }}>
                    {nickname || '管理员'} <span style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.35)' }}>不可修改</span>
                  </div>
                ) : editing ? (
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '0', border: '1px solid rgba(139,125,104,0.25)', fontSize: '0.9rem', color: '#3D3020', outline: 'none', fontFamily: 'inherit', background: 'rgba(255,255,255,0.8)' }} />
                ) : (
                  <div style={{ fontSize: '0.9rem', color: '#3D3020', padding: '8px 0' }}>{nickname || '未设置'}</div>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.6)', display: 'block', marginBottom: '4px' }}>自我介绍</label>
                {editing ? (
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={2}
                    placeholder="介绍一下你自己吧..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '0', border: '1px solid rgba(139,125,104,0.25)', fontSize: '0.9rem', color: '#3D3020', outline: 'none', fontFamily: 'inherit', resize: 'vertical', background: 'rgba(255,255,255,0.8)' }} />
                ) : (
                  <div style={{ fontSize: '0.9rem', color: bio ? '#3D3020' : 'rgba(139,125,104,0.35)', padding: '8px 0', lineHeight: 1.6 }}>
                    {bio || '这个人很懒，什么都没写...'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!editing ? (
                  <button onClick={handleEditClick}
                    style={{ background: 'none', border: '1px solid rgba(139,125,104,0.2)', borderRadius: '0', padding: '6px 18px', cursor: 'pointer', fontSize: '0.82rem', color: '#5D4E37' }}>编辑资料</button>
                ) : (
                  <button onClick={handleSave}
                    style={{ background: '#B6563A', border: 'none', borderRadius: '0', padding: '6px 18px', cursor: 'pointer', fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>保存</button>
                )}
              </div>
            </div>
          )}
        </details>

        {/* ===== 测试记录 ===== */}
        <details
          open
          onToggle={(e) => setTestRecordsOpen((e.target as HTMLDetailsElement).open)}
          style={{
            background: '#fff', borderRadius: '0', padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '16px',
          }}>
          <summary style={{ fontWeight: 700, fontSize: '0.95rem', color: '#5D4E37', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            🧪 测试记录
            <span style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.4)' }}>{testRecordsOpen ? '收起' : '展开'}</span>
          </summary>

          {!isLoggedIn ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(139,125,104,0.45)', fontSize: '0.85rem' }}>
              🔒 请先登录后查看测试记录
            </div>
          ) : consultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(139,125,104,0.3)', fontSize: '0.9rem' }}>
              📭 还没有测试记录，去首页选一张体验卡开始吧
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.4)', margin: '0 0 16px 0' }}>共 {consultations.length} 次测试</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {consultations.map((rec) => {
                  const key = `${rec.cardId}_${rec.timestamp}`;
                  const isExpanded = expandedId === key;
                  const card = ALL_CARDS.find((c) => c.id === rec.cardId);
                  const persona = getPersonaDetail(rec.personalityId);

                  return (
                    <div key={key} style={{
                      border: `1px solid ${isExpanded ? 'rgba(182,86,58,0.3)' : 'rgba(139,125,104,0.1)'}`,
                      borderRadius: '0', overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}>
                      {/* 记录摘要行 */}
                      <div onClick={() => toggleExpand(rec)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', background: isExpanded ? 'rgba(182,86,58,0.03)' : 'transparent' }}>
                        <span style={{ fontSize: '1.3rem' }}>{card?.emoji || '🎴'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3D3020' }}>{rec.cardTitle || card?.title || '未知体验卡'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(139,125,104,0.45)', marginTop: '2px' }}>{timeAgo(rec.timestamp)}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '0', background: 'rgba(124,58,237,0.06)', color: '#7C3AED', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {persona ? persona.persona : '未知'}
                        </span>
                        <span style={{ color: 'rgba(139,125,104,0.3)', fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>

                      {/* 展开详情 */}
                      {isExpanded && persona && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(139,125,104,0.08)', background: 'rgba(255,255,255,0.6)' }}>
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>诊断结果</div>
                            <div style={{ fontSize: '0.85rem', color: '#5D4E37', lineHeight: 1.7 }}>{persona.dia}</div>
                          </div>

                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>处方 Rp.</div>
                            <div style={{ background: 'rgba(182,86,58,0.04)', borderRadius: '0', padding: '12px 16px', fontSize: '0.85rem', color: '#5D4E37', lineHeight: 1.7 }}>
                              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{persona.med}</div>
                              <div style={{ color: 'rgba(139,125,104,0.6)', fontSize: '0.8rem' }}>{persona.usage}</div>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>医嘱</div>
                            <div style={{ fontSize: '0.85rem', color: '#5D4E37', lineHeight: 1.7, fontStyle: 'italic' }}>{persona.advice}</div>
                          </div>

                          {rec.personalityId && PERSONALITY_CHARACTERS[rec.personalityId] && (
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.5)' }}>代表人物</span>
                              <img src={PERSONALITY_CHARACTERS[rec.personalityId]} alt="" style={{ width: 48, height: 48, borderRadius: '0', objectFit: 'cover' }} />
                            </div>
                          )}

                          <div style={{ marginTop: '12px', fontSize: '0.7rem', color: 'rgba(139,125,104,0.35)' }}>
                            选择路径：{rec.choicePath?.join(' → ') || '无'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </details>
        {/* ===== 管理用户（仅管理员可见） ===== */}
        {admin && (
          <details
            onToggle={async (e) => {
              const open = (e.target as HTMLDetailsElement).open;
              setAdminOpen(open);
              if (open && !usersLoaded) await loadUsers();
            }}
            style={{
              background: '#fff', borderRadius: '0', padding: '20px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '16px',
            }}>
            <summary style={{ fontWeight: 700, fontSize: '0.95rem', color: '#B6563A', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              🛡️ 管理用户
              <span style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.4)' }}>{adminOpen ? '收起' : '展开'}</span>
            </summary>

            <div style={{ marginTop: '16px' }}>
              {!usersLoaded ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(139,125,104,0.4)' }}>加载中...</div>
              ) : users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(139,125,104,0.35)' }}>暂无用户</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {users.map((u) => {
                    const isBanned = u.banned === true;
                    const isMuted = u.mutedUntil && u.mutedUntil > Date.now();
                    const mutedHours = isMuted ? Math.ceil((u.mutedUntil! - Date.now()) / (60 * 60 * 1000)) : 0;

                    return (
                      <div key={u._id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 14px', borderRadius: '0',
                        border: '1px solid rgba(139,125,104,0.08)',
                        background: isBanned ? 'rgba(220,53,69,0.04)' : isMuted ? 'rgba(245,166,35,0.04)' : 'transparent',
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.isAdmin ? '#B6563A' : '#8B7D68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                          {(u.name || u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#3D3020' }}>
                            {u.name || u.username}
                            {u.isAdmin && <span style={{ fontSize: '0.6rem', marginLeft: '6px', padding: '1px 6px', borderRadius: '0', background: 'rgba(182,86,58,0.1)', color: '#B6563A' }}>管理员</span>}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.45)' }}>{u.email}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '0', color: '#fff', background: isBanned ? '#DC3545' : '#6c757d', fontWeight: 600 }}>拉黑</span>
                          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '0', color: '#fff', background: isMuted ? '#E5902F' : '#6c757d', fontWeight: 600 }}>禁言{isMuted ? ` ${mutedHours}h` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {isBanned || isMuted ? (
                            <button onClick={() => handleUnban(u.email)}
                              style={{ padding: '4px 10px', borderRadius: '0', border: 'none', background: '#00A86B', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                              解除
                            </button>
                          ) : (
                            <>
                              <button onClick={() => handleMute(u.email)}
                                style={{ padding: '4px 10px', borderRadius: '0', border: '1px solid rgba(229,144,47,0.3)', background: '#fff', color: '#E5902F', fontSize: '0.72rem', cursor: 'pointer' }}>
                                禁言
                              </button>
                              <button onClick={() => handleBan(u.email)}
                                style={{ padding: '4px 10px', borderRadius: '0', border: 'none', background: '#DC3545', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                                拉黑
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </details>
        )}

        {/* ===== 用户申诉（管理员） ===== */}
        {admin && (
          <details
            onToggle={(e) => {
              setAdminAppealOpen((e.target as HTMLDetailsElement).open);
              if ((e.target as HTMLDetailsElement).open) loadAllAppeals();
            }}
            style={{
              background: '#fff', borderRadius: '0', padding: '20px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '16px',
            }}>
            <summary style={{ fontWeight: 700, fontSize: '0.95rem', color: '#B6563A', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              📩 用户申诉
              <span style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.4)' }}>{adminAppealOpen ? '收起' : '展开'}</span>
            </summary>
            <div style={{ marginTop: '16px' }}>
              {allAppeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(139,125,104,0.35)' }}>暂无申诉</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allAppeals.map((a) => {
                    const statusBg = a.status === 'pending' ? 'rgba(245,166,35,0.03)' : a.status === 'approved' ? 'rgba(0,168,107,0.03)' : a.status === 'replied' ? 'rgba(124,58,237,0.03)' : 'rgba(220,53,69,0.03)';
                    const statusColor = a.status === 'pending' ? '#E5902F' : a.status === 'approved' ? '#00A86B' : a.status === 'replied' ? '#7C3AED' : '#DC3545';
                    const statusLabel = a.status === 'pending' ? '待处理' : a.status === 'approved' ? '已通过' : a.status === 'replied' ? '已回复' : '已拒绝';
                    return (
                    <div key={a._id} style={{
                      padding: '12px 16px', borderRadius: '0',
                      border: '1px solid rgba(139,125,104,0.1)',
                      background: statusBg,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#3D3020' }}>{a.username}</span>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.45)', marginLeft: '8px' }}>{a.userEmail}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '0', color: '#fff', background: statusColor, fontWeight: 600 }}>
                          {statusLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#5D4E37', lineHeight: 1.6 }}>{a.reason}</div>
                      {a.reply && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(124,58,237,0.06)', borderRadius: '0', fontSize: '0.82rem', color: '#5D4E37', borderLeft: '3px solid #7C3AED' }}>
                          <span style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 600 }}>管理员回复：</span>{a.reply}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.4)', marginTop: '8px' }}>
                        {new Date(a.createdAt).toLocaleString('zh-CN')}
                      </div>
                      {a.status === 'pending' && (
                        <div style={{ marginTop: '8px' }}>
                          {replyAppealId === a._id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                placeholder="输入回复..."
                                rows={2}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '0', border: '1px solid rgba(139,125,104,0.25)', fontSize: '0.85rem', color: '#3D3020', outline: 'none', fontFamily: 'inherit', resize: 'vertical', background: 'rgba(255,255,255,0.8)' }}
                              />
                              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                <button onClick={handleReplyAppeal} disabled={!replyText.trim()}
                                  style={{ padding: '6px 12px', borderRadius: '0', border: 'none', background: replyText.trim() ? '#7C3AED' : 'rgba(139,125,104,0.15)', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>回复</button>
                                <button onClick={() => { setReplyAppealId(null); setReplyText(''); }}
                                  style={{ padding: '6px 12px', borderRadius: '0', border: '1px solid rgba(139,125,104,0.2)', background: '#fff', color: '#5D4E37', fontSize: '0.75rem', cursor: 'pointer' }}>取消</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => { setReplyAppealId(a._id); setReplyText(''); }}
                                style={{ padding: '4px 14px', borderRadius: '0', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                                💬 回复
                              </button>
                              <button onClick={() => handleResolveAppeal(a._id, true)}
                                style={{ padding: '4px 14px', borderRadius: '0', border: 'none', background: '#00A86B', color: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                                同意
                              </button>
                              <button onClick={() => handleResolveAppeal(a._id, false)}
                                style={{ padding: '4px 14px', borderRadius: '0', border: 'none', background: '#DC3545', color: '#fff', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                                拒绝
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          </details>
        )}

        {/* ===== 我的申诉（普通用户） ===== */}
        {!admin && isLoggedIn && (
          <details
            onToggle={(e) => {
              setAppealOpen((e.target as HTMLDetailsElement).open);
              if ((e.target as HTMLDetailsElement).open) loadMyAppeals();
            }}
            style={{
              background: '#fff', borderRadius: '0', padding: '20px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '16px',
            }}>
            <summary style={{ fontWeight: 700, fontSize: '0.95rem', color: '#5D4E37', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              📩 我的申诉
              <span style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.4)' }}>{appealOpen ? '收起' : '展开'}</span>
            </summary>
            <div style={{ marginTop: '16px' }}>
              {/* 发起申诉 */}
              <div id="my-appeal-section" style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-end' }}>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="写一下你申诉的原因..."
                  rows={2}
                  maxLength={300}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '0',
                    border: '1px solid rgba(139,125,104,0.25)', fontSize: '0.9rem',
                    color: '#3D3020', outline: 'none', fontFamily: 'inherit',
                    resize: 'vertical', background: 'rgba(255,255,255,0.8)',
                  }}
                />
                <button onClick={handleSubmitAppeal}
                  disabled={!appealReason.trim() || appealLoading}
                  style={{
                    padding: '10px 20px', borderRadius: '0', border: 'none',
                    background: appealReason.trim() ? '#B6563A' : 'rgba(139,125,104,0.15)',
                    color: appealReason.trim() ? '#fff' : 'rgba(139,125,104,0.5)',
                    cursor: appealReason.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {appealLoading ? '提交中...' : '发起申诉'}
                </button>
              </div>

              {/* 申诉历史 */}
              {myAppeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(139,125,104,0.35)', fontSize: '0.85rem' }}>暂无申诉记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {myAppeals.map((a) => (
                    <div key={a._id} style={{
                      padding: '10px 14px', borderRadius: '0',
                      border: `1px solid ${a.status === 'pending' ? 'rgba(245,166,35,0.2)' : a.status === 'approved' ? 'rgba(0,168,107,0.2)' : 'rgba(220,53,69,0.2)'}`,
                      background: a.status === 'pending' ? 'rgba(245,166,35,0.03)' : a.status === 'approved' ? 'rgba(0,168,107,0.03)' : 'rgba(220,53,69,0.03)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.45)' }}>{new Date(a.createdAt).toLocaleString('zh-CN')}</span>
                        <span style={{
                          fontSize: '0.65rem', padding: '2px 8px', borderRadius: '0',
                          color: '#fff',
                          background: a.status === 'pending' ? '#E5902F' : a.status === 'approved' ? '#00A86B' : a.status === 'replied' ? '#7C3AED' : '#DC3545',
                          fontWeight: 600,
                        }}>
                          {a.status === 'pending' ? '待处理' : a.status === 'approved' ? '已通过' : a.status === 'replied' ? '已回复' : '未通过'}
                        </span>
                      </div>
                      {a.reply && (
                        <div style={{ padding: '8px 12px', background: 'rgba(124,58,237,0.06)', borderRadius: '0', fontSize: '0.82rem', color: '#5D4E37', borderLeft: '3px solid #7C3AED', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 600 }}>管理员回复：</span>{a.reply}
                        </div>
                      )}

                      {editingAppealId === a._id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                          <textarea
                            value={editingAppealReason}
                            onChange={(e) => setEditingAppealReason(e.target.value)}
                            rows={2}
                            maxLength={300}
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: '0',
                              border: '1px solid rgba(139,125,104,0.25)', fontSize: '0.85rem',
                              color: '#3D3020', outline: 'none', fontFamily: 'inherit',
                              resize: 'vertical', background: 'rgba(255,255,255,0.8)',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={handleEditAppeal}
                              disabled={!editingAppealReason.trim()}
                              style={{ padding: '6px 12px', borderRadius: '0', border: 'none', background: editingAppealReason.trim() ? '#B6563A' : 'rgba(139,125,104,0.15)', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>
                              保存
                            </button>
                            <button onClick={() => { setEditingAppealId(null); setEditingAppealReason(''); }}
                              style={{ padding: '6px 12px', borderRadius: '0', border: '1px solid rgba(139,125,104,0.2)', background: '#fff', color: '#5D4E37', fontSize: '0.75rem', cursor: 'pointer' }}>
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#5D4E37', lineHeight: 1.5 }}>{a.reason}</div>
                      )}

                      {a.status === 'pending' && editingAppealId !== a._id && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button onClick={() => { setEditingAppealId(a._id); setEditingAppealReason(a.reason); }}
                            style={{ padding: '4px 14px', borderRadius: '0', border: '1px solid rgba(139,125,104,0.2)', background: '#fff', color: '#5D4E37', fontSize: '0.75rem', cursor: 'pointer' }}>
                            编辑
                          </button>
                          <button onClick={() => handleWithdraw(a._id)}
                            style={{ padding: '4px 14px', borderRadius: '0', border: 'none', background: '#DC3545', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                            撤回
                          </button>
                        </div>
                      )}
                      {(a.status === 'replied' || a.status === 'rejected') && (
                        <div style={{ marginTop: '8px' }}>
                          <button onClick={() => {
                            setAppealReason('');
                            // 滚动到申诉输入框
                            const textarea = document.querySelector('#my-appeal-section textarea') as HTMLTextAreaElement | null;
                            if (textarea) { textarea.scrollIntoView({ behavior: 'smooth' }); textarea.focus(); }
                          }}
                            style={{ padding: '4px 14px', borderRadius: '0', border: 'none', background: '#B6563A', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                            🔄 再次申诉
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        )}


      </div>
    </div>
  );
}
