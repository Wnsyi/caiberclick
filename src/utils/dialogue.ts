/**
 * ============================================================
 * AI对话管理器 — 赛博老中医问诊流程
 * ============================================================
 *
 * 【设计说明】
 * 本模块定义问诊对话的流程控制。AI老中医会进行至少3轮提问，
 * 每轮根据用户上一轮回答的长度、情绪倾向动态选择追问策略。
 *
 * 【对话流程】
 * 第1轮：开场提问 — 引导用户倾诉
 * 第2轮：共鸣追问 — 根据用户回答的怨气程度幽默追问
 * 第3轮：深度追问 — 进一步挖掘
 * 第4轮（可选）：灵魂拷问 — 如果用户回答较短则追加一轮
 *
 * 后续可替换为真实AI接口，只需将此文件改为调用API生成回复即可。
 * ============================================================
 */

export interface DialogueMessage {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

/**
 * 开场白模板 — 根据用户选择的身份标签动态选择
 */
const OPENING_PHRASES: Record<string, string[]> = {
  'crispy-student': [
    '来，同学，挂号单我看看...嗯，脆皮大学生科。说说，最近哪门课/哪个老师/哪个瞬间让你觉得这个学非上不可？',
    '好的脆皮选手，先跟华佗说说，最近一次觉得自己要碎了是什么时候？',
  ],
  'malou': [
    '吗喽你好，先跟华佗说说，你最近一次发出猴叫是什么时候？以及，为什么？',
    '来看病的是吗喽啊。说说，是哪根香蕉让人抢了，还是树枝不够睡了？',
  ],
  'fulltime-kid': [
    '全职儿女科的。来，跟华佗说说，最近爸妈的情绪KPI完成得怎么样了？有没有什么让你血压飙升的家庭名场面？',
    '哟，全职儿女。跟华佗说说，最近一次被爸妈的灵魂拷问是什么？答上来了吗？',
  ],
  'shelter-malou': [
    '社畜吗喽...这科室最近爆满啊。来，跟华佗吐槽一下，最近哪个瞬间让你想把辞职信甩老板脸上？',
    '社畜吗喽你好。华佗先问：你上一次准点下班是什么时候？还记得吗？',
  ],
  'daren': [
    '打工人你好。来跟华佗说说，最近你的恩格尔系数是多少？以及，为什么打工人的钱都去哪了？',
    '好的打工人。华佗问你：如果不考虑工资，你真正想做的是什么？——不准说"不想工作"。',
  ],
  'bailan': [
    '摆烂人来了。来，跟华佗说说，你最近摆烂摆出什么新高度了？最低能耗生存法分享一下？',
    '摆烂选手你好。华佗问你：这世上还有什么事能让你从床上弹起来？',
  ],
  'pure-love': [
    '纯爱战士！稀客稀客。来跟华佗说说，最近一次心动的瞬间是什么？注意：不准美化！说真实的！',
    '纯爱战士你好。华佗问你：最近一次因为什么哭了？要真的哭了那种，不是感动的。',
  ],
  'fine': [
    '精神状态"良好"的朋友。来，对着华佗说实话：最近一次觉得自己精神不太"良好"是什么时候？',
    '好的。既然你说你精神状态良好，那华佗问你：如果你是一杯水，现在这杯水是满的、半满的、还是在冒烟？',
  ],
};

/**
 * 第2轮追问模板 — 根据用户回答长度和情绪选择
 */
const FOLLOW_UP_PHRASES: Record<string, string[]> = {
  // 如果用户回答的怨气很重（检测到负面情绪关键词）
  highAnger: [
    '嗯...你这怨气，少说能养活两个邪剑仙了。还有呢？继续。',
    '我感受到了，你这情绪浓度比我熬的中药还浓。展开说说。',
    '好好好，这吐槽质量很高。来，还有没有什么更离谱的？',
  ],
  // 如果用户回答比较温和
  mildAnger: [
    '嗯，华佗听着呢。不过你这话有点收着啊，真的没有更崩溃的时候吗？',
    '感觉你有点含蓄。没关系，在华佗这里不用装体面，说说真心话。',
    '你这话说了一半吧？来，把剩下的一半也说出来。',
  ],
  // 如果用户回答很短
  shortAnswer: [
    '就这？华佗觉得你还有话没说完。来，深呼吸，继续。',
    '太短了太短了，不够诊断用的。你把华佗当树洞，多说点。',
    '华佗把脉需要多点信息啊，再来一段。你最近到底怎么了？',
  ],
  // 如果用户回答很抽象/哲学
  abstractAnswer: [
    '有意思。你这思考深度可以啊。那回到现实世界：最近一次让你觉得"人间不值得"的具体事件是？',
    '嗯，很有哲理。不过华佗需要一点具体案例，比如说，最近一次让你破防的瞬间？',
  ],
};

/**
 * 第3轮深度追问
 */
const DEEP_QUESTIONS: string[] = [
  '好的，华佗大概了解了。最后一个问题：如果给你一个超能力，让你可以改变最近生活里的一件事，你会改什么？',
  '华佗再问最后一个：你觉得自己最被误解的一点是什么？别人总说你什么，但其实你不是那样的？',
  '差不多了。最后一个灵魂拷问：你上次发自内心觉得"活着真好"是什么时候？——没有的话就说没有。',
  '最后一个问题：请用一个emoji形容你最近的精神状态，然后用一句话解释为什么。',
];

/**
 * 诊断前的结语
 */
const CLOSING_PHRASES: string[] = [
  '好了，华佗已经把完脉了。你的精神状态我已经有了初步判断。现在请躺好，待我给你开方子。',
  '行，诊断数据收集够了。华佗现在给你开药，稍等片刻...',
  '了解了。你这个情况吧，说严重也严重，说不严重...也挺严重的。来，看看华佗给你开的方子。',
];

// ============ 对话管理函数 ============

/**
 * 获取随机开场白
 * @param tagId 身份标签ID
 * @returns 开场白文本
 */
export function getOpeningPhrase(tagId: string): string {
  const phrases = OPENING_PHRASES[tagId] || OPENING_PHRASES['malou'];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * 根据用户上一轮回答内容，生成AI追问
 * @param userText 用户上一轮回答的文本
 * @returns AI的追问文本
 */
export function getFollowUp(userText: string): string {
  const lowerText = userText.toLowerCase();
  const textLength = userText.trim().length;

  // 判断情绪倾向
  const angerKeywords = ['烦', '气死', '崩溃', '受不了', '无语', '离谱', '傻逼', '有病', '奇葩', '恶心', '吐了', '裂开', '疯了', '想死', '救命'];
  const abstractKeywords = ['人生', '意义', '宇宙', '命运', '灵魂', '存在', '为什么', '自由', '未来'];
  const highAnger = angerKeywords.filter(w => lowerText.includes(w)).length >= 2;

  let pool: string[];

  if (textLength < 20) {
    pool = FOLLOW_UP_PHRASES.shortAnswer;
  } else if (highAnger) {
    pool = FOLLOW_UP_PHRASES.highAnger;
  } else if (abstractKeywords.some(w => lowerText.includes(w))) {
    pool = FOLLOW_UP_PHRASES.abstractAnswer;
  } else {
    pool = FOLLOW_UP_PHRASES.mildAnger;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 获取深度追问
 * @returns 深度追问文本
 */
export function getDeepQuestion(): string {
  return DEEP_QUESTIONS[Math.floor(Math.random() * DEEP_QUESTIONS.length)];
}

/**
 * 获取诊断结语
 * @returns 结语文本
 */
export function getClosingPhrase(): string {
  return CLOSING_PHRASES[Math.floor(Math.random() * CLOSING_PHRASES.length)];
}
