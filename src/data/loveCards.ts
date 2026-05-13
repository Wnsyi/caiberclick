import type { BaseCard } from './gameTypes';
import { buildResults, populateCardResults } from './personalityMappings';

const cardData: BaseCard[] = [
  {
    id: 'love_crush', emoji: '💌', badge: 'LOVE STORY', stars: 5, reviews: '0 人体验过',
    title: '暗恋咖啡店：说不出口的那句话',
    desc: '你每天都会去公司楼下的咖啡店，只为了看一眼那个靠窗座位的TA。今天，咖啡师递给你一张纸条——是TA写的。有些话再不说，可能就再也没有机会了。',
    slideClass: 'slide-love-crush',
    imgSrc: 'images/lovecard1Background2.jpeg',
    avatarColors: { '咖啡师小鹿': '#d97706', '林学长': '#8b5cf6', '闺蜜小乔': '#ec4899', 'TA': '#f59e0b' },
    startPhase: 'crush_1', results: null,
    phases: {
      crush_1: {
        chatName: '☕ 公司楼下咖啡店 · 早上8:30',
        messages: [
          { sender: '咖啡师小鹿', text: '你的拿铁。对了——靠窗那个人让我把这个给你。' },
          { sender: '咖啡师小鹿', text: '（递过来一张折好的纸条）' },
          { sender: '咖啡师小鹿', text: 'TA每天都坐同一个位置。今天我终于忍不住问TA，结果TA脸都红了。' },
        ],
        prompt: '纸条上写着："如果你也想认识我，明天同一时间，这里见。——窗边的人"',
        options: [
          { id: 1, text: '心跳加速，决定明天准时赴约', next: 'crush_2a' },
          { id: 2, text: '把纸条收好，但心里还在犹豫要不要去', next: 'crush_2b' },
        ],
      },
      crush_2a: {
        chatName: '☕ 第二天 · 同一张桌子',
        messages: [
          { sender: 'TA', text: '你真的来了。说实话，我昨天写完纸条就后悔了。' },
          { sender: 'TA', text: '我观察你两周了。你每次都坐离我最远的位置，但你的眼睛一直在往这边瞄。' },
          { sender: 'TA', text: '所以——你到底是想认识我，还是只是喜欢这个窗边的座位？' },
        ],
        prompt: 'TA歪着头看你，嘴角带着笑，但眼神是认真的。',
        options: [
          { id: 1, text: '坦率承认："对，我就是为了看你才天天来的。"', next: 'crush_3a' },
          { id: 2, text: '笑着说："两者都有。拿铁不错，窗边的人也不错。"', next: 'crush_3b' },
        ],
      },
      crush_2b: {
        chatName: '☕ 第二天 · 你没有出现',
        messages: [
          { sender: '咖啡师小鹿', text: '（发消息）靠窗那位今天等了三个小时。' },
          { sender: '咖啡师小鹿', text: '走之前TA又写了一张纸条。这次字写得很快，像是怕自己反悔。' },
          { sender: '咖啡师小鹿', text: '纸条："我不知道你为什么没来。但明天我还会在。——同一个位置。"' },
        ],
        prompt: '纸条的边角被攥得有点皱。你盯着那行字，心里翻来覆去。',
        options: [
          { id: 1, text: '决定明天一定要去，当面说清楚', next: 'crush_3c' },
          { id: 2, text: '先加TA微信，发消息解释一下', next: 'crush_3d' },
        ],
      },
      crush_3a: {
        chatName: '☕ 咖啡店角落 · 两人对坐',
        messages: [
          { sender: 'TA', text: '（笑得很开心）你知道吗，我每天都在想你会不会主动过来。' },
          { sender: 'TA', text: '结果最后居然是我先写了纸条。我妈知道了肯定要说我怂。' },
          { sender: 'TA', text: '不过无所谓——结果最重要。所以，我们现在算认识了吗？' },
        ],
        prompt: 'TA把手机推到你面前，屏幕上是一个新联系人的空白页。',
        options: [
          { id: 1, text: '接过手机，输入自己的号码——"1**"', next: 'end' },
          { id: 2, text: '也掏出手机："不如你输你的。这样就扯平了。"', next: 'end' },
        ],
      },
      crush_3b: {
        chatName: '☕ 咖啡店角落 · 两人对坐',
        messages: [
          { sender: 'TA', text: '（被你逗笑）拿铁不错？你知道这家店的拿铁评分才3.5吗。' },
          { sender: 'TA', text: '你要是真喜欢拿铁，应该去隔壁街那家。所以——嗯，我当你在夸我。' },
          { sender: 'TA', text: '不过你得补偿我。这张纸条差点被我的咖啡打湿，我紧张得要死。' },
        ],
        prompt: 'TA假装生气地敲了敲桌子，但耳朵尖是红的。',
        options: [
          { id: 1, text: '"补偿你一杯新的。这次我请。"', next: 'end' },
          { id: 2, text: '"我明天再请你。这样你就有理由继续坐窗边了。"', next: 'end' },
        ],
      },
      crush_3c: {
        chatName: '☕ 第三天 · 窗边座位',
        messages: [
          { sender: 'TA', text: '（看到你走进来，愣了一下）你来了。' },
          { sender: 'TA', text: '我差点以为你真的不会来了。说实话，昨晚我把纸条揉掉又捡起来三次。' },
          { sender: 'TA', text: '还好你来了。不然我就要想办法把自己从窗边挪走了。' },
        ],
        prompt: 'TA面前的咖啡已经凉了，显然等了很久。',
        options: [
          { id: 1, text: '坐下，认真道歉——"对不起。但我想认识你，这是认真的。"', next: 'end' },
          { id: 2, text: '站着没坐——"我想好好解释。但不是在这里。晚上有空吗？"', next: 'end' },
        ],
      },
      crush_3d: {
        chatName: 'TA',
        messages: [
          { sender: 'TA', text: '（通过了你的好友申请）' },
          { sender: 'TA', text: '还以为你打算彻底消失呢。收到好友申请的时候我差点把手机摔了。' },
          { sender: 'TA', text: '所以——为什么今天没来？这不是质问，我就是想知道。' },
        ],
        prompt: '对话框上方的"正在输入..."亮了又灭，灭了又亮。',
        options: [
          { id: 1, text: '诚实打字："我怂了。但我想了一整天，觉得不来会后悔。"', next: 'end' },
          { id: 2, text: '直接约时间："明天我会去的。同一个位置，这次换我等你。"', next: 'end' },
        ],
      },
      end: { chatName: '', messages: [], prompt: '', options: [], isEnd: true },
    },
  },
  {
    id: 'love_reunion', emoji: '💔', badge: 'LOVE STORY', stars: 5, reviews: '0 人体验过',
    title: '重逢的十字路口：再见时该说什么',
    desc: '分手三年后，你在十字路口遇到了TA。绿灯亮了，但你们都站在原地没动。TA先开了口——"好久不见。"三条路在你们面前展开，你会怎么走？',
    slideClass: 'slide-love-reunion',
    imgSrc: 'images/lovecard2.jpg',
    avatarColors: { 'TA': '#8b5cf6', '好友阿哲': '#2563eb', 'TA的现朋友': '#d97706', '咖啡店老板': '#92400e' },
    startPhase: 'reun_1', results: null,
    phases: {
      reun_1: {
        chatName: '🚦 市中心十字路口 · 下午5:30',
        messages: [
          { sender: 'TA', text: '......好久不见。' },
          { sender: 'TA', text: '你看起来挺好的。' },
          { sender: 'TA', text: '绿灯了。——不过我也不急。你赶时间吗？' },
        ],
        prompt: '红灯又亮了。你们站在路中间的安全岛上，周围是川流不息的车。',
        options: [
          { id: 1, text: '"不赶。我们去旁边的咖啡店坐坐吧。"', next: 'reun_2a' },
          { id: 2, text: '"好久不见。我确实有点赶。"', next: 'reun_2b' },
        ],
      },
      reun_2a: {
        chatName: '☕ 街角咖啡馆',
        messages: [
          { sender: '咖啡店老板', text: '二位要点什么？...诶，你们以前是不是常来？' },
          { sender: 'TA', text: '（低头笑）还是老样子？我记得你喝美式，不加糖。' },
          { sender: 'TA', text: '三年了。你没什么变化。' },
        ],
        prompt: 'TA的拿铁冒着热气。窗外十字路口的红灯刚好又亮了。',
        options: [
          { id: 1, text: '"当初为什么要分手？我一直想问这个问题。"', next: 'reun_3a' },
          { id: 2, text: '"你现在过得好吗？工作、生活——一切都好吗？"', next: 'reun_3b' },
        ],
      },
      reun_2b: {
        chatName: '🚶 你转身离开 · 走了两个街区',
        messages: [
          { sender: '好友阿哲', text: '（电话）我刚才好像看到你和TA在一起？？什么情况？？' },
          { sender: '好友阿哲', text: '你还好吗？三年了，你确定就这样走了？' },
          { sender: '好友阿哲', text: '虽然我不是你——但我觉得有些话不说，再过三年还是会后悔。' },
        ],
        prompt: '你靠在路边的栏杆上。阿哲的话像一根针扎在胸口。',
        options: [
          { id: 1, text: '掉头回去——阿哲说得对，有些话不说不甘心', next: 'reun_3c' },
          { id: 2, text: '给TA发一条消息："刚才走太快了。有些话想跟你说。"', next: 'reun_3d' },
        ],
      },
      reun_3a: {
        chatName: '🕯️ 咖啡馆 · 灯光渐暗',
        messages: [
          { sender: 'TA', text: '（沉默了很久）你想知道为什么分手...' },
          { sender: 'TA', text: '那时候我刚被公司裁员。三十岁失业，我觉得自己一无所有。' },
          { sender: 'TA', text: '我不想拖累你。但我没勇气告诉你真相。我选择让你觉得是感情淡了。' },
          { sender: 'TA', text: '这是我这辈子最后悔的决定。三年了，我每天都在想——如果当时说出来会怎样。' },
        ],
        prompt: 'TA的眼睛红了。你面前的咖啡已经凉透了。',
        options: [
          { id: 1, text: '"你应该告诉我的。我可以陪你一起扛。"', next: 'end' },
          { id: 2, text: '"谢谢你告诉我真相。过去的就让它过去吧。"', next: 'end' },
        ],
      },
      reun_3b: {
        chatName: '☕ 咖啡馆 · 聊开了',
        messages: [
          { sender: 'TA', text: '过得还行。换了份工作，养了一只猫，叫"等等"。' },
          { sender: 'TA', text: '你呢？我记得你以前说过想开一家自己的店——现在做了吗？' },
          { sender: 'TA', text: '其实后来我去过好几次你以前说想开的那种咖啡店。每次都想，如果你来会点哪一杯。' },
        ],
        prompt: 'TA还记得你说过的每一个梦想。你突然觉得，有些东西即使分开了也没有消失。',
        options: [
          { id: 1, text: '"看到你现在挺好的，我放心了。以后——保重。"', next: 'end' },
          { id: 2, text: '"其实我也变了很多。不如我们重新认识一下？"', next: 'end' },
        ],
      },
      reun_3c: {
        chatName: '🚦 十字路口 · 你跑回来了',
        messages: [
          { sender: 'TA', text: '（看到你气喘吁吁地出现，愣住了）你...回来了？' },
          { sender: 'TA', text: '我以为你说"赶时间"是借口。我以为你再也不想见到我了。' },
          { sender: 'TA', text: '你跑得满头都是汗。' },
        ],
        prompt: 'TA递过来一张纸巾。十字路口的红灯刚好又亮了，你们又站在了安全岛上。',
        options: [
          { id: 1, text: '"我还喜欢你。三年来从没变过。"', next: 'end' },
          { id: 2, text: '"我不想留遗憾。至少我们可以做回朋友。"', next: 'end' },
        ],
      },
      reun_3d: {
        chatName: '💬 深夜 · 手机屏幕亮起',
        messages: [
          { sender: 'TA', text: '（秒回）我还以为你把我拉黑了。' },
          { sender: 'TA', text: '其实刚才你走后，我在那个路口愣了好几分钟。咖啡店老板出来问我是不是在等人。' },
          { sender: 'TA', text: '所以——你想跟我说什么？' },
        ],
        prompt: '对话框上方的"正在输入..."亮了又灭，灭了又亮。你有很多话想说，但不知道该打哪一句。',
        options: [
          { id: 1, text: '"刚才走太快了。明天有空吗？我请你喝咖啡——不是以前那家。"', next: 'end' },
          { id: 2, text: '"三年没见了，刚才太仓促。保持联系，下次慢慢聊。"', next: 'end' },
        ],
      },
      end: { chatName: '', messages: [], prompt: '', options: [], isEnd: true },
    },
  },
];

populateCardResults(cardData);
export const LOVE_CARDS: BaseCard[] = cardData;
