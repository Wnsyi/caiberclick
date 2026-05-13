import cloudbase from '@cloudbase/js-sdk';

const ENV_ID = 'game-one-d1gx1gwhbee34fff7';

const app = cloudbase.init({ env: ENV_ID });

let tcbReady = false;
let tcbDb: ReturnType<typeof app.database> | null = null;

export async function initCloudBase() {
  try {
    const auth = app.auth();
    const loginState = await auth.getLoginState();
    if (!loginState) {
      await auth.signInAnonymously();
    }
    tcbDb = app.database();
    tcbReady = true;
  } catch (err) {
    console.warn('[CloudBase] 初始化失败:', err);
  }
}

export async function getCardCounts(): Promise<Record<string, number>> {
  if (!tcbReady || !tcbDb) return {};
  try {
    const res = await tcbDb.collection('card_counters').limit(1000).get();
    const counts: Record<string, number> = {};
    if (res.data) {
      for (const doc of res.data) {
        const cid = doc.cardId;
        if (cid) counts[cid] = (counts[cid] || 0) + 1;
      }
    }
    return counts;
  } catch (err) {
    console.warn('[CloudBase] 读取计数失败:', err);
    return {};
  }
}

export async function incrementCardCount(cardId: string) {
  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('card_counters').add({
      cardId,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[CloudBase] 更新计数失败:', err);
  }
}

export async function saveConsultation(data: {
  cardId: string;
  cardTitle: string;
  choicePath: number[];
  personalityId?: number;
  persona?: string;
}) {
  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('consultations').add({ ...data, timestamp: Date.now() });
    console.log('[CloudBase] 问诊记录已保存');
  } catch (err: any) {
    console.warn('[CloudBase] 保存问诊失败:', err.message || err);
  }
}

export async function savePrescription(data: {
  cardId: string;
  cardTitle: string;
  personalityId?: number;
  persona?: string;
  dia: string;
  med: string;
  usage: string;
  advice: string;
}) {
  if (!tcbReady || !tcbDb) return;
  try {
    await tcbDb.collection('prescriptions').add({ ...data, timestamp: Date.now() });
    console.log('[CloudBase] 处方数据已保存');
  } catch (err: any) {
    console.warn('[CloudBase] 保存处方失败:', err.message || err);
  }
}
