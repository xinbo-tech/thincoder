# Thincoder Server · 运维面（ops/OPS）

> 板块 = server ∥ 本档 = ops 域（配置 ∥ 首启引导 ∥ 运维 CLI ∥ 部署面 ∥ 启动/停机/日志）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 本域回指 = `PROJECT.md` §7（非功能·仅内网 ∥ AC-7⑦ 引导幂等——机制 = 本档 §2）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构 + 部署面薄面）。

## 1. 配置面（`config.json`）

```json
{
  "host": "192.168.1.10",
  "port": 8787,
  "db": "data/gateway.db",
  "bootstrap": { "username": "admin", "password": "env:TC_SERVER_ADMIN_PASSWORD" },
  "providers": [
    {
      "name": "bailian",
      "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "env:DASHSCOPE_API_KEY",
      "models": ["qwen3.5-plus", "qwen3.7-max"]
    }
  ],
  "embedding": { "baseURL": "http://10.0.0.5:11434/v1", "model": "bge-m3" }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `host` | 是 | 内网接口地址（如 `192.168.x.x` ∥ `10.x.x.x`）；填 `0.0.0.0` 时启动警告（仅单接口机可接受） |
| `port` | 否 | 缺省 `8787` |
| `db` | 否 | SQLite 库路径（相对 = 本配置档所在目录）；缺省 `data/gateway.db` |
| `bootstrap` | 否 | 首启引导凭据（`username` ∥ `password`——支持 `env:`）；仅零 admin 时消费（§2——幂等） |
| `providers[]` | 是（≥1） | `name` ∥ `baseURL`（OpenAI 兼容根） ∥ `apiKey`（可空——空则不发 Authorization 头） ∥ `models`（本 provider 上游模型名清单——对外标识 = `provider/model`） |
| `embedding` | 是 | `baseURL` ∥ `model` ∥ `apiKey`（选填——本地引擎常无鉴权） |

- 字符串值支持 `env:变量名` 前缀（加载期解析；变量缺位 ⇒ 启动失败）——真实 key 可只住环境变量。
- **启动校验（fail-closed）**：`host` 缺失 ∥ `providers` 空 ∥ provider `name` 缺/空 ∥ `name` 含 `/` ∥ `name` 重名（providers 间） ∥ **同 provider 内**模型重名 ∥ `baseURL` 非 http(s) ⇒ 非零退出 + 明确报错；`bootstrap` 在场时 `password` ≥8 字符（否则启动失败）。
- provider `name` 校验缘由（对外标识 = `provider/model` 首斜杠切分）：`name` 缺/空 ∥ 含 `/` ⇒ 前缀形不可解析（清单列示而派发 404）；`name` 重名 ⇒ 派发歧义。
- 对外模型标识 = `provider/model`（**首斜杠切分**——首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；两段非空；裸名不解析；**同名模型跨 provider 并存且各自可达**）；`/v1/models` = 带前缀名清单。
- 模板 = `thincoder-server/config.example.json`（已落盘）；真档 = `thincoder-server/config.json`（不入 git）。
- provider key 轮换 = 改配置 + 重启（分钟级；「最小面」口径——不做动态热载，见 §10 边界）。

## 2. 首启引导（幂等）

- 启动时库中零 `admin` 且 `bootstrap` 配置在场 ⇒ 建首个 admin（配置口令即初始密码；建后可从配置撤除——已存在不再读取）。
- 零 admin 且未配置 ⇒ 启动告警（服务器照常起——CLI `member add --role admin` 可补建）。
- 非零 admin ⇒ 引导整体跳过（不重建 ∥ 不改密——幂等口径）——KD-SV-15（§8）。

## 3. 运维 CLI（服务器本机运行）

```text
node src/ops/cli.mjs --config <配置档> <命令>
  member add <name> [--username <u>] [--role admin|user] [--password <pw>]   # 建成员（缺省 username = name ∥ user；无 --password ⇒ 生成临时密码打印一次）
  member list                           # 成员 + 角色 + 额度 + 本月已用
  member quota <name> <N|none>          # 设额度（none = 不限）
  member passwd <name> [--password <pw>]  # 重置密码（本机兜底；无 --password ⇒ 生成打印一次）
  key issue <member>                    # 签发——全文只打印一次（+ key id）
  key revoke <id|hint>                  # 吊销（立即生效）
  key list [--member <m>]               # 提示形清单（无明文）
```

- 落点 = `thincoder-server/src/ops/cli.mjs`（已落盘）；直开库（不经 HTTP）——服务器本机兜底。
- 与页面（`accounts/ACCOUNTS.md` §3 端点表）同库同语义（同一散列/吊销/轮转/重置口径）——页面 = 常态管理面，CLI = 本机通道。

## 4. 启动/停机与日志

- 启动 = `thincoder-server/bin/thincoder-server.mjs`（已落盘）：argv（`--config`）→ 配置加载/校验 → 首启引导 → 开库/迁移（`store/STORE.md` §3）→ `node:http` 监听 → 就绪日志。
- 停机 = SIGINT/SIGTERM ⇒ 优雅收尾（停收新连 ∥ 关闭库）。
- 日志 = `thincoder-server/src/ops/log.mjs`（已落盘）：单行 JSON 到 stdout（逐请求一行 + 启动/引导/错误事件）；采集/落盘 = 部署面（§5——裸机 journald ∥ 容器 docker logs）。

## 5. 部署面（薄面——分发两路：npm 发布 ∥ Docker 镜像；守护两路：systemd ∥ 容器 restart）

### 5.1 分发（两路）

- **npm 路（包体就绪——本批只做包体；发布动作 = 发布面轮）**：`thincoder-server/package.json` 转可发布形——撤 `private` ∥ 包名 = `@thincoder/server`（拟——发布轮验 registry 占用/scope 权限；更优命名可上抛） ∥ `bin` = `thincoder-server` ∥ `engines` node>=24 ∥ `prepublishOnly` 门禁（全树 `node --check` + 批内件冒烟——发布轮可收紧）。
- npm 收面：`files` 白名单 = bin ∥ src ∥ public ∥ config.example.json ∥ README.md；装机 = `npm i -g @thincoder/server`；`RELEASE.md` 扩展 = 发布面轮（不在本批）。
- **Docker 路**：`thincoder-server/Dockerfile`（已落盘）——`node:24-slim`（alpine 并列可换；零依赖 ⇒ 无 install 步） ∥ WORKDIR `/app` ∥ COPY 服务树 ∥ EXPOSE `8787` ∥ `VOLUME /app/data` ∥ ENTRYPOINT `node bin/thincoder-server.mjs --config /app/config.json`。
- Docker 配套：`thincoder-server/.dockerignore`（排除 `config.json` ∥ `data/` ∥ `docs/` ∥ `.git`）+ `thincoder-server/docker-compose.yml`（样例）：

```yaml
services:
  server:
    image: <registry>/thincoder-server:<tag>   # 待定占位——部署时确认
    restart: unless-stopped
    ports:
      - "8787:8787"
    volumes:
      - ./config.json:/app/config.json:ro
      - ./data:/app/data
    env_file: .env
```

- **待定占位**：镜像 registry ∥ 镜像名 ∥ 首版号（部署时确认）。

### 5.2 守护（两路并列）

- **裸机路 = systemd**（npm i -g 装机）：模板 = `thincoder-server/deploy/thincoder-server.service`（已落盘）——`Restart=always` ∥ 开机自启（`enable`）；`ExecStart` 指 `thincoder-server --config <配置档>`（npm 全局垫片；或 node 直指仓内入口——模板注释二选一）。
- 裸机日志 = stdout 单行 JSON 由 journald 收（`journalctl -u thincoder-server`）；安放 = 拷 unit 到 `/etc/systemd/system/` → `daemon-reload` → `systemctl enable --now thincoder-server`。
- **容器路 = restart 策略**（无 systemd 依赖）：`restart: unless-stopped`；日志 = `docker logs`。

### 5.3 配置（两路同）

- `config.json`（机本地 ∥ 不入 git）+ env（provider keys ∥ `bootstrap` 口令——首启建 admin 后可撤）；裸机路 env 落点 = systemd `EnvironmentFile`（缺省 `/etc/thincoder-server.env`——unit 模板在册）；容器路 = compose 卷 + `env_file: .env`。

### 5.4 升级/回滚

- npm 路 = 装新版 + `systemctl restart`（分钟级；与「配置不热载」同口径）；回滚 = 装回旧版号 + restart。
- 容器路 = `docker compose pull` + `up -d`；回滚 = 旧 tag + `up -d`。

### 5.5 备份

- SQLite 单文件（`data/gateway.db`——WAL）：停写窗 `cp` ∥ SQLite `.backup` 口径——手工执行（最小面；不建自动备份面）；容器路 = 备份卷内文件。

### 5.6 TLS 边界

- 内网 HTTP；HTTPS 如需 = 前置反代（不集成进 server——不做项在册）。

### 5.7 首部署清单（两版）

- **npm 路**（6 步）：① 装 Node ≥24 → ② `npm i -g @thincoder/server` → ③ `config.example.json` ⇒ `config.json` + env → ④ 首启（env 建首个 admin）→ ⑤ unit 安放 + `enable --now` → ⑥ 验收 = 携团队 key `curl /v1/models` ⇒ 200（key = 首启 admin 登录后自助签发）。
- **Docker 路**（7 步）：① 装 Docker → ② `docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = `thincoder-server/`；registry ∥ 镜像名 ∥ 首版号 = 待定占位——§5.1）→ ③ 备 `config.json` + `data/` + `.env` → ④ `docker compose up -d` → ⑤ 首启日志确认（env 建首个 admin）→ ⑥ 验收同 npm 路（端口 `8787`）→ ⑦ 升级/回滚 = 换 tag + `up -d`。

### 5.8 目标机/OS

- 内网 Linux 服务器（具体机与 OS 以部署时确认；若 Windows ⇒ 裸机守护面换写法——部署时定）。

## 6. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/bin/thincoder-server.mjs`（已落盘） | **113**（实读 2026-10-06——设计估 ≈50） | argv ∥ 配置加载 ∥ 首启引导 ∥ 启动 ∥ 停机 |
| `thincoder-server/src/ops/config.mjs`（已落盘） | **154**（实读 2026-10-06——设计估 ≈150） | 读档 ∥ 校验（fail-closed） ∥ `env:` 解析 ∥ 缺省值 |
| `thincoder-server/src/ops/log.mjs`（已落盘） | **35**（实读 2026-10-06——设计估 ≈35） | 单行 JSON 日志（stdout） |
| `thincoder-server/src/ops/cli.mjs`（已落盘） | **179**（实读 2026-10-06——设计估 ≈240） | 运维 CLI 七命令（含密码面） |
| `thincoder-server/config.example.json`（已落盘） | **28**（实读 2026-10-06——设计估 ≈40） | 配置模板（无真 key） |
| `thincoder-server/deploy/thincoder-server.service`（已落盘） | **32**（实读 2026-10-06——设计估 ≈40） | systemd unit 模板（裸机路——Restart=always ∥ 开机自启 ∥ journald） |
| `thincoder-server/Dockerfile`（已落盘） | **16**（实读 2026-10-06——设计估 ≈30） | 镜像构建（node:24-slim ∥ 零 install ∥ EXPOSE 8787 ∥ VOLUME /app/data） |
| `thincoder-server/.dockerignore`（已落盘） | **7**（实读 2026-10-06——设计估 ≈10） | 构建上下文排除（config.json ∥ data ∥ docs ∥ .git） |
| `thincoder-server/docker-compose.yml`（已落盘） | **15**（实读 2026-10-06——设计估 ≈30） | 容器样例（端口 ∥ 卷 ∥ env_file ∥ restart: unless-stopped） |
| `thincoder-server/README.md`（已落盘） | **119**（实读 2026-10-06——设计估 ≈140） | 运维面：安装（npm ∥ Docker） ∥ 部署（systemd ∥ compose） ∥ 启动（首启引导） ∥ CLI 用法 ∥ 控制台 |
| **小计** | **≈765 ⇒ 698** | —— |

## 7. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 仅内网 | `host` 必填（缺失 ⇒ 拒启——fail-closed）；`0.0.0.0` ⇒ 启动警告 | 批内件 |
| AC-8（功能点 8——分发与部署） | `npm pack --dry-run` 通过（`files` 白名单齐 ∥ 零 install 步）∥ `docker build` 成功 + compose 起停通 ∥ systemd unit 安放可启（`systemd-analyze verify` ∥ `enable --now` 后 `is-active`——unit 模板 = §5.2） | 收口轮（真机；发布动作 = 发布面轮） |

## 8. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-15 | **首启 admin 引导 = config `bootstrap` + 幂等**：仅零 admin 时依配置创建（`username` ∥ `password`——支持 `env:`）；建后配置可撤；零 admin 且未配置 ⇒ 启动告警；非零 ⇒ 跳过 | 「首启引导（env 或本机 CLI）」的需求形；幂等 = 只建不改（不覆盖已改口令）∥ 配置口令 ⇒ 操作者已知首密、零额外步骤 | 固定缺省口令（admin/admin123——裸奔）· 仅 CLI 建首管（多一步壳访问）· 每启对账改写（会把 admin 已改的口令回滚——非幂等） |

## 9. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| B7 | 边界 | 零 admin 库 + `bootstrap` 配置在场，连续两次启动 | 第一次建 admin；第二次跳过（不重建 ∥ 不改密——幂等） |

## 10. 本域边界（不做的面）

- 日志落盘/轮转（裸机 = journald ∥ 容器 = docker logs——采集归各平台） ∥ 动态热载配置 ∥ TLS 终结（前置反代） ∥ 自动备份/巡检面（备份 = 手工最小面——§5） ∥ Windows 守护面（部署时定写法）——均不做。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——ops 域：配置面（bootstrap 段） ∥ 首启引导 ∥ 运维 CLI（含密码面） ∥ 启动/停机/日志；KD-SV-15；用例 B7。
- 2026-10-06：部署面薄面落（用户 08:21→08:24 令）——§5：分发两路 = npm 发布（包体就绪） ∥ Docker 镜像；守护两路 = systemd ∥ 容器 restart；升级/回滚 ∥ 备份（手工） ∥ 两版首部署清单；部署档组 = `deploy/` ∥ `Dockerfile` ∥ `.dockerignore` ∥ `docker-compose.yml`。
- 2026-10-06：fix 轮（评审轮次 1 #2）——§7 补 AC-8（分发与部署）判据行（pack dry-run ∥ docker build + compose 起停 ∥ unit 安放可启；载体 = 收口轮）。
- 2026-10-06：实施后回填轮（fix）——§3 `key issue` 行撤 `--label`（本阶段不提供）；§5.3 补裸机路 env 落点（`EnvironmentFile`）；§5.7 Docker 路补 `docker build` 步（6 ⇒ 7 步）；§6 行数按实读回填（小计 ≈765 ⇒ 681）。
- 2026-10-06：模型标识口径变更（用户 10:27–10:28）——§1 校验规则改（重名判据 = 同 provider 内 ⇒ 拒启）∥ 补对外标识句（`provider/model` 斜杠形）。
- 2026-10-06：小收尾轮（fix）——§1 启动校验补 provider `name` 判据（缺/空 ∥ 含 `/` ∥ 重名（providers 间）⇒ 拒启——与模型重名判据并列；缘由行随补）∥ §6 README 行数再收正（117 ⇒ 119；小计 ≈765 ⇒ 683）。
