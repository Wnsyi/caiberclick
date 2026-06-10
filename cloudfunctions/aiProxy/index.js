// CloudBase 云函数 - AI API 代理
// 支持 HTTP 触发（公开访问）和 Event 触发（SDK/CLI 调用）

const AI_API_BASE = process.env.AI_API_BASE || 'http://jxnujwc.top:28000/v1';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'ds';

exports.main = async (event) => {
  // HTTP 触发时，参数在 event.body（字符串）
  // Event 触发时，参数直接在 event 对象上
  let params;
  if (event.body) {
    try {
      params = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      return { error: '请求体 JSON 解析失败' };
    }
  } else {
    params = event;
  }

  const { messages, response_format } = params;

  if (!messages || !Array.isArray(messages)) {
    return { error: '缺少 messages 参数' };
  }

  try {
    const body = {
      model: AI_MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 2048,
    };
    if (response_format === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(`${AI_API_BASE.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { error: `AI API error ${res.status}: ${errText}` };
    }

    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'AI 请求失败' };
  }
};
