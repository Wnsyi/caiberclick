/**
 * 身份标签数据定义
 * 用户选择代表自己当前状态的互联网身份
 */
export interface IdentityTag {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const identityTags: IdentityTag[] = [
  {
    id: 'crispy-student',
    label: '脆皮大学生',
    emoji: '🎓',
    description: '身体嘎嘣脆，精神嘎嘣脆，主打一个全方位破碎',
  },
  {
    id: 'malou',
    label: '吗喽',
    emoji: '🐵',
    description: '精神状态领先同龄人二十年，已提前进入返祖阶段',
  },
  {
    id: 'fulltime-kid',
    label: '全职儿女',
    emoji: '🏠',
    description: '工作是处理爸妈的情绪，工资是爸妈的情绪',
  },
  {
    id: 'shelter-malou',
    label: '社畜吗喽',
    emoji: '💼',
    description: '在上班和上吊之间选择了上香，在求人和求己之间选择了求佛',
  },
  {
    id: 'daren',
    label: '打工人',
    emoji: '🔨',
    description: '我不是在打工，我是在用生命为老板的梦想充值',
  },
  {
    id: 'bailan',
    label: '摆烂人',
    emoji: '🛌',
    description: '努力不一定成功，但不努力一定很舒服',
  },
  {
    id: 'pure-love',
    label: '纯爱战士',
    emoji: '💗',
    description: '在这物欲横流的世界里，坚持用恋爱脑对抗消费主义',
  },
  {
    id: 'fine',
    label: '精神状态良好',
    emoji: '🙂',
    description: '我没疯，我只是精神状态非常非常非常好（注意这个微笑）',
  },
];
