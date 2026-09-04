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

## 目录结构与文件夹说明

### 目录总览

```text
asset-management/
├── .git/                       Git 仓库元数据和版本历史
├── .pnpm-store/                项目专用的 pnpm 包缓存
├── artifacts/                  页面设计、效果对比和视频参考帧
├── backend/                    Java Spring Boot 后端工程
│   ├── .mvn/                   Maven Wrapper 配置
│   ├── data/                   本地开发使用的 H2 数据库文件
│   ├── src/main/               后端业务源码和运行配置
│   ├── src/test/               后端自动化测试
│   └── target/                 Maven 编译、测试和打包产物
├── deploy/                     宿主机部署配套配置
│   └── systemd/                MySQL 定时备份服务和定时器
├── frontend/                   React + TypeScript 前端工程
│   ├── dist/                   Vite 生产构建产物
│   ├── node_modules/           前端依赖安装目录
│   └── src/                    前端源码
├── node_modules/               pnpm 工作区根依赖和链接
├── output/                     单次生成的输出文件
│   └── pdf/                    资产标签 PDF 样例
├── outputs/                    专项任务的成套输出和检查材料
├── scripts/                    部署、备份和一次性维护脚本
├── tmp/                        临时渲染和验证文件
├── compose.yaml                生产环境 Docker Compose 编排
├── pnpm-workspace.yaml         pnpm 工作区和缓存目录配置
├── pnpm-lock.yaml              根工作区依赖锁定文件
├── .env.example                环境变量模板
├── DEPLOY_LINUX.md             Linux 部署详细说明
└── README.md                   项目总说明
```

### 根目录文件夹

#### `.git/`

Git 自动创建的仓库管理目录，保存提交历史、分支、标签、暂存区和远程仓库信息。日常通过 `git status`、`git diff`、`git log` 等命令使用，不要手工编辑或删除。删除后业务源码仍在，但项目会失去现有 Git 历史和版本管理能力。

#### `.pnpm-store/`

pnpm 的项目本地内容寻址缓存。`pnpm-workspace.yaml` 已将 `storeDir` 指向这里，目的是避免在 E 盘根目录或用户目录散落依赖缓存。执行 `pnpm install` 时会自动读取或创建；删除后不会丢失源码，但下次安装依赖需要重新生成。该目录已被 `.gitignore` 忽略，不需要上传服务器或提交 Git。

#### `artifacts/`

开发期间保存的界面截图、样式对比图和视频拆帧参考，例如登录页、资产列表、资产详情、用户管理效果以及 `video-reference/` 中的参考帧。它们用于视觉验收和回看，不参与前后端运行。确认不再需要这些设计证据后可以删除；当前已被 Git 忽略。

#### `backend/`

Java 21 + Spring Boot 后端工程，负责登录鉴权、用户权限、资产增删改查、编号生成、二维码标签、CSV 导入导出、审计日志、系统设置和数据库访问。生产部署时由 `backend/Dockerfile` 在容器中使用 Maven 构建并运行。

主要子目录：

- `.mvn/`：Maven Wrapper 的版本和下载配置，配合 `mvnw`、`mvnw.cmd` 使用，应保留并提交 Git。
- `data/`：不使用生产配置时，本机开发环境产生的 H2 数据库，包括 `assets.mv.db` 和锁文件。它不是生产 MySQL 数据，也不应提交 Git；删除会清空本机 H2 测试数据。
- `src/main/java/`：后端 Java 业务源码。
  - `asset/`：资产、设备绑定、标签二维码、编号流水和 CSV 导入导出。
  - `audit/`：登录和业务操作审计日志。
  - `common/`：通用异常及统一接口处理。
  - `config/`：安全、初始化和其他 Spring 配置。
  - `lookup/`：公司、型号、分类、状态、位置等基础资料。
  - `security/`：登录身份和权限相关逻辑。
  - `setting/`：二维码基础地址等系统设置。
  - `user/`：用户、密码和头像管理。
- `src/main/resources/`：Spring Boot 配置文件；通用配置和生产 MySQL 配置位于这里。
- `src/test/`：接口、初始化、导入、权限和标签生成的自动化测试。
- `target/`：Maven 自动生成的 class、测试报告和 JAR 包。可以安全删除并通过构建重新生成，已被 Git 忽略。

#### `deploy/`

保存操作系统层面的部署辅助配置。目前 `deploy/systemd/` 中是每月 MySQL 备份的 systemd service 和 timer 模板，供 `scripts/install-monthly-backup-timer.sh` 安装到 Linux 宿主机。它不保存业务数据，应纳入 Git。

#### `frontend/`

React 19 + TypeScript + Vite 前端工程，负责登录、资产管理、二维码公开页面、标签打印预览、用户、日志和设置界面。生产构建后由 Nginx 提供静态页面，并把 `/api` 请求转发到后端。

主要子目录：

- `src/`：前端源代码。
  - `components/`：页面、表单、弹窗、资产详情、打印预览等 React 组件。
  - `types/`：前后端接口数据的 TypeScript 类型定义。
  - `App.tsx`：前端主应用、页面状态和主要数据加载流程。
  - `api.ts`：与后端 API 通信、CSRF 和文件下载封装。
  - `styles.css`：全站页面、组件、响应式和打印样式。
  - `main.tsx`：React 应用入口。
- `node_modules/`：前端实际安装的依赖和 pnpm 链接。可以删除后通过 `pnpm install` 恢复，不应提交 Git 或复制到 Linux 生产目录。
- `dist/`：执行 `pnpm build` 后生成的 HTML、JavaScript 和 CSS。可以重新构建，已被 Git 忽略；Docker 生产镜像会自行构建，不依赖本机旧 `dist`。

#### `node_modules/`

pnpm 工作区根目录的依赖和软链接，供根工作区管理前端依赖。它不是业务源码，可以通过 `pnpm install` 重新生成，已被 Git 忽略。不要手工修改里面的第三方代码。

#### `output/`

保存单次工具任务生成的最终输出。目前 `output/pdf/` 中是 60×50 毫米资产标签 PDF 样例。它不参与应用运行，确认样例不再需要后可以删除，已被 Git 忽略。

#### `outputs/`

保存需要成组留存的专项工作结果。目前包含资产导入 CSV/XLSX、生成脚本、检查记录和预览图，用于复核某一次导入文件制作过程。它不参与生产运行，已被 Git 忽略；删除前应先确认其中的待确认导入文件是否还要使用。

#### `scripts/`

项目维护脚本目录，应保留并提交 Git：

- `deploy-linux.sh`：检查环境变量，构建并启动前端、后端和 MySQL，等待服务健康。
- `backup-mysql.sh`：导出、压缩并校验 MySQL 备份，按保留策略清理旧备份。
- `install-monthly-backup-timer.sh`：在 Linux 上安装每月自动备份的 systemd 定时任务。
- `renumber-test-asset-tags-20260901.sql`：仅供指定测试数据重新编号的一次性 SQL，不应在生产数据库随意执行。

#### `tmp/`

工具运行时使用的临时目录。目前 `tmp/pdfs/` 保存 PDF 渲染检查图片。它不参与应用运行，可以删除并重新生成，已被 Git 忽略。

### 删除、用途与再次使用规则

| 文件夹 | 类型和用途 | 能否删除 | 删除后的影响 | 下次是否还会用、如何恢复 |
|---|---|---|---|---|
| `.git/` | Git 版本历史、分支和回滚依据 | **绝对不要删除** | 项目源码仍在，但所有本地提交历史、分支和版本追踪能力会丢失 | Git 每次提交和回滚都会使用，不能靠安装依赖恢复 |
| `.pnpm-store/` | pnpm 下载的软件包缓存，供两个 `node_modules` 复用 | **可以删除** | 不影响源码和业务数据，但下一次安装依赖会重新下载，速度更慢且需要网络 | 执行 `pnpm install` 时自动重新创建；磁盘空间够时建议保留 |
| `artifacts/` | 页面截图、设计对比图和视频参考帧 | **按需删除** | 不影响系统运行，但会失去以前的视觉设计和验收参考 | 程序不会自动恢复；以后做界面对比可能还会用，确认无价值后再删 |
| `backend/` | Spring Boot 后端源码、测试和构建配置 | **不能整体删除** | 后端无法构建，资产、用户、权限和接口全部无法运行 | 开发、测试和生产构建都会使用，必须保留 |
| `backend/.mvn/` | Maven Wrapper 配置 | **不建议删除** | `mvnw` 可能无法自动下载和确定 Maven 版本 | 本机或构建机使用 Maven Wrapper 时会用，随源码保留 |
| `backend/data/` | 本机开发环境的 H2 数据库 | **谨慎删除** | 不影响生产 MySQL，但本机调试创建的资产和用户会丢失 | 本地后端再次启动会生成空数据库；想保留本机测试数据就不要删 |
| `backend/src/` | 后端正式源码和自动化测试 | **绝对不要删除** | 后端项目失去业务代码或测试 | 每次开发和构建都使用，必须提交 Git |
| `backend/target/` | Maven 编译结果、JAR 和测试报告缓存 | **可以删除** | 不影响源码；现有 JAR 和测试报告会消失 | 执行 `mvn package` 或 `mvn test` 自动重新生成；排查近期测试问题时可暂时保留 |
| `deploy/` | Linux systemd 备份任务配置 | **不建议删除** | 不影响本机开发，但新服务器无法按文档安装自动备份任务 | 首次部署或重新安装备份定时器时使用，必须提交 Git |
| `frontend/` | React 前端源码、构建配置和 Nginx 配置 | **不能整体删除** | Web 页面无法构建和部署 | 开发和生产构建都会使用，必须保留 |
| `frontend/src/` | 前端页面、组件、接口、类型和样式源码 | **绝对不要删除** | 登录、资产页面和打印页面等前端功能丢失 | 每次前端开发和构建都使用，必须提交 Git |
| `frontend/dist/` | Vite 生成的生产静态文件 | **可以删除** | 如果本机正直接使用该目录提供页面，页面会暂时不可用；不影响源码 | 执行 `pnpm build` 自动重建；Docker 构建会在镜像中重新生成 |
| `frontend/node_modules/` | 前端依赖及 pnpm 链接 | **可以删除** | 前端暂时无法构建或启动开发服务 | 执行 `pnpm install` 恢复；近期还要开发时保留可节省安装时间 |
| `node_modules/` | pnpm 工作区根依赖和命令链接 | **可以删除** | 工作区的构建命令可能暂时无法运行 | 执行 `pnpm install` 恢复；它与 `frontend/node_modules/` 都不是源码 |
| `output/` | 当前保存的单次正式输出，例如标签 PDF 样例 | **按需删除** | 不影响系统，只会失去已生成的样例 | 不一定能原样自动恢复；确认样例不再需要后可以删除 |
| `outputs/` | 某项任务的完整输出，包括待确认导入表、脚本和预览图 | **谨慎删除** | 不影响系统运行，但可能丢失尚未导入或需要复核的业务文件 | 程序不会自动恢复；先确认 CSV/XLSX 已处理或另有备份 |
| `scripts/` | 上线、MySQL 备份和测试数据维护脚本 | **不要删除** | 自动部署、备份和维护流程无法按文档执行 | 上线和运维会反复使用，必须提交 Git；其中重编号 SQL 只能用于指定测试数据 |
| `tmp/` | PDF 渲染、截图检查等临时缓存 | **可以删除** | 不影响源码、数据库和生产服务 | 相关工具下次运行时会重新生成；通常是最适合清理的目录 |

快速判断：

- **可以放心清理**：`.pnpm-store/`、两个 `node_modules/`、`backend/target/`、`frontend/dist/`、`tmp/`。清理后需要重新安装依赖或重新构建，近期还要开发时保留缓存会更省时间。
- **确认内容后再清理**：`artifacts/`、`output/`、`outputs/`、`backend/data/`。它们不是正式源码，但里面可能有无法自动恢复的参考材料、导入文件或本机测试数据。
- **不要删除**：`.git/`、`backend/src/`、`frontend/src/`、`deploy/`、`scripts/` 以及前后端的 Dockerfile、配置文件和依赖清单。

> 生产资产、用户、日志和设置不在上述源码目录中，而是保存在 Docker 命名卷 `asset-management_mysql_data`。删除源码中的 `backend/data/` 不会删除生产 MySQL；反过来，删除 Docker 数据卷会造成生产数据丢失。

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
