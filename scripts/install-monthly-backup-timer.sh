#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "错误：安装 systemd 定时器需要 root 权限，请使用 sudo 执行。" >&2
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_TEMPLATE="$PROJECT_DIR/deploy/systemd/asset-management-backup.service"
TIMER_TEMPLATE="$PROJECT_DIR/deploy/systemd/asset-management-backup.timer"
SERVICE_TARGET="/etc/systemd/system/asset-management-backup.service"
TIMER_TARGET="/etc/systemd/system/asset-management-backup.timer"
TEMP_SERVICE="$(mktemp)"
TEMP_TIMER="$(mktemp)"
trap 'rm -f "$TEMP_SERVICE" "$TEMP_TIMER"' EXIT

test -f "$PROJECT_DIR/compose.yaml"
test -f "$SERVICE_TEMPLATE"
test -f "$TIMER_TEMPLATE"
chmod 700 "$PROJECT_DIR/scripts/backup-mysql.sh"

sed "s|@PROJECT_DIR@|$PROJECT_DIR|g" "$SERVICE_TEMPLATE" > "$TEMP_SERVICE"
cp "$TIMER_TEMPLATE" "$TEMP_TIMER"
install -m 0644 "$TEMP_SERVICE" "$SERVICE_TARGET"
install -m 0644 "$TEMP_TIMER" "$TIMER_TARGET"

systemctl daemon-reload
systemctl enable --now asset-management-backup.timer

echo "月度备份定时器已安装：每月1日02:30执行，错过后开机补跑。"
systemctl list-timers asset-management-backup.timer --no-pager
