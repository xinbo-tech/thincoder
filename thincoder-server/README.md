# Thincoder Server（内网 token 网关 + 控制台）

单进程 Node 服务（纯 ESM——**零第三方运行期依赖**）：OpenAI 兼容入口（chat ∥ embeddings ∥ models）——
网关代持全部真实 provider key，逐请求记账（SQLite）、按成员限额度；另配登录制控制台（vanilla 静态前端，
零框架 ∥ 零构建 ∥ 零外部资源）与本机运维 CLI。

- 运行要求：Node ≥ 24（npm 路）∥ Docker（容器路）
- 存储：SQLite 单文件（缺省 `data/gateway.db`，WAL）——库文件为运行期生成，不入 git
- 配置：机本地 `config.json`（不入 git）——模板见 `config.example.json`

## 1. 安装（分发两路）

- **npm 路**（包体就绪）：`npm i -g @thincoder/server` —— 零依赖 ⇒ 装机无 install 步；
  包内容 = `bin/` ∥ `src/` ∥ `public/` ∥ `config.example.json` ∥ `README.md`。
- **Docker 路**：`docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = 本目录；
  `node:24-slim` 基座，无 install 步）；运行样例 = `docker-compose.yml`。

## 2. 配置（`config.json`）

```json
{
  "host": "192.168.1.10",
  "port": 8787,
  "db": "data/gateway.db",
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
| `bootstrap` | 否 | 首启引导凭据（仅零 admin 时消费——见 §5）；口令 ≥8 字符 |
| `providers[]` | 是（≥1） | `name` ∥ `baseURL`（OpenAI 兼容根） ∥ `apiKey`（可空——空则不发 Authorization 头） ∥ `models`（本 provider 上游模型名清单——对外标识 = `provider/model`） |
| `embedding` | 是 | `baseURL` ∥ `model` ∥ `apiKey`（选填——本地引擎常无鉴权） |

- 字符串值支持 `env:变量名` 前缀（加载期解析；变量缺位 ⇒ 启动失败）——真实 key 可只住环境变量。
- 对外模型标识 = `provider/model`（首斜杠切分：首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；
  两段非空；裸名不解析；同名模型跨 provider 并存且各自可达）；`/v1/models` = 带前缀名清单。
- 启动校验（fail-closed）：缺 `host` ∥ `providers` 空 ∥ 同 provider 内模型重名 ∥ `baseURL` 非 http(s) ⇒
  拒启（非零退出 + 明确报错）。
- key 轮换 = 改配置 + 重启（分钟级；配置不热载）。

## 3. 首部署清单（两版）

### npm 路（6 步）

1. 装 Node ≥ 24
2. `npm i -g @thincoder/server`
3. `config.example.json` ⇒ `config.json` + 备 env（provider keys ∥ bootstrap 口令；裸机路落 `/etc/thincoder-server.env`——unit `EnvironmentFile`）
4. 首启（env 建首个 admin）
5. unit 安放（自仓库取 `deploy/thincoder-server.service` → `/etc/systemd/system/`；模板内 ExecStart 二选一）
   + `systemctl enable --now thincoder-server`
6. 验收 = 携团队 key `curl /v1/models` ⇒ 200（key = 首启 admin 登录控制台后自助签发）

### Docker 路（7 步）

1. 装 Docker
2. `docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = `thincoder-server/`）
3. 备 `config.json` + `data/` + `.env`
4. `docker compose up -d`
5. 首启日志确认（env 建首个 admin）
6. 验收同 npm 路（端口 `8787`）
7. 升级/回滚 = 换 tag + `docker compose up -d`

## 4. 启动 ∥ 停机 ∥ 日志

- 启动：`thincoder-server --config <配置档>`（npm 路）∥ compose（容器路）；就绪后 stdout 一行 JSON。
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

## 8. 升级 ∥ 回滚

- npm 路 = 装新版 + `systemctl restart thincoder-server`；回滚 = 装回旧版号 + restart。
- 容器路 = `docker compose pull` + `up -d`；回滚 = 旧 tag + `up -d`。

## 9. 备份

- SQLite 单文件（`data/gateway.db`——WAL）：停写窗 `cp` ∥ SQLite `.backup` 口径——手工执行（最小面）。
- 容器路 = 备份卷内文件（`./data`）。

## 10. 边界（不含）

- TLS 终结（内网 HTTP；HTTPS 如需 = 前置反代）∥ 日志落盘/轮转（归 journald ∥ docker logs）∥
  配置热载 ∥ 自动备份/巡检 ∥ Windows 守护面（部署时定写法）。
