import { useState } from 'react';
import type { CardRecord } from '../../cloudbase';

const COLOR_OPTIONS = [
  { value: 'slide-lottery', label: '🍊 橙橘', color: '#FFCBA4' },
  { value: 'slide-hogwarts', label: '🪄 淡紫', color: '#C4B5F0' },
  { value: 'slide-invisible', label: '💧 浅蓝', color: '#B8CDF5' },
  { value: 'slide-reunion', label: '🌟 暖黄', color: '#FCDD9A' },
  { value: 'slide-gaokao', label: '🌿 薄荷绿', color: '#A8DEC4' },
  { value: 'slide-timeloop', label: '🌸 樱花粉', color: '#F5B8CF' },
  { value: 'slide-love-crush', label: '💗 恋爱粉', color: '#F8B8CC' },
  { value: 'slide-love-reunion', label: '🔮 薰衣草', color: '#D0C4F2' },
];

interface Props {
  card?: CardRecord;
  onSave: (card: CardRecord) => void;
  onDelete?: (cardId: string) => void;
  onClose: () => void;
}

export function EditCardModal({ card, onSave, onDelete, onClose }: Props) {
  const isNew = !card;
  const [title, setTitle] = useState(card?.title || '');
  const [desc, setDesc] = useState(card?.desc || '');
  const [imgSrc, setImgSrc] = useState(card?.imgSrc || '');
  const [emoji, setEmoji] = useState(card?.emoji || '');
  const [badge, setBadge] = useState(card?.badge || '');
  const [stars, setStars] = useState(card?.stars || 5);
  const [slideClass, setSlideClass] = useState(card?.slideClass || 'slide-lottery');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !desc.trim()) return;
    setSaving(true);
    const result: CardRecord = {
      id: card?.id || 'card_' + Date.now(),
      title: title.trim(),
      desc: desc.trim(),
      imgSrc: imgSrc.trim() || card?.imgSrc || '',
      emoji: emoji.trim() || card?.emoji || '🎴',
      badge: badge.trim() || card?.badge || '',
      slideClass,
      stars,
      reviews: card?.reviews || '0 人体验过',
    };
    onSave(result);
    setSaving(false);
  };

  return (
    <div className="gh-overlay show" onClick={onClose}>
      <div className="gh-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', maxHeight: '90vh', overflow: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', fontSize: '1.2rem', color: '#5D4E37', cursor: 'pointer' }}>✕</button>
        <h3 style={{ fontFamily: "'Ma Shan Zheng','KaiTi',cursive", fontSize: '1.3rem', color: '#5D4E37', margin: '0 0 18px' }}>
          {isNew ? '➕ 新增体验卡' : '✏️ 编辑体验卡'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(139,125,104,0.3)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>描述</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(139,125,104,0.3)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>图片路径</label>
              <input value={imgSrc} onChange={(e) => setImgSrc(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(139,125,104,0.3)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
            </div>
            {imgSrc && (
              <img src={imgSrc} alt="预览" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '0' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>Emoji</label>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(139,125,104,0.3)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>标签</label>
              <input value={badge} onChange={(e) => setBadge(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(139,125,104,0.3)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
            </div>
            <div style={{ width: '60px' }}>
              <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>星级</label>
              <input type="number" min={1} max={5} value={stars} onChange={(e) => setStars(parseInt(e.target.value) || 5)}
                style={{ width: '100%', padding: '8px', border: '1px solid rgba(139,125,104,0.3)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#8B7D68', display: 'block', marginBottom: '4px' }}>卡片颜色</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSlideClass(opt.value)}
                  style={{
                    padding: '8px 4px', border: slideClass === opt.value ? '2px solid #B6563A' : '1px solid rgba(139,125,104,0.2)',
                    background: opt.color, cursor: 'pointer', fontSize: '0.75rem', fontWeight: slideClass === opt.value ? 700 : 400,
                    color: '#3D3020', borderRadius: '0',
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div>
            {!isNew && onDelete && (
              <button onClick={() => onDelete(card!.id)}
                style={{ padding: '8px 16px', border: 'none', background: '#DC3545', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                🗑 删除
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', border: '1px solid rgba(139,125,104,0.3)', background: '#fff', color: '#5D4E37', cursor: 'pointer', fontSize: '0.85rem' }}>
              取消
            </button>
            <button onClick={handleSave} disabled={saving || !title.trim()}
              style={{ padding: '8px 16px', border: 'none', background: title.trim() ? '#B6563A' : '#ccc', color: '#fff', cursor: title.trim() ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600 }}>
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
