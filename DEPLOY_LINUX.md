# Linux 宿主机部署

推荐使用 Docker Compose。宿主机只需要 Docker Engine、Compose 插件和用于上传项目的 SSH/SCP，不需要另外安装 Java、Maven、Node.js、Nginx 或 MySQL。

## 1. 部署结构

```text
浏览器 -> Linux宿主机:80 -> web(Nginx + React)
                              └─ /api -> backend(Spring Boot:8080)
                                           └─ mysql(MySQL 8.4)
```

只有 Web 端口发布到宿主机。MySQL 和后端端口只存在于 Docker 内部网络中。

## 2. 宿主机最低建议

- x86_64 Linux
- 2 核 CPU
- 4 GB 内存
- 20 GB 可用磁盘
- Docker Engine 和 `docker compose` 插件
- 防火墙/云安全组开放 TCP 80；数据库 3306 不要对公网开放

正式存放的项目目录建议使用：

```text
/opt/asset-management
```

## 3. 把项目传到 Linux

在 Windows PowerShell 中执行，把地址换成你的 Linux IP：

```powershell
scp -r 'E:\资产管理系统' root@服务器IP:/opt/asset-management
```

如果服务器禁止 root SSH，请换成实际账号并先确保该账号有 `/opt/asset-management` 的写权限。

上传后登录服务器：

```bash
ssh root@服务器IP
cd /opt/asset-management
```

确认目录正确：

```bash
pwd
ls -la
test -f compose.yaml && echo "项目文件正常"
```

## 4. 创建生产密码

```bash
cp .env.example .env
openssl rand -base64 32
openssl rand -base64 24
openssl rand -base64 32
vi .env
```

将前三次生成的不同字符串分别填写到：

```dotenv
MYSQL_ROOT_PASSWORD=第一条强密码
MYSQL_PASSWORD=第二条强密码
ASSET_ADMIN_USERNAME=admin
ASSET_ADMIN_PASSWORD=第三条强密码
HTTP_BIND_IP=0.0.0.0
HTTP_PORT=80
```

不要把 `.env` 上传到代码仓库或发到聊天中。

## 5. 启动

```bash
chmod +x scripts/deploy-linux.sh scripts/backup-mysql.sh scripts/install-monthly-backup-timer.sh
./scripts/deploy-linux.sh
```

首次启动需要下载和构建镜像，耗时取决于服务器访问 Docker Hub 和 Maven/npm 仓库的速度。

## 6. 验证

```bash
docker compose ps
docker compose logs --tail=100 backend
curl -i http://127.0.0.1/healthz
curl -i http://127.0.0.1/api/assets
```

可证明部署成功的信号：

1. `mysql`、`backend`、`web` 都显示 `Up` 且 `healthy`。
2. `/healthz` 返回 `200` 和 `ok`。
3. 未登录访问 `/api/assets` 返回 `401`，说明接口登录保护已生效。
4. 客户端浏览器访问 `http://服务器IP/` 能打开纯白背景登录页。
5. 用 `.env` 中的超级管理员账号登录后，首页包含演示资产 `202600000001`，侧栏可进入“用户”和“设置”。
6. 首次打印二维码前，在“设置”中保存该部署实例长期使用的访问地址，例如 `https://asset.example.com`。不要填写可能迁移的虚拟机 IP。

如果服务器本机可以访问，而外部浏览器不能访问，应检查 Linux 防火墙和云安全组，而不是先改应用代码。

## 7. 常用运维命令

```bash
# 查看状态
docker compose ps

# 持续查看全部日志
docker compose logs -f

# 只看后端日志
docker compose logs -f backend

# 修改代码后重新构建发布
docker compose up -d --build --wait

# 停止但保留数据库
docker compose down

# 启动已有容器
docker compose up -d --wait

# 备份数据库
./scripts/backup-mysql.sh
```

## 8. 宿主机月度数据库备份

系统按当前使用规模配置为每月备份一次，默认每月1日 02:30 在 Linux 宿主机执行，保留最近12份。宿主机关机错过执行时间后，systemd 会在下次开机补跑。

安装定时器：

```bash
cd /opt/asset-management
sudo ./scripts/install-monthly-backup-timer.sh
```

备份默认保存在：

```text
/opt/asset-management/backups/monthly/
```

每份备份包含一个 `.sql.gz` 文件和对应的 `.sha256` 校验文件。资产图片当前存储在 MySQL 中，因此也会包含在数据库备份内。

查看下一次执行时间和历史结果：

```bash
systemctl list-timers asset-management-backup.timer --no-pager
journalctl -u asset-management-backup.service --no-pager -n 100
```

手工验证最近一份备份：

```bash
cd /opt/asset-management/backups/monthly
sha256sum -c "$(ls -1t *.sha256 | head -n 1)"
gzip -t "$(ls -1t *.sql.gz | head -n 1)"
```

备份文件包含账号密码哈希、资产图片和备注，目录权限保持为 `700`，文件权限保持为 `600`。不要把备份文件放进代码仓库或发送到聊天中。

不要执行 `docker compose down -v`，`-v` 会删除 MySQL 数据卷。

## 9. 回滚思路

本项目尚未接入镜像仓库，当前回滚方式是保留上一个代码目录：

```text
/opt/asset-management-current
/opt/asset-management-previous
```

发布前先运行数据库备份。代码异常时切回旧目录并执行：

```bash
docker compose up -d --build --wait
```

数据库结构变化不能仅靠切换代码回滚；正式长期使用前应把 Hibernate `ddl-auto=update` 替换为 Flyway 版本化迁移。

## 10. 当前安全边界

系统已经具备登录、服务端会话、CSRF 防护、两级账号边界、操作审计和宿主机月度备份。普通用户拥有全部资产操作权限，但没有用户管理和日志查看权限；超级管理员账号受保护，只能由启动配置创建。正式公网使用前仍需补充 HTTPS；如果以后需要抵御宿主机磁盘损坏，再增加异机备份。
