# Thincoder Server · 运维面（ops/OPS）

> 板块 = server ∥ 本档 = ops 域（配置 ∥ 首启引导 ∥ 运维 CLI ∥ 部署面 ∥ 启动/停机/日志 ∥ 可靠性面：备份恢复 ∥ 指标与告警 ∥ 容量与降级）；板总览 = `PROJECT.md`（文档地图 = §3）。
> 本域回指 = `PROJECT.md` §7（非功能·仅内网 ∥ AC-7⑦ 引导幂等——机制 = 本档 §2）。
> 建档：2026-10-06（批 `docs/batches/2026-10-06-server-gateway.md` 设计轮；同日补轮——B 案织入 + 三层结构 + 部署面薄面）。

## 1. 配置面（`config.json`）

```json
{
  "host": "192.168.1.10",
  "port": 8787,
  "db": "data/gateway.db",
  "autoUpdate": "notify",
  "trustProxy": false,
  "usageRetentionDays": 90,
  "alert": { "webhookUrl": "https://hooks.example.com/thincoder-server" },
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
| `trustProxy` | 否 | 反代场景客户端 IP 口径：`false`（缺省——IP = 连接对端地址） ∥ `true`（读 `X-Real-IP` 头——反代须 set 形覆盖客户端伪造；前提 = 服务端口仅反代可达）；登录防爆破 IP 维消费（`accounts/ACCOUNTS.md` §2） |
| `proxy` | 否 | 上游出口代理（形 = `{ "uri": "http://host:port" }`——代理目标本体，非门槛）：在场时仅**逐渠 `proxy: true`** 的 provider 上游请求（chat 转发 ∥ 模型发现）经此代理（逐渠独立——无全局闸）；缺省/缺位 = 零代理；非对象形态（数组 ∥ 数字）∥ `uri` 非法（非字符串 ∥ 空串 ∥ 非 URL ∥ scheme 非 `http:`——仅 `http:` 收）⇒ 拒启（fail-closed）；启动 warn 两条（触发/文案 = `gateway/API.md` §6 KD-SV-55）——① 明文 `http:` uri（密钥外发提示）∥ ② 任一条目旗 `true` 而 `uri` 缺位（直连——旗未生效）；改动生效 = 重启（配置文件不热载——§10 在案）；机制全文 = `gateway/API.md` §6 KD-SV-55 |
| `usageRetentionDays` | 否 | 保留窗（天；**用量（含 `usage_daily`/`quota_counters` 两派生表）与审计事件同窗**——单一旋钮）：正整数 ∥ `null`（不限——保留全量）；缺省 `90`；非正整数 ∥ 非法值 ⇒ 拒启（机制 = `metering/METERING.md` §1 ∥ `accounts/ACCOUNTS.md` §2.1） |
| `alert` | 否 | 告警 webhook（可靠性批——机制全文 = §5.11）：形 = `{ "webhookUrl": "http(s)://…" }`；出场非对象 ∥ `webhookUrl` 非法（非字符串 ∥ 空 ∥ 非 URL ∥ scheme 非 http(s)）⇒ 拒启（fail-closed）；缺省/缺位 = 告警投递禁用（服务照常）；投递 = JSON POST（超时 5s ∥ 失败仅日志 ∥ 去抖 10 分钟窗）；生效 = 重启（配置文件不热载——§10 在案）；控制台写面 = 「服务配置」卡告警行（`alertWebhookUrl`——`""` ⇒ 删段） |
| `bootstrap` | 否 | 首启引导凭据（`username` ∥ `password`——支持 `env:`）；仅零 admin 时消费（§2——幂等） |
| `providers[]` | 否 | **首启种子**（一次性导入——矩阵见下；此后控制台管理——`gateway/API.md` §2.2）。**两种条目形**：预设形（`preset` = 预设名——缺省字段展开，见下）∥ 手写形（`name` ∥ `baseURL` ∥ `models` 自备）。两形共有字段：`name`（预设形可省——缺省 = 预设名） ∥ `baseURL`（OpenAI 兼容根——预设形可省） ∥ `apiKey`（可空——空则不发 Authorization 头；支持 `env:` 引用——载入不解析，引用保形） ∥ `models`（开放清单——预设形可省；**条目两形**：字符串 = 上游模型名（无别名）∥ 对象 `{ name, alias }`（配别名——对外标识 = alias）；无别名时对外标识 = `provider/model`；2026-10-09 alias 批——KD-SV-59；控制台编辑位 = 服务模型页「别名」组——`webui/WEBUI.md` §2.4③） ∥ `proxy`（布尔——true = 该渠上游请求经代理；缺省/非真 = 直连——机制 = `gateway/API.md` §6 KD-SV-55） |
| `embedding` | 否 | 嵌入引擎（旁路进程——内网）接入段：`baseURL` ∥ `model` ∥ `apiKey`（选填——本地引擎常无鉴权）。**缺位 ∥ `null` = 禁用态**（服务照常起 + 启动警告一条——`/v1/embeddings` ⇒ 404 `model_not_found` 消息明示未配置；控制台向量卡「未配置」态可创建——见下「配置写面」）；**在场 ⇒ 严格校验**（`baseURL` 须 http(s) ∥ `model` 非空串——非法 ⇒ 拒启）；机制全文 = §8 KD-SV-57 |

- 字符串值支持 `env:变量名` 前缀（加载期解析；变量缺位 ⇒ 启动失败）——真实 key 可只住环境变量。**例外 = `providers[].apiKey`**：载入/种子期不解析（引用保形）；解析 = provider 注册表构建期——缺位 ⇒ 启动拒启 ∥ 保存 400（`gateway/API.md` §2.2）。
- 更新源 = 环境变量 `NPM_CONFIG_REGISTRY`（可指内网镜像——npm 同名配置；自检与自装同源）；缺省 `https://registry.npmjs.org`（机制 = §5.4）。
- **预设形（内建 provider 预设）**：条目给 `preset` = 预设名 ⇒ 缺省字段由预设表展开——`name` 缺省 = 预设名；`baseURL` ∥ `models` 缺省取预设值（**2026-10-09 清除批：预设表零 `model` 键——`models` 无缺省；条目未自备 `models` ⇒ 空清单，经「模型发现」面勾选**）；
  条目自带者**覆盖**预设值（区域端点 ∥ 自选中继清单）；`apiKey` 只住条目（预设表零密钥）。未知预设名 ⇒ 拒启（fail-closed——报错列可用名）。落点 = `thincoder-server/src/ops/presets.mjs`（已落盘 51 行——静态表 + 展开函数；§6 在册）。
- **预设双消费面**：① 配置种子（预设形条目——上条）；② 控制台「从预设快速添加」起手（同表单源——`gateway/API.md` §2.2）。
- **预设覆盖面（起步 21 家）**：抄录自 `thincoder-core/config-presets.mjs`（**只读参考面**——自持表（快照——KD-SV-17 ∥ 引核口径 KD-SV-78）；对照取数 = 只读、非运行期依赖；快照日 2026-10-06——2026-10-09 本批同步 + `gemini-openai`）的 OpenAI 兼容子集：
  `deepseek` ∥ `kimi` ∥ `kimi-code` ∥ `glm` ∥ `glm-code` ∥ `qwen` ∥ `qwenplan` ∥ `mimo` ∥ `mimoplan` ∥ `openai` ∥ `gemini-openai` ∥
  `grok` ∥ `mistral` ∥ `volcengine` ∥ `hunyuan` ∥ `tokenhub` ∥ `huawei` ∥ `siliconflow` ∥ `openrouter` ∥ `groq` ∥ `opencode-go`。
  排除 4 家：`claude` ∥ `gemini` ∥ `opencode-go-anthropic`（`format` 面——非 OpenAI 协议）∥ `minimax`（`chatPath` 面——非标准路径；本服务转发固定 `baseURL` + `/chat/completions`）。每键只载 `{ baseURL }`（单值 `model` 退场——2026-10-09 清除批；不消费 `thinking`/`reasoningEffort`/`maxTokens` 一族——客户端侧参数）。
- **漂移纪律（快照非活链）**：CLI 表更新后由后续批**手工同步**本表（同步笔 = 表 ∥ 本名单行 ∥ 漂移件三处同改）；漂移检 = 批内件断言（server 键集 = CLI 表 OpenAI 兼容子集 ∥ 同键 `baseURL` 逐值相等——重跑批档件即报）；取数 = 批内件只读引入核表（import ∥ 解析皆可——只读对照、非运行期依赖，引核口径 KD-SV-78——运行期面零涉）。
- **种子导入矩阵（`providers[]` × 库——控制台为常态管理面）**：库空 + 段在场 ⇒ 首启导入（日志 `providers_imported`——`env:` 引用**原样保形**入库）；库空 + 段缺/空 ⇒ 允许（启动警告「零 provider——控制台添加」）；库非空 + 段在场 ⇒ **忽略 + 警告**（`providers_config_ignored`——库为准，提示清理该段）；库非空 + 段缺 ⇒ 正常。
- **幂等与边角**：导入后库非空 ⇒ 不再导；控制台删空后若段仍在 ⇒ 重启按矩阵重导（配置段 = 「初始种子」口径——不再需要请移除该段）。
- **种子导入残 nuance（台账 #967——2026-10-09 注）**：种子导入 = 一次性；导入后库行留存（**无回滚**——要撤 = 控制台手删）；`env:` 引用解析 = 注册表构建期 ⇒ **先修好环境变量再入库**（否则入库即拒启——修复 = 补变量后重启）。
- **provider 密钥形态（库面）**：明文 ∥ `env:` 引用并存（明文 = 部署机文件权限自担；引用 = 秘密只住环境）；界面回显掩码（规则 = `gateway/API.md` §2.2）；**永不入日志**。
- **条目校验单源** = `thincoder-server/src/ops/config.mjs` 导出（`validateProviderEntry` ∥ `validateProviderEntries`）——三径调用：配置载入 ∥ 启动构建/种子 ∥ 控制台保存（`gateway/API.md` §2.2）；**别名校验**（2026-10-09 alias 批——KD-SV-59）：非空 ∥ 不含斜杠 ∥ 无首尾空白；
  **全服唯一**（别名 vs 别名 ⇒ 拒启/保存 400——唯一性三径同助手）；**别名与带前缀名形上不相交**（别名无斜杠 ∥ 前缀名含斜杠 ⇒ 唯一撞法互斥）。
- **启动校验（fail-closed）**：`host` 缺失 ∥ 种子/库内 provider `name` 缺/空 ∥ `name` 含 `/` ∥ `name` 重名（providers 间） ∥ **同 provider 内**模型重名 ∥ `baseURL` 非 http(s) ∥ **未知预设名** ∥ `trustProxy` 非布尔 ∥ `usageRetentionDays` 非正整数且非 `null`
  ∥ `embedding` 在场非对象 ∥ 在场缺 `baseURL`/`model`（或 `baseURL` 非 http(s)）
  ∥ **别名非法**（空 ∥ 含斜杠 ∥ 首尾空白 ∥ 跨 provider 重名——2026-10-09 alias 批）
  ⇒ 非零退出 + 明确报错；`bootstrap` 在场时 `password` ≥8 字符（否则启动失败）。**零 provider = 允许态**（服务照常起 + 警告；控制台/种子为两条配置路径）。
  **零 embedding = 允许态**（2026-10-09 embed 解耦批；台账 #1147——用户 17:24）——嵌入面禁用 + 启动警告一条（「嵌入引擎未配置（config.json 缺 embedding 段）——/v1/embeddings 禁用；配置后重启生效」）；机制全文 = §8 KD-SV-57。
- provider `name` 校验缘由（对外标识 = `provider/model` 首斜杠切分）：`name` 缺/空 ∥ 含 `/` ⇒ 前缀形不可解析（清单列示而派发 404）；`name` 重名 ⇒ 派发歧义。
- 对外模型标识 = **别名（配了）∥ `provider/model`（未配）**——别名 = 唯一显示名与请求名（2026-10-09 alias 批——KD-SV-59）；未配时 = `provider/model`（**首斜杠切分**——首段 = provider `name` ∥ 余段 = 上游模型名（可含斜杠）；两段非空；裸名不解析（别名形除外）；**同名模型跨 provider 并存且各自可达**）；`/v1/models` = 对外标识清单。
- 模板 = `thincoder-server/config.example.json`（已落盘——预设形 ∥ 手写形并存）；真档 = `thincoder-server/config.json`（部署机本地——不入 git）（机检豁免——部署机本地档）。
- provider key 轮换 = 控制台改 provider 并保存（**保存即热生效**——机制 = `gateway/API.md` §2.2；用户 2026-10-06 16:01 令）。
- **配置写面（控制台——`#/admin/system`「服务配置」卡（含 `proxy.uri` 行 + 连通测试块——2026-10-10 代理回迁批；`webui/WEBUI.md` §2.7） + 向量卡；2026-10-09 配置批）**：可写项 = `autoUpdate` ∥ `trustProxy` ∥ `usageRetentionDays` ∥ `proxy.uri`（顶层段） ∥ `embedding.{baseURL,model,apiKey}` ∥ `alert.webhookUrl`（顶层段——可靠性批；`""` ⇒ 删段）；
  只读展示 = `host` ∥ `port` ∥ `db`（部署拓扑项——改端口 = 自断连接 ∥ 改库 = 迁移动作；**定则例外显式说明**：不做写面）+ `bootstrap`（一次性——口令永不回显）+ `providers[]`（指针：常态管理 = 控制台 Provider 页）。
  读写形 = **文件面**（读 = config.json 现值（缺省回填展示） ∥ 写 = 读改写）；
  写路径 = ① 白名单（未知键 ⇒ 400）→ ② 合并原档（**保未知键**；`proxyUri: ""` ⇒ 删 `proxy` 段）→ ③ 门 = `resolveEnvRefs` + `validateConfig`（**载入面等价两跳**——写入的文件必可载入；不过 ⇒ 400 原报文，文件零变）→ ④ 原子写（同目录 tmp ⇒ `rename` 覆盖；写盘形 = 2 空格缩进 + 末尾换行——与现档同形）→ ⑤ 审计 `config_update`（detail = 键名清单；值永不入）。
  **生效 = 重启**（统一标注——配置文件不热载 §10 不破；本批不做运行态注入）。单写者（进程内同步读改写 + 部署模型单实例；跨进程并发 = 不做）。**写面前提 = 配置档所在目录可写**（容器路 = 配置目录级可写挂载——§5.1；裸机 = 部署者自管）。端点 = `gateway/API.md` §2.4；决策 = §8 KD-SV-56。
  **`embedding` 缺段创建（2026-10-09 embed 解耦批）**：缺段档保存向量卡 ⇒ 子键合并自动建段（从无到有——同一 PATCH）；缺段档 PATCH 他键照常过门（校验门容缺段——载入面等价两跳）；部分子键（仅 `baseURL` ∥ 仅 `model`）⇒ 400（在场须完整——载入门判）；控制台删除/清空 `embedding` 段 = 不做（编辑配置文件；PATCH `embedding: null` ⇒ 400）。机制全文 = §8 KD-SV-57。

## 2. 首启引导（幂等）

- 启动时库中零 `admin` 且 `bootstrap` 配置在场 ⇒ 建首个 admin（配置口令即初始密码；建后可从配置撤除——已存在不再读取）。
- 零 admin 且未配置 ⇒ 启动告警（服务器照常起——CLI `member add --role admin` 可补建）。
- 非零 admin ⇒ 引导整体跳过（不重建 ∥ 不改密——幂等口径）——KD-SV-15（§8）。

## 3. 运维 CLI（服务器本机运行）

```text
node src/ops/cli.mjs --config <配置档> <命令>
  member add <name> [--username <u>] [--role admin|user] [--password <pw>]   # 建成员（缺省 username = name ∥ user；无 --password ⇒ 生成临时密码打印一次）
  member list                           # 成员 + 角色 + 分模型覆盖数 + 本月已用
  member quota <name> <model> <N|none>  # 设分模型覆盖（model = 对外标识；none = 删覆盖）
  member passwd <name> [--password <pw>]  # 重置密码（本机兜底；无 --password ⇒ 生成打印一次）
  key issue <member>                    # 签发——全文只打印一次（+ key id）
  key revoke <id|hint>                  # 吊销（立即生效）
  key list [--member <m>]               # 提示形清单（无明文）
  usage reconcile [--month YYYY-MM] [--fix]  # 派生两表对账重算（vs 明细；--fix = 覆写）
```

- 落点 = `thincoder-server/src/ops/cli.mjs`（已落盘）；直开库（不经 HTTP）——服务器本机兜底。
- 与页面（`accounts/ACCOUNTS.md` §3 端点表）同库同语义（同一散列/吊销/轮转/重置口径）——页面 = 常态管理面，CLI = 本机通道。
- **审计**：改动类命令（`member add` ∥ `member passwd` ∥ `key issue` ∥ `key revoke`）各记一条审计事件（`actor = "cli"`——目录与列形 = `accounts/ACCOUNTS.md` §2.1）。

## 4. 启动/停机与日志

- 启动 = `thincoder-server/bin/thincoder-server.mjs`（已落盘）：argv（`--config`）→ 配置加载/校验 → 首启引导 → 开库/迁移（`store/STORE.md` §3）→ **保留清理（用量 + 审计事件：启动一次 + 24h 周期——`metering/METERING.md` §1 ∥ `accounts/ACCOUNTS.md` §2.1）** →
  **provider 运行时引导（种子导入 ∥ 注册表构建——§1）** → **告警 watchdog（60s 周期——§5.11；webhook 缺省 ⇒ 零行为）** → `node:http` 监听 → 就绪日志（`ready` 行含 `version` 字段——§5.4(g)）。
- 停机 = SIGINT/SIGTERM ⇒ 优雅收尾（停收新连 ∥ 清周期定时器（更新循环 ∥ 保留清理 ∥ watchdog 同法） ∥ 关闭库）。
- 日志 = `thincoder-server/src/ops/log.mjs`（已落盘）：单行 JSON 到 stdout（逐请求一行 + 启动/引导/错误事件）；采集/落盘 = 部署面（§5——裸机 journald ∥ 容器 docker logs）。
- 启动失败（catch 段）⇒ `startup_failed` 日志 + 告警尽力投递（`alert.webhookUrl` 在案时——§5.11；投递失败仅 warn——进程退出码 1 不变）。
- **入口判据（bin 垫片形——#1113）**：主入口判定 = `argv[1]` 经 `realpathSync` 解析后与 `import.meta.url` 比对——npm 全局装（POSIX）= bin 符号链接形：`argv[1]` 为符号链接路径而 `import.meta.url` 为真身路径，不解析 ⇒ 判据恒假 ⇒ **静默退出 0**（`run` 从不执行）；路径不可解析 ⇒ 抛（显式报错——不静默）；模块被 import（非主入口）⇒ `run` 不自动执行（测试面可导入）。判据行最终形（`:12` 邻增 import ∥ `:176`）：

```js
import { realpathSync } from "node:fs"
// 入口判据：argv[1] 先经 realpath 解析再比——npm 全局装（POSIX）bin = 符号链接形：argv[1] 非真身路径，不解析 ⇒ 判据恒假 ⇒ 静默退出 0；不可解析 ⇒ 抛（显式，不静默）。
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) await run()
```

## 5. 部署面（两路统一：版本身份 = npm 包；容器 = 壳；守护两路：systemd ∥ 容器 restart）

### 5.1 分发（两路——版本身份 = npm 包 `@thincoder/server`，唯一真相）

- **版本身份 = npm 包**（两路同源）：升级 = 装 npm 新版 + 重启（§5.4）；**镜像 tag 不承担版本语义**（tag 只标壳——除 Node 基座换代外无需重建镜像）。
- **npm 路（包体就绪——发布动作 = 发布面轮）**：`thincoder-server/package.json` 转可发布形——撤 `private` ∥ 包名 = `@thincoder/server`（拟——发布轮验 registry 占用/scope 权限；更优命名可上抛） ∥ `bin` = `thincoder-server` + `thincoder-runner`（第二入口——沙盒批；`sandbox/RUNNER.md` §9 预算行在册）
  ∥ `engines` node>=24 ∥ `prepublishOnly` 门禁（全树 `node --check` + 批内件 30 ⇒ 31 ⇒ 32 ⇒ 33 ⇒ 34 ⇒ 35 ⇒ 36 ⇒
  **38 件**（八 + #962/#963/i18n/#972 件 + 弹窗批件 + 后续各批 18 ⇒ 19 ⇒ 20 ⇒ 21 ⇒ 22 ⇒ 23 ⇒ 25 件——alias ∥ 代理页批件已入链；以当刻盘面实读为准：盘面实读 **36**（2026-10-10 现读——含 server-face-residues 件）⇒ 本批（server-small-fixes 两件入链）**+2 ⇒ 38** ⇒ server-exec-sandbox 批两件入链 **+2 ⇒ 40**））。
  - `files` 白名单 = bin ∥ src ∥ public ∥ config.example.json ∥ README.md（`deploy/` 档组 = 仓内部署面——不入包）。
- **npm 路装机 = 前缀式**（自升前提）：`NPM_CONFIG_PREFIX` 指**服务账号可写目录**（建议 `/opt/thincoder-server/.npm-global`——与配置/数据同根）⇒ 装机（`npm i -g @thincoder/server`）与自升（服务进程内——§5.4）同前缀、免 sudo 重写；安放后该根目录整归服务账号（`chown -R`）。
- **Docker 路 = 壳镜像**（`thincoder-server/Dockerfile`——重设计）：基座 `node:24-slim` + 引导层（`thincoder-server/deploy/docker-entrypoint.sh`（已落盘 7 行） ∥ `thincoder-server/deploy/converge.mjs`（已落盘 197 行））；**App 代码由 npm 取装**——镜像本体只含壳（不带版本身份）。
- **构建期预装 = 上下文包体**（离线可运行性）：构建上下文（= `thincoder-server/`）内 `npm pack`（同 `files` 白名单形）⇒ `npm i -g <tgz>` 装入镜像前缀（`/home/node/.npm-global`——node 账号自有）；**构建零 registry 依赖**（发布前亦可构建验证）；预装版 = 构建时树版本（离线兜底副本——非版本身份，tag 不随）。
- **运行期收敛**（entrypoint 口径——**重跑壳 = 收敛到配置版本：不留旧、不漂移**）：`TC_SERVER_VERSION`（env）三态——空 = 运行已装版本（零网络）∥ `x.y.z` = 钉（已装即用；缺则装；装不上 ⇒ 拒启）∥ `latest` = 追新（查 registry；不可达 ⇒ 回退已装 + 警告）；判定表 = §5.4（d）。
- **装位 ∥ 权限**：装位 = 镜像前缀（node 账号自有——自升可写）∥ `ENV PATH` 含 `<前缀>/bin`（入口 `exec thincoder-server` 依赖——或入口改用前缀绝对路径）；运行 = `USER node`（非 root）；`VOLUME /app/data` 保留——bind 卷须对容器内 node 账号可写（`chown 1000:1000 ./data` ∥ `./config`；uid 以镜像为准——官方基座 `useradd --uid 1000` 实读在案 2026-10-06）。
- **壳与 Node 基座**：基座 node:24 与包 `engines`（node>=24）同源；**Node 换代 = 重建镜像**（自升不动基座；触发 = 包 `engines` 变更）。
- Docker 配套随动：`thincoder-server/.dockerignore`（排除清单 + `config/`——随正件见下）+ `thincoder-server/docker-compose.yml`（样例——重写）：

```yaml
services:
  server:
    image: <registry>/thincoder-server:<tag>   # 待定占位（壳 tag——不含版本语义）
    restart: unless-stopped                     # 容器路守护（无 systemd 依赖）；崩溃自愈 ∥ 开机自起
    # healthcheck：继承自镜像（Dockerfile HEALTHCHECK——§5.9；docker compose ps 可见 (healthy)）
    environment:
      - TC_SERVER_VERSION=${TC_SERVER_VERSION:-}   # 钉死 = 写 x.y.z；留空（缺省空串）= 按镜像预装运行（离线）
      # - NPM_CONFIG_REGISTRY=http://<内网镜像>/          # 更新源（选填——§5.4）
    ports:
      - "8787:8787"
    volumes:
      - ./config:/app/config                    # 配置目录（目录级 rw——写面原子写（同目录 tmp ⇒ `rename`）须之；须 chown 1000:1000）
      - ./data:/app/data                        # SQLite 库（db 写 `/app/data/gateway.db`）；须 chown 1000:1000（部署清单 ③）
    env_file: .env
```

- **容器路配置形（写面前提——2026-10-09 配置控制台批）**：配置档 = `/app/config/config.json`（entrypoint 传 `--config`——`thincoder-server/deploy/docker-entrypoint.sh`）；挂载 = `./config` **目录级 rw**——单文件挂载下原子写（同目录 tmp ⇒ `rename`）换不了挂载点 ⇒ 保存必失败；容器路 `db` 取**绝对值** `/app/data/gateway.db`（配置档在 `/app/config`——相对形会落配置目录内）。
- **随正件（实施轮——防泄面）**：`thincoder-server/.dockerignore` 添 `config/` ∥ `.env` ∥ `.env.*` ∥ `backups/`（构建上下文排除——自仓构建场景；密钥/口令永不入镜像层；`backups/` 为旧布局备份默认落位） ∥ 仓根 `.gitignore` 添 `thincoder-server/config/` ∥ `thincoder-server/backups/`（自仓运行场景——旧布局备份落位；库全量）∥ `.env` 行补 `.env.*` 变体（两防泄通道口径对称）。
- **既有部署迁移（单文件挂载 ⇒ 目录级）**：配置档移入 `./config/` ∥ 卷两行随正 ∥ `db` 改绝对形 ∥ `chown -R 1000:1000 ./config` ⇒ `docker compose up -d`。

- **待定占位**：镜像 registry ∥ 镜像名 ∥ tag（部署时确认——tag 不含版本语义）。

### 5.2 守护（两路并列——升级链的依赖面：进程退出 ⇒ 重起拾新版）

- **裸机路 = systemd**（npm 前缀式装机）：模板 = `thincoder-server/deploy/thincoder-server.service`（已落盘——本批随动）——`Restart=always` ∥ 开机自启（`enable`）。
- unit env（自升前提）= `NPM_CONFIG_PREFIX=<前缀>`（自升子进程同前缀——§5.1） ∥ `NPM_CONFIG_CACHE=<缓存目录>`（服务账号家目录缺位时 npm 缓存有落点）；`ExecStart=<前缀>/bin/thincoder-server --config <配置档>`（全局垫片）。
- 裸机日志 = stdout 单行 JSON 由 journald 收（`journalctl -u thincoder-server`）；安放 = 拷 unit 到 `/etc/systemd/system/` → `daemon-reload` → `systemctl enable --now thincoder-server`。
- **容器路 = restart 策略**（无 systemd 依赖）：`restart: unless-stopped`；日志 = `docker logs`；**收敛链 = 容器重起重跑壳引导**（自升成功 ⇒ 应用退出 ⇒ docker 重起 ⇒ converge 按 `TC_SERVER_VERSION` 收敛——§5.4）。
- **重起拾新版链（两路同律）**：进程退出（退出码 0 亦然）⇒ 守护重起 ⇒ 入口读到的 = 前缀内实际安装版本。
- **崩溃循环遏制**（可靠性批——口径说明）：systemd 默认起爆窗（10s 内 5 次起爆 ⇒ 停止重试；`systemctl status` 可见）∥ docker restart = 指数退避；进程起不来期间可见面 = journald/docker logs（`startup_failed` 告警为尽力投递——§5.11）。

### 5.3 配置（两路同）

- `config.json`（机本地 ∥ 不入 git）+ env（provider keys ∥ `bootstrap` 口令——首启建 admin 后可撤）；裸机路 env 落点 = systemd `EnvironmentFile`（缺省 `/etc/thincoder-server.env`——unit 模板在册）；容器路 = compose 卷（配置目录 + 数据——§5.1）+ `env_file: .env`。
- **部署面 env（更新/收敛族——机制 = §5.4）**：`TC_SERVER_VERSION`（容器路——壳收敛目标）∥ `NPM_CONFIG_REGISTRY`（更新源——自检与自装同源）∥ `NPM_CONFIG_PREFIX`（裸机——装机/自升前缀）∥ `NPM_CONFIG_CACHE`（裸机——npm 缓存落点）；更新档位 = `autoUpdate`（config 字段——§1，非 env）。

### 5.4 升级/回滚（两路同法：版本回指 + 重启）

- **（a）自检**：服务内周期自检——启动即检一次 + 每 6 小时（interval = 实现常量；不设配置项）；请求 = `<registry>/@thincoder%2fserver/latest`（直连 registry——scheme 随 `NPM_CONFIG_REGISTRY`（http(s) 皆可）；`%2f` 编码形实测在案 2026-10-06；超时 5s 沿 CLI 先例）；**失败/404 静默**（与「无新版」同面——不打扰）；更新源 = `NPM_CONFIG_REGISTRY`（§5.3）。
- **（b）档位**（`autoUpdate`——§1；默认值论证）：`false` = 零检查（离线 ∥ 审计场景）；`"notify"` = 检查 + 日志（`update_available`——可见但不越权：**缺省**）；`"auto"` = 检查 + 自装（免值守——opt-in）。**抑制**：容器内 `TC_SERVER_VERSION` 为钉（非空且非 `latest`）⇒ 自装抑制（生效 = notify + 启动一条说明——升级 = 改钉值；防与壳收敛互搏）。
- **（c）自升执行器**：`npm i -g @thincoder/server@<版号>`（版号 = 检查所得具体值——防标签竞态；`--no-audit --no-fund`）子进程（超时 120s）；成功判据 = 退出码 0 ∧ 复读版本变更 ⇒ **走既有优雅停机路径**（`shutdown`——`signal: "self-update"`；停收新连 ∥ 在途至多 10s ∥ 关库）⇒ 退出 ⇒ 守护重起拾新版；
  **失败/超时恒保留旧版运行**（warn `update_install_failed`——含重装提示；下轮再检；可靠性批：同点接线告警投递——`onInstallFailed` 回调，缺省 null 零行为）；**注入口径**（批内件替身）：npm 命令 ∥ 前缀 ∥ 周期/超时常量走可覆盖参数 + `??` 缺省（缺省 = 生产行为不变；测试内 finally 复原）。
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
  - **共同注意**：升级不动数据（库文件零触）；库迁移只进不退（回滚前建议先备份——§5.5，可先跑演练脚本验证该快照）；自升窗内遇停机 ⇒ 半装窗风险（恢复 = 重装命令在日志与文档）。
- **（f）失败安全链**（绝不 brick——fail-closed 与消息在案）：自装失败/超时 ⇒ 旧版照常运行（进程不退）∥ 半装窗 ⇒ 旧进程内存内照常服务（树受损时恢复 = 重装）；装后启动失败 ⇒ 守护重起循环（systemd 起爆窗内失败态 ∥ docker 重起——日志可见）⇒ 回滚 = 版本回指 + 重启；容器钉版不可得 ⇒ **拒启**（重起循环使其可见——不静默漂移）。
- **（g）版本可见性**：启动日志 `ready` 行含 `version`（= 前缀内实际安装版本——journald/docker logs 直读；升级核对 = 重起读 ready 行）；容器收敛行 `converge: version=<v> source=<installed|installed-now|fallback>`。
  **形态选型**：ready 行字段（**选定**——零新面：无新端点 ∥ 无响应头改动）；轻端点（否——新面 ∥ 健康语义膨胀）∥ 响应头（否——热路径每响应加字段）；**控制台可见面 = `GET /api/system`**（KD-SV-24——同一进程内状态；两消费方：部署面 = ready 行 ∥ 控制台 = 端点）。
- **（h）前置声明（发布面接线点）**：`@thincoder/server` 发布前 ⇒ registry 查询 404 ⇒ **自检恒「无新版」（静默）**——机制就绪、接线在发布面轮（发布后自生效，无需改动）。

### 5.5 备份与恢复（在线快照 ∥ WAL 检查点 ∥ 恢复演练 ∥ RPO/RTO——可靠性批）

- 工具 = `thincoder-server/deploy/backup.mjs`（可靠性批 86 ⇒ ≈150 行）：`node deploy/backup.mjs --config <配置档> [--out <目录>]` ⇒ `<out>/gateway-<时间戳>.db`（`--out` 缺省 = 配置档旁 `backups/`）。
- 机制（三步一体）：① **在线快照** = node:sqlite `backup()`（WAL 安全、免停写窗；与运行实例并存；源库只读开——零触；node 自带——零外部工具）→
  ② **快照自检**（本批新）：只读开快照 ⇒ `PRAGMA integrity_check` = `ok` ∧ `user_version` 可读 ∧ 关键表可查（`members` ∥ `api_keys` ∥ `usage`）——任一不过 ⇒ 退出 1（坏快照留盘——排障）→
  ③ **WAL 检查点**（本批新）：对源库 `PRAGMA wal_checkpoint(TRUNCATE)`——成功 ⇒ WAL 复位（限额兜底）；busy ⇒ warn 续行（快照已得——不判失败）。
- 退出码：0 = 快照生成且自检过（stdout 一行 = 产物路径——可管道消费）∥ 1 = 失败（stderr 说明 + 告警投递，见下）。
- **失败告警**（本批新——§5.11 同渠）：快照生成失败 ∥ 自检不过 ⇒ `alert.webhookUrl` 在案时 POST `{ source:"thincoder-server/backup", event:"backup_failed", … }`（本档自含海报——零 App 依赖；投递失败仅 stderr 一行——不反噬退出码）；成功不投递（零噪声）。
- **RPO/RTO 声明**（口径 = 机制推导 + 实测回填，非拍数）：
  - RPO（进程崩溃）= **0**——WAL 提交即持久，重起自恢复；**掉电** = 丢最后若干提交（`synchronous=NORMAL`——计量档位在册，`store/db.mjs:322`）；
  - RPO（整机/介质丢失）= **最新快照龄**——定时器样例每日 ⇒ **≤24h**（调频 = 改 `OnCalendar`；频次越高 RPO 越小、盘占用越高）；
  - RTO = 恢复四步「停服 → 快照替换库 + 清 `-wal`/`-shm` 伴档 → 起服 → `/healthz` 200」——脚本段实测（演练读数 `copy_ms`+`verify_ms`）+ 人工段读数（收口轮真机回填）。
- **恢复演练**（本批新——可跑流程：`deploy/restore-drill.mjs`（拟新增 ≈170 行））：
  - 运行：`node deploy/restore-drill.mjs --config <配置档> [--backup <快照>] [--dir <演练目录>]`（缺省快照 = 配置档旁 `backups/` 最新 `gateway-*.db` ∥ 演练目录 = 配置档旁 `restore-drill/`）；
  - 步 = ① 定位快照（缺 ⇒ 退出 1「无快照可演练」）② 复制到演练目录（同名覆盖——演练目录专用）③ 只读开 + 三判据（`integrity_check`=`ok` ∥ `user_version` 数值可读 ∥ 关键表行数可读）④ 对源比对（源库可读 ⇒ `members`/`providers` 行数与 `user_version` 逐一相等；源不可读 ⇒ 跳 + 注行）⑤ 读数与退出码；
  - **判据**：全过 ⇒ 退出 0，stdout `PASS` + `copy_ms ∥ verify_ms` + 各表行数（= RTO 脚本段实测源）∥ **失败判据**：任一不过 ⇒ 退出 1 + `FAIL: <原因>`（演练副本留盘——排障）；
  - 周期建议：随发布 ∥ 季度（部署方流程——脚本即判据；不设 timer，按需执行）。
- 定时器样例（systemd——README §9 全文）：`thincoder-server-backup.service`（`Type=oneshot`；`ExecStart=node <deploy>/backup.mjs --config <配置档>`）+ `thincoder-server-backup.timer`（`OnCalendar=daily` ∥ `Persistent=true`）。
- 容器路 = 宿主对卷内库执行同命令：`docker compose exec server node /app/deploy/backup.mjs --config /app/config/config.json --out /app/data/backups`（镜像含 `deploy/`；产物落卷）。
- **恢复步**（README §9 备份节成文）：停服 → 以快照替换库（`gateway-<时间戳>.db` ⇒ `data/gateway.db`）+ 清 `-wal`/`-shm` 伴档 → 起服；换库前建议先跑演练脚本（对同一快照——判据过了再换）。
- **WAL 归档口径（本批裁定——KD-SV-79）**：SQLite 的 WAL **不可独立重放**（分段归档 = PostgreSQL 语义）——本仓形态 = **快照（一致点）+ 检查点（限额复位）**；「归档」实义 = 快照序列本身（每个快照 = 完整一致归档件）。
- **环境回退**：若 `backup()` 环境核验不过 ⇒ 回退 = 停写窗快照方案（README 明示）。
- 边界：进程内自动备份面不做（备份 = 部署侧面）；轮转/保留 = 部署方自管（不做）。

### 5.6 反代与 TLS（样例——nginx；登录防护 IP 维接线）

- 边界保持：内网 HTTP；HTTPS 如需 = **前置反代**（不集成进 server——不做项在册）；完整样例 = README §11（选型 = KD-SV-25）。
- 样例要点（接线三件——必须带对）：① `client_max_body_size` 按 location 分路由：缺省 32m（≥ 服务端通用 32 MiB 请求体上限——nginx 默认 1m 会先挡；其余路由保持从严）∥ **快照上送例外** = `location = /api/runner/checkpoint` 块 `client_max_body_size 200m`（= 路由级上限 200 MiB 同值——`gateway/API.md` §2.6；≤200 MiB 上送不被反代先挡）；
  ② SSE：`proxy_http_version 1.1` ∥ `proxy_buffering off` ∥ `proxy_read_timeout` 拉长（流式逐块透传——缓冲/短超时会断流）；③ `proxy_set_header X-Real-IP $remote_addr`（set 形覆盖客户端伪造）⇒ 服务端置 `trustProxy: true` 后按真实客户端 IP 计防爆破 IP 维。
- `trustProxy: true` **前提** = 服务端口仅反代可达（同机仅听回环 ∥ 防火墙白名单——否则直连可伪造 `X-Real-IP`）；README 样例注记同拍。

### 5.7 首部署清单（两版）

- **npm 路**（6 步）：① 装 Node ≥24 → ② 以服务账号装机（`NPM_CONFIG_PREFIX` 指可写前缀——§5.1；自升前提）→ ③ `config.example.json` ⇒ `config.json` + env（provider keys ∥ bootstrap 口令）→ ④ 首启（env 建首个 admin）→ ⑤ unit 安放（ExecStart = 前缀垫片——§5.2）+ `enable --now` → ⑥ 验收 = 携团队 key `curl /v1/models` ⇒ 200（key = 首启 admin 登录后自助签发）。
- **Docker 路**（7 步）：① 装 Docker → ② `docker build -t <registry>/thincoder-server:<tag> .`（构建上下文 = `thincoder-server/`；壳化——构建期预装上下文包体（离线可构建）；registry ∥ 镜像名 ∥ tag = 待定占位——§5.1）。
  - 续（③–⑦）：③ 备 `config/`（内含 `config.json`——目录须对 node 账号可写：`chown 1000:1000 ./config`；`db` 写绝对形 `/app/data/gateway.db`）+ `data/`（`chown 1000:1000`——node 账号）+ `.env`（`TC_SERVER_VERSION` 可选——§5.4(d)）
    → ④ `docker compose up -d` → ⑤ 首启日志确认（converge 行 + env 建首个 admin；`docker compose ps` 可见 `(healthy)`——§5.9）→ ⑥ 验收同 npm 路（端口 `8787`）→ ⑦ 升级/回滚 = 改 `TC_SERVER_VERSION` + `up -d`（§5.4(e)）。

### 5.8 目标机/OS

- 内网 Linux 服务器（具体机与 OS 以部署时确认；若 Windows ⇒ 裸机守护面换写法——部署时定）。

### 5.9 健康检查（探活面——契约 = `gateway/API.md` §2.3 ∥ KD-SV-23）

- 探针 = `GET /healthz`（无鉴权只读）：200 = `{ status:"ok", …, db:"ok" }`；db 探活失败 ⇒ 503 `degraded`。
- 容器路 = **Dockerfile `HEALTHCHECK` 单源**（interval 30s ∥ timeout 5s ∥ start-period 120s ∥ retries 3——start-period 覆盖壳收敛/装版窗）：
  `CMD node -e "fetch('http://127.0.0.1:8787/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"`；compose 不重复声明（镜像 healthcheck 自动继承——`docker ps` STATUS 可见 `(healthy)`）。
- 端口与 `host`：探针固定缺省 `8787`；`port` 改非缺省 ⇒ 同步改 HEALTHCHECK 行（在案）；容器路 `host` 取 `0.0.0.0`（容器单接口——警告可接受）——探针固定 `127.0.0.1` 依赖之。
- `unhealthy` = **标注态**（restart 策略只按进程退出动作——healthcheck 不触发重起；「不健康即重起」= 外部工具，不做项）。
- 裸机路 = 手跑探活（`curl`——README §12 排障节）；systemd 不设独立探活（`Restart=always` 按退出主）。

### 5.10 沙盒 runner（执行面——部署与运维；server-exec-sandbox 批 · 台账 #1224）

- **形态** = 同 npm 包第二入口（`thincoder-runner` bin——`@thincoder/server` 同包，版本锁步；KD-SV-64）；一台 runner 机 = 一个守护进程 + 本机容器运行时。
- **装机三步**：① 装 Node ≥24 + 容器运行时（docker ∥ podman——探测定序 = **已裁 U1**（双兼容，2026-10-10 14:23））+ 网络工具（nft ∥ iptables）+ 磁盘配额机制（xfs pquota ∥ ext4 prjquota ∥ loopback 备选——`sandbox/RUNNER.md` §5/§7）⇒
  ② `npm i -g @thincoder/server` + `thincoder-runner doctor`（核心项全 PASS——否则拒跑）⇒ ③ 控制台生成 join token（**整条命令可复制 ∥ 有效期可见**）⇒ `thincoder-runner join --server <url> --join-token <t>`（失败 = 逐句人话（过期 ∥ 已用过 ∥ 令牌不对）+ 失败审计行——`sandbox_event`）⇒ 安放 `deploy/thincoder-runner.service`（拟新增）⇒ `enable --now`。
- **网络面**：runner → server 出向 HTTP(S)（server 无需入向端口）；盒流量在 runner 本机桥内、出站经本机闸（不占 server 侧带宽——KD-SV-63 动机）。
- **机队运维**：加机 = 同装机三步 ∥ 排空 = 控制台一键（停新放置 + 收旗停盒（拆前 WIP 快照）+ 卷保留）∥ 退役 = 删机（要求工作区已重建或 `confirm: true` 丢弃）；升级 = 重装 + 重启（runner 自动更新 = 不做——`sandbox/RUNNER.md` §12）。
- **前置/自检清单全文与判据** = `sandbox/RUNNER.md` §7/§8（本档不复述）。

## 6. 本域文件与行数预算（本域族行）

| 档 | 行数（实读——设计估） | 职责 |
|---|---|---|
| `thincoder-server/bin/thincoder-server.mjs`（已落盘） | **153 ⇒ ≈172**（实读 2026-10-06——设计估 ≈50；#961 +9 = 版本读取 ∥ 更新循环接线 ∥ 停机清循环；#962 +4 = 运行时引导接线；#963 +27 = 系统面注册 ∥ 保留清理接线 ∥ 停机清周期 ∥ 惰性访问器 ∥ 登录守卫注入；本批 +≈19 = 审计清理接线（启动 + 周期） ∥ 两注册行（overview ∥ embedding） ∥ 守卫 `onLock` 接线）**；实读 **176**（2026-10-09）⇒ **实读 178**（#1113 批：+2 = `realpathSync` import ∥ 注释——判据行就地改写 ±0）⇒ ≈180（配置控制台批：config 注册行 ∥ `configPath` 传递 +≈2）⇒ 实读 **180**（2026-10-09 配置控制台批落地后）⇒ ≈182（2026-10-09 代理页批：import ∥ 注册行 +≈2）⇒ 实读 182（2026-10-09 代理页批落地后：180 ⇒ 182）** | argv ∥ 配置加载 ∥ 首启引导 ∥ 启动 ∥ 停机 |
| `thincoder-server/src/ops/config.mjs`（已落盘） | **189**（实读 2026-10-06——设计估 ≈150；#961 +6 = `autoUpdate` 校验 ∥ 常量导出；#962 +16 = 种子语义 ∥ 校验单源导出 ∥ 载入期 `env:` 跳过；#963 +9 = `trustProxy` ∥ `usageRetentionDays` 校验）**⇒ 实读 252 ⇒ ≈262**（配额批：settings 子字段 `quotaTokens` +≈10）**⇒ 实读 ≈260（2026-10-09）⇒ 实读 301**（本批 proxy：`proxy` 段校验 ∥ 条目 `proxy` 判据——实读）**⇒ 实读 311（2026-10-09 embed 解耦批：`embedding` 可选分支 ∥ 告警一行——实读收正）⇒ ≈316（2026-10-09 alias 批：别名校验（非空 ∥ 无斜杠 ∥ 无首尾空白 ∥ 跨 provider 唯一）+≈5——实读待回填）** | 读档 ∥ 校验（fail-closed） ∥ `env:` 解析 ∥ 缺省值 ∥ 预设展开接线 |
| `thincoder-server/src/ops/update.mjs`（已落盘） | **239**（实读 2026-10-06——设计估 ≈160；§5.4 a–c；#963 +11 = 状态导出 `getStatus`） | 更新机制 |
| `thincoder-server/src/ops/presets.mjs`（已落盘） | **51**（实读 2026-10-09——设计估 ≈45）**⇒ 实读 52**（本批：`gemini-openai` 行 ∥ 头注随正——实读） | 预设表（`SERVER_PRESETS`——起步 **21** 家 `{ baseURL }`；**2026-10-09 清除批：零 `model` 键**） ∥ 展开（`expandProviderEntry`：`name` 缺省 ∥ 覆盖 ∥ 未知预设拒启） |
| `thincoder-server/src/ops/log.mjs`（已落盘） | **35**（实读 2026-10-06——设计估 ≈35） | 单行 JSON 日志（stdout） |
| `thincoder-server/src/ops/cli.mjs`（已落盘） | **179 ⇒ ≈195**（实读 2026-10-06——设计估 ≈240；本批 +≈16 = 四命令审计写（member add ∥ member passwd ∥ key issue ∥ key revoke——actor = `cli`））**⇒ 实读 189 ⇒ ≈215**（配额批：member quota 换形（model 参） ∥ `usage reconcile` 新组（布尔参） ∥ member list 列随正） | 运维 CLI（成员/密钥/对账） |
| `thincoder-server/config.example.json`（已落盘） | **35**（实读 2026-10-06——设计估 ≈40；#961 +1 = `autoUpdate`；#963 +2 = `trustProxy` ∥ `usageRetentionDays`）**⇒ 实读 38**（本批：`proxy` 段示例——实读）**⇒ ±0（配置控制台批：零改——容器路 `db` 绝对形见 §5.1 注）** | 配置模板（无真 key——预设形 ∥ 手写形并存） |
| `thincoder-server/deploy/thincoder-server.service`（已落盘） | **34**（实读 2026-10-06——设计估 ≈40；本批 +2 = 前缀 env ∥ ExecStart） | systemd unit 模板（裸机路——Restart=always ∥ 开机自启 ∥ journald） |
| `thincoder-server/deploy/docker-entrypoint.sh`（已落盘） | **7**（实读 2026-10-06——设计估 ≈12；§5.1）**⇒ ±0（配置控制台批：`--config` 路径随正 `/app/config/config.json`——文本改，行数零变）** | 容器入口（壳——`exec … --config /app/config/config.json`） |
| `thincoder-server/deploy/converge.mjs`（已落盘） | **197**（实读 2026-10-06——设计估 ≈85；§5.4(d)） | 壳引导收敛（零 App 依赖——自足） |
| `thincoder-server/Dockerfile`（已落盘） | **34**（实读 2026-10-06——设计估 ≈30；#961 +12 = 壳化重设计；#963 +6 = `HEALTHCHECK`——§5.9） | 镜像构建（壳 + 构建期预装——§5.1） |
| `thincoder-server/.dockerignore`（已落盘） | **8**（实读 2026-10-06——设计估 ≈10；本批 +1 = 注释随正——清单不变）**⇒ ≈9（配置控制台批：+1 = `config/` 排除——挂载形随正（构建上下文防泄）**⇒ 实读 12**（2026-10-09 配置控制台批落地后——+4）** | 构建上下文排除（config.json ∥ config/ ∥ data ∥ docs ∥ .git） |
| `thincoder-server/docker-compose.yml`（已落盘） | **20**（实读 2026-10-06——设计估 ≈30；#961 +4 = env ∥ 注释；#963 +1 = healthy 继承注记——§5.9）**⇒ ≈24（配置控制台批：卷行改目录级 rw 挂载 ∥ 用法注释随正 +≈4）⇒ 实读 **22**（2026-10-09 配置控制台批落地后——+2）** | 容器样例（端口 ∥ 卷（配置目录 rw ∥ 数据） ∥ env_file ∥ restart: unless-stopped） |
| `thincoder-server/deploy/backup.mjs`（已落盘） | **无 ⇒ 86**（实读 2026-10-06——设计估 ≈45；在线备份脚本：node:sqlite `backup()` ∥ `--config`/`--out` ∥ 时间戳命名——§5.5） | 备份（命令化——定时器样例在 README §9） |
| `thincoder-server/deploy/thincoder-runner.service`（拟新增） | ≈30（设计估——systemd unit：runner 守护；§5.10） | 沙盒 runner 机（`RUNNER.md` §8） |
| `thincoder-server/deploy/sandbox/Dockerfile`（拟新增） | ≈35（设计估——盒镜像：node 基座 + git/curl + 非 root） | 沙盒盒镜像（`RUNNER.md` §3） |
| `thincoder-server/README.md`（已落盘） | **241 ⇒ ≈255**（实读 2026-10-06——#961 +17 = 更新章 ∥ 部署章随动；#962 +4 = §2 种子句 ∥ §6 控制台 ∥ §10 热载句收正；#963 +94 = §9 重写 ∥ §10–12 新节 ∥ §2 两行 ∥ §3 微改 ∥ §4/§6/§13 随动；i18n +1 = §6 控制台多语言行；本批 +≈14 = §6 控制台节随正（九页 ∥ 状态灯 ∥ 审计） ∥ §10 成员接入（向量调用句））**⇒ 实读 247（2026-10-09）⇒ 实读 252**（本批 proxy：配置表行 ∥ 代理说明——实读）**⇒ 实读 256（2026-10-09——配置控制台批落地后：§6 控制台节随正 ∥ 配置写面句 ∥ 容器路配置目录前提；embed 解耦批 ±0——实读收正）⇒ ≈257（2026-10-09 alias 批：#967 注一行 +≈1——实读待回填）⇒ ≈258（2026-10-09 代理页批：§6 控制台节随正（代理页入场）+ 写面句改指——+≈1）⇒ 实读 258（2026-10-09 代理页批落地后：三处 hunk 全行内改——净 0）⇒ ≈318（server-exec-sandbox 批：§5.10 runner 部署节 +≈60——实读待回填）** | 运维面：安装（npm ∥ Docker） ∥ 部署（systemd ∥ compose） ∥ 启动（首启引导） ∥ CLI 用法 ∥ 控制台 |
| **小计** | **≈762 ⇒ 1246 ⇒ 1270 ⇒ 1506 ⇒ 1507 ⇒ ≈1556**（#961 实读——+484 = 新三档 432 = update 228 ∥ converge 197 ∥ entrypoint 7；增档增量 52 = bin +9 ∥ config +6 ∥ example +1 ∥ service +2 ∥ Dockerfile +12 ∥ dockerignore +1 ∥ compose +4 ∥ README +17——presets ∥ log ∥ cli 零动；#962 实读 +24 = bin +4 ∥ config +16 ∥ README +4；#963 实读 +236 = backup 新 86 ∥ README +94 ∥ bin +27 ∥ update +11 ∥ config +9 ∥ Dockerfile +6 ∥ example +2 ∥ compose +1；i18n 实读 +1 = README **241**——其余零动；本批估 +≈49 = bin +19 ∥ cli +16 ∥ README +14）⇒ +≈19（配置控制台批：bin +≈2 ∥ README +≈12 ∥ `docker-compose.yml` +≈4 ∥ `.dockerignore` +≈1；余档 ±0——实读待回填）⇒ 实读增量 **+12**（2026-10-09 配置控制台批落地后——逐档见上表）**⇒ +10（2026-10-09 embed 解耦批：`config.mjs` +10 ∥ `README.md` ±0——实读收正）⇒ +≈6（2026-10-09 alias 批：`config.mjs` +≈5 ∥ `README.md` +≈1——实读待回填）⇒ +≈3（2026-10-09 代理页批：`bin` +≈2 ∥ `README.md` +≈1；`config.mjs` ±0——`validateProxyConfig` 复用零改）⇒ 实读增量 **+2**（2026-10-09 代理页批落地后：`bin` **+2** ∥ `README.md` 净 **0**——三处 hunk 全行内改；`config.mjs` ±0）⇒ +≈127（server-exec-sandbox 批：`deploy/thincoder-runner.service` 新 ≈30 ∥ `deploy/sandbox/Dockerfile` 新 ≈35 ∥ `README.md` +≈60；`bin/thincoder-server.mjs` 增 ≈+6——控制面计（`SANDBOX.md` §13）∥ runner 入口 `bin/thincoder-runner.mjs`（拟新增）另档计（`RUNNER.md` §9）——实读待回填）** | —— |

provider 面回填（2026-10-06——批 `docs/batches/2026-10-06-console-providers.md`）：增量实数 = `config.mjs` **+16** ∥ `bin/thincoder-server.mjs` **+4** ∥ `README.md` **+4** ∥ `config.example.json` ±0——已并入上表。

first-release-completeness 面回填（2026-10-06——批 `docs/batches/2026-10-06-first-release-completeness.md`）：增量实数 = `config.mjs` **+9** ∥ `update.mjs` **+11** ∥ `bin/thincoder-server.mjs` **+27** ∥
  `Dockerfile` **+6** ∥ `docker-compose.yml` **+1** ∥ `README.md` **+94** ∥ `config.example.json` **+2** ∥ `thincoder-server/deploy/backup.mjs` 新 **86**——已并入上表。

## 7. 验收判据（机检面）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| 非功能 · 仅内网 | `host` 必填（缺失 ⇒ 拒启——fail-closed）；`0.0.0.0` ⇒ 启动警告 | 批内件 |
| AC-8（功能点 8——分发与部署） | `npm pack --dry-run` 通过（`files` 白名单齐 ∥ 零 install 步）∥ `docker build` 成功 + compose 起停通 ∥ systemd unit 安放可启（`systemd-analyze verify` ∥ `enable --now` 后 `is-active`——unit 模板 = §5.2） | 收口轮（真机；发布动作 = 发布面轮） |
| AC-9（功能点 9——provider 预设；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 预设形展开（`{"preset":"deepseek","apiKey":"env:X"}` ⇒ `name`=`deepseek` ∥ `baseURL`=预设值 ∥ `models`= 空（预设表零 `model` 键——2026-10-09 清除批）⇒ 经「模型发现」勾选后 `/v1/models` 含 `deepseek/<选中模型>` ∥ 经 mock 上游完成一次请求）；未知预设名 ⇒ 拒启（报错列可用名）∥ `name` 缺省 = 预设名（显式者胜）∥ 条目覆盖 `baseURL`/`models` 生效 ∥ 手写形回归零变 ∥ 漂移件（CLI 表对照）绿 ∥ 名单含 `gemini-openai`（Google 官方 OpenAI 兼容端点——OpenAI 形入子集；2026-10-09 本批） | 批内件（`docs/batches/2026-10-06-server-presets.test.mjs`——已落盘 349 行） |
| AC-10（功能点 10——自动更新；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 自检（假 registry ⇒ 触发 ∥ 404/失败 ⇒ 静默）∥ 档位三值语义 + 非法值拒启 ∥ 自升执行器（成功 ⇒ 优雅停机；失败/超时 ⇒ 不退 ∥ 旧版续跑）∥ 启动日志 `ready` 行含 `version` ∥ 容器收敛判定表（converge 矩阵）；`docker build` + 起停 = 收口轮真机（#959 条件行同窗） | 批内件（`docs/batches/2026-10-06-server-auto-update.test.mjs`——已落盘 498 行）+ 收口轮 |
| AC-11（功能点 11——种子与生效面） | 种子四格（库空+段 ⇒ 导入且 `env:` 保形 ∥ 非空库+段 ⇒ 忽略 + 警告 ∥ 两空 ⇒ 允许起 + 警告「零 provider」）∥ 零 provider 允许态（`/v1/models` = 空清单 ∥ chat ⇒ 404）∥ `env:` 缺位（启动 ⇒ 拒启 ∥ 保存 ⇒ 400）；端到端判据全文 = `gateway/API.md` §5 AC-11 行 | 批内件 |
| AC-13（功能点 12——首版完备化⑤面与本域接线；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | ⑤ 部署文档：README 结构断言（成员接入节 ∥ nginx 完整段 ∥ 备份命令/定时器样例 ∥ 恢复步）∥ `thincoder-server/deploy/backup.mjs`（已落盘 86 行）实跑 ⇒ 快照生成 + 可开（含热库在线备份）∥ Dockerfile `HEALTHCHECK` 行在册；配置校验：`trustProxy` 非布尔 ∥ `usageRetentionDays` 非法 ⇒ 拒启 | 批内件 + 收口轮 |
| 功能点 8（分发与部署——npm 全局装启动链；缺陷 #1113） | 经符号链接（bin 垫片形 ∥ 目录连接形）调用入口 ⇒ 程序真执行（进入正常输出/错误路径——非静默退 0）；路径不可解析 ⇒ 显式报错（非静默）；普通 `node <真身路径>` 调用不回归 | 批内件（`docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`——已落盘 112 行） |
| 上游代理（台账 #1129——机制 = `gateway/API.md` §6 KD-SV-55） | 判定（旗 `proxy: true` ∧ 顶层 `proxy.uri` 在案 ⇒ 经代理；缺省 ∥ 无 uri ⇒ 直连——两条链同判定：chat 转发 ∥ 模型发现）；loopback 目标恒直连；假代理回放（CONNECT 命中 + SSE 逐块透传）；代理不可达 ⇒ 502 `upstream_error`；代理路径断连 ⇒ 中止上游 + 记 `status='aborted'`（§2.1 契约零回归）；启动 warn 两条（明文 `http:` ∥ 旗 `true` 缺 uri——触发/文案 = KD-SV-55）；迁移 v9（空库 9 ∥ v8 升 9 ∥ 幂等）；配置面：顶层 `proxy` 段校验（非法 ⇒ 拒启）∥ 条目 `proxy` 布尔判据（非布尔 ⇒ 拒启/400）∥ 管理面字段往返（POST/PATCH/GET）；控制台勾选（添加 ∥ 详情两窗） | 批内件 + 收口轮（浏览器实走） |
| AC-6（功能点 6——嵌入配置可选与禁用形态；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 缺 `embedding` 段（∥ 显式 `null`）⇒ 载入通过 + 警告恰一条（嵌入未配置）∥ 服务照常起（`/healthz` 200）∥ 缺段档创建（PATCH `embedding` ⇒ 建段 ⇒ 重启启用）∥ 在场非对象 ∥ 缺子键 ⇒ 拒启 ∥ 400（文件零变）；判据全文 = §9 B33/B34 ∥ E22 | 批内件 |
| AC-28（功能点 28——配置控制台写面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 写路径机检（`config-admin.mjs` 导出直测）：白名单（未知键 ⇒ 400）∥ 合并保未知键（写回后非托管键原样）∥ 校验门（非法值 ⇒ 400 且文件字节零变；`env:` 缺位 ⇒ 400）∥ 原子写（tmp 零残留 ∥ rename 覆盖 ∥ 落盘形 = 2 空格缩进 + 末尾换行同现档）∥ 单写者（同步段无交错）∥ 生效标注统一「重启生效」∥ 审计行（`config_update` ∥ detail = 键名清单 ∥ 值零入）∥ 写后 GET 回读逐值（round-trip） | 批内件 |
| AC-29①③（功能点 29——配置形与唯一性：种子/配置面；已落需求档——`docs/server/requirements/PROJECT.md` 验收表） | 条目两形（字符串 ∥ `{ name, alias }`）经三径校验同助手（载入 ∥ 启动构建/种子 ∥ 保存——`validateProviderEntry`/`validateProviderEntries`）∥ 别名非法（空 ∥ 含斜杠 ∥ 首尾空白 ∥ 跨 provider 重名）⇒ 拒启（配置面）∥ 400（保存径——库与运行时零变）∥ 种子条目别名原样入库（控制台可改——别名变更当即生效）；对外标识句 = §1（无斜杠裸名归别名形；`/v1/models` = 对外标识清单）；判据全文 = `gateway/API.md` §5 AC-29 行 | 批内件 + 收口轮 |
| 沙盒执行面（server-exec-sandbox 批——台账 #1224；需求 §5 沙盒块 + 用户 14:00 裁定） | `sandbox/RUNNER.md` §7 doctor（核心项 FAIL ⇒ 拒跑）∥ §3 盒参数表（read-only ∥ 唯一卷 ∥ tmpfs 例外 ∥ cap-drop ∥ 非 root ∥ 每工作区网络）∥ §5 配额两机制 ∥ §6 快照 ∥ §8 部署（unit 安放可启——收口轮真机）；探针 P1–P14 = `sandbox/SANDBOX.md` §12 | 批内件 + 收口轮（真机 runner） |

## 8. 关键决策（本域）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-SV-15 | **首启 admin 引导 = config `bootstrap` + 幂等**：仅零 admin 时依配置创建（`username` ∥ `password`——支持 `env:`）；建后配置可撤；零 admin 且未配置 ⇒ 启动告警；非零 ⇒ 跳过 | 「首启引导（env 或本机 CLI）」的需求形；幂等 = 只建不改（不覆盖已改口令）∥ 配置口令 ⇒ 操作者已知首密、零额外步骤 | 固定缺省口令（admin/admin123——裸奔）· 仅 CLI 建首管（多一步壳访问）· 每启对账改写（会把 admin 已改的口令回滚——非幂等） |
| KD-SV-17 | **provider 预设 = server 自持表（快照——起步 21 家 OpenAI 兼容子集）**：`thincoder-server/src/ops/presets.mjs`（已落盘 52 行）静态表 `{ baseURL }` × 展开（`name` 缺省 = 预设名 ∥ 条目覆盖 `baseURL`/`models` ∥ 未知预设名拒启）；漂移 = 手工同步 + 批内件断言 | 需求 = 免手写 `baseURL`（功能点 9——2026-10-09 清除批：模型面走「发现」勾选）；自持 ⇒ 引核口径 KD-SV-78（运行时不 import core）∥ 表极小（≈45 行）∥ 快照口径 + 漂移件兜同步 | ② 边界例外引 core（重开引核口径 KD-SV-78——为 ≈40 行数据表动架构决策不值；核表字段面 ≠ server 面（`format`/`chatPath` 一族不消费）；且沿批档 §1 边界须停下上抛）· ③ 外部脚本生成（生成步 = 变相构建——违「无构建步骤」；产物仍为仓内快照——机制多而无得） |
| KD-SV-18 | **自动更新 = 两路统一 npm 版本身份（自检 + 档位 + 自升执行器；容器 = 壳）**：版本真相 = npm 包（镜像 tag 不承担版本语义）；自检 = registry `latest`（`NPM_CONFIG_REGISTRY` 可指内网镜像；失败/404 静默）；`autoUpdate` = `false ∥ "notify" ∥ "auto"`（缺省 `"notify"`——可见不越权；`"auto"` = opt-in）；自升 = `npm i -g @thincoder/server@<版号>` 子进程（超时 120s；成功 ∧ 复读校验 ⇒ 优雅停机 ⇒ 守护重起；失败 ⇒ 恒保留旧版）；容器 = 壳镜像（构建期上下文包体预装——离线可运行；`TC_SERVER_VERSION` 三态收敛：空/钉/`latest`；钉版抑制自装）；全文 = §5.4 | 用户 15:33/15:37 两令（两路统一 npm 路径 + 容器壳化）；「退出 ⇒ 重起」两路守护既有（unit `Restart=always` ∥ compose `restart: unless-stopped`）；零第三方依赖（fetch = node 内建 ∥ 自升走 npm CLI）；自持实现（先例语义参考 `thincoder-cli/src/upgrade.mjs:7-19`——零代码共享：跨包不可 import） | 外部看门器（Watchtower ∥ 宿主定时——用户裁作废：版本路径不统一）· 容器烤树形镜像（版本身份由镜像承担——用户裁弃）· 自装改由 CLI 代跑（无进程常驻处 ∥ 守护不在 CLI 面）· 轻端点/响应头做版本可见性（新面/热路径——ready 行字段足） |
| KD-SV-19 | **provider 配置面 = 库单源 + 保存即热生效**：控制台管理（`providers` 表——迁移 v2）；密钥落库（明文 ∥ `env:` 引用并存——引用保形）；`config.json` 的 `providers[]` 降为**一次性种子**（空库导入；非空库忽略 + 警告）；热生效 = 注册表重建 + 原子换表（在途请求 = 派发时快照） | 用户 2026-10-06 16:01 令（「不再只靠 `config.json` + 重启」）；库 = 运行期单源（迁移链 G2 断点）；热生效免重启（零守护依赖 ∥ 亚秒级）；`env:` 保形（密钥卫生——种子不物化秘密）；预设衔接 = 界面「从预设快速添加」复用 `presets.mjs`（KD-SV-17） | 保存即重启（在途全断 ∥ 无守护场景不可用 ∥ 与自升停机面语义叠）· config 主从双向同步（漂移面 ∥ 无必要）· 全弃 config 段（旧部署须手抄——首启导入零成本更优）· `env:` 载入期解析 + 种子物化入库（密钥卫生退化）· meta 表种子标记（为罕见边角增表——表空即导 + 警告口径足） |
| KD-SV-23 | **健康检查 = `GET /healthz`（无鉴权只读探活）**：`{ status, version, uptime, db }`（`SELECT 1` 一探）；db 故障 ⇒ 503 `degraded`；no-store；接线 = Dockerfile `HEALTHCHECK` 单源（compose 继承——§5.9；探针面契约 = `gateway/API.md` §2.3） | 探针入口须零凭据（Docker/监控直调）；只读单探 = 零副作用；`version` 与 `ready` 行同源；接线单源 = 改一处 | 鉴权式（探针无法持会话/团队 key——接不进）· 并入 `/v1` 面（探针须持 key——否）· 详细依赖探活（膨胀——仅 db 一探）· 非 HTTP 探针（进程在 ≠ 服务可用） |
| KD-SV-24 | **版本/更新可见面 = `GET /api/system`（会话——两角色）+ 控制台（meta 槽 ∥ 系统页）**：`{ version, update: { mode, lastCheckAt, latest } }`——数据 = 更新器进程内状态（`getStatus()` 导出）；`latest` = 已见新版（无/未检/失败 ⇒ `null`——静默同面） | 浏览器不可读日志 ⇒ 控制台可见须 HTTP 数据面（#961「ready 行足」限定 = 部署面——两消费方不同，不相抵）；系统页 = admin（动作方）；meta 槽 = 全角色（版本非敏感） | 并入 `/api/me`（语义 = 本人——服务器信息越界）· healthz 携更新字段（探活语义膨胀）· 日志/外发通知（控制台不可读） |
| KD-SV-25 | **部署文档完备 = README 定稿（反代 = nginx 完整段 ∥ 备份 = `deploy/backup.mjs`（已落盘 86 行）+ systemd 定时器样例）**：反代段 = body 上限（缺省 32m ∥ 快照路由 200m） ∥ SSE 免缓冲 ∥ `X-Real-IP`；备份 = node:sqlite `backup()`（WAL 在线一致——免停写窗；零外部工具） | 用户 16:04 令；nginx = 最常见 ∥ 不预设自动证书（内网自签直白）；node 自带备份 = sqlite3 CLI 不保证在；在线备份 = 免停写、与运行实例并存 | caddy（自动 HTTPS 面向公网域名——内网假设不符）· `sqlite3` CLI `.backup`（外部依赖）· 停写窗 `cp`（易漏 WAL 伴档）· cron 样例（与 systemd 部署面两套）· 定时器落 `deploy/` 真件（样例在 README 足） |
| KD-SV-53 | **bin 主入口判据 = `argv[1]` 经 `realpathSync` 解析后与 `import.meta.url` 比对（#1113）**：符号链接（npm 全局装（POSIX）垫片）∥ 目录连接（dev 树 junction）两形均可主入口执行；路径不可解析 ⇒ 抛（显式报错——不静默）；比较用 `node:fs` `realpathSync`（拼写保持面——与 ESM 装载器的模块 URL 解析同面；`.native` 会归一盘符/大小写——小写拼写调用恒假） | 缺陷双证（ECS 2026-10-09：垫片形 = 零输出退 0、服务永不启动；真身直跑 = 真执行）+ 本机实证（2026-10-09：文件符号链接 ∥ junction 两形旧判据恒假、realpath 判据恒真） | 仅 `resolve()` 面（不解析链接——同病）· `realpathSync.native`（大小写归一与装载器拼写保持面不咬合）· `throwIfNoEntry: false` 吞缺位（静默面残留）· 仅文档约定「勿用符号链接调用」（根因不动）· 部署壳绕行长期化（ECS `entrypoint:` 覆盖 = 临时态——随修复移除） |
| KD-SV-56 | **配置控制台 = 文件面读写 + 重启生效 + 原子写 + 校验单源 + 单写者**：写端点 = `PATCH /api/admin/config`（白名单五键 ∥ 未知键 400 ∥ 合并保未知键 ∥ 载入面等价两跳门 ∥ 同目录 tmp ⇒ `rename` ∥ 审计 `config_update`）；读 = 文件面有效值（缺省回填 ∥ 密钥掩码）；`host`/`port`/`db` 只读展示（定则例外显式说明）；容器路写面前提 = 配置目录级可写挂载（§5.1） | 用户 2026-10-09 15:51–15:57 定则（「任何配置项必须有配置界面」——台账 #1139 ∥ #1138 ∥ #1123）；文件面 = 单源不改（KD-SV-19 库面零涉）；原子写 = 半写零暴露（同目录 tmp ⇒ `rename`）；校验门复用载入单源（写入的文件必可载入）；单写者 = 部署模型单实例 | 运行态注入（逐消费点快照差异 ⇒ 语义碎片 + 触「不重构 config 加载」红线）· 内存主/文件辅（双源漂移）· `host`/`port`/`db` 可写（改端口 = 自断 ∥ 改库 = 迁移动作）· 配置版本史/回滚（零需求新存储面）· 写前 `.bak` 备份（部署面 §5.5 已有）· 单文件挂载维持（保存必失败——挂载形与写面互斥） |
| KD-SV-57 | **嵌入配置可选 = 禁用态 + 控制台可从无到有创建（2026-10-09 embed 解耦批；台账 #1147——用户 17:24「这个约束不合理，不应该强制必须配置以后才能启动」）**：`embedding` 缺位 ∥ `null` ⇒ 归一 `null`（服务照常起 + 启动警告一条）；禁用语义 = `/v1/embeddings` ⇒ 404 `model_not_found`（消息明示未配置——**零新码**）；在场 ⇒ 严格校验保持（`baseURL` http(s) ∥ `model` 非空；部分子键 ⇒ 400）；控制台向量卡「未配置」态 + 保存创建（同一 PATCH——缺段合并建段）；全下游随动 = `/api/system.embedding.model = null` ∥ `GET /api/admin/embedding` 两值 `null` ∥ 探活无草稿 ⇒ 400（携草稿照常）；生效 = 重启 | 用户 17:24 裁（强制配置「不合理」）；「服务照起 + 缺时明确禁用语义」= 批档条目①目标形；错误码沿既有族（零新码纪律）；引擎可不在线语义不变（启动路径零探引擎——既有） | 保持必填（用户裁否）· 503 `service_unavailable` 新码（零新码纪律 + 家族沿袭——否）· 缺配静默 200/空向量（谎报——否）· 客户端直连引擎回落（拆面——否）· 控制台删除/清空段（写面仅创建/改值——缺段 = 编辑配置文件——否） |

## 9. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| B7 | 边界 | 零 admin 库 + `bootstrap` 配置在场，连续两次启动 | 第一次建 admin；第二次跳过（不重建 ∥ 不改密——幂等） |
| N12 | 正常 | 预设形条目（`{"preset":"deepseek","apiKey":"env:X"}`）载入 | `name`=`deepseek` ∥ `baseURL`=预设值 ∥ `models`= 空清单（2026-10-09 清除批：预设表零 `model` 键）⇒ 经「模型发现」勾选后 `/v1/models` 含 `deepseek/<选中模型>` |
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
| N21 | 正常 | `node thincoder-server/deploy/backup.mjs --config <档>`（库在盘） | 快照文件生成（时间戳名）；可开（与源库行数一致） |
| B17 | 边界 | 服务运行中（热库 ∥ WAL）执行备份 | 快照一致可用（在线备份——无需停写）；源库零触 |
| E18 | 错误 | `usageRetentionDays` 非法（0 ∥ 负 ∥ 非数） | 拒启（fail-closed） |
| E19 | 错误 | `trustProxy` 非布尔 | 拒启（fail-closed） |
| B30 | 边界 | 经符号链接（bin 垫片形）∥ 目录连接形调用入口（无 `--config`）∥ 不可解析 `argv[1]`（伪构造：不存在路径 + 动态导入） | 程序真执行：`startup_failed` + 退 1（非静默退 0）；不可解析 ⇒ 显式报错（非静默——退非 0）；普通 `node <真身路径>` 调用同读数（不回归） |
| N22 | 正常 | 预设形条目（`{"preset":"gemini-openai","apiKey":"env:X"}`）载入 | `name`=`gemini-openai` ∥ `baseURL` = Google 官方 OpenAI 兼容端点（`https://generativelanguage.googleapis.com/v1beta/openai`）∥ `models` = 空清单 |
| B31 | 边界 | 条目 `proxy: true` + 顶层 `proxy` 段在场 + baseURL = loopback（127.0.0.1 mock） | 直连（loopback 旁路——假代理零命中）；同形非 loopback ⇒ 经代理 |
| E20 | 错误 | 顶层 `proxy` 非对象（数组 ∥ 数字）∥ 顶层 `proxy.uri` 非法（非字符串 ∥ 空串 ∥ 非 URL ∥ 裸串形 ∥ scheme 非 `http:`——仅 `http:` 收） | 拒启（fail-closed；报错提示规范形 `{ "uri": "http://host:port" }`） |
| E21 | 错误 | 条目 `proxy` 非布尔（如 `"yes"`） | 拒启（配置载入径）∥ 400（控制台保存径——库与运行时零变） |
| B32 | 边界 | 控制台 PATCH（`usageRetentionDays` ∥ `proxy.uri` ∥ `embedding.model`）⇒ 重启 | 启动按新值运行（保留清理窗/代理判定/引擎指向随动——文件面读写闭环）；未重启 ⇒ 运行值不变（重启生效标注语义） |
| B33 | 边界 | 配置档缺 `embedding` 段（∥ 显式 `null`）⇒ 载入 + 起服 | `loadConfig` 通过（warnings 恰含一条「嵌入引擎未配置」）；服务照常起（`/healthz` 200 ∥ `ready` 行在）——嵌入面禁用态（2026-10-09 embed 解耦批） |
| B34 | 边界 | 缺段档 + admin PATCH `embedding:{baseURL,model}` ⇒ 重启 | 200（建段——原子写落盘）⇒ 重启后嵌入面启用（`/v1/embeddings` 照常 ∥ `/api/system.embedding.model` = 新值）；缺段档 PATCH 他键（`trustProxy`）⇒ 200（门容缺段） |
| E22 | 错误 | `embedding` 在场非对象（字符串 ∥ 数组 ∥ 数字）∥ PATCH `embedding:{baseURL}` 缺 `model` | 拒启（fail-closed）∥ 400（文件零变——在场须完整） |

## 10. 本域边界（不做的面）

- 日志落盘/轮转（裸机 = journald ∥ 容器 = docker logs——采集归各平台） ∥ **`config.json` 文件热载**（文件改动仍须重启；**provider 数据面 = 保存即热生效**——机制 = `gateway/API.md` §2.2） ∥ TLS 终结（前置反代） ∥ 进程内自动备份/巡检面（备份 = 部署侧面：命令 + 定时器样例——§5.5） ∥ Windows 守护面（部署时定写法）——均不做。
- provider 管理面不做：本机 CLI 面 ∥ URL 白名单/出口限制（admin 自担）——归 `gateway/API.md` §8。
- 更新面不做：渠道（beta ∥ canary） ∥ 灰度分批 ∥ 多版本并存（A/B 双装 ∥ 秒切） ∥ 进程内热载 ∥ 认证型 registry 的自检凭据面（fetch 不带 npm 凭据——如内网镜像要求认证 ⇒ 自检静默不更新；自装经 npm 凭据面但需手工触发） ∥ 自动备份（回滚前备份 = 命令 + 定时器样例——§5.5）。
- 健康面不做：metrics/Prometheus ∥ 深度依赖探活 ∥ `unhealthy` 自动处置（探针接线 = §5.9）；反代配置生成/托管不做（样例仅文档——§5.6）；备份轮转/保留策略不做（部署方自管）。
- 配置控制台面不做（2026-10-09 配置批）：`config.json` 热载/运行态注入（生效 = 统一重启——§10 不破）∥ `host`/`port`/`db` 写面（部署拓扑项——只读展示；定则例外显式说明）∥ 配置版本史/回滚 ∥ 写前 `.bak` 备份（备份 = 部署侧面——§5.5）∥ 多实例并发写（部署模型 = 单写者）。
- 嵌入配置面不做（2026-10-09 embed 解耦批）：控制台删除/清空 `embedding` 段（缺段 = 编辑配置文件；界面仅创建/改值）∥ 嵌入面新错误码（404 `model_not_found` 复用——零新码）∥ 引擎进程起停管理（手动——不变）。
- 别名面不做（2026-10-09 alias 批——KD-SV-59）：配置/控制台面别名批量编辑 ∥ 别名历史（改别名当即生效）∥ 别名与带前缀名的交叉排歧（形上不相交——别名无斜杠）；机制全文 = `gateway/API.md` §6 KD-SV-59。
- 沙盒 runner 面不做（server-exec-sandbox 批）：runner 自动更新（升级 = 重装重启）∥ 盒镜像内容治理（镜像 = 部署面）∥ 入站/端口转发 ∥ IPv6——全文 = `sandbox/RUNNER.md` §12 ∥ `sandbox/SANDBOX.md` §16。

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
- 2026-10-06：首版完备化设计轮（批 `docs/batches/2026-10-06-first-release-completeness.md`——需求 §2:12 ∥ 台账 #963）——§1 增 `trustProxy` ∥ `usageRetentionDays`（表 ∥ 模板 ∥ 启动校验）∥ §4 启动链补保留清理 ∥ §5.4(g) 补控制台可见面句 ∥ §5.5 备份重写（`thincoder-server/deploy/backup.mjs`（拟新增）在线快照 + 定时器样例）∥ §5.6 增反代样例（nginx 段要点 + `trustProxy` 前提）∥ §5.7 ⑤ 补 healthy 核对 ∥ §5.9 增健康检查接线 ∥ §6 预算（backup 拟新增 ≈45 + 叠加段）∥ §7 补 AC-13 候补行（⑤ 面）∥ §8 增 KD-SV-23/24/25 ∥ §9 增 N21 ∥ B17 ∥ E18/E19 ∥ §10 边界随正；同源随动 = `gateway/API.md` §2.3 ∥ `metering/METERING.md` §1 ∥ `accounts/ACCOUNTS.md` §2 ∥ `webui/WEBUI.md` §2.1。
- 2026-10-06：fix 轮（评审轮次 1 #2/#3/#6/#8/#9/#11 收正——批 `docs/batches/2026-10-06-first-release-completeness.md` §3）：#2 §4 停机链补「清周期定时器（更新循环 ∥ 保留清理同法）」∥ #3 §5.1 门禁件数收正（八件 ⇒ 十件）∥ #6 §1 删「推翻式」残留（保「用户令」出处）∥ #8 §5.9 补容器路 `host` 注 ∥ #9 §5.5 补恢复步 + §7 AC-13⑤ 行随正 ∥ #11 §5.5 补 `backup()` 回退句。
- 2026-10-06：KD-SV-19 理由句收正（父侧直接执行 · 机械 · 可 revert）——删「推翻「配置不热载」」残留（保用户令出处；同 #6 法——全档「推翻式」归零）。
- 2026-10-06：AC-13 行候补标记收正（父侧直接执行 · 机械 · 可 revert——已落需求档验收表）。
- 2026-10-06：实施后回填轮（R14——批 `docs/batches/2026-10-06-console-providers.md`）：§6 行数按实读收正（bin **126** ∥ config **180** ∥ README **146**；小计 1246 ⇒ **1270**）；provider 面随动段转回填记录。
- 2026-10-06：实施后回填轮（R16——批 `docs/batches/2026-10-06-first-release-completeness.md`）：§5.5/§7/§8 backup 标记翻正；§6 行数按实读收正（update **239** ∥ config **189** ∥ bin **153** ∥ Dockerfile **34** ∥ compose **20** ∥ backup **86** ∥ README **240** ∥ example **35**；小计 ⇒ **1506**）；随动段转回填记录。
- 2026-10-06：实施后回填轮（R18——批 `docs/batches/2026-10-06-server-i18n.md`）：§6 README 行实读收正（**241**——控制台节多语言行；小计 ⇒ **1507**）∥ §5.1 门禁件数随正（十件 ⇒ 十一件——本批件入列）。
- 2026-10-06：控制台可见面二轮设计轮（批 `docs/batches/2026-10-06-console-completeness-2.md`——需求 §2:15 ∥ 台账 #972）——§1 `usageRetentionDays` 行补「审计同窗」∥ §3 增 CLI 审计句 ∥ §4 启动链同拍（审计清理同周期）∥ §6 预算（bin ⇒ ≈172 ∥ cli ⇒ ≈195 ∥ README ⇒ ≈255；小计 ⇒ ≈1556）。
- 2026-10-06：fix 轮（评审 #69——批 `docs/batches/2026-10-06-console-completeness-2.md` §3 十项，本档面）：§5.1 门禁件数随正（十一件 ⇒ 十二件——本批件入列；清单文本 = `thincoder-server/package.json` 单行添项——实施轮落地）。
- 2026-10-07：配额分模型批设计轮（批 `docs/batches/2026-10-07-quota-per-model.md`——需求 §2:21 ∥ §2:22 ∥ 台账 #990/#991/#992）——§1 `usageRetentionDays` 行补「派生两表同窗」∥ §3 CLI 块随正（member list 列（分模型覆盖数） ∥ member quota 换形（+ model 参） ∥ `usage reconcile` 新组（--month/--fix））∥ §6 预算（config 252 ⇒ ≈262 ∥ cli 189 ⇒ ≈215）；机制全文 = `metering/METERING.md` §1/§2。
- 2026-10-09：bin 入口 guard 修复设计轮（批 `docs/batches/2026-10-09-server-bin-guard-fix.md`——台账 #1113）——§4 增入口判据条（`argv[1]` realpath 解析 ∥ 不可解析 ⇒ 显式报错 ∥ import 不自动执行；判据行最终形与注释在册）∥ §6 bin 行预算（实读 176 ⇒ ≈179）∥ §7 补功能点 8 判据行（符号链接调用不静默）∥ §8 增 KD-SV-53 ∥ §9 增 B30。
- 2026-10-09：fix 轮（评审轮次 1 #1–#3——批 `docs/batches/2026-10-09-server-bin-guard-fix.md` §3）：#1 §7 功能点 8 判据行补「路径不可解析 ⇒ 显式报错（非静默）」支（机检腿入批内件）∥ §9 B30 输入/预期扩同支 ∥ #2 §5.1 门禁件数随正（十二件 ⇒ 27；本批件入链 ⇒ 28）∥ #3 §6 bin 行预算收正（≈179 ⇒ ≈178；+≈2 = `realpathSync` import ∥ 注释——判据行就地改写 ±0）。
- 2026-10-09：fix 轮（评审轮次 1 #1——批 `docs/batches/2026-10-09-server-console-testkey-fix.md` §3）：§5.1 门禁件数随正（28 ⇒ 29——本批件入链；七件断言随正登记 = `design/PROJECT.md` §6 本批预算行 ∥ §9 R44③）。
- 2026-10-09：实施后回填轮（bin 入口 guard 修复批——批 `docs/batches/2026-10-09-server-bin-guard-fix.md`）：§7 功能点 8 判据行「拟新增」标记翻正（批内件已落盘 112 行）；同源随动 = `design/PROJECT.md` §6/§7/变更记录。
- 2026-10-09（**provider-default-model-purge 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §3 轮次 1 · 台账 #1122）：§6 `presets.mjs` 行表形改 `{ baseURL }` ∥ §1 覆盖面 ∥ 漂移句随正（去 `model`）∥ §9 N12 期望改「`models` 空清单 ⇒ 经「模型发现」勾选后 `/v1/models` 含 `deepseek/<选中模型>`」；批内注记名统一「2026-10-09 清除批」。**零新语义**（评审发现 #1 直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09（**provider-default-model-purge 批 · 实施期收正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §2 ∥ §5 舱5 · 台账 #1122）：§6 `presets.mjs` 行实读收正（**50 ⇒ 51**——本批实施落盘）∥ §1 落点行 ∥ §8 KD-SV-17 三处同拍；§5.1 门禁件数随正（**29 ⇒ 30 件**——10-09 清除批件入链；组成式后续各批 16 ⇒ 17 件）。**零新语义**（实读 ∥ 计数）。
- 2026-10-09（**server-gemini-openai-preset 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-gemini-openai-preset.md` §2 · 台账 #1128 ∥ #1129；用户 13:45/13:5x 两令）：① 预设覆盖面 20 ⇒ **21 家**（+ `gemini-openai`——Google 官方 OpenAI 兼容端点；名单 ∥ §6 行 ∥ §7 AC-9 行 ∥ KD-SV-17 同变）∥ ② 配置面增 **`proxy` 段**（表行 ∥ 形 ∥ 校验 ∥ 生效面）+ provider 条目 **`proxy` 字段**（两形共有字段行）——机制全文 = `gateway/API.md` §6 **KD-SV-55**；§9 增 N22/B31/E20/E21；§6 预算（presets ∥ config ∥ example ∥ README 随动）；§5.1 门禁件数随正（30 ⇒ 31 件）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-gemini-openai-preset.md` §3 评审发现 1/2/6，本档面）：§1 `proxy` 行补两启动 warn（明文 `http:` ∥ 旗 true 缺 uri——触发/文案 = `gateway/API.md` §6 KD-SV-55）+ 校验射程（非对象 ∥ scheme 非 `http:` ⇒ 拒启）∥ §7 上游代理行补两 warn 判据与代理路径断连腿 ∥ §9 E20 补非对象形态与 scheme 射程。**零新语义**（评审发现直接导出项）。
- 2026-10-09：配置控制台批设计轮（批 `docs/batches/2026-10-09-server-console-config.md`——台账 #1139 ∥ #1138 ∥ #1123；用户 15:51–15:57 三连）——§1 增**配置写面**块（可写/只读项表 ∥ 文件面读写 ∥ 白名单/保未知键/载入面等价校验门/原子写/审计 ∥ 重启生效统一 ∥ 单写者）∥ §5.1 门禁件数随正（31 ⇒ **32**——本批件入链）∥ §6 预算（bin ⇒ ≈180 ∥ README ⇒ ≈262）∥ §7 增 AC-28 写路径判据行 ∥ §8 增配置面不做项；决策 = §8 KD-SV-56。**产品码零触（设计轮）**。
- 2026-10-09（**server-console-config 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-09-server-console-config.md` §3 轮次 1 · 台账 #1139）：**#1（🔴）容器路挂载形收正**——§5.1 样例卷行改目录级可写挂载（`./config:/app/config`）+ 增「容器路配置形（写面前提）」注（配置档 = `/app/config/config.json` ∥ 容器路 `db` 取绝对值 ∥ 随正件（`.dockerignore` ∥ 仓根 `.gitignore`） ∥ 既有部署迁移四步）∥ §1 补写面前提句 ∥ §5.3/§5.5/§5.7 随正（备份命令 ∥ Docker 路 ③ 步）∥ §6 预算（compose ⇒ ≈24 ∥ entrypoint ±0 ∥ README ⇒ ≈264 ∥ `.dockerignore` ⇒ ≈9 ∥ 小计 +≈19）；#2 §8 补 **KD-SV-56** 行（决策/理由/被否候选——素材 = 批档 §2.6）——全档「§8 KD-SV-56」指针解悬。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09：embed 解耦批设计轮（批 `docs/batches/2026-10-09-server-embedding-decouple.md`——台账 #1147 ∥ #1148；用户 17:24 两条之 1/2）——§1 `embedding` 行改可选（缺位/`null` = 禁用态 ∥ 在场严格校验保持）+ 启动校验补嵌入判据与允许态句 + 配置写面块补「缺段创建」∥ §7 增 AC-6 判据行 ∥ §8 增 **KD-SV-57** ∥ §9 增 B33/B34/E22 ∥ §10 增嵌入配置面不做项。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-embedding-decouple.md` §3 评审发现 5–7 ∥ 9，本档面）：§5.1 门禁件数链收正（⇒ **33 件**——本批件入链；组成式 18 ⇒ 19 ⇒ 20 件）∥ §6 `README.md` 行按配置控制台批落地实读收正（252 ⇒ **实读 256** ⇒ ≈258——陈值 ≈264 删）∥ §7 AC-6/AC-28 两行「候补」标记收正（已落需求档）∥ §1 配置写面块补 `embedding: null` ⇒ 400 半句（与 `gateway/API.md` §7 E25 同拍）。**零新语义**（评审发现直接导出项）。
- 2026-10-09：评审 #14 复评收（父侧机械注 · 可 revert——承批档 `docs/batches/2026-10-09-server-embedding-decouple.md` §3 轮次 2 新 🔵 一条）：§6 `config.mjs` 行补本批增量注（⇒ ≈306）∥ 小计补「⇒ +≈7」——计数注位补齐，零新语义。
- 2026-10-09（**server-model-alias 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-server-model-alias.md` §2 · 台账 #1153 + 并入 #967；需求 §2:29 + AC-29；用户 20:32/20:36 令）：§1 `providers[]` 行条目两形（别名）+ 校验单源行补别名校验/唯一性/形不相交 + 启动校验补别名判据 + 对外标识句随正（别名 ∥ 前缀名）+ 增 #967 残 nuance 注（种子一次性/无回滚/先修 env）∥ §6 预算（`config.mjs` ⇒ ≈316 ∥ `README.md` ⇒ ≈259；小计 ⇒ +≈6）∥ §7 增 AC-29①③ 行 ∥ §10 增别名面不做句。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-server-model-alias.md` §3 评审发现 5③④，本档面）：§6 `config.mjs` 行链基线收正（≈306 ⇒ **实读 311**——embed 批实读；alias 链 ⇒ ≈316 算术平）∥ `README.md` 行链收正（embed 链 ⇒ ±0 实读收正——基线 256；alias 链 ≈259 ⇒ **≈257**——+≈1 字面平）∥ 小计行 embed 增量收正（+≈7 ⇒ **+10** = `config.mjs` +10 ∥ `README.md` ±0——实读）。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09（**console-proxy-page 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-09-console-proxy-page.md` §2 · 台账 #1158；需求 §2:30 + AC-30；用户 21:06 令）：§1 配置写面块落面句补「代理」页（`proxy.uri` 落点迁入——写路径/白名单/生效口径零变）∥ §6 预算（`bin` ⇒ ≈182 ∥ `README.md` ⇒ ≈258；小计 ⇒ +≈3；`config.mjs` ±0——`validateProxyConfig` 复用）；控制台面全文 = `webui/WEBUI.md` §2.7 ∥ 端点 = `gateway/API.md` §2.4。**产品码零触（设计轮）**。
- 2026-10-09：设计修正轮（fix——批 `docs/batches/2026-10-09-console-proxy-page.md` §3 评审发现 4，本档面）：§5.1 门禁件数链随两在途批收正（30 ⇒ 31 ⇒ 32 ⇒ 33 ⇒ 34 ⇒ **35 件**）∥ 组成式重算对账（补「弹窗批件」项——8 + 4 + 1 + 20 = 33 平）+ 基数口径明写「以当刻盘面实读为准」。**零新语义**（评审发现直接导出项）。明细 = 批档 §2 修复轮块。
- 2026-10-09：实施后回填轮（代理页批——批 `docs/batches/2026-10-09-console-proxy-page.md` · eng-designer）：§6 `bin` 行实读收正（**182**）∥ `README.md` 行实读收正（**258**——本批净 0）∥ 小计实读增量 **+2**。**零语义**（读数）。
- 2026-10-10：随正件（实施轮 · 机械计数 · 可 revert——server-face-residues 批 · 台账 #1161）：§5.1 门禁件数链收正（35 ⇒ **36 件**——本批件入链）+ 组成式同拍（后续各批 22 ⇒ 23 件；alias ∥ 代理页批件已入链）；同源随动 = `design/PROJECT.md` §6 板级行/注⑰。**零新语义**（计数）。
- 2026-10-10（**console-proxy-back 批 · 设计形式化轮 · eng-designer**——承批档 `docs/batches/2026-10-10-console-proxy-back.md` §2 · 台账 #1199；需求 §2:30 + AC-30 回改；用户 08:22「服务器的代理设置还是放回系统设置页面。」+ 08:41「测试要保留。」）：§1 配置写面块落面句收正（「「代理」页（`proxy.uri`——代理页批迁入）」⇒「「服务配置」卡（含 `proxy.uri` 行 + 连通测试块）——代理回迁批」——可写项/写路径/生效口径零变）；控制台面全文 = `webui/WEBUI.md` §2.7 ∥ 端点 = `gateway/API.md` §2.4。**产品码零触**（形式化轮——码已落）。
- 2026-10-10（**server-exec-sandbox 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 · 台账 #1224）：§5 增 **§5.10 沙盒 runner（执行面）**（装机三步 ∥ 网络面 ∥ 机队运维（加机/排空/退役）∥ 升级口径）∥ §6 预算（两新档 + README +≈60）∥ §7 增沙盒执行面判据行 ∥ §10 增不做面句；机制全文 = `sandbox/RUNNER.md` §7/§8。**产品码零触（设计轮）**。
- 2026-10-10（**server-exec-sandbox 批 · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §3 轮次 1 之 5/6 + 用户 14:56 直令）：§5.1 npm 路 `bin` 行补第二入口（`thincoder-runner`——`sandbox/RUNNER.md` §9 预算行在册）∥ §5.10 装机三步 ③ 补加入流程三件（整条命令可复制 ∥ 有效期可见 ∥ join 失败逐句人话 + 失败审计行）。**零新语义**（评审发现直接导出项）。
- 2026-10-10（**server-exec-sandbox 批 · 残差对齐（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-10-server-exec-sandbox.md` §2 残差项 ①；父侧裁定：收口前对齐）：§5.6 反代样例 ① 按 location 分路由——缺省 32m 保持（其余路由从严）∥ 快照路由例外 = `location = /api/runner/checkpoint` 块 `client_max_body_size 200m`（= 路由级上限 200 MiB 同值——`gateway/API.md` §2.6；≤200 MiB 上送不被反代先挡）；§8 KD-SV-25 行同拍（body 上限 = 缺省 32m ∥ 快照路由 200m）；完整样例（`thincoder-server/README.md` §11）随动待落——产品面/另轮。**零新语义**（KD-SV-77 路由级豁免的残差对齐）。
- 2026-10-10（**server-exec-sandbox 批 · 残差对齐（fix 轮）· eng-designer**——承评审 #143 交卷点出的同族残留；父侧裁定：换依据不删观点）：§1 预设覆盖面行 ∥ §1 漂移纪律行 ∥ §8 KD-SV-17 行三处引核依据收正——「被 KD-SV-2 禁」⇒ 引核口径 KD-SV-78（KD-SV-2 范围 = 网关（provider 层）面——`design/PROJECT.md` §5）；自持快照口径（KD-SV-17 ∥ 对照取数 = 只读、非运行期依赖）零变。同族收正 = `webui/WEBUI.md` §7（KD-SV-34 行）。**零新语义**（KD-SV-78 裁定的残差对齐）。
