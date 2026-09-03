#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "错误：没有找到 docker，请先安装 Docker Engine。" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "错误：没有找到 docker compose 插件。" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "错误：缺少 .env。先执行 cp .env.example .env，然后填写两个数据库密码。" >&2
  exit 1
fi

if grep -q '请替换' .env; then
  echo "错误：.env 仍包含示例密码，请先替换后再部署。" >&2
  exit 1
fi

echo "[1/4] 检查 Compose 配置"
docker compose config --quiet

echo "[2/4] 构建镜像并启动服务"
docker compose up -d --build --wait

echo "[3/4] 显示服务状态"
docker compose ps

echo "[4/4] 验证首页"
HTTP_PORT_VALUE="$(sed -n 's/^HTTP_PORT=//p' .env | tail -n 1)"
HTTP_PORT_VALUE="${HTTP_PORT_VALUE:-80}"
curl --fail --silent --show-error "http://127.0.0.1:${HTTP_PORT_VALUE}/healthz"
echo
echo "部署完成：请访问 http://服务器IP:${HTTP_PORT_VALUE}/"

