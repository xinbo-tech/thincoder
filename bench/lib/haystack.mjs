/**
 * lib/haystack.mjs — 确定性长文生成（设计 §5.7；固定语料 + 定种子 + 埋点按字符偏移固定）。
 *
 * 同一 (chars, insertions) 恒得同一长文（跨时点可比——KD-3 同源纪律：不可复现的题面禁用）。
 * 语料 = 固定句子池（运维叙事，不含任何埋点数字）；选取用固定种子 LCG；埋点按 ratio 换算的
 * 字符偏移插入（升序 + 累计位移，位置稳定）。
 */

const SEED = 20260923

const CORPUS = [
  "凌晨的监控告警在值班群里闪了三次，随后被确认是一次正常的扩容重启。",
  "值班工程师把这次变更记录进了运行手册的附录，并在旁边标注了回滚步骤。",
  "运维平台的数据面在夜间完成了灰度发布，早高峰前确认指标没有异常波动。",
  "服务网格的边车在新版本里降低了内存占用，长连接抖动也随之减少。",
  "机房温度稳定后，巡检机器人沿着既定路线完成了当天的第二轮盘点。",
  "日志平台把冷数据迁移到了对象存储，查询面板的响应时间因此缩短了一半。",
  "值班同事在应急演练里复现了链路故障，并补齐了缺失的熔断配置。",
  "调度器把批处理任务挪到了空闲窗口，白天的在线请求因此获得更稳定的延迟。",
  "配置中心推送了新一批路由规则，网关按权重逐步把流量切到了新集群。",
  "容量评审会上，团队决定把缓存层扩容两成，并把淘汰策略换成更保守的方案。",
  "巡检脚本发现个别节点时钟漂移，时间同步服务随后自动完成了校准。",
  "发布窗口结束前，值班同学确认了回滚包可用，并在看板上更新了变更状态。",
  "接入层把超时时间从默认值下调，慢请求不再占用连接池里的位置。",
  "数据管道的补偿任务在凌晨跑完，补齐了白天的两批延迟写入。",
  "存储团队把快照策略从每天改为每小时，恢复演练的耗时随之下降。",
  "值班手册里记录了一条经验：先看依赖，再看自身，最后才怀疑网络。",
]

function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** 生成 `chars` 量级的长文，并在固定偏移插入埋点句（insertions = [{ text, ratio }]）。 */
export function buildHaystack({ chars, insertions = [] }) {
  const rand = lcg(SEED)
  const parts = []
  let len = 0
  while (len < chars) {
    const s = CORPUS[Math.floor(rand() * CORPUS.length)]
    parts.push(s)
    len += s.length
  }
  let text = parts.join("")
  let shift = 0
  for (const ins of [...insertions].sort((a, b) => a.ratio - b.ratio)) {
    const at = Math.min(text.length, Math.round(ins.ratio * chars) + shift)
    text = `${text.slice(0, at)}\n\n${ins.text}\n\n${text.slice(at)}`
    shift += ins.text.length + 4
  }
  return text
}
