# Thincoder Server（内网 token 网关 + 控制台）

单进程 Node 服务（纯 ESM——**零第三方运行期依赖**）：OpenAI 兼容入口（chat ∥ embeddings ∥ models）——
网关代持全部真实 provider key，逐请求记账（SQLite）、按成员限额度；另配登录制控制台（vanilla 静态前端，
零框架 ∥ 零构建 ∥ 零外部资源）与本机运维 CLI。

- 运行要求：Node ≥ 24（npm 路）∥ Docker（容器路）
- 存储：SQLite 单文件（缺省 `data/gateway.db`，WAL）——库文件为运行期生成，不入 git
- 配置：机本地 `config.json`（不入 git）——模板见 `config.example.json`

## 1. 安装（分发两路——版本身份 = npm 包）

- **npm 路**（包体就绪——发布动作 = 发布面轮）：`npm i -g @thincoder/server` —— 零依赖 ⇒ 装机无 install 步；
  包内容 = `bin/` ∥ `src/` ∥ `public/` ∥ `config.example.json` ∥ `README.md`（`deploy/` 为仓内部署面，不入包）。
  - 前缀式装机（自升前提）：`NPM_CONFIG_PREFIX` 指**服务账号可写目录**（建议与配置/数据同根——见 §3）；装机与自升同前缀、免 sudo 重写。
- **Docker 路**：`docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = 本目录）；镜像 = **壳**
  （`node:24-slim` + 引导层——App 代码由 npm 取装，镜像不自带版本身份；构建期以上下文包体预装兜底，离线可构建）；
  运行样例 = `docker-compose.yml`——版本由 `TC_SERVER_VERSION` 收敛（见 §8）。

## 2. 配置（`config.json`）

```json
{
  "host": "192.168.1.10",
  "port": 8787,
  "db": "data/gateway.db",
  "autoUpdate": "notify",
  "trustProxy": false,
  "usageRetentionDays": 90,
  "bootstrap": { "username": "admin", "password": "env:TC_SERVER_ADMIN_PASSWORD" },
  "providers": [
    { "name": "bailian", "baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "env:DASHSCOPE_API_KEY", "models": ["qwen3.5-plus", "qwen3.7-max"] }
  ],
  "embedding": { "baseURL": "http://10.0.0.5:11434/v1", "model": "bge-m3" }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `host` | 是 | 内网接口地址；填 `0.0.0.0` 时启动警告（仅单接口机可接受） |
| `port` | 否 | 缺省 `8787` |
| `db` | 否 | SQLite 库路径（相对 = 配置档所在目录）；缺省 `data/gateway.db` |
| `autoUpdate` | 否 | 更新档位：`false`（关——零检查） ∥ `"notify"`（检查 + 日志） ∥ `"auto"`（检查 + 自装）；缺省 `"notify"`；非法值 ⇒ 拒启（见 §8） |
| `trustProxy` | 否 | 反代场景客户端 IP 口径：`false`（缺省——IP = 连接对端地址） ∥ `true`（读 `X-Real-IP` 头）；前提 = 服务端口仅反代可达（反代须 `set` 形覆盖客户端伪造——见 §11）；登录防爆破 IP 维消费 |
| `usageRetentionDays` | 否 | 用量保留窗（天）：正整数 ∥ `null`（不限——保留全量）；缺省 `90`；非正整数/非法值 ⇒ 拒启（清理时机 = 启动一次 + 每 24h） |
| `bootstrap` | 否 | 首启引导凭据（仅零 admin 时消费——见 §5）；口令 ≥8 字符 |
| `providers[]` | 否 | **首启种子**（一次性导入——此后控制台管理：`#/admin/providers`）。`name` ∥ `baseURL`（OpenAI 兼容根） ∥ `apiKey`（可空——空则不发 Authorization 头；支持 `env:` 引用） ∥ `models`（开放清单——对外标识 = `provider/model`）；预设形（`preset`）可省字段。零 provider = 允许态（服务照常起 + 警告） |
| `embedding` | 是 | `baseURL` ∥ `model` ∥ `apiKey`（选填——本地引擎常无鉴权） |

- 字符串值支持 `env:变量名` 前缀（加载期解析；变量缺位 ⇒ 启动失败）——真实 key 可只住环境变量。例外 = `providers[].apiKey`：载入不解析（引用保形），注册表构建期解析（缺位 ⇒ 启动拒启 ∥ 保存 400）。
- 更新源 = 环境变量 `NPM_CONFIG_REGISTRY`（可指内网镜像——npm 同名配置；自检与自装同源）；缺省 = npmjs（机制见 §8）。
- **预设形条目**（内建 provider 预设——`preset` = 预设名）：清单 = `src/ops/presets.mjs`（起步 21 家 OpenAI 兼容上游——
  快照口径 = CLI 预设表的只读子集，核表更新后由后续版本手工同步）。
- `{ "preset": "deepseek", "apiKey": "env:DEEPSEEK_API_KEY" }` ⇒ `name` 缺省 = 预设名、`baseURL` 缺省取预设值；
  条目自带 `name`/`baseURL`/`models` 覆盖预设值（显式在场者胜）。
- `models` 无预设缺省（2026-10-09 清除批：预设表零 `model` 键）——条目未自备 `models` ⇒ 空清单，
  经控制台「模型发现」（详情弹窗「刷新候选」）勾选后保存。
- 未知预设名 ⇒ 拒启（报错列可用名——fail-closed）。
- 预设双消费面：① 配置种子（预设形条目——上条）；② 控制台「从预设快速添加」（`#/admin/providers`——拉预设表 ⇒ 预填 ⇒ 补 `apiKey` ⇒ 保存；写入仍走全字段校验）。
- 对外模型标识 = `provider/model`（首斜杠切分：首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；
  两段非空；裸名不解析；同名模型跨 provider 并存且各自可达）；`/v1/models` = 带前缀名清单。
- 启动校验（fail-closed）：缺 `host` ∥ provider `name` 缺/空 ∥ `name` 含 `/` ∥ `name` 重名（provider 间） ∥ 同 provider 内模型重名 ∥ `baseURL` 非 http(s) ∥ 未知预设名 ⇒
  拒启（非零退出 + 明确报错）。**零 provider = 允许态**（服务照常起 + 警告——控制台为配置路径）。
- provider 变更（增/删/改 ∥ 含密钥）= 控制台 `#/admin/providers` 保存即热生效（零重启；在途请求照常收尾）；`config.json` 文件本身不热载（改动仍须重启）。

## 3. 首部署清单（两版）

### npm 路（6 步）

1. 装 Node ≥ 24
2. 以服务账号**前缀式装机**（`NPM_CONFIG_PREFIX` 指可写前缀——建议 `/opt/thincoder-server/.npm-global`，与配置/数据同根；自升前提）：
   `NPM_CONFIG_PREFIX=/opt/thincoder-server/.npm-global npm i -g @thincoder/server`
3. `config.example.json` ⇒ `config.json` + 备 env（provider keys ∥ bootstrap 口令；裸机路落 `/etc/thincoder-server.env`——unit `EnvironmentFile`）
4. 首启（env 建首个 admin）
5. unit 安放（自仓库取 `deploy/thincoder-server.service` → `/etc/systemd/system/`；unit 内 `NPM_CONFIG_PREFIX`/`ExecStart` 按实际前缀调整）
   + `systemctl enable --now thincoder-server`
6. 验收 = 携团队 key `curl /v1/models` ⇒ 200（key = 首启 admin 登录控制台后自助签发）

### Docker 路（7 步）

1. 装 Docker
2. `docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = `thincoder-server/`；壳 + 构建期预装——离线可构建）
3. 备 `config.json` + `data/`（`chown 1000:1000`——容器内 node 账号）+ `.env`（`TC_SERVER_VERSION` 可选——见 §8）
4. `docker compose up -d`
5. 首启日志确认（`converge:` 收敛行 + env 建首个 admin；`docker compose ps` 可见 `(healthy)`——见 §12）
6. 验收同 npm 路（端口 `8787`）
7. 升级/回滚 = 改 `TC_SERVER_VERSION` + `docker compose up -d`（见 §8）

## 4. 启动 ∥ 停机 ∥ 日志

- 启动：`thincoder-server --config <配置档>`（npm 路）∥ compose（容器路——先跑壳收敛，日志出 `converge:` 行）；
  就绪后 stdout 一行 JSON（`ready` 行含 `version` = 实际安装版本——升级核对 = 重起读该行）。
- 停机：SIGINT/SIGTERM ⇒ 优雅收尾（停收新连 ∥ 清周期定时器（更新循环 ∥ 保留清理同法）∥ 关库）。
- 日志：单行 JSON 到 stdout（逐请求一行 + 启动/引导/错误事件）；
  裸机 = journald（`journalctl -u thincoder-server -f`）∥ 容器 = `docker logs`。

## 5. 首启引导（幂等）

- 库中零 `admin` 且 `bootstrap` 配置在场 ⇒ 建首个 admin（配置口令即初始密码；建后可从配置撤除）。
- 零 `admin` 且未配置 ⇒ 启动告警（服务器照常起——CLI `member add --role admin` 可补建）。
- 非零 `admin` ⇒ 引导整体跳过（不重建 ∥ 不改密）。

## 6. 控制台

- 浏览器打开 `http://<host>:<port>/`；侧栏分组导航（哈希路由）：我的 = `#/me/keys`（key 清单——含最后使用/近 30 天用量；签发/轮换明文一次性区）∥
  `#/me/usage`（本月额度/已用 + 用量明细 + 端点过滤 + 向量服务提示条）∥ `#/me/account`（基本信息 ∥ 改密）；管理（admin）= `#/admin/overview`（落地页：
  今日请求/token ∥ 成员数 ∥ 健康 ∥ 更新提示 ∥ 快捷入口）∥ `#/admin/members`（成员表含各成员 key 清单与吊销 ∥ 建成员初始密码一次性回显 ∥ 设额度 ∥
  重置密码）∥ `#/admin/providers`（provider 增删改 ∥ 模型发现/勾选开放 ∥ 测试 ∥ 预设快速添加）∥ `#/admin/usage`（用量看板：过滤 + 趋势/聚合/排行 + CSV 导出）∥
  `#/admin/audit`（审计事件：类型/成员/时段过滤）∥ `#/admin/system`（版本与更新 ∥ 成员接入卡 ∥ 向量服务卡（地址/模型/探活/试跑）∥ 服务健康——数据 = `/api/system`）。
- 侧栏底部 meta 槽：服务器版本 + 健康状态灯（30s 轮询 `GET /healthz`——绿 ∥ 黄（DB 异常）∥ 红（不可达）；全角色）；更新提示在 `#/admin/system`（可动作方 = admin）。
- 旧链重定向：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview`；`#/` 与未知 hash ⇒ 角色默认页（admin ⇒ 总览 ∥ user ⇒ 我的 key）。
- provider 保存即热生效（零重启）；密钥列表回显掩码（明文永不回显）。
- 界面多语言：中文 ∥ English——自动检测浏览器语言（缺省中文）；侧栏底部与登录卡可随时切换（记忆存浏览器本地）；错误提示按错误码本地化。
- 判权全在后端（会话 cookie + 角色）：`user` 直打管理端点 ⇒ 403——页面显隐不是判据。

## 7. 运维 CLI（服务器本机；直开库——不经 HTTP）

```text
node src/ops/cli.mjs --config <配置档> <命令>
  member add <name> [--username <u>] [--role admin|user] [--password <pw>]   # 建成员（无 --password ⇒ 生成临时密码打印一次）
  member list                           # 成员 + 角色 + 额度 + 本月已用
  member quota <name> <N|none>          # 设额度（none = 不限）
  member passwd <name> [--password <pw>]  # 重置密码（本机兜底；无 --password ⇒ 生成打印一次）
  key issue <member>                    # 签发——全文只打印一次（+ key id）
  key revoke <id|hint>                  # 吊销（立即生效）
  key list [--member <m>]               # 提示形清单（无明文）
```

与页面同库同语义（同一散列/吊销/轮转/重置口径）——页面 = 常态管理面，CLI = 本机通道。

## 8. 更新 ∥ 升级 ∥ 回滚（两路统一：版本身份 = npm 包；升级 = 装新版 + 重启）

- **更新档位**（`config.json` 的 `autoUpdate`）：`false` = 零检查（离线/审计）∥ `"notify"`（缺省）= 每 6h 自检 +
  有新版本记日志 `update_available`（不自装）∥ `"auto"` = 自检 + 自装（免值守——`"auto"` 为 opt-in）；
  更新源 = `NPM_CONFIG_REGISTRY`（自检与自装同源）；档位机制全文 = 设计 `ops/OPS.md` §5.4。
- **自升**（`"auto"`）：装 `@thincoder/server@<新版>` ⇒ 复读校验 ⇒ 优雅停机（日志 `shutdown` `signal:"self-update"`）
  ⇒ 守护重起拾新版；装版失败/超时 ⇒ 旧版照常运行（日志 `update_install_failed`）。
- **npm 路手工**：升 = `npm i -g @thincoder/server@<新版>`（前缀式——§2/§3）+ `systemctl restart thincoder-server`；
  回滚 = 装回旧版号 + restart。注意：`"auto"` 档回滚会被下轮自检再自装——长期停留旧版 ⇒ 改 `false`/`"notify"`。
- **容器路**：升 = 改 `TC_SERVER_VERSION`（或 `latest`）+ `docker compose up -d`（重跑壳收敛——`converge: version=…` 行可见）；
  回滚 = 钉回旧版号 + `up -d`（离线可指镜像预装版 = 构建时树版本）。钉死版本号时自装自动抑制（生效 = notify——升级 = 改钉值）。
- 共同注意：升级不动数据（库文件零触）；库迁移只进不退（回滚前建议先备份——§9）；半装窗内遇停机 ⇒ 恢复 = 重装（命令见上）。

## 9. 备份与恢复

- 工具 = `deploy/backup.mjs`（**在线一致快照**——`node:sqlite` 备份 API：WAL 安全 ∥ 免停写窗 ∥ 与运行实例并存；
  源库只读开（零触）；node 自带 ⇒ 零外部工具依赖）。`deploy/` 档组不入 npm 包 ⇒ **自仓库取脚本**。
  - 裸机路：`node deploy/backup.mjs --config <配置档>` ⇒ 产物 `<配置档目录>/backups/gateway-<时间戳>.db`
    （`--out <目录>` 指定落点；同一秒重跑拒写退出 1——不覆盖既有快照）。
  - 容器路：`docker compose exec server node /app/deploy/backup.mjs --config /app/config.json --out /app/data/backups`
    （镜像含 `deploy/`；产物落卷）。
  - 回退句：若本机 `backup()` 不可用/核验不过 ⇒ 回退 = **停写窗快照**（停服 ⇒ 复制库文件 + 清伴档 ⇒ 起服）。
  - 权限：快照 = 库全量（含 provider 密钥与口令散列）——备份目录限服务账号可读（如 `chmod 700 backups`）。
- 定时器样例（systemd——裸机路；`OnCalendar=daily` ∥ `Persistent=true`）：

  `/etc/systemd/system/thincoder-server-backup.service`：

  ```ini
  [Unit]
  Description=Thincoder Server 备份（在线快照）
  [Service]
  Type=oneshot
  ExecStart=/usr/bin/node /opt/thincoder-server/deploy/backup.mjs --config /opt/thincoder-server/config.json
  ```

  `/etc/systemd/system/thincoder-server-backup.timer`：

  ```ini
  [Unit]
  Description=每日备份 Thincoder Server
  [Timer]
  OnCalendar=daily
  Persistent=true
  [Install]
  WantedBy=timers.target
  ```

  启用：`systemctl daemon-reload && systemctl enable --now thincoder-server-backup.timer`。
- **恢复步**（停服 → 替换 → 起服）：
  1. 停服：`systemctl stop thincoder-server`（容器路 = `docker compose down`）。
  2. 以快照替换库：`cp backups/gateway-<时间戳>.db data/gateway.db`。
  3. 清伴档：`rm -f data/gateway.db-wal data/gateway.db-shm`。
  4. 起服：`systemctl start thincoder-server`（容器路 = `docker compose up -d`）——`curl /healthz` 验活（见 §12）。
- 边界：轮转/保留策略自管（脚本不做）；进程内自动备份不做（备份 = 部署侧面）。

## 10. 成员接入

- **获得 key**：登录控制台 → `#/me/keys` → 签发 / 轮换（`sk-tc-…` 形；**明文仅显示一次**——请立即交付成员本人）。
- **通用参数**（四端一致）：
  - `name` = 渠道名（自取，如 `team`）∥ `baseURL` = `http://<主机>:<端口>/v1`（网关地址 + `/v1`）
  - `model` = `<provider>/<model>`（对外模型标识——首斜杠切分，如 `deepseek/deepseek-flash`；`GET /v1/models` 列全量）
  - `apiKey` = 团队 key（`sk-tc-…`）
- **四端操作路径**（均落共享 `~/.thincoder/config.json` 的 `providers[]`）：
  - CLI：TUI 内 `/model` ⇒ `Add provider…`（增/改渠道与密钥；首启向导同）
  - VS Code：聊天面板设置（⚙）⇒ 渠道（providers）卡
  - 桌面：设置 ⇒ 渠道 ⇒ 添加自定义渠道
  - 其他 OpenAI 兼容端：直接填 `baseURL` + API key（SDK/客户端皆可）
- **向量（embeddings）**：`POST /v1/embeddings`——`model` = 引擎模型名（即配置 `embedding.model`，如 `bge-m3`；用户面提示条 = 我的用量页 `#/me/usage` ∥
  管理面详情（地址/探活/试跑）= `#/admin/system` 向量卡）∥ `input` = 待嵌入文本；与 chat 同 key、同记账（用量「端点」列/过滤 = `embeddings`）。
- **冒烟**：`curl -H "Authorization: Bearer sk-tc-…" http://<主机>:<端口>/v1/models`（200 = 清单）。

## 11. 反代与 TLS（nginx 样例）

内网 HTTP 可直接用；HTTPS/统一入口 = **前置反代**（服务不内置 TLS）。完整段（要素三件必须带对）：

```nginx
server {
    listen 443 ssl;
    server_name thincoder.internal;
    ssl_certificate     /etc/nginx/certs/server.crt;   # 证书位（内网自签即可）
    ssl_certificate_key /etc/nginx/certs/server.key;

    client_max_body_size 32m;        # ① ≥ 服务端请求体上限（32 MiB）——nginx 默认 1m 会先挡

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;       # ② SSE 前提
        proxy_set_header Connection "";
        proxy_buffering off;          #    SSE 免缓冲（流式逐块透传——缓冲/短超时会断流）
        proxy_read_timeout 3600s;     #    长流拉长读超时
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;   # ③ set 形覆盖客户端伪造
    }
}
```

- 置 `trustProxy: true` 后服务端按 `X-Real-IP` 计登录防爆破 IP 维。
- **前提**：`trustProxy: true` 只在**服务端口仅反代可达**时使用（同机仅听回环 ∥ 防火墙白名单）——否则直连可伪造 `X-Real-IP`。

## 12. 排障（健康检查）

- 探活：`curl -i http://127.0.0.1:8787/healthz` ⇒ 200 `{ status:"ok", version, uptime, db:"ok" }`
  （无鉴权只读——零凭据可直调；`Cache-Control: no-store`）。
- **503** `{ status:"degraded", db:"error" }` = 库探活（`SELECT 1`）失败——查库文件权限/磁盘空间/进程持有。
- 容器路：`docker compose ps` 看 `(healthy)`（镜像自带 HEALTHCHECK：interval 30s ∥ timeout 5s ∥ start-period 120s ∥ retries 3）。
- `unhealthy` = **标注态**：restart 策略只按进程退出动作——healthcheck 不触发重起（「不健康即重起」须外部工具）。
- 端口改非缺省（`port ≠ 8787`）⇒ 同步改 Dockerfile `HEALTHCHECK` 行与上面的 curl 端口。

## 13. 边界（不含）

- TLS 终结（内网 HTTP；HTTPS 如需 = 前置反代——§11）∥ 日志落盘/轮转（归 journald ∥ docker logs）∥
  `config.json` 文件热载（文件改动仍须重启；provider 数据面 = 控制台保存即热生效） ∥ 自动备份/巡检 ∥
  备份轮转/保留策略（部署方自管——§9）∥ Windows 守护面（部署时定写法）。
- 更新面不做：渠道（beta/canary）∥ 灰度分批 ∥ 多版本并存（A/B 双装/秒切）∥ 进程内热载 ∥
  认证型 registry 的自检凭据（自检不带 npm 凭据——内网镜像要求认证时自检静默不更新）。
