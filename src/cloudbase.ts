/**
 * CloudBase Web SDK 初始化
 *
 * 【使用说明】
 * 1. 前往 https://console.cloud.tencent.com/tcb 创建环境
 * 2. 将环境ID填入下方的 ENV_ID 占位符
 * 3. 在CloudBase控制台 → 数据库 → 安全规则 → 将 consultations 和 prescriptions
 *    两个集合的安全规则设置为：
 *    { "read": true, "write": true }
 *    （本项目使用匿名登录，无用户鉴权，因此开放读写）
 */

import cloudbase from '@cloudbase/js-sdk';

// TODO: 替换为你的CloudBase环境ID
const ENV_ID = 'game-one-d1gx1gwhbee34fff7';

const app = cloudbase.init({
  env: ENV_ID,
});

/**
 * 匿名登录
 * CloudBase要求先登录才能访问数据库，匿名登录无需用户注册
 */
export async function signInAnonymously() {
  try {
    const auth = app.auth();
    const loginState = await auth.getLoginState();
    if (!loginState) {
      await auth.signInAnonymously();
    }
    console.log('[CloudBase] 匿名登录成功');
  } catch (err) {
    console.warn('[CloudBase] 匿名登录失败，将以离线模式运行:', err);
  }
}

export const db = app.database();

/**
 * 保存问诊记录
 */
export async function saveConsultation(data: {
  avatarTag: string;
  messages: Array<{ role: string; text: string; timestamp: number }>;
}) {
  try {
    const collection = db.collection('consultations');
    await collection.add({
      ...data,
      timestamp: Date.now(),
    });
    console.log('[CloudBase] 问诊记录保存成功');
  } catch (err) {
    console.warn('[CloudBase] 保存问诊记录失败:', err);
  }
}

/**
 * 保存处方数据
 */
export async function savePrescription(data: {
  mbtiType: string;
  avatarTag: string;
  prescriptionContent: Record<string, unknown>;
  shareCount: number;
}) {
  try {
    const collection = db.collection('prescriptions');
    await collection.add({
      ...data,
      timestamp: Date.now(),
    });
    console.log('[CloudBase] 处方数据保存成功');
  } catch (err) {
    console.warn('[CloudBase] 保存处方数据失败:', err);
  }
}

/**
 * 增加分享计数
 */
export async function incrementShareCount(prescriptionId: string) {
  try {
    const collection = db.collection('prescriptions');
    const doc = collection.doc(prescriptionId);
    const res = await doc.get();
    if (res.data && res.data.length > 0) {
      const current = res.data[0].shareCount || 0;
      await doc.update({ shareCount: current + 1 });
    }
    console.log('[CloudBase] 分享计数+1');
  } catch (err) {
    console.warn('[CloudBase] 更新分享计数失败:', err);
  }
}
