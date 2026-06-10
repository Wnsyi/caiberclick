import { useRef, useEffect, useCallback, useState } from 'react';

function generateCode(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function drawCaptcha(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 浅色背景
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, w, h);

  // 干扰线
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.strokeStyle = `rgba(${100 + Math.random() * 100},${80 + Math.random() * 80},${50 + Math.random() * 50},0.3)`;
    ctx.lineWidth = 1 + Math.random();
    ctx.stroke();
  }

  // 干扰点
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${100 + Math.random() * 155},${80 + Math.random() * 100},${50 + Math.random() * 80},0.5)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  // 绘制字符
  const fontSize = h * 0.55;
  ctx.font = `bold ${fontSize}px "Georgia", serif`;
  ctx.textBaseline = 'middle';

  for (let i = 0; i < code.length; i++) {
    const x = w * 0.12 + i * (w * 0.2);
    const y = h / 2 + (Math.random() - 0.5) * 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.4);
    ctx.fillStyle = `rgb(${20 + Math.random() * 80},${30 + Math.random() * 60},${40 + Math.random() * 80})`;
    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }
}

interface Props {
  onValidate: (valid: boolean) => void;
}

export function Captcha({ onValidate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState('');

  const refresh = useCallback(() => {
    const newCode = generateCode(4);
    setCode(newCode);
    onValidate(false);
    // 等 state 更新后重绘
    requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawCaptcha(canvasRef.current, newCode);
      }
    });
  }, [onValidate]);

  // 初始生成
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 暴露给父组件
  useEffect(() => {
    (window as any).__captchaCode = code;
  }, [code]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={50}
      onClick={refresh}
      style={{
        borderRadius: '8px',
        cursor: 'pointer',
        border: '1px solid rgba(139,125,104,0.25)',
        display: 'block',
      }}
      title="点击切换验证码"
    />
  );
}

/** 校验验证码 */
export function checkCaptcha(input: string): boolean {
  const code = (window as any).__captchaCode as string | undefined;
  if (!code) return true; // 还未初始化，放行
  return input.toUpperCase().trim() === code.toUpperCase();
}
