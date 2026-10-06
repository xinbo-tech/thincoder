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
  "autoUpdate": "notify",
  "bootstrap": { "username": "admin", "password": "env:TC_SERVER_ADMIN_PASSWORD" },
  "providers": [
    { "preset": "deepseek", "apiKey": "env:DEEPSEEK_API_KEY" },
    { "preset": "qwen", "name": "bailian", "apiKey": "env:DASHSCOPE_API_KEY", "models": ["qwen3.5-plus", "qwen3.7-max"] },
    { "name": "internal", "baseURL": "http://10.0.0.9:8000/v1", "apiKey": "", "models": ["deepseek-v3"] }
  ],
  "embedding": { "baseURL": "http://10.0.0.5:11434/v1", "model": "bge-m3" }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `host` | 是 | 内网接口地址（如 `192.168.x.x` ∥ `10.x.x.x`）；填 `0.0.0.0` 时启动警告（仅单接口机可接受） |
| `port` | 否 | 缺省 `8787` |
| `db` | 否 | SQLite 库路径（相对 = 本配置档所在目录）；缺省 `data/gateway.db` |
| `autoUpdate` | 否 | 更新档位：`false`（关——零检查） ∥ `"notify"`（检查 + 日志） ∥ `"auto"`（检查 + 自装）；缺省 `"notify"`；非法值 ⇒ 拒启（机制 = §5.4） |
| `bootstrap` | 否 | 首启引导凭据（`username` ∥ `password`——支持 `env:`）；仅零 admin 时消费（§2——幂等） |
| `providers[]` | 否 | **首启种子**（一次性导入——矩阵见下；此后控制台管理——`gateway/API.md` §2.2）。**两种条目形**：预设形（`preset` = 预设名——缺省字段展开，见下）∥ 手写形（`name` ∥ `baseURL` ∥ `models` 自备）。两形共有字段：`name`（预设形可省——缺省 = 预设名） ∥ `baseURL`（OpenAI 兼容根——预设形可省） ∥ `apiKey`（可空——空则不发 Authorization 头；支持 `env:` 引用——载入不解析，引用保形） ∥ `models`（开放清单——预设形可省；对外标识 = `provider/model`） |
| `embedding` | 是 | `baseURL` ∥ `model` ∥ `apiKey`（选填——本地引擎常无鉴权） |

- 字符串值支持 `env:变量名` 前缀（加载期解析；变量缺位 ⇒ 启动失败）——真实 key 可只住环境变量。**例外 = `providers[].apiKey`**：载入/种子期不解析（引用保形）；解析 = provider 注册表构建期——缺位 ⇒ 启动拒启 ∥ 保存 400（`gateway/API.md` §2.2）。
- 更新源 = 环境变量 `NPM_CONFIG_REGISTRY`（可指内网镜像——npm 同名配置；自检与自装同源）；缺省 `https://registry.npmjs.org`（机制 = §5.4）。
- **预设形（内建 provider 预设）**：条目给 `preset` = 预设名 ⇒ 缺省字段由预设表展开——`name` 缺省 = 预设名；`baseURL` ∥ `models` 缺省取预设值（`models` 缺省 = `[预设默认模型]`）；条目自带者**覆盖**预设值（区域端点 ∥ 自选中继清单）；`apiKey` 只住条目（预设表零密钥）。未知预设名 ⇒ 拒启（fail-closed——报错列可用名）。落点 = `thincoder-server/src/ops/presets.mjs`（已落盘 50 行——静态表 + 展开函数；§6 在册）。
- **预设双消费面**：① 配置种子（预设形条目——上条）；② 控制台「从预设快速添加」起手（同表单源——`gateway/API.md` §2.2）。
- **预设覆盖面（起步 20 家）**：抄录自 `thincoder-core/config-presets.mjs`（**只读参考面**——运行时 import 被 KD-SV-2 禁；快照日 2026-10-06）的 OpenAI 兼容子集：
  `deepseek` ∥ `kimi` ∥ `kimi-code` ∥ `glm` ∥ `glm-code` ∥ `qwen` ∥ `qwenplan` ∥ `mimo` ∥ `mimoplan` ∥ `openai` ∥
  `grok` ∥ `mistral` ∥ `volcengine` ∥ `hunyuan` ∥ `tokenhub` ∥ `huawei` ∥ `siliconflow` ∥ `openrouter` ∥ `groq` ∥ `opencode-go`。
  排除 4 家：`claude` ∥ `gemini` ∥ `opencode-go-anthropic`（`format` 面——非 OpenAI 协议）∥ `minimax`（`chatPath` 面——非标准路径；本服务转发固定 `baseURL` + `/chat/completions`）。每键只载 `{ baseURL, model }`（不消费 `thinking`/`reasoningEffort`/`maxTokens` 一族——客户端侧参数）。
- **漂移纪律（快照非活链）**：CLI 表更新后由后续批**手工同步**本表（同步笔 = 表 ∥ 本名单行 ∥ 漂移件三处同改）；漂移检 = 批内件断言（server 键集 = CLI 表 OpenAI 兼容子集 ∥ 同键 `baseURL`/`model` 逐值相等——重跑批档件即报）；取数 = 批内件只读引入核表（import ∥ 解析皆可——只读对照、非运行期依赖，KD-SV-2 运行期面零涉）。
- **种子导入矩阵（`providers[]` × 库——控制台为常态管理面）**：库空 + 段在场 ⇒ 首启导入（日志 `providers_imported`——`env:` 引用**原样保形**入库）；库空 + 段缺/空 ⇒ 允许（启动警告「零 provider——控制台添加」）；库非空 + 段在场 ⇒ **忽略 + 警告**（`providers_config_ignored`——库为准，提示清理该段）；库非空 + 段缺 ⇒ 正常。
- **幂等与边角**：导入后库非空 ⇒ 不再导；控制台删空后若段仍在 ⇒ 重启按矩阵重导（配置段 = 「初始种子」口径——不再需要请移除该段）。
- **provider 密钥形态（库面）**：明文 ∥ `env:` 引用并存（明文 = 部署机文件权限自担；引用 = 秘密只住环境）；界面回显掩码（规则 = `gateway/API.md` §2.2）；**永不入日志**。
- **条目校验单源** = `thincoder-server/src/ops/config.mjs` 导出（`validateProviderEntry` ∥ `validateProviderEntries`）——三径调用：配置载入 ∥ 启动构建/种子 ∥ 控制台保存（`gateway/API.md` §2.2）。
- **启动校验（fail-closed）**：`host` 缺失 ∥ 种子/库内 provider `name` 缺/空 ∥ `name` 含 `/` ∥ `name` 重名（providers 间） ∥ **同 provider 内**模型重名 ∥ `baseURL` 非 http(s) ∥ **未知预设名** ⇒ 非零退出 + 明确报错；`bootstrap` 在场时 `password` ≥8 字符（否则启动失败）。**零 provider = 允许态**（服务照常起 + 警告——取代原「`providers` 空 ⇒ 拒启」；控制台/种子为两条配置路径）。
- provider `name` 校验缘由（对外标识 = `provider/model` 首斜杠切分）：`name` 缺/空 ∥ 含 `/` ⇒ 前缀形不可解析（清单列示而派发 404）；`name` 重名 ⇒ 派发歧义。
- 对外模型标识 = `provider/model`（**首斜杠切分**——首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；两段非空；裸名不解析；**同名模型跨 provider 并存且各自可达**）；`/v1/models` = 带前缀名清单。
- 模板 = `thincoder-server/config.example.json`（已落盘——预设形 ∥ 手写形并存）；真档 = `thincoder-server/config.json`（部署机本地——不入 git）（机检豁免——部署机本地档）。
- provider key 轮换 = 控制台改 provider 并保存（**保存即热生效**——机制 = `gateway/API.md` §2.2；推翻原「改配置 + 重启 ∥ 配置不热载」口径——用户 2026-10-06 16:01 令）。

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

- 启动 = `thincoder-server/bin/thincoder-server.mjs`（已落盘）：argv（`--config`）→ 配置加载/校验 → 首启引导 → 开库/迁移（`store/STORE.md` §3）→ **provider 运行时引导（种子导入 ∥ 注册表构建——§1）** → `node:http` 监听 → 就绪日志（`ready` 行含 `version` 字段——§5.4(g)）。
- 停机 = SIGINT/SIGTERM ⇒ 优雅收尾（停收新连 ∥ 关闭库）。
- 日志 = `thincoder-server/src/ops/log.mjs`（已落盘）：单行 JSON 到 stdout（逐请求一行 + 启动/引导/错误事件）；采集/落盘 = 部署面（§5——裸机 journald ∥ 容器 docker logs）。

## 5. 部署面（两路统一：版本身份 = npm 包；容器 = 壳；守护两路：systemd ∥ 容器 restart）

### 5.1 分发（两路——版本身份 = npm 包 `@thincoder/server`，唯一真相）

- **版本身份 = npm 包**（两路同源）：升级 = 装 npm 新版 + 重启（§5.4）；**镜像 tag 不承担版本语义**（tag 只标壳——除 Node 基座换代外无需重建镜像）。
- **npm 路（包体就绪——发布动作 = 发布面轮）**：`thincoder-server/package.json` 转可发布形——撤 `private` ∥ 包名 = `@thincoder/server`（拟——发布轮验 registry 占用/scope 权限；更优命名可上抛） ∥ `bin` = `thincoder-server` ∥ `engines` node>=24 ∥ `prepublishOnly` 门禁（全树 `node --check` + 批内件八件——本批 +1）。
  - `files` 白名单 = bin ∥ src ∥ public ∥ config.example.json ∥ README.md（`deploy/` 档组 = 仓内部署面——不入包）。
- **npm 路装机 = 前缀式**（自升前提）：`NPM_CONFIG_PREFIX` 指**服务账号可写目录**（建议 `/opt/thincoder-server/.npm-global`——与配置/数据同根）⇒ 装机（`npm i -g @thincoder/server`）与自升（服务进程内——§5.4）同前缀、免 sudo 重写；安放后该根目录整归服务账号（`chown -R`）。
- **Docker 路 = 壳镜像**（`thincoder-server/Dockerfile`——重设计）：基座 `node:24-slim` + 引导层（`thincoder-server/deploy/docker-entrypoint.sh`（已落盘 7 行） ∥ `thincoder-server/deploy/converge.mjs`（已落盘 197 行））；**App 代码由 npm 取装**——镜像本体只含壳（不带版本身份）。
- **构建期预装 = 上下文包体**（离线可运行性）：构建上下文（= `thincoder-server/`）内 `npm pack`（同 `files` 白名单形）⇒ `npm i -g <tgz>` 装入镜像前缀（`/home/node/.npm-global`——node 账号自有）；**构建零 registry 依赖**（发布前亦可构建验证）；预装版 = 构建时树版本（离线兜底副本——非版本身份，tag 不随）。
- **运行期收敛**（entrypoint 口径——**重跑壳 = 收敛到配置版本：不留旧、不漂移**）：`TC_SERVER_VERSION`（env）三态——空 = 运行已装版本（零网络）∥ `x.y.z` = 钉（已装即用；缺则装；装不上 ⇒ 拒启）∥ `latest` = 追新（查 registry；不可达 ⇒ 回退已装 + 警告）；判定表 = §5.4（d）。
- **装位 ∥ 权限**：装位 = 镜像前缀（node 账号自有——自升可写）∥ `ENV PATH` 含 `<前缀>/bin`（入口 `exec thincoder-server` 依赖——或入口改用前缀绝对路径）；运行 = `USER node`（非 root）；`VOLUME /app/data` 保留——bind 卷须对容器内 node 账号可写（`chown 1000:1000 ./data`；uid 以镜像为准——官方基座 `useradd --uid 1000` 实读在案 2026-10-06）。
- **壳与 Node 基座**：基座 node:24 与包 `engines`（node>=24）同源；**Node 换代 = 重建镜像**（自升不动基座；触发 = 包 `engines` 变更）。
- Docker 配套随动：`thincoder-server/.dockerignore`（注释随正——排除清单不变）+ `thincoder-server/docker-compose.yml`（样例——重写）：

```yaml
services:
  server:
    image: <registry>/thincoder-server:<tag>   # 待定占位（壳 tag——不含版本语义）
    restart: unless-stopped                     # 容器路守护（无 systemd 依赖）；崩溃自愈 ∥ 开机自起
    environment:
      - TC_SERVER_VERSION=${TC_SERVER_VERSION:-}   # 钉死 = 写 x.y.z；留空（缺省空串）= 按镜像预装运行（离线）
      # - NPM_CONFIG_REGISTRY=http://<内网镜像>/          # 更新源（选填——§5.4）
    ports:
      - "8787:8787"
    volumes:
      - ./config.json:/app/config.json:ro       # 机本地配置（不入 git）
      - ./data:/app/data                        # SQLite 库（data/gateway.db）；须 chown 1000:1000（部署清单 ③）
    env_file: .env
```

- **待定占位**：镜像 registry ∥ 镜像名 ∥ tag（部署时确认——tag 不含版本语义）。

### 5.2 守护（两路并列——升级链的依赖面：进程退出 ⇒ 重起拾新版）

- **裸机路 = systemd**（npm 前缀式装机）：模板 = `thincoder-server/deploy/thincoder-server.service`（已落盘——本批随动）——`Restart=always` ∥ 开机自启（`enable`）。
- unit env（自升前提）= `NPM_CONFIG_PREFIX=<前缀>`（自升子进程同前缀——§5.1） ∥ `NPM_CONFIG_CACHE=<缓存目录>`（服务账号家目录缺位时 npm 缓存有落点）；`ExecStart=<前缀>/bin/thincoder-server --config <配置档>`（全局垫片）。
- 裸机日志 = stdout 单行 JSON 由 journald 收（`journalctl -u thincoder-server`）；安放 = 拷 unit 到 `/etc/systemd/system/` → `daemon-reload` → `systemctl enable --now thincoder-server`。
- **容器路 = restart 策略**（无 systemd 依赖）：`restart: unless-stopped`；日志 = `docker logs`；**收敛链 = 容器重起重跑壳引导**（自升成功 ⇒ 应用退出 ⇒ docker 重起 ⇒ converge 按 `TC_SERVER_VERSION` 收敛——§5.4）。
- **重起拾新版链（两路同律）**：进程退出（退出码 0 亦然）⇒ 守护重起 ⇒ 入口读到的 = 前缀内实际安装版本。

### 5.3 配置（两路同）

- `config.json`（机本地 ∥ 不入 git）+ env（provider keys ∥ `bootstrap` 口令——首启建 admin 后可撤）；裸机路 env 落点 = systemd `EnvironmentFile`（缺省 `/etc/thincoder-server.env`——unit 模板在册）；容器路 = compose 卷 + `env_file: .env`。
- **部署面 env（更新/收敛族——机制 = §5.4）**：`TC_SERVER_VERSION`（容器路——壳收敛目标）∥ `NPM_CONFIG_REGISTRY`（更新源——自检与自装同源）∥ `NPM_CONFIG_PREFIX`（裸机——装机/自升前缀）∥ `NPM_CONFIG_CACHE`（裸机——npm 缓存落点）；更新档位 = `autoUpdate`（config 字段——§1，非 env）。

### 5.4 升级/回滚（两路同法：版本回指 + 重启）

- **（a）自检**：服务内周期自检——启动即检一次 + 每 6 小时（interval = 实现常量；不设配置项）；请求 = `<registry>/@thincoder%2fserver/latest`（直连 registry——scheme 随 `NPM_CONFIG_REGISTRY`（http(s) 皆可）；`%2f` 编码形实测在案 2026-10-06；超时 5s 沿 CLI 先例）；**失败/404 静默**（与「无新版」同面——不打扰）；更新源 = `NPM_CONFIG_REGISTRY`（§5.3）。
- **（b）档位**（`autoUpdate`——§1；默认值论证）：`false` = 零检查（离线 ∥ 审计场景）；`"notify"` = 检查 + 日志（`update_available`——可见但不越权：**缺省**）；`"auto"` = 检查 + 自装（免值守——opt-in）。**抑制**：容器内 `TC_SERVER_VERSION` 为钉（非空且非 `latest`）⇒ 自装抑制（生效 = notify + 启动一条说明——升级 = 改钉值；防与壳收敛互搏）。
- **（c）自升执行器**：`npm i -g @thincoder/server@<版号>`（版号 = 检查所得具体值——防标签竞态；`--no-audit --no-fund`）子进程（超时 120s）；成功判据 = 退出码 0 ∧ 复读版本变更 ⇒ **走既有优雅停机路径**（`shutdown`——`signal: "self-update"`；停收新连 ∥ 在途至多 10s ∥ 关库）⇒ 退出 ⇒ 守护重起拾新版；
  **失败/超时恒保留旧版运行**（warn `update_install_failed`——含重装提示；下轮再检）；**注入口径**（批内件替身）：npm 命令 ∥ 前缀 ∥ 周期/超时常量走可覆盖参数 + `??` 缺省（缺省 = 生产行为不变；测试内 finally 复原）。
- **（d）容器收敛判定表**（`TC_SERVER_VERSION` × 已装——`converge.mjs`）：

| `TC_SERVER_VERSION` | 已装 | 行为 |
|---|---|---|
| 空（缺位 ∥ 空串） | 有 | 直接运行（零网络）——按镜像预装/已装运行；重建回预装版（追新请用 `latest`） |
| 空 | 无 | 拒启（未装 App 且未给 `TC_SERVER_VERSION`） |
| `x.y.z` | = x.y.z | 直接运行 |
| `x.y.z` | ≠ | 装 `x.y.z`（超时 120s）⇒ 复读校验 ⇒ 运行；装不上 ⇒ 拒启（三选修复：联网重试 ∥ 改钉值 ∥ 回滚旧值）——不漂移 |
| `latest` | 有 | 查 registry（超时 30s）：已最新 ⇒ 运行；有新 ⇒ 装 ⇒ 运行（**装失败/超时 ⇒ 回退已装 + 警告**）；不可达 ⇒ 回退已装 + 警告 |
| `latest` | 无 | 可达 ⇒ 装 ⇒ 运行（**装失败/超时 ⇒ 拒启**——无已装可跑）；不可达 ⇒ 拒启 |

- **（e）手工升级/回滚**（两路同法「版本回指 + 重启」）：
  - 裸机：升 = `npm i -g @thincoder/server@<新版>`（前缀式——§5.2）+ `systemctl restart thincoder-server`；回滚 = 装回旧版号 + restart。**注意**：`autoUpdate:"auto"` 时回滚会被下轮自检再自装——长期停留旧版 ⇒ 改 `false`/`"notify"`。
  - 容器：升 = 改 `TC_SERVER_VERSION`（或 `latest`）+ `docker compose up -d`（重跑壳收敛）；回滚 = 钉回旧版 + `up -d`（离线可指镜像预装版 = 构建时树版本）。
  - **共同注意**：升级不动数据（库文件零触）；库迁移只进不退（回滚前建议先备份——§5.5）；自升窗内遇停机 ⇒ 半装窗风险（恢复 = 重装命令在日志与文档）。
- **（f）失败安全链**（绝不 brick——fail-closed 与消息在案）：自装失败/超时 ⇒ 旧版照常运行（进程不退）∥ 半装窗 ⇒ 旧进程内存内照常服务（树受损时恢复 = 重装）；装后启动失败 ⇒ 守护重起循环（systemd 起爆窗内失败态 ∥ docker 重起——日志可见）⇒ 回滚 = 版本回指 + 重启；容器钉版不可得 ⇒ **拒启**（重起循环使其可见——不静默漂移）。
- **（g）版本可见性**：启动日志 `ready` 行含 `version`（= 前缀内实际安装版本——journald/docker logs 直读；升级核对 = 重起读 ready 行）；容器收敛行 `converge: version=<v> source=<installed|installed-now|fallback>`。**形态选型**：ready 行字段（**选定**——零新面：无新端点 ∥ 无响应头改动）；轻端点（否——新面 ∥ 健康语义膨胀）∥ 响应头（否——热路径每响应加字段）。
- **（h）前置声明（发布面接线点）**：`@thincoder/server` 发布前 ⇒ registry 查询 404 ⇒ **自检恒「无新版」（静默）**——机制就绪、接线在发布面轮（发布后自生效，无需改动）。

### 5.5 备份

- SQLite 单文件（`data/gateway.db`——WAL）：停写窗 `cp` ∥ SQLite `.backup` 口径——手工执行（最小面；不建自动备份面）；容器路 = 备份卷内文件。

### 5.6 TLS 边界

- 内网 HTTP；HTTPS 如需 = 前置反代（不集成进 server——不做项在册）。

### 5.7 首部署清单（两版）

- **npm 路**（6 步）：① 装 Node ≥24 → ② 以服务账号装机（`NPM_CONFIG_PREFIX` 指可写前缀——§5.1；自升前提）→ ③ `config.example.json` ⇒ `config.json` + env（provider keys ∥ bootstrap 口令）→ ④ 首启（env 建首个 admin）→ ⑤ unit 安放（ExecStart = 前缀垫片——§5.2）+ `enable --now` → ⑥ 验收 = 携团队 key `curl /v1/models` ⇒ 200（key = 首启 admin 登录后自助签发）。
- **Docker 路**（7 步）：① 装 Docker → ② `docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = `thincoder-server/`；壳化——构建期预装上下文包体（离线可构建）；registry ∥ 镜像名 ∥ tag = 待定占位——§5.1）。
  - 续（③–⑦）：③ 备 `config.json` + `data/`（`chown 1000:1000`——node 账号）+ `.env`（`TC_SERVER_VERSION` 可选——§5.4(d)）→ ④ `docker compose up -d` → ⑤ 首启日志确认（converge 行 + env 建首个 admin）→ ⑥ 验收同 npm 路（端口 `8787`）→ ⑦ 升级/回滚 = 改 `TC_SERVER_VERSION` + `up -d`（§5.4(e)）。

### 5.8 目标机/OS

- 内网 Linux 服务器（具体机与 OS 以部署时确认；若 Windows ⇒ 裸机守护面换写法——部署时定）。

## 6. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/bin/thincoder-server.mjs`（已落盘） | **122**（实读 2026-10-06——设计估 ≈50；本批 +9 = 版本读取 ∥ 更新循环接线 ∥ 停机清循环） | argv ∥ 配置加载 ∥ 首启引导 ∥ 启动 ∥ 停机 |
| `thincoder-server/src/ops/config.mjs`（已落盘） | **164**（实读 2026-10-06——设计估 ≈150；本批 +6 = `autoUpdate` 校验 ∥ 常量导出） | 读档 ∥ 校验（fail-closed） ∥ `env:` 解析 ∥ 缺省值 ∥ 预设展开接线 |
| `thincoder-server/src/ops/update.mjs`（已落盘） | **228**（实读 2026-10-06——设计估 ≈160；§5.4 a–c） | 更新机制 |
| `thincoder-server/src/ops/presets.mjs`（已落盘） | **50**（实读 2026-10-06——设计估 ≈45） | 预设表（`SERVER_PRESETS`——起步 20 家 `{ baseURL, model }`） ∥ 展开（`expandProviderEntry`：`name` 缺省 ∥ 覆盖 ∥ 未知预设拒启） |
| `thincoder-server/src/ops/log.mjs`（已落盘） | **35**（实读 2026-10-06——设计估 ≈35） | 单行 JSON 日志（stdout） |
| `thincoder-server/src/ops/cli.mjs`（已落盘） | **179**（实读 2026-10-06——设计估 ≈240） | 运维 CLI 七命令（含密码面） |
| `thincoder-server/config.example.json`（已落盘） | **33**（实读 2026-10-06——设计估 ≈40；本批 +1 = `autoUpdate`） | 配置模板（无真 key——预设形 ∥ 手写形并存） |
| `thincoder-server/deploy/thincoder-server.service`（已落盘） | **34**（实读 2026-10-06——设计估 ≈40；本批 +2 = 前缀 env ∥ ExecStart） | systemd unit 模板（裸机路——Restart=always ∥ 开机自启 ∥ journald） |
| `thincoder-server/deploy/docker-entrypoint.sh`（已落盘） | **7**（实读 2026-10-06——设计估 ≈12；§5.1） | 容器入口（壳） |
| `thincoder-server/deploy/converge.mjs`（已落盘） | **197**（实读 2026-10-06——设计估 ≈85；§5.4(d)） | 壳引导收敛（零 App 依赖——自足） |
| `thincoder-server/Dockerfile`（已落盘） | **28**（实读 2026-10-06——设计估 ≈30；本批 +12 = 壳化重设计） | 镜像构建（壳 + 构建期预装——§5.1） |
| `thincoder-server/.dockerignore`（已落盘） | **8**（实读 2026-10-06——设计估 ≈10；本批 +1 = 注释随正——清单不变） | 构建上下文排除（config.json ∥ data ∥ docs ∥ .git） |
| `thincoder-server/docker-compose.yml`（已落盘） | **19**（实读 2026-10-06——设计估 ≈30；本批 +4 = env ∥ 注释） | 容器样例（端口 ∥ 卷 ∥ env_file ∥ restart: unless-stopped） |
| `thincoder-server/README.md`（已落盘） | **142**（实读 2026-10-06 复测；本批 +17 = 更新章 ∥ 部署章随动） | 运维面：安装（npm ∥ Docker） ∥ 部署（systemd ∥ compose） ∥ 启动（首启引导） ∥ CLI 用法 ∥ 控制台 |
| **小计** | **≈762 ⇒ 1246**（本批实读——+484 = 新三档 432 = update 228 ∥ converge 197 ∥ entrypoint 7；增档增量 52 = bin +9 ∥ config +6 ∥ example +1 ∥ service +2 ∥ Dockerfile +12 ∥ dockerignore +1 ∥ compose +4 ∥ README +17——presets ∥ log ∥ cli 零动） | —— |

provider 面随动（批 `docs/batches/2026-10-06-console-providers.md`——叠加口径 = 上表 #961 回填后）：`config.mjs` +≈15（种子语义 ∥ 校验单源导出 ∥ 载入期 `env:` 跳过）∥ `bin/thincoder-server.mjs` +≈8（运行时引导接线）∥ `README.md` +≈15（§2/§6/§10 随动）∥ `config.example.json` ±0（种子示例形保留）。

## 7. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 仅内网 | `host` 必填（缺失 ⇒ 拒启——fail-closed）；`0.0.0.0` ⇒ 启动警告 | 批内件 |
| AC-8（功能点 8——分发与部署） | `npm pack --dry-run` 通过（`files` 白名单齐 ∥ 零 install 步）∥ `docker build` 成功 + compose 起停通 ∥ systemd unit 安放可启（`systemd-analyze verify` ∥ `enable --now` 后 `is-active`——unit 模板 = §5.2） | 收口轮（真机；发布动作 = 发布面轮） |
| AC-9（功能点 9——provider 预设；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 预设形展开（`{"preset":"deepseek","apiKey":"env:X"}` ⇒ `name`=`deepseek` ∥ `baseURL`=预设值 ∥ `models`=[默认模型] ⇒ `/v1/models` 含 `deepseek/deepseek-flash` ∥ 经 mock 上游完成一次请求）；未知预设名 ⇒ 拒启（报错列可用名）∥ `name` 缺省 = 预设名（显式者胜）∥ 条目覆盖 `baseURL`/`models` 生效 ∥ 手写形回归零变 ∥ 漂移件（CLI 表对照）绿 | 批内件（`docs/batches/2026-10-06-server-presets.test.mjs`——已落盘 347 行） |
| AC-10（功能点 10——自动更新；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 自检（假 registry ⇒ 触发 ∥ 404/失败 ⇒ 静默）∥ 档位三值语义 + 非法值拒启 ∥ 自升执行器（成功 ⇒ 优雅停机；失败/超时 ⇒ 不退 ∥ 旧版续跑）∥ 启动日志 `ready` 行含 `version` ∥ 容器收敛判定表（converge 矩阵）；`docker build` + 起停 = 收口轮真机（#959 条件行同窗） | 批内件（`docs/batches/2026-10-06-server-auto-update.test.mjs`——已落盘 498 行）+ 收口轮 |
| AC-11（功能点 11——种子与生效面） | 种子四格（库空+段 ⇒ 导入且 `env:` 保形 ∥ 非空库+段 ⇒ 忽略 + 警告 ∥ 两空 ⇒ 允许起 + 警告「零 provider」）∥ 零 provider 允许态（`/v1/models` = 空清单 ∥ chat ⇒ 404）∥ `env:` 缺位（启动 ⇒ 拒启 ∥ 保存 ⇒ 400）；端到端判据全文 = `gateway/API.md` §5 AC-11 行 | 批内件 |

## 8. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-15 | **首启 admin 引导 = config `bootstrap` + 幂等**：仅零 admin 时依配置创建（`username` ∥ `password`——支持 `env:`）；建后配置可撤；零 admin 且未配置 ⇒ 启动告警；非零 ⇒ 跳过 | 「首启引导（env 或本机 CLI）」的需求形；幂等 = 只建不改（不覆盖已改口令）∥ 配置口令 ⇒ 操作者已知首密、零额外步骤 | 固定缺省口令（admin/admin123——裸奔）· 仅 CLI 建首管（多一步壳访问）· 每启对账改写（会把 admin 已改的口令回滚——非幂等） |
| KD-SV-17 | **provider 预设 = server 自持表（快照——起步 20 家 OpenAI 兼容子集）**：`thincoder-server/src/ops/presets.mjs`（已落盘 50 行）静态表 `{ baseURL, model }` × 展开（`name` 缺省 = 预设名 ∥ 条目覆盖 `baseURL`/`models` ∥ 未知预设名拒启）；漂移 = 手工同步 + 批内件断言 | 需求 = 免手写 `baseURL`/默认模型（功能点 9）；自持 ⇒ 不动 KD-SV-2（运行时不 import core）∥ 表极小（≈45 行）∥ 快照口径 + 漂移件兜同步 | ② 边界例外引 core（重开 KD-SV-2——为 ≈40 行数据表动架构决策不值；核表字段面 ≠ server 面（`format`/`chatPath` 一族不消费）；且沿批档 §1 边界须停下上抛）· ③ 外部脚本生成（生成步 = 变相构建——违「无构建步骤」；产物仍为仓内快照——机制多而无得） |
| KD-SV-18 | **自动更新 = 两路统一 npm 版本身份（自检 + 档位 + 自升执行器；容器 = 壳）**：版本真相 = npm 包（镜像 tag 不承担版本语义）；自检 = registry `latest`（`NPM_CONFIG_REGISTRY` 可指内网镜像；失败/404 静默）；`autoUpdate` = `false ∥ "notify" ∥ "auto"`（缺省 `"notify"`——可见不越权；`"auto"` = opt-in）；自升 = `npm i -g @thincoder/server@<版号>` 子进程（超时 120s；成功 ∧ 复读校验 ⇒ 优雅停机 ⇒ 守护重起；失败 ⇒ 恒保留旧版）；容器 = 壳镜像（构建期上下文包体预装——离线可运行；`TC_SERVER_VERSION` 三态收敛：空/钉/`latest`；钉版抑制自装）；全文 = §5.4 | 用户 15:33/15:37 两令（两路统一 npm 路径 + 容器壳化）；「退出 ⇒ 重起」两路守护既有（unit `Restart=always` ∥ compose `restart: unless-stopped`）；零第三方依赖（fetch = node 内建 ∥ 自升走 npm CLI）；自持实现（先例语义参考 `thincoder-cli/src/upgrade.mjs:7-19`——零代码共享：跨包不可 import） | 外部看门器（Watchtower ∥ 宿主定时——用户裁作废：版本路径不统一）· 容器烤树形镜像（版本身份由镜像承担——用户裁弃）· 自装改由 CLI 代跑（无进程常驻处 ∥ 守护不在 CLI 面）· 轻端点/响应头做版本可见性（新面/热路径——ready 行字段足） |
| KD-SV-19 | **provider 配置面 = 库单源 + 保存即热生效**：控制台管理（`providers` 表——迁移 v2）；密钥落库（明文 ∥ `env:` 引用并存——引用保形）；`config.json` 的 `providers[]` 降为**一次性种子**（空库导入；非空库忽略 + 警告）；热生效 = 注册表重建 + 原子换表（在途请求 = 派发时快照） | 用户 2026-10-06 16:01 令（「不再只靠 `config.json` + 重启」——推翻「配置不热载」）；库 = 运行期单源（迁移链 G2 断点）；热生效免重启（零守护依赖 ∥ 亚秒级）；`env:` 保形（密钥卫生——种子不物化秘密）；预设衔接 = 界面「从预设快速添加」复用 `presets.mjs`（KD-SV-17） | 保存即重启（在途全断 ∥ 无守护场景不可用 ∥ 与自升停机面语义叠）· config 主从双向同步（漂移面 ∥ 无必要）· 全弃 config 段（旧部署须手抄——首启导入零成本更优）· `env:` 载入期解析 + 种子物化入库（密钥卫生退化）· meta 表种子标记（为罕见边角增表——表空即导 + 警告口径足） |

## 9. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| B7 | 边界 | 零 admin 库 + `bootstrap` 配置在场，连续两次启动 | 第一次建 admin；第二次跳过（不重建 ∥ 不改密——幂等） |
| N12 | 正常 | 预设形条目（`{"preset":"deepseek","apiKey":"env:X"}`）载入 | `name`=`deepseek` ∥ `baseURL`=预设值 ∥ `models`=[预设默认模型]；`/v1/models` 含 `deepseek/deepseek-flash` |
| N13 | 正常 | 预设形 + 条目覆盖（`name` ∥ `models` ∥ `baseURL` 自备） | 覆盖生效（预设值不吞条目字段）；派发与清单按条目展开 |
| B9 | 边界 | 同预设双条、均未给 `name` | 拒启（provider 名重名——`name` 缺省撞车） |
| E11 | 错误 | 未知预设名 | 拒启；报错列可用预设名 |
| N14 | 正常 | `autoUpdate:"notify"` + 假 registry 报新版 | 日志 `update_available`；进程继续运行（不自装） |
| N15 | 正常 | `"auto"` + 假 npm 装版成功（复读版本变更） | 走优雅停机（`shutdown`——`signal: "self-update"`；退出码 0） |
| B10 | 边界 | 检查 404/超时/网络失败 | 静默（无日志 ∥ 状态不变——与「无新版」同面） |
| B11 | 边界 | 装版子进程失败/超时 | 不退进程；warn `update_install_failed`；旧版续跑 |
| B12 | 边界 | 容器钉版（`TC_SERVER_VERSION=x.y.z`）+ `"auto"` | 自装抑制（生效 = notify；启动一条说明） |
| B13 | 边界 | 容器 `latest` + registry 不可达 | 回退已装版本运行 + 警告（不拒启） |
| E12 | 错误 | `autoUpdate` 非法值（如 `"yes"`） | 拒启（fail-closed） |
| E13 | 错误 | 容器钉版不可得（离线 + 未装该版） | 拒启；消息含三选修复 |

## 10. 本域边界（不做的面）

- 日志落盘/轮转（裸机 = journald ∥ 容器 = docker logs——采集归各平台） ∥ **`config.json` 文件热载**（文件改动仍须重启；**provider 数据面 = 保存即热生效**——机制 = `gateway/API.md` §2.2） ∥ TLS 终结（前置反代） ∥ 自动备份/巡检面（备份 = 手工最小面——§5） ∥ Windows 守护面（部署时定写法）——均不做。
- provider 管理面不做：本机 CLI 面 ∥ URL 白名单/出口限制（admin 自担）——归 `gateway/API.md` §8。
- 更新面不做：渠道（beta ∥ canary） ∥ 灰度分批 ∥ 多版本并存（A/B 双装 ∥ 秒切） ∥ 进程内热载 ∥ 认证型 registry 的自检凭据面（fetch 不带 npm 凭据——如内网镜像要求认证 ⇒ 自检静默不更新；自装经 npm 凭据面但需手工触发） ∥ 自动备份（回滚前备份 = 手工——§5.5）。

## 变更记录

- 2026-10-06：建档（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮按三层结构 + B 案织入）——ops 域：配置面（bootstrap 段） ∥ 首启引导 ∥ 运维 CLI（含密码面） ∥ 启动/停机/日志；KD-SV-15；用例 B7。
- 2026-10-06：部署面薄面落（用户 08:21→08:24 令）——§5：分发两路 = npm 发布（包体就绪） ∥ Docker 镜像；守护两路 = systemd ∥ 容器 restart；升级/回滚 ∥ 备份（手工） ∥ 两版首部署清单；部署档组 = `deploy/` ∥ `Dockerfile` ∥ `.dockerignore` ∥ `docker-compose.yml`。
- 2026-10-06：fix 轮（评审轮次 1 #2）——§7 补 AC-8（分发与部署）判据行（pack dry-run ∥ docker build + compose 起停 ∥ unit 安放可启；载体 = 收口轮）。
- 2026-10-06：实施后回填轮（fix）——§3 `key issue` 行撤 `--label`（本阶段不提供）；§5.3 补裸机路 env 落点（`EnvironmentFile`）；§5.7 Docker 路补 `docker build` 步（6 ⇒ 7 步）；§6 行数按实读回填（小计 ≈765 ⇒ 681）。
- 2026-10-06：模型标识口径变更（用户 10:27–10:28）——§1 校验规则改（重名判据 = 同 provider 内 ⇒ 拒启）∥ 补对外标识句（`provider/model` 斜杠形）。
- 2026-10-06：小收尾轮（fix）——§1 启动校验补 provider `name` 判据（缺/空 ∥ 含 `/` ∥ 重名（providers 间）⇒ 拒启——与模型重名判据并列；缘由行随补）∥ §6 README 行数再收正（117 ⇒ 119；小计 ≈765 ⇒ 683）。
- 2026-10-06：provider 预设落（批 `docs/batches/2026-10-06-server-presets.md` 设计轮——需求 §2:9 ∥ 台账 #960）——§1 配置面增预设块（预设形/展开 ∥ 覆盖面 20 家 ∥ 漂移纪律）∥ §6 +`presets.mjs`（拟新增 ≈45）∥ config/example/README 行预期增量 ∥ §7 补 AC-9 候补判据 ∥ §8 增 KD-SV-17 ∥ §9 增 N12/N13/B9/E11；另：README 实读复测 120（原表 119——±1 收正）∥ `config.json` 引用两条悬空按注记集闭合（本档 §1 模板行 ∥ `PROJECT.md` §6 随动表行）。
- 2026-10-06：评审轮次 1 收正（父侧直接执行 · 机械 · 可 revert）——预算链补记（小计 683 ⇒ 698 = provider 名校验轮 `config.mjs` 139 ⇒ 154（+15）；698 ⇒ 699 = README 复测 +1）∥ §7 AC-9 行标记收正（已落需求档）∥ §1 模板行注记标记文本统一 ∥ §1 漂移纪律补取数口径半句。
- 2026-10-06：实施后回填轮（R8 · 父侧直接执行 · 机械 · 可 revert）——§6 行数按实读收正（presets **50** ∥ config **158** ∥ example **32** ∥ README **125**；小计 **762**）；批内件实读 **347** 入 `PROJECT.md` §6。
- 2026-10-06：自动更新设计轮（批 `docs/batches/2026-10-06-server-auto-update.md`——需求 §2:10 ∥ 台账 #961）——§1 配置面增 `autoUpdate` 档位 + 更新源行；§4 就绪日志句随动（`ready` 含 `version`）；§5 部署面按「两路统一 npm 版本身份 + 容器壳化」重写（5.1 分发 ∥ 5.2 守护 ∥ 5.3 配置 ∥ 5.4 升级/回滚全机制：自检/档位/自升/容器收敛表/失败安全链/版本可见性/发布接线 ∥ 5.7 清单）；§6 预算（新三档 + 增量预期）；§7 补 AC-10 候补行；§8 增 KD-SV-18；§9 增 N14/N15/B10–B13/E12–E13；§10 增更新面不做项。
- 2026-10-06：控制台 provider/模型管理设计轮（批 `docs/batches/2026-10-06-console-providers.md`——需求 §2:11 ∥ 台账 #962）——§1 `providers[]` 降为**首启种子**（导入矩阵 ∥ 幂等边角 ∥ 密钥形态 ∥ 校验单源 ∥ fail-closed 改写：零 provider 允许态）∥ `env:` 例外（载入不解析——构建期）∥ key 轮换句收正（保存即热生效）∥ §4 启动链补运行时引导 ∥ §6 provider 面随动增量 ∥ §7 补 AC-11 种子行 ∥ §8 增 KD-SV-19 ∥ §10「动态热载配置」句收正（文件不热载 ∥ provider 数据面热生效）+ 增 provider 管理面不做项；机制全文 = `gateway/API.md` §2.2。
- 2026-10-06：实施后回填轮（R11 · 父侧直接执行 · 机械 · 可 revert）——§5.1 引导层两档标记翻正；§6 行数按实读收正（update **228** ∥ converge **197** ∥ entrypoint **7** ∥ bin **122** ∥ config **164** ∥ Dockerfile **28** ∥ compose **19** ∥ dockerignore **8** ∥ service **34** ∥ example **33** ∥ README **142**；小计 **1246**）；§7 AC-10 行标记收正（批内件实读 498）；批内件实读 **498** 入 `PROJECT.md` §6。
- 2026-10-06：行宽机械拆行（父侧直接执行 · 可 revert）——§5.4(c) 行（356 字符 ⇒ 两行 ≤300）。
