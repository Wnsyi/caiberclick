/**
 * ============================================================
 * 开药吗 NLP 分析引擎 (基于规则)
 * ============================================================
 *
 * 【设计说明】
 * 本模块使用关键词匹配 + 句式分析 + 情感倾向来模拟MBTI性格分析。
 * 后续可替换为真实 AI API（如 Claude / GPT），只需将此文件改为
 * 调用 AI 接口并解析返回的 JSON 结果即可。
 *
 * 【MBTI 四维度分析逻辑】
 *
 * E/I (外向 Extraversion vs 内向 Introversion):
 *   - E 倾向：频繁提及社交场景、多人活动、外部世界
 *     关键词: 朋友、一起、聚会、同事、同学、出去玩、聊天、热闹
 *   - I 倾向：倾向独处、内心世界、自我反思
 *     关键词: 一个人、安静、宅、社恐、不想说话、自己的空间、独处
 *
 * S/N (实感 Sensing vs 直觉 iNtuition):
 *   - S 倾向：关注具体事实、细节、当下体验
 *     关键词: 今天、昨天、吃了、看到、听到、具体、实际、事实
 *   - N 倾向：抽象思维、联想、可能性、未来
 *     关键词: 感觉、好像、也许、可能、未来、梦想、意义、为什么、人生
 *
 * T/F (思考 Thinking vs 情感 Feeling):
 *   - T 倾向：逻辑分析、因果推理、客观标准
 *     关键词: 因为、所以、应该、但是、合理、逻辑、分析、数据
 *   - F 倾向：情绪表达、主观感受、价值判断
 *     关键词: 烦、开心、难过、焦虑、喜欢、讨厌、受不了、无语、崩溃
 *
 * J/P (判断 Judging vs 感知 Perceiving):
 *   - J 倾向：计划性、结构化、确定性
 *     关键词: 必须、计划、安排、应该、规则、准时、控制、目标
 *   - P 倾向：灵活性、随性、开放性
 *     关键词: 随便、都行、看情况、到时候再说、无所谓、随机、free、随意
 *
 * 【分数归一化】
 * 各维度得分归一化到 -1 ~ 1 区间，正值代表 E/S/T/J 倾向，负值代表 I/N/F/P 倾向。
 * ============================================================
 */

export interface MBTIScores {
  ei: number;   // >0=E倾向, <0=I倾向
  sn: number;   // >0=S倾向, <0=N倾向
  tf: number;   // >0=T倾向, <0=F倾向
  jp: number;   // >0=J倾向, <0=P倾向
}

export interface MBTIResult {
  type: string;
  scores: MBTIScores;
  animal: string;
  description: string;
}

// ============ MBTI各维度关键词词典 ============

interface KeywordEntry {
  word: string;
  weight: number; // 关键词权重，常见词低权重，特征词高权重
}

const DIMENSION_KEYWORDS: Record<string, KeywordEntry[]> = {
  E: [
    { word: '朋友', weight: 1.0 },
    { word: '一起', weight: 0.8 },
    { word: '聚会', weight: 1.2 },
    { word: '同事', weight: 0.8 },
    { word: '同学', weight: 0.8 },
    { word: '出去玩', weight: 1.2 },
    { word: '聊天', weight: 0.7 },
    { word: '热闹', weight: 1.0 },
    { word: '大家', weight: 0.6 },
    { word: '社交', weight: 1.2 },
    { word: '出去', weight: 0.6 },
    { word: '约', weight: 0.7 },
    { word: '见面', weight: 0.8 },
    { word: '人多', weight: 1.0 },
    { word: '饭局', weight: 1.0 },
    { word: '团建', weight: 1.2 },
    { word: '合租', weight: 0.8 },
    { word: '室友', weight: 0.8 },
    { word: '班', weight: 0.3 },
  ],
  I: [
    { word: '一个人', weight: 1.0 },
    { word: '安静', weight: 0.8 },
    { word: '宅', weight: 1.2 },
    { word: '社恐', weight: 1.5 },
    { word: '不想说话', weight: 1.5 },
    { word: '自己的空间', weight: 1.2 },
    { word: '独处', weight: 1.3 },
    { word: '自闭', weight: 1.5 },
    { word: '躲', weight: 0.8 },
    { word: '不想出门', weight: 1.3 },
    { word: '回家', weight: 0.6 },
    { word: '躺着', weight: 0.8 },
    { word: '周末', weight: 0.4 },
    { word: '不想去', weight: 1.0 },
    { word: '累', weight: 0.3 },
    { word: '内耗', weight: 1.0 },
  ],
  S: [
    { word: '今天', weight: 0.6 },
    { word: '昨天', weight: 0.6 },
    { word: '吃了', weight: 1.0 },
    { word: '看到', weight: 0.5 },
    { word: '听到', weight: 0.5 },
    { word: '具体', weight: 1.2 },
    { word: '实际', weight: 1.0 },
    { word: '事实', weight: 1.0 },
    { word: '数据', weight: 1.0 },
    { word: '钱', weight: 0.6 },
    { word: '工资', weight: 0.8 },
    { word: '吃', weight: 0.5 },
    { word: '睡', weight: 0.5 },
    { word: '买', weight: 0.5 },
    { word: '房租', weight: 0.7 },
    { word: '地铁', weight: 0.6 },
    { word: '早上', weight: 0.4 },
    { word: '晚上', weight: 0.4 },
    { word: '身体', weight: 0.6 },
    { word: '头疼', weight: 0.7 },
  ],
  N: [
    { word: '感觉', weight: 0.6 },
    { word: '好像', weight: 0.5 },
    { word: '也许', weight: 0.8 },
    { word: '可能', weight: 0.6 },
    { word: '未来', weight: 1.0 },
    { word: '梦想', weight: 1.2 },
    { word: '意义', weight: 1.3 },
    { word: '为什么', weight: 0.8 },
    { word: '人生', weight: 1.2 },
    { word: '宇宙', weight: 1.5 },
    { word: '灵魂', weight: 1.3 },
    { word: '命运', weight: 1.2 },
    { word: '存在', weight: 1.5 },
    { word: '活着', weight: 1.0 },
    { word: '本质', weight: 1.3 },
    { word: '精神', weight: 1.0 },
    { word: '灵魂拷问', weight: 1.5 },
    { word: '自由', weight: 1.0 },
    { word: '想太多', weight: 1.2 },
  ],
  T: [
    { word: '因为', weight: 0.6 },
    { word: '所以', weight: 0.6 },
    { word: '应该', weight: 0.7 },
    { word: '但是', weight: 0.4 },
    { word: '合理', weight: 1.2 },
    { word: '逻辑', weight: 1.3 },
    { word: '分析', weight: 1.2 },
    { word: '数据', weight: 0.8 },
    { word: '原因', weight: 0.8 },
    { word: '结果', weight: 0.7 },
    { word: '效率', weight: 1.0 },
    { word: '解决', weight: 0.7 },
    { word: '方案', weight: 0.8 },
    { word: '根本', weight: 0.7 },
    { word: '事实', weight: 0.6 },
    { word: '系统', weight: 0.8 },
    { word: '结论', weight: 0.8 },
  ],
  F: [
    { word: '烦', weight: 0.8 },
    { word: '开心', weight: 0.7 },
    { word: '难过', weight: 0.7 },
    { word: '焦虑', weight: 1.0 },
    { word: '喜欢', weight: 0.6 },
    { word: '讨厌', weight: 0.8 },
    { word: '受不了', weight: 1.0 },
    { word: '无语', weight: 0.8 },
    { word: '崩溃', weight: 1.2 },
    { word: '哭', weight: 1.3 },
    { word: '委屈', weight: 1.2 },
    { word: '气死', weight: 1.0 },
    { word: '感动', weight: 1.0 },
    { word: '心疼', weight: 1.1 },
    { word: '呜呜', weight: 1.5 },
    { word: '哈哈', weight: 0.6 },
    { word: '爱', weight: 0.7 },
    { word: '恨', weight: 0.9 },
    { word: '不公平', weight: 1.1 },
    { word: '凭什么', weight: 0.9 },
    { word: '好累', weight: 0.8 },
    { word: '心态', weight: 0.6 },
  ],
  J: [
    { word: '必须', weight: 1.0 },
    { word: '计划', weight: 1.2 },
    { word: '安排', weight: 1.0 },
    { word: '应该', weight: 0.6 },
    { word: '规则', weight: 1.1 },
    { word: '准时', weight: 1.2 },
    { word: '目标', weight: 1.0 },
    { word: '清单', weight: 1.3 },
    { word: '整理', weight: 1.0 },
    { word: '控制', weight: 0.8 },
    { word: '按照', weight: 0.7 },
    { word: '制定', weight: 1.0 },
    { word: '完成', weight: 0.6 },
    { word: '提前', weight: 0.8 },
    { word: '准备', weight: 0.7 },
    { word: '确定性', weight: 1.5 },
    { word: '习惯', weight: 0.6 },
  ],
  P: [
    { word: '随便', weight: 1.2 },
    { word: '都行', weight: 1.2 },
    { word: '看情况', weight: 1.0 },
    { word: '到时候再说', weight: 1.5 },
    { word: '无所谓', weight: 1.2 },
    { word: '随机', weight: 1.0 },
    { word: '随意', weight: 1.0 },
    { word: '懒得', weight: 0.8 },
    { word: '再说', weight: 0.8 },
    { word: '再算', weight: 1.0 },
    { word: '随便吧', weight: 1.3 },
    { word: '不急', weight: 0.8 },
    { word: '来得及', weight: 0.7 },
    { word: '躺平', weight: 1.0 },
    { word: '摆烂', weight: 1.1 },
    { word: '随缘', weight: 1.2 },
    { word: '自由发挥', weight: 1.2 },
  ],
};

// ============ 句式特征分析 ============

/**
 * 统计文本中感叹句的比例（感叹号结尾或包含强烈情绪词）
 * 高感叹句比例 → F倾向
 */
function exclamationRatio(text: string): number {
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 2);
  if (sentences.length === 0) return 0;
  const exclamCount = sentences.filter(s =>
    /！|!$/.test(s.trim()) || /啊啊|呜呜|卧槽|天了噜/.test(s)
  ).length;
  return exclamCount / sentences.length;
}

/**
 * 统计文本中问句的比例（问号结尾或包含疑问词）
 * 高问句比例 → N倾向（探索性思维）
 */
function questionRatio(text: string): number {
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 2);
  if (sentences.length === 0) return 0;
  const questionCount = sentences.filter(s =>
    /？|\?$/.test(s.trim()) || /为什么|怎么办|怎么|什么|何时|哪里/.test(s)
  ).length;
  return questionCount / sentences.length;
}

/**
 * 统计文本平均句长
 * 长句 → N倾向（复杂抽象思维）或 T倾向（逻辑展开）
 * 短句 → S倾向（直接感受）
 */
function avgSentenceLength(text: string): number {
  const sentences = text.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  return sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
}

// ============ 主分析函数 ============

/**
 * 对一段文本计算MBTI四维度得分
 * @param text 用户输入文本
 * @returns MBTIScores 各维度得分 (-1 ~ 1)
 */
export function analyzeMBTIScores(text: string): MBTIScores {
  const lowerText = text.toLowerCase();

  // 第一步：关键词匹配打分
  const scores: Record<string, number> = {};
  for (const [dim, keywords] of Object.entries(DIMENSION_KEYWORDS)) {
    scores[dim] = 0;
    for (const { word, weight } of keywords) {
      // 统计关键词出现次数
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[dim] += matches.length * weight;
      }
    }
  }

  // 输入越长，每个关键词的贡献应该被稀释（避免长文本天然高分）
  const textLength = text.length;
  const lengthFactor = Math.max(1, Math.log10(textLength + 1)); // 对数稀释

  // 归一化每维得分到0-1（先除以长度因子，再通过tanh控制范围）
  const maxScore = 8; // 期望的合理最大原始分
  const normalize = (raw: number) => Math.tanh(raw / (maxScore * lengthFactor));

  // 第二步：计算每个维度的净得分（E-I, S-N, T-F, J-P）
  const eiRaw = scores['E'] - scores['I'];
  const snRaw = scores['S'] - scores['N'];
  const tfRaw = scores['T'] - scores['F'];
  const jpRaw = scores['J'] - scores['P'];

  let ei = normalize(eiRaw);
  let sn = normalize(snRaw);
  let tf = normalize(tfRaw);
  let jp = normalize(jpRaw);

  // 第三步：句式特征微调
  const exRatio = exclamationRatio(text);
  const qRatio = questionRatio(text);
  const avgLen = avgSentenceLength(text);

  // 感叹句多 → F倾向（情感表达）
  tf -= exRatio * 0.3;

  // 问句多 → N倾向（探索性思维）
  sn -= qRatio * 0.3;

  // 长句 → 略偏N和T
  if (avgLen > 30) {
    sn -= 0.1;
    tf += 0.1;
  } else if (avgLen < 12) {
    sn += 0.1;
  }

  // 第四步：增加随机噪音（使结果不完全确定，增加趣味性）
  const noise = () => (Math.random() - 0.5) * 0.15;
  ei += noise();
  sn += noise();
  tf += noise();
  jp += noise();

  // 裁剪到 -1 ~ 1 范围
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));

  return {
    ei: clamp(ei),
    sn: clamp(sn),
    tf: clamp(tf),
    jp: clamp(jp),
  };
}

/**
 * 根据四维度得分确定MBTI类型
 * @param scores 四维度得分
 * @returns MBTI类型字符串 (如 "INFP")
 */
export function determineMBTIType(scores: MBTIScores): string {
  return [
    scores.ei > 0 ? 'E' : 'I',
    scores.sn > 0 ? 'S' : 'N',
    scores.tf > 0 ? 'T' : 'F',
    scores.jp > 0 ? 'J' : 'P',
  ].join('');
}

// ============ MBTI类型 → 动物比喻映射 ============

/**
 * 每个MBTI类型的趣味动物比喻及描述
 * 动物比喻的设计原则：既要幽默，又要有共情感
 */
const MBTI_ANIMALS: Record<string, { animal: string; description: string }> = {
  INTJ: { animal: '暗中观察的猫头鹰', description: '你以为它在睡觉，其实早把一切都盘算好了' },
  INTP: { animal: '互联网幽灵', description: '在知识的海洋里遨游，但拒绝上岸社交' },
  ENTJ: { animal: '草原CEO狮子', description: '不是在卷，就是在制定卷的计划' },
  ENTP: { animal: '逻辑辩论赛冠军', description: '你说东它说西，但说得比你有道理' },
  INFJ: { animal: '人类观察日记作者', description: '看透一切但不说，默默在心里写八百字小作文' },
  INFP: { animal: '流泪猫猫头', description: '世界以痛吻我，我哭完继续对世界比心' },
  ENFJ: { animal: '精神抚慰犬', description: '主动营业型治愈师，治愈别人但治不了自己' },
  ENFP: { animal: '快乐修勾', description: '精力无限，对世界永远好奇，是行走的多巴胺发射器' },
  ISTJ: { animal: '可靠大鹅', description: '社恐但靠谱，内心os: "能不能别烦我但在ddl前一定交"' },
  ISFJ: { animal: '守序善良小仓鼠', description: '默默囤积安全感，表面平静内心已发疯88次' },
  ESTJ: { animal: '纪律委员', description: '万物皆可Excel，混乱世界需要我来整顿' },
  ESFJ: { animal: '人间小太阳', description: '群聊活跃度第一名，关心所有人但忘了关心自己' },
  ISTP: { animal: '冷酷布偶猫', description: '面瘫但手巧，能用螺丝刀修好一切，除了自己的人际关系' },
  ISFP: { animal: '文艺流浪猫', description: '在城市的缝隙里发现美，然后默默走开' },
  ESTP: { animal: '即时反应哈士奇', description: '先做了再说，后悔是之后的事' },
  ESFP: { animal: '派对闪光灯', description: '哪里有热闹哪里就有我，生活的目的就是快乐' },
};

/**
 * 主入口：分析所有对话记录，返回完整MBTI结果
 * @param messages 用户的所有消息文本数组
 * @returns MBTIResult
 */
export function analyzeMBTI(messages: string[]): MBTIResult {
  // 合并所有用户消息
  const combinedText = messages.join(' ');

  // 如果文本太短（例如全是单字回复），使用随机但合理的分数
  let scores: MBTIScores;
  if (combinedText.trim().length < 10) {
    scores = {
      ei: (Math.random() - 0.5) * 1.4,
      sn: (Math.random() - 0.5) * 1.4,
      tf: (Math.random() - 0.5) * 1.4,
      jp: (Math.random() - 0.5) * 1.4,
    };
  } else {
    scores = analyzeMBTIScores(combinedText);
  }

  const type = determineMBTIType(scores);
  const animalData = MBTI_ANIMALS[type];

  return {
    type,
    scores,
    animal: animalData.animal,
    description: animalData.description,
  };
}
