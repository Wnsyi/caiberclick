// AI 大模型调用模块
// OpenAI 兼容接口: http://jxnujwc.top:28000/v1

// AI 调用支持三种模式（按优先级）：
// 1. 云函数模式：VITE_AI_CLOUDBASE_FUNCTION 有值时通过 HTTP 公开端点调用（用于 CloudBase HTTPS 部署）
// 2. 直连模式：VITE_AI_API_BASE 有值时直接调用 AI API（用于 Electron / 支持 HTTPS 的部署）
// 3. 代理模式：回退到 server.js 代理（用于本地开发）

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResult {
  personalityId: number;
  persona: string;
  dia: string;
  med: string;
  usage: string;
  advice: string;
  finishReason: string;
}

// 聊天消息接口（用于前端展示）
export interface AIChatItem {
  role: 'assistant' | 'user';
  text: string;
}

/** AI 调用模式 */
type AIMode =
  | { type: 'cloudfunction'; url: string }
  | { type: 'direct'; url: string; headers: Record<string, string>; model: string }
  | { type: 'proxy' };

function getAIMode(): AIMode {
  // 1. 云函数模式（优先）— HTTP 公开端点，不需要 SDK 权限
  const funcName = import.meta.env.VITE_AI_CLOUDBASE_FUNCTION;
  if (funcName) {
    const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID || 'game-one-d1gx1gwhbee34fff7';
    return {
      type: 'cloudfunction',
      url: `https://${envId}.service.tcloudbase.com/${funcName}`,
    };
  }

  // 2. 直连模式
  const base = import.meta.env.VITE_AI_API_BASE;
  const key = import.meta.env.VITE_AI_API_KEY;
  if (base && key) {
    return {
      type: 'direct',
      url: `${base.replace(/\/+$/, '')}/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      model: import.meta.env.VITE_AI_MODEL || 'ds',
    };
  }

  // 3. 代理模式（回退）
  return { type: 'proxy' };
}

async function callAI(messages: ChatMessage[], responseFormat?: 'text' | 'json_object'): Promise<string> {
  const mode = getAIMode();

  if (mode.type === 'cloudfunction') {
    // 云函数 HTTP 公开端点 — 直接 fetch
    const res = await fetch(mode.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, response_format: responseFormat }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown');
      throw new Error(`云函数 HTTP ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.content || '';
  }

  if (mode.type === 'direct') {
    // 直连模式
    const body: Record<string, unknown> = {
      model: mode.model,
      messages,
      temperature: 0.85,
      max_tokens: 2048,
    };
    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }
    const res = await fetch(mode.url, {
      method: 'POST',
      headers: mode.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`AI API error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // 代理模式（回退到 server.js）
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, response_format: responseFormat }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`AI API error ${res.status}: ${errData.error}`);
  }
  const data = await res.json();
  return data.content || '';
}

// 构建系统提示词（含16种人格信息）
function buildSystemPrompt(cardTitle: string, cardDesc: string): string {
  return `你是一个心理诊疗游戏的AI主持人。你正在引导玩家体验"${cardTitle}"。

## 游戏背景
${cardDesc}

## 你的角色
你是这个场景中的角色们（朋友、家人、陌生人等）。你需要：
1. 先用简短的场景介绍引导玩家进入情境（2-3句话）
2. 向玩家提出与场景相关的开放式问题，引导玩家做出选择或表达观点
3. 根据玩家的回答给予回应、追问或推进剧情
4. 对话进行4-6轮后，根据玩家的回答判断其人格类型，给出最终诊断

## 人格类型（必须从中选择，id为1-16）
1.「勇敢的行动者」- 果断、行动力强、不惧风险
2.「清醒的边界者」- 理性与感性平衡、有底线
3.「温柔的守护者」- 善良有锋芒、有选择地付出
4.「独立的独行者」- 独立自主、享受孤独
5.「理性的思考者」- 逻辑严密、深思熟虑
6.「浪漫的梦想家」- 理想主义、富有想象力
7.「热情的能量体」- 充满活力、感染力强
8.「安静的观察者」- 细腻敏感、善于洞察
9.「自由的探索者」- 好奇心强、热爱冒险
10.「坚定的务实派」- 脚踏实地、注重实际
11.「包容的共情者」- 善解人意、心胸宽广
12.「真诚的表达者」- 坦率直接、不虚伪
13.「内省的哲思者」- 喜欢深度思考、探寻意义
14.「谨慎的规划者」- 周密计划、规避风险
15.「豁达的乐观者」- 积极乐观、随遇而安
16.「温暖的治愈者」- 给他人带来温暖和力量

## 重要规则
- 不要把人格列表直接发给玩家
- 根据玩家的选择自然判断，不要提前透露人格判断
- 保持轻松有趣的语气，偶尔使用emoji
- 首次回复用场景介绍开场

## 对话轮次与结束
这是第几轮对话了？如果是第5轮或第6轮，你必须结束对话。
结束方式：在回复末尾直接加上 [RESULT]（这是强制标记，必须加）。
例如："感谢你的分享！你的测试已经完成了～ [RESULT]"
不要输出JSON，不要透露人格，只要自然告别并加 [RESULT]。`;
}

// 构建人格分析和处方生成的提示词
function buildResultPrompt(dialogHistory: string): string {
  return `基于以下对话历史，判断玩家的人格类型，并生成完整的诊断结果。

## 对话历史
${dialogHistory}

## 人格类型
1.「勇敢的行动者」- 果断、行动力强、不惧风险
2.「清醒的边界者」- 理性与感性平衡、有底线
3.「温柔的守护者」- 善良有锋芒、有选择地付出
4.「独立的独行者」- 独立自主、享受孤独
5.「理性的思考者」- 逻辑严密、深思熟虑
6.「浪漫的梦想家」- 理想主义、富有想象力
7.「热情的能量体」- 充满活力、感染力强
8.「安静的观察者」- 细腻敏感、善于洞察
9.「自由的探索者」- 好奇心强、热爱冒险
10.「坚定的务实派」- 脚踏实地、注重实际
11.「包容的共情者」- 善解人意、心胸宽广
12.「真诚的表达者」- 坦率直接、不虚伪
13.「内省的哲思者」- 喜欢深度思考、探寻意义
14.「谨慎的规划者」- 周密计划、规避风险
15.「豁达的乐观者」- 积极乐观、随遇而安
16.「温暖的治愈者」- 给他人带来温暖和力量

## 输出JSON格式
{
  "personalityId": 数字1-16,
  "persona": "「人格名称」",
  "dia": "诊断描述，150字左右，分析玩家的性格特点",
  "med": "处方名称，8-15字，一个有趣的药物名称",
  "usage": "用法说明，30-50字，告诉玩家如何使用这个处方",
  "advice": "医嘱建议，50-80字，温暖鼓励的话语",
  "finishReason": "简短说明为什么为此人格"
}`;
}

// 人格名称映射
const PERSONA_NAMES: Record<number, string> = {
  1: '「勇敢的行动者」', 2: '「清醒的边界者」', 3: '「温柔的守护者」',
  4: '「独立的独行者」', 5: '「理性的思考者」', 6: '「浪漫的梦想家」',
  7: '「热情的能量体」', 8: '「安静的观察者」', 9: '「自由的探索者」',
  10: '「坚定的务实派」', 11: '「包容的共情者」', 12: '「真诚的表达者」',
  13: '「内省的哲思者」', 14: '「谨慎的规划者」', 15: '「豁达的乐观者」',
  16: '「温暖的治愈者」',
};

/** AI 聊天：发送消息并获取回复 */
export async function sendAIMessage(
  cardTitle: string,
  cardDesc: string,
  chatHistory: AIChatItem[],
  userMessage: string,
): Promise<{ reply: string; isFinished: boolean }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(cardTitle, cardDesc) },
  ];
  // 添加历史
  for (const h of chatHistory) {
    messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text });
  }
  // 添加当前消息
  messages.push({ role: 'user', content: userMessage });

  const reply = await callAI(messages);
  const isFinished = reply.includes('[RESULT]');
  return { reply: reply.replace('[RESULT]', '').trim(), isFinished };
}

/** AI 初始消息：游戏开始时的场景介绍 */
export async function startAIChat(cardTitle: string, cardDesc: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(cardTitle, cardDesc) },
    { role: 'user', content: '我准备好了，开始吧！' },
  ];
  const reply = await callAI(messages);
  return reply.trim();
}

/** AI 分析人格并生成处方 */
export async function analyzeAIPersonality(
  chatHistory: AIChatItem[],
): Promise<AIResult> {
  const dialogText = chatHistory.map(h => `[${h.role === 'user' ? '玩家' : '主持人'}]: ${h.text}`).join('\n');

  // 先尝试直接从对话中生成结果
  const messages: ChatMessage[] = [
    { role: 'system', content: buildResultPrompt(dialogText) },
    { role: 'user', content: '请输出JSON格式的人格分析结果。' },
  ];

  const raw = await callAI(messages, 'json_object');
  // 提取JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI未返回有效的JSON结果');

  const result = JSON.parse(jsonMatch[0]);
  const pid = parseInt(result.personalityId) || 1;
  const clampedPid = Math.max(1, Math.min(16, pid));

  return {
    personalityId: clampedPid,
    persona: result.persona || PERSONA_NAMES[clampedPid] || '「未知人格」',
    dia: result.dia || '根据你的对话表现，你展现出了独特的性格特质。',
    med: result.med || '「认识自己」胶囊',
    usage: result.usage || '每日一次，温水送服。',
    advice: result.advice || '每个人都是独一无二的，接纳自己是最好的处方。',
    finishReason: result.finishReason || '',
  };
}

/** 根据历史测试记录分析用户人格 */
export async function analyzeTestHistory(
  records: { cardTitle: string; persona: string; dia: string }[],
): Promise<string> {
  if (records.length === 0) return '暂无测试记录可供分析。';
  const summary = records.map((r, i) => `${i + 1}. 体验卡「${r.cardTitle}」→ 人格：${r.persona}，诊断：${r.dia}`).join('\n');
  const messages: ChatMessage[] = [
    { role: 'system', content: `你是一位心理分析师。根据用户多次心理测试的结果，综合分析其人格特质。

## 用户测试记录
${summary}

## 要求
1. 找出用户多次测试中反复出现的人格特质和规律
2. 分析用户的性格核心：是什么让TA在不同情境下呈现这些特质？
3. 给出综合性的成长建议（100-150字）
4. 语气温暖、有洞察力，避免说教
5. 总字数控制在300-400字` },
    { role: 'user', content: '请分析我的测试记录，告诉我我是什么样的人。' },
  ];
  return await callAI(messages);
}
