# 资产管理系统

面向公司内部使用的轻量资产管理系统。前端使用 React，后端使用 Java Spring Boot，生产环境通过 Docker Compose 运行，业务数据存储在 MySQL 持久化数据卷中。

## 上线结论

代码同步到 Linux 宿主机后，执行项目统一部署脚本即可同时重新构建前端和后端：

```bash
cd /opt/asset-management
./scripts/deploy-linux.sh
```

也可以直接使用 Compose：

```bash
docker compose up -d --build --wait
```

正常重新构建、重建容器或重启宿主机，不会删除以下历史数据：

- 资产及关联设备
- 用户、密码哈希和自定义头像
- 操作日志与登录日志
- 二维码基础地址等系统设置
- 资产图片和备注
- CSV 导入产生的资产和审计记录

这些数据保存在 Docker 命名卷 `asset-management_mysql_data` 中，而不是保存在临时容器内。

> 后端容器重启后，已有登录会话可能失效，用户需要重新登录。这不代表业务数据丢失。

### 严禁执行

以下操作可能直接删除全部历史数据：

```bash
docker compose down -v
docker volume rm asset-management_mysql_data
docker system prune --volumes
```

也不要手工删除 `/var/lib/docker/volumes/` 下的项目数据。

## 当前功能

### 资产

- 全部、当前可用、已经领出、维护中、已报废五种列表视图
- 新增、编辑、克隆、领用、归还和确认删除
- 新增资产时自动生成 12 位编号：8 位日期（`YYYYMMDD`）+ 4 位当日流水号
- 二维码与资产编号合成标签并下载
- 电脑型号、CPU、内存、硬盘、显卡和选填的厂家序列号
- 显示器、鼠标、充电器等关联设备，支持型号、序列号、订单号、规格和数量
- 图片上传、缩略图查看和居中放大
- 创建时间、更新时间、采购价格、当前价值和备注

### 用户

- 超级管理员和普通用户
- 普通用户可以使用全部资产功能，但看不到用户、日志和设置菜单
- 超级管理员可以创建、删除普通用户并重置其密码
- 用户可以修改自己的密码和头像
- 超级管理员账号不能被普通用户删除

### 日志

- 记录登录、退出、资产增删改、领用归还、用户管理、密码、头像、设置和导入等操作
- 支持查询和 CSV 导出
- 日志与 MySQL 数据一同持久化和备份

### 设置与导入导出

- 配置资产二维码使用的公开基础地址
- 下载 CSV 空模板
- CSV 导入前预览和校验，确认后再写入数据库
- 导出当前资产数据

## 目录结构

```text
asset-management/
├── backend/                    Java Spring Boot 后端
├── frontend/                   React 前端
├── scripts/                    部署、备份和定时任务脚本
├── compose.yaml                生产环境容器编排
├── .env.example                环境变量模板
├── DEPLOY_LINUX.md             Linux 部署详细说明
└── README.md                   本文档
```

## 首次部署到 Linux

### 1. 环境要求

- Linux x86_64
- Docker Engine
- Docker Compose V2
- 建议至少 2 核 CPU、4 GB 内存、20 GB 可用磁盘
- 宿主机只需安装 Docker，无需额外安装 Java、Maven、Node.js、pnpm 或 MySQL

检查环境：

```bash
docker --version
docker compose version
```

### 2. 准备目录和配置

```bash
mkdir -p /opt/asset-management
cd /opt/asset-management
cp .env.example .env
```

编辑 `.env`，至少修改以下内容：

```dotenv
MYSQL_ROOT_PASSWORD=请设置强密码
MYSQL_PASSWORD=请设置另一个强密码
ASSET_ADMIN_USERNAME=admin
ASSET_ADMIN_PASSWORD=请设置管理员初始强密码
HTTP_BIND_IP=0.0.0.0
HTTP_PORT=80
ASSET_PUBLIC_BASE_URL=https://asset.example.com
```

注意：

- `ASSET_PUBLIC_BASE_URL` 用于生成二维码，开源部署时由部署者填写自己的域名。
- `HTTP_BIND_IP` 是资产服务器自身的监听地址，不是远端反向代理服务器的地址；使用独立反向代理时，应绑定资产服务器内网 IP，并通过防火墙只放行反向代理服务器来源。
- 域名迁移时修改系统设置中的二维码基础地址；资产编号本身不变。
- 不要把真实 `.env` 提交到 Git 或发送给其他人。

### 3. 启动

```bash
chmod +x scripts/*.sh
./scripts/deploy-linux.sh
```

脚本会检查配置、构建前后端、启动 MySQL，并等待健康检查通过。

### 4. 验证

```bash
docker compose ps
curl -fsS http://127.0.0.1:${HTTP_PORT:-80}/healthz
curl -i http://127.0.0.1:${HTTP_PORT:-80}/api/assets
```

预期结果：

- `mysql`、`backend`、`web` 均为 `healthy`
- `/healthz` 返回成功
- 未登录访问 `/api/assets` 返回 `401`，说明反向代理和后端认证链路正常

浏览器访问 `http://Linux宿主机IP`。如果已配置 HTTPS 和内部 DNS，则使用正式域名访问。

## 日常更新上线

代码文件同步到宿主机以后，推荐按以下顺序操作。

### 1. 更新前手工备份

```bash
cd /opt/asset-management
./scripts/backup-mysql.sh
```

确认 `backups/monthly/` 中生成了 `.sql.gz` 和校验文件后再继续。

### 2. 重新构建并启动

```bash
./scripts/deploy-linux.sh
```

此操作会重新构建前端和后端，但复用原来的 MySQL 数据卷。

### 3. 上线后检查

```bash
docker compose ps
curl -fsS http://127.0.0.1:${HTTP_PORT:-80}/healthz
docker compose logs --tail=100 backend
```

然后在浏览器验证：

1. 可以正常登录。
2. 原有资产数量和用户仍然存在。
3. 打开一条资产详情，图片、二维码和关联设备正常。
4. 日志页面可以看到本次登录和相关操作。

## 历史数据和密码说明

| 内容 | 保存位置 | 重新构建后是否保留 |
|---|---|---|
| 资产、关联设备、状态 | MySQL 数据卷 | 保留 |
| 用户、密码哈希、头像 | MySQL 数据卷 | 保留 |
| 操作日志 | MySQL 数据卷 | 保留 |
| 图片、备注、二维码设置 | MySQL 数据卷 | 保留 |
| 浏览器登录会话 | 后端运行内存 | 后端重启后可能需要重新登录 |
| Docker 构建缓存和旧镜像 | Docker 本地存储 | 可能占用磁盘，但不属于业务数据 |

### 为什么修改 `.env` 后管理员密码不变

`ASSET_ADMIN_PASSWORD` 只在数据库中还没有超级管理员时用于创建初始账号。超级管理员一旦存在，重新构建不会覆盖数据库中的密码。

已有管理员应登录系统，在“用户”页面修改自己的密码。超级管理员可以在该页面重置普通用户密码。

### MySQL 密码不要随意修改

MySQL 镜像中的初始化密码只在空数据卷首次启动时生效。已有数据库运行后，只修改 `.env` 可能导致后端无法连接数据库。确需更换数据库密码时，应先在 MySQL 中修改账号密码，再同步更新 `.env`，并立即验证后端健康状态。

## 操作说明

### 登录

使用管理员创建的账号和密码登录。系统只使用一个账号名称，不使用 `@admin` 一类的别名。

### 新增资产

1. 进入左侧“资产”。
2. 点击“新增资产”。
3. 填写名称、公司、归属部门、分类、位置和状态；资产编号保存时自动生成。
4. 填写电脑型号及硬件参数。
5. 按需添加显示器、鼠标、充电器等关联设备。
6. 填写价格、领用信息、图片和备注。
7. 保存后系统按“当天日期 + 当日流水”生成不可修改的 12 位资产编号，并生成二维码标签。

编号示例：`202609010001` 表示 2026 年 9 月 1 日登记的第 1 项资产。使用数据库流水而不是随机数，既避免重复，也方便按登记日期追溯。每天最多可生成 9999 项；历史资产编号保持不变。

状态规则：

- `当前可用`：设备无人使用，可以领用。
- `已经领出`：必须填写领用人。
- `维护中`：设备正在维修或检查，不代表已经报废。
- `已报废`：设备退出使用，但历史档案仍然保留。

### 领用与归还

- 领用时选择使用人，资产进入“已经领出”。
- 归还时清除领用人，资产恢复为“当前可用”。
- 删除和归还等操作从资产详情页执行并进行确认。

### 克隆资产

克隆会打开一份已复制内容的编辑页面。确认新资产编号、图片、关联设备和备注后再保存，避免把原资产编号打印到新设备上。

### CSV 导入

1. 进入“设置”。
2. 下载最新 CSV 空模板。
3. 使用 Excel 或其他工具填写数据。
4. 另存为 UTF-8 CSV。
5. 上传后先查看预览和错误提示。
6. 只有校验通过并确认后，数据才会写入数据库。

导入限制：

- 单个文件最大 5 MB。
- 一次最多 2000 条资产。
- 不要修改模板表头。
- “已经领出”的资产必须填写领用人。
- 厂家序列号为选填；填写后不能与文件内或系统中的其他资产重复。
- 资产状态只能使用系统固定状态。
- 公司、位置、分类等非固定下拉值可以在导入时自动创建。

### 二维码

二维码只保存资产详情地址，不把整套资产参数写入二维码。资产信息更新后，二维码保持不变，扫码时读取服务器中的最新资料。

扫码打开的是无需登录的只读资产档案，方便手机现场核对。公开页面仅展示设备身份、配置、位置、状态、领用人和关联设备；采购价格、当前价值、备注、日志以及所有编辑操作不会公开。后台资产管理和其他接口仍然必须登录。

如果使用公司内网域名，手机必须连接公司 Wi-Fi、VPN 或其他能够解析并访问该域名的网络。

修改二维码域名：

1. 进入“设置”。
2. 修改二维码公开基础地址。
3. 保存并重新下载标签。

如果只是服务器 IP 变化而域名不变，只需更新 DNS 解析，原二维码仍然有效。

### 用户与头像

- 普通用户可以修改自己的密码和头像。
- 支持 JPG、PNG、WebP，最大 2 MB。
- 选择图片后可以拖动人物位置并缩放，保存结果与裁切预览一致。
- 超级管理员可以创建、删除普通用户、重置密码和清除普通用户头像。
- 普通用户不能删除超级管理员，也看不到用户、日志和设置菜单。

### 日志

“日志”记录系统中的关键操作。排查误修改或误删除时，可以按用户、动作、对象和时间搜索，并可导出 CSV 留档。

## 数据库备份

### 手工备份

```bash
cd /opt/asset-management
./scripts/backup-mysql.sh
```

默认备份目录：

```text
/opt/asset-management/backups/monthly/
```

备份文件包含资产、用户、图片、头像、设置和日志。脚本会压缩 SQL、生成 SHA256 校验文件，并默认保留最近 12 份月度备份。

### 安装每月自动备份

```bash
cd /opt/asset-management
sudo ./scripts/install-monthly-backup-timer.sh
```

查看定时器：

```bash
systemctl list-timers asset-management-backup.timer
systemctl status asset-management-backup.timer
```

默认每月 1 日 02:30 左右执行。建议定期把备份复制到另一台服务器、NAS 或离线存储；只放在同一块宿主机磁盘上不能防止整盘损坏。

### 数据恢复

恢复会覆盖当前数据库，必须先确认备份文件和目标环境，并先为当前数据库再做一份备份。

```bash
cd /opt/asset-management
./scripts/backup-mysql.sh
docker compose stop web backend
gzip -dc backups/monthly/目标备份.sql.gz | docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
docker compose up -d --wait
docker compose ps
```

恢复完成后，检查登录、资产数量、用户、图片和日志。

## 常用维护命令

查看状态：

```bash
docker compose ps
```

查看后端日志：

```bash
docker compose logs --tail=200 backend
```

查看全部服务日志：

```bash
docker compose logs --tail=200
```

停止服务但保留数据：

```bash
docker compose down
```

再次启动：

```bash
docker compose up -d --wait
```

清理无引用旧镜像和构建缓存，不删除业务数据卷：

```bash
docker image prune -f
docker builder prune -f
```

不要为省磁盘空间执行带 `--volumes` 的清理命令。

## 故障排查

### 一直停在 backend waiting

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=100 mysql
```

重点检查：

- `.env` 中的数据库账号和密码是否与已有数据库一致
- MySQL 是否为 `healthy`
- 后端是否有数据库迁移、字段或约束错误
- 宿主机磁盘是否已满

### 页面显示 Failed to fetch

```bash
curl -i http://127.0.0.1:${HTTP_PORT:-80}/healthz
curl -i http://127.0.0.1:${HTTP_PORT:-80}/api/auth/me
docker compose logs --tail=200 web backend
```

### 修改代码后页面没有变化

确认已经重新构建 web 容器，并在浏览器中强制刷新。可以通过无痕窗口排除浏览器缓存。

### 修改 `.env` 后不生效

环境变量变化需要重建相关容器；但管理员初始密码和 MySQL 初始化密码还受数据库现有状态影响，不能只靠重新构建覆盖，参见“历史数据和密码说明”。

## 安全建议

- 生产环境必须修改所有示例密码。
- 只对外开放 Web 所需的 80/443 端口，不开放 MySQL 端口。
- 公司内网使用时，建议通过内部 DNS 配置固定域名。
- 对外网开放前，应配置 HTTPS、访问控制和防火墙。
- 定期检查磁盘、备份文件和容器健康状态。
- 不要把 `.env`、数据库备份或用户导出文件提交到公开仓库。

## 开发验证

后端测试：

```bash
cd backend
./mvnw test
```

前端构建：

```bash
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

生产部署的完整细节和 Linux 主机准备说明见 [DEPLOY_LINUX.md](DEPLOY_LINUX.md)。

```
518051
4514617678282106
```
