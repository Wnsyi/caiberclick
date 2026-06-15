#!/bin/bash
# ============================================================
# CaiberClick 服务器部署脚本
# 用法: bash deploy.sh <MySQL密码>
# 示例: bash deploy.sh 20232308Wxy
# ============================================================

set -e

if [ -z "$1" ]; then
  echo "用法: bash deploy.sh <MySQL密码>"
  echo "示例: bash deploy.sh 20232308Wxy"
  exit 1
fi

MYSQL_PASS="$1"

echo "=========================================="
echo "  CaiberClick 一键部署脚本"
echo "=========================================="

# 1. 创建 MySQL 数据库和表
echo ""
echo "[1/4] 创建数据库表 ..."
mysql -u root -p"$MYSQL_PASS" < schema.sql 2>/dev/null && echo "  ✅ 数据库表已创建" || echo "  ⚠️  部分表可能已存在，跳过"

# 2. 安装依赖
echo ""
echo "[2/4] 安装 Node.js 依赖 ..."
npm install --production 2>&1 | tail -1

# 3. 构建前端
echo ""
echo "[3/4] 构建前端 ..."
npm run build 2>&1 | tail -5

# 4. 配置 .env.local（如不存在）
if [ ! -f .env.local ]; then
  echo ""
  echo "[4/4] 创建 .env.local（请手动填入 API Key）..."
  cat > .env.local << EOF
AI_API_BASE=
AI_API_KEY=
AI_MODEL=deepseek-chat
VITE_AI_API_BASE=
VITE_AI_API_KEY=
VITE_AI_MODEL=deepseek-chat
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=$MYSQL_PASS
DB_DATABASE=CaiberClick_db
EOF
  echo "  ⚠️  .env.local 已创建，请编辑填入 AI_API_BASE 和 AI_API_KEY"
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "  启动命令: node server.js"
echo "  访问地址: http://39.105.51.168:8081"
echo "=========================================="
