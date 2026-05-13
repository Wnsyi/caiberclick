import type { GameMessage } from '../../data/gameTypes';

interface Props {
  msg: GameMessage;
  isMe: boolean;
  avatarColor: string;
}

export function ChatBubble({ msg, isMe, avatarColor }: Props) {
  const initials = isMe ? '我' : (msg.sender || '?').charAt(0);
  const name = isMe ? '你' : (msg.sender || '');

  return (
    <div className={`msg-row${isMe ? ' me' : ''}`}>
      <div className="msg-avatar" style={{ background: avatarColor }}>
        {initials}
      </div>
      <div className="msg-body">
        <div className="msg-name">{name}</div>
        <div className="msg-bubble">{msg.text}</div>
      </div>
    </div>
  );
}

export function UserChoiceBubble({ text }: { text: string }) {
  return (
    <div className="msg-row me">
      <div className="msg-avatar" style={{ background: '#f59e0b' }}>
        我
      </div>
      <div className="msg-body">
        <div className="msg-name">你</div>
        <div className="msg-bubble">"{text}"</div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span style={{ fontSize: 11, color: '#8B7D68' }}>对方正在输入...</span>
    </div>
  );
}
