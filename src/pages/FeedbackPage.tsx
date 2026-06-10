import { useState, useEffect, useCallback } from 'react';
import { useGameDispatch } from '../contexts/GameContext';
import {
  getSession,
  getComments,
  addComment,
  deleteComment,
  toggleLike,
  isAdmin,
  checkCanComment,
  initCloudBase,
  getPublicProfile,
  type CommentDoc,
} from '../cloudbase';
import { ConfirmModal } from '../components/game/Modals';

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return '刚刚';
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)} 天前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export function FeedbackPage() {
  const dispatch = useGameDispatch();
  const session = getSession();
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null); // comment id being replied to
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState(''); // 非空表示被禁止评论
  const [profileUser, setProfileUser] = useState<{ username: string; email: string; bio: string; avatar: string } | null>(null);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // 检查用户是否可以评论
  useEffect(() => {
    if (session) {
      checkCanComment().then(({ ok, reason }) => {
        setBanReason(ok ? '' : reason);
      });
    } else {
      setBanReason('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [!!session, comments.length]); // comments 变化时重新检查（禁言到期自动恢复）

  // Load comments
  const load = useCallback(async () => {
    await initCloudBase();
    const list = await getComments();
    // 预加载所有评论者的资料，同步用户名和头像
    const emails = [...new Set(list.map((c) => c.authorEmail))];
    const profileMap: Record<string, { username: string; avatar: string }> = {};
    for (const email of emails) {
      const p = await getPublicProfile(email);
      if (p) profileMap[email] = { username: p.username, avatar: p.avatar };
    }
    // 用当前用户名覆盖评论中的旧名
    const updated = list.map((c) => ({
      ...c,
      authorName: profileMap[c.authorEmail]?.username || c.authorName,
    }));
    setComments(updated);
    const avatarMap: Record<string, string> = {};
    for (const [email, p] of Object.entries(profileMap)) {
      avatarMap[email] = p.avatar;
    }
    setAvatarMap((prev) => ({ ...prev, ...avatarMap }));
    setCommentsLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Post top-level comment
  const handlePost = useCallback(async () => {
    if (!inputText.trim() || !session || banReason) return;
    setLoading(true);
    await addComment(inputText.trim(), session.email, session.username, null);
    setInputText('');
    setLoading(false);
    await load();
  }, [inputText, session, load, banReason]);

  // Post reply
  const handleReply = useCallback(async (parentId: string) => {
    if (!replyText.trim() || !session || banReason) return;
    setLoading(true);
    await addComment(replyText.trim(), session.email, session.username, parentId);
    setReplyText('');
    setReplyTo(null);
    setExpandedReplies((prev) => new Set(prev).add(parentId));
    setLoading(false);
    await load();
  }, [replyText, session, load, banReason]);

  // Delete
  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    await deleteComment(confirmDeleteId);
    setConfirmDeleteId(null);
    await load();
  }, [confirmDeleteId, load]);

  // Like
  const handleLike = useCallback(async (commentId: string) => {
    if (!session) return;
    const updated = await toggleLike(commentId, session.email);
    if (updated) {
      setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, likes: updated.likes, likedBy: updated.likedBy } : c)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!session]);

  // Toggle replies visibility
  const viewProfile = useCallback(async (email: string) => {
    const profile = await getPublicProfile(email);
    setProfileUser(profile);
  }, []);

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  const topLevel = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '12px 16px', borderRadius: '12px',
    border: '1px solid rgba(139,125,104,0.25)',
    background: 'rgba(255,255,255,0.85)', fontSize: '0.95rem',
    color: '#3D3020', outline: 'none', fontFamily: 'inherit',
    resize: 'none', minHeight: '44px',
  };

  return (
    <div className="page active" id="page-feedback" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#faf7f2' }}>
      {/* 顶栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(139,125,104,0.12)', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ fontFamily: "'Ma Shan Zheng','KaiTi',cursive", fontSize: '1.4rem', color: '#5D4E37', margin: 0 }}>💬 意见反馈</h2>
        <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'page-home' })} style={{ background: 'rgba(139,125,104,0.08)', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.9rem', color: '#5D4E37' }}>
          ✕ 返回
        </button>
      </div>

      {/* 输入区 */}
      <div style={{ padding: '20px 24px' }}>
        {session ? (
          banReason ? (
            <div style={{
              padding: '14px 20px', borderRadius: '8px',
              background: banReason.includes('拉黑') ? 'rgba(220,53,69,0.08)' : 'rgba(245,166,35,0.08)',
              border: `1px solid ${banReason.includes('拉黑') ? 'rgba(220,53,69,0.2)' : 'rgba(245,166,35,0.2)'}`,
              textAlign: 'center', color: banReason.includes('拉黑') ? '#DC3545' : '#E5902F',
              fontSize: '0.9rem', fontWeight: 600,
            }}>
              🚫 {banReason}
            </div>
          ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#B6563A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: localStorage.getItem(`caiber_avatar_${session.email}`) ? '1.3rem' : '1rem', fontWeight: 700, flexShrink: 0 }}>
              {localStorage.getItem(`caiber_avatar_${session.email}`) || session.username.charAt(0).toUpperCase()}
            </div>
            <textarea
              placeholder="说点什么..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={2}
              style={inputStyle}
            />
            <button
              onClick={handlePost}
              disabled={!inputText.trim() || loading}
              style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: inputText.trim() ? '#B6563A' : 'rgba(139,125,104,0.15)', color: inputText.trim() ? '#fff' : 'rgba(139,125,104,0.5)', cursor: inputText.trim() ? 'pointer' : 'not-allowed', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              发布
            </button>
          </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(139,125,104,0.5)' }}>
            请先登录后再发表评论
          </div>
        )}
      </div>

      {/* 评论列表 */}
      <div style={{ flex: 1, padding: '0 24px 40px' }}>
        {!commentsLoaded ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(139,125,104,0.2)', fontSize: '0.95rem' }}>
            ⏳ 加载中...
          </div>
        ) : topLevel.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(139,125,104,0.35)', fontSize: '0.95rem' }}>
            还没有评论，来说点什么吧
          </div>
        )}
        {topLevel.map((comment) => {
          const replies = getReplies(comment._id);
          const hasReplies = replies.length > 0;
          const isExpanded = expandedReplies.has(comment._id);
          const isOwn = session?.email === comment.authorEmail || isAdmin();
          const liked = session ? (comment.likedBy || []).includes(session.email) : false;

          return (
            <div key={comment._id} style={{ marginBottom: '8px' }}>
              {/* 主评论 */}
              <div style={{ display: 'flex', gap: '10px', padding: '12px 0' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); viewProfile(comment.authorEmail); }}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: avatarMap[comment.authorEmail] ? 'transparent' : '#8B7D68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: avatarMap[comment.authorEmail] ? '1.3rem' : '0.85rem', fontWeight: 700, flexShrink: 0, cursor: 'pointer' }}
                  title="点击查看用户资料">
                  {avatarMap[comment.authorEmail] || comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3D3020' }}>{comment.authorName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.5)' }}>{timeAgo(comment.createdAt)}</span>
                    {isOwn && (
                      <button onClick={() => setConfirmDeleteId(comment._id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(220,53,69,0.5)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' }}>
                        删除
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#3D3020', lineHeight: 1.7, wordBreak: 'break-word' }}>
                    {comment.content}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <button
                      onClick={() => handleLike(comment._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: liked ? '#E0442B' : 'rgba(139,125,104,0.5)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                    >
                      {liked ? '❤️' : '🤍'} {comment.likes || 0}
                    </button>
                    {session && !banReason && (
                      <button
                        onClick={() => { setReplyTo(replyTo === comment._id ? null : comment._id); setReplyText(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(139,125,104,0.5)', padding: 0 }}
                      >
                        💬 回复
                      </button>
                    )}
                    {hasReplies && (
                      <button onClick={() => toggleReplies(comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#B6563A', padding: 0 }}>
                        {isExpanded ? '收起回复' : `查看 ${replies.length} 条回复`}
                      </button>
                    )}
                  </div>

                  {/* 回复输入框 */}
                  {replyTo === comment._id && session && !banReason && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        placeholder={`回复 ${comment.authorName}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(139,125,104,0.2)', background: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', color: '#3D3020', outline: 'none', fontFamily: 'inherit' }}
                      />
                      <button onClick={() => handleReply(comment._id)} disabled={!replyText.trim()} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: replyText.trim() ? '#B6563A' : 'rgba(139,125,104,0.1)', color: replyText.trim() ? '#fff' : 'rgba(139,125,104,0.4)', cursor: replyText.trim() ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>
                        回复
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 回复列表 */}
              {isExpanded && hasReplies && (
                <div style={{ marginLeft: '46px', borderLeft: '2px solid rgba(139,125,104,0.1)', paddingLeft: '16px' }}>
                  {replies.map((reply) => {
                    const isReplyOwn = session?.email === reply.authorEmail || isAdmin();
                    const replyLiked = session ? (reply.likedBy || []).includes(session.email) : false;
                    return (
                      <div key={reply._id} style={{ display: 'flex', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(139,125,104,0.06)' }}>
                        <div
                          onClick={(e) => { e.stopPropagation(); viewProfile(reply.authorEmail); }}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: avatarMap[reply.authorEmail] ? 'transparent' : '#A09080', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: avatarMap[reply.authorEmail] ? '1rem' : '0.7rem', fontWeight: 700, flexShrink: 0, cursor: 'pointer' }}
                          title="点击查看用户资料">
                          {avatarMap[reply.authorEmail] || reply.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#5D4E37' }}>{reply.authorName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(139,125,104,0.45)' }}>{timeAgo(reply.createdAt)}</span>
                            {isReplyOwn && <button onClick={() => setConfirmDeleteId(reply._id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(220,53,69,0.45)', cursor: 'pointer', fontSize: '0.7rem', padding: '1px 4px' }}>删除</button>}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: '#3D3020', lineHeight: 1.6, wordBreak: 'break-word' }}>{reply.content}</div>
                          <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                            <button onClick={() => handleLike(reply._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: replyLiked ? '#E0442B' : 'rgba(139,125,104,0.45)', padding: 0 }}>
                              {replyLiked ? '❤️' : '🤍'} {reply.likes || 0}
                            </button>
                            {session && !banReason && (
                              <button
                                onClick={() => { setReplyTo(replyTo === reply._id ? null : reply._id); setReplyText(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'rgba(139,125,104,0.45)', padding: 0 }}
                              >
                                💬 回复
                              </button>
                            )}
                          </div>
                          {/* 对回复的回复输入框 */}
                          {replyTo === reply._id && session && !banReason && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <input
                                type="text"
                                placeholder={`回复 ${reply.authorName}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(139,125,104,0.2)', background: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', color: '#3D3020', outline: 'none', fontFamily: 'inherit' }}
                              />
                              <button onClick={() => handleReply(reply._id)} disabled={!replyText.trim()} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: replyText.trim() ? '#B6563A' : 'rgba(139,125,104,0.1)', color: replyText.trim() ? '#fff' : 'rgba(139,125,104,0.4)', cursor: replyText.trim() ? 'pointer' : 'not-allowed', fontSize: '0.8rem' }}>
                                回复
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        show={!!confirmDeleteId}
        title="确认删除"
        message="确定要删除这条评论吗？删除后无法恢复。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* 用户资料弹窗 */}
      {profileUser && (
        <div className="gh-overlay show" onClick={() => setProfileUser(null)}>
          <div className="gh-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', color: '#2D2010' }}>
            <button onClick={() => setProfileUser(null)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', fontSize: '1.2rem', color: '#5D4E37', cursor: 'pointer' }}>✕</button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 16px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#B6563A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
              }}>
                {profileUser.avatar}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2D2010', marginTop: '10px' }}>
                {profileUser.username}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#5D4E37', marginTop: '4px' }}>
                {profileUser.email}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(139,125,104,0.15)', paddingTop: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: '#3D3020', fontWeight: 600, marginBottom: '6px' }}>自我介绍</div>
              <div style={{
                padding: '12px 16px', background: 'rgba(139,125,104,0.06)', borderRadius: '8px',
                fontSize: '0.9rem', color: profileUser.bio ? '#2D2010' : '#8B7D68',
                lineHeight: 1.7, minHeight: '40px',
              }}>
                {profileUser.bio || '这个人很懒，什么都没写...'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
