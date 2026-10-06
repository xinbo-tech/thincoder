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
| `bootstrap` | 否 | 首启引导凭据（仅零 admin 时消费——见 §5）；口令 ≥8 字符 |
| `providers[]` | 是（≥1） | `name` ∥ `baseURL`（OpenAI 兼容根） ∥ `apiKey`（可空——空则不发 Authorization 头） ∥ `models`（本 provider 上游模型名清单——对外标识 = `provider/model`） |
| `embedding` | 是 | `baseURL` ∥ `model` ∥ `apiKey`（选填——本地引擎常无鉴权） |

- 字符串值支持 `env:变量名` 前缀（加载期解析；变量缺位 ⇒ 启动失败）——真实 key 可只住环境变量。
- 更新源 = 环境变量 `NPM_CONFIG_REGISTRY`（可指内网镜像——npm 同名配置；自检与自装同源）；缺省 = npmjs（机制见 §8）。
- **预设形条目**（内建 provider 预设——`preset` = 预设名）：清单 = `src/ops/presets.mjs`（起步 20 家 OpenAI 兼容上游——
  快照口径 = CLI 预设表的只读子集，核表更新后由后续版本手工同步）。
- `{ "preset": "deepseek", "apiKey": "env:DEEPSEEK_API_KEY" }` ⇒ `name` 缺省 = 预设名、`baseURL`/`models` 缺省取预设值
  （`models` = `[预设默认模型]`）；条目自带 `name`/`baseURL`/`models` 覆盖预设值（显式在场者胜）。
- 未知预设名 ⇒ 拒启（报错列可用名——fail-closed）。
- 对外模型标识 = `provider/model`（首斜杠切分：首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；
  两段非空；裸名不解析；同名模型跨 provider 并存且各自可达）；`/v1/models` = 带前缀名清单。
- 启动校验（fail-closed）：缺 `host` ∥ `providers` 空 ∥ provider `name` 缺/空 ∥ `name` 含 `/` ∥ `name` 重名（providers 间） ∥ 同 provider 内模型重名 ∥ `baseURL` 非 http(s) ∥ 未知预设名 ⇒
  拒启（非零退出 + 明确报错）。
- key 轮换 = 改配置 + 重启（分钟级；配置不热载）。

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
5. 首启日志确认（`converge:` 收敛行 + env 建首个 admin）
6. 验收同 npm 路（端口 `8787`）
7. 升级/回滚 = 改 `TC_SERVER_VERSION` + `docker compose up -d`（见 §8）

## 4. 启动 ∥ 停机 ∥ 日志

- 启动：`thincoder-server --config <配置档>`（npm 路）∥ compose（容器路——先跑壳收敛，日志出 `converge:` 行）；
  就绪后 stdout 一行 JSON（`ready` 行含 `version` = 实际安装版本——升级核对 = 重起读该行）。
- 停机：SIGINT/SIGTERM ⇒ 优雅收尾（停收新连 ∥ 关库）。
- 日志：单行 JSON 到 stdout（逐请求一行 + 启动/引导/错误事件）；
  裸机 = journald（`journalctl -u thincoder-server -f`）∥ 容器 = `docker logs`。

## 5. 首启引导（幂等）

- 库中零 `admin` 且 `bootstrap` 配置在场 ⇒ 建首个 admin（配置口令即初始密码；建后可从配置撤除）。
- 零 `admin` 且未配置 ⇒ 启动告警（服务器照常起——CLI `member add --role admin` 可补建）。
- 非零 `admin` ⇒ 引导整体跳过（不重建 ∥ 不改密）。

## 6. 控制台

- 浏览器打开 `http://<host>:<port>/`；三视图（哈希路由）：`#/login` 登录 ∥ `#/me` 我的
  （key 清单 ∥ 签发/轮换明文一次性区 ∥ 本人用量 ∥ 改密）∥ `#/admin` 管理（成员表含各成员 key 清单与吊销 ∥
  建成员初始密码一次性回显 ∥ 设额度 ∥ 重置密码 ∥ 全队用量过滤）。
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

## 9. 备份

- SQLite 单文件（`data/gateway.db`——WAL）：停写窗 `cp` ∥ SQLite `.backup` 口径——手工执行（最小面）。
- 容器路 = 备份卷内文件（`./data`）。

## 10. 边界（不含）

- TLS 终结（内网 HTTP；HTTPS 如需 = 前置反代）∥ 日志落盘/轮转（归 journald ∥ docker logs）∥
  配置热载 ∥ 自动备份/巡检 ∥ Windows 守护面（部署时定写法）。
- 更新面不做：渠道（beta/canary）∥ 灰度分批 ∥ 多版本并存（A/B 双装/秒切）∥ 进程内热载 ∥
  认证型 registry 的自检凭据（自检不带 npm 凭据——内网镜像要求认证时自检静默不更新）。
