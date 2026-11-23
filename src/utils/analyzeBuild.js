// 本地「智能装机点评」引擎（纯前端规则，无网络、无密钥）。
// 输入：已选配件 selected；输出：结构化点评报告。
// 目标：像一位装机老手那样，用大白话讲清这套配置的优点、短板和升级建议。
import { checkCompatibility, estimatePower } from './compatibility'

// 依据价格给配件分档：0 入门 / 1 主流 / 2 高端 / 3 旗舰
function cpuTier(p) {
  if (!p) return -1
  const v = p.price || 0
  return v >= 4200 ? 3 : v >= 2600 ? 2 : v >= 1500 ? 1 : 0
}
function gpuTier(p) {
  if (!p) return -1
  const v = p.price || 0
  return v >= 7000 ? 3 : v >= 4200 ? 2 : v >= 2400 ? 1 : 0
}
const tierName = ['入门', '主流', '高端', '旗舰']

// 收集所有标签用于判断用途
function collectTags(s) {
  const all = []
  for (const p of Object.values(s)) {
    if (p?.tags) all.push(...p.tags)
  }
  return all
}

export function analyzeBuild(selected) {
  const s = selected
  const issues = checkCompatibility(s)
  const errors = issues.filter((it) => it.level === 'error')
  const warnings = issues.filter((it) => it.level === 'warning')
  const power = estimatePower(s)
  const total = Object.values(s)
    .filter(Boolean)
    .reduce((sum, p) => sum + (p.price || 0), 0)
  const selectedCount = Object.values(s).filter(Boolean).length

  const pros = []
  const cons = []
  const tips = []
  let score = 100

  // —— 1. 兼容性（权重最高） ——
  for (const it of errors) {
    score -= 18
    cons.push({ title: it.title, desc: it.detail, level: 'error' })
  }
  for (const it of warnings) {
    score -= 7
    cons.push({ title: it.title, desc: it.detail, level: 'warning' })
  }
  if (!errors.length && !warnings.length && selectedCount >= 2) {
    pros.push({
      title: '配件之间没问题',
      desc: '目前选择的配件互相兼容，装机时不会因为接口、尺寸这些硬性问题卡住。',
    })
  }

  // —— 2. CPU / 显卡均衡度 ——
  const ct = cpuTier(s.cpu)
  const gt = gpuTier(s.gpu)
  if (ct >= 0 && gt >= 0) {
    const diff = ct - gt
    if (diff >= 2) {
      score -= 14
      cons.push({
        title: 'CPU 比显卡高出不少',
        desc: `${s.cpu.name} 属于${tierName[ct]}级，但显卡只有${tierName[gt]}级，玩游戏时显卡会先到瓶颈，CPU 的性能发挥不满。`,
      })
    } else if (diff <= -2) {
      score -= 14
      cons.push({
        title: '显卡比 CPU 高出不少',
        desc: `${s.gpu.name} 是${tierName[gt]}级显卡，但 CPU 只有${tierName[ct]}级，中低端 CPU 可能带不动，建议把 CPU 升一档。`,
      })
    } else {
      pros.push({
        title: 'CPU 和显卡搭配均衡',
        desc: `一个是${tierName[ct]}级 CPU、一个是${tierName[gt]}级显卡，档次般配，没有明显的"头重脚轻"。`,
      })
    }
  }

  // —— 3. 电源余量 ——
  if (s.psu && (s.cpu || s.gpu)) {
    const headroom = (s.psu.wattage - power) / s.psu.wattage
    if (headroom >= 0.3) {
      pros.push({
        title: '电源余量充足',
        desc: `整机约 ${power}W，${s.psu.wattage}W 电源留了三成以上余量，以后升级显卡也基本不用换电源。`,
      })
    } else if (headroom >= 0.12) {
      tips.push({
        title: '电源余量适中',
        desc: `整机约 ${power}W，${s.psu.wattage}W 够用但余量不大，日后若升级高功耗显卡，记得同步换新电源。`,
      })
    } else if (headroom >= 0) {
      score -= 8
      cons.push({
        title: '电源余量偏紧',
        desc: `整机约 ${power}W，${s.psu.wattage}W 刚好够用但没有富余，长期满载供电压力大，建议留出 100W 以上空间。`,
      })
    }
  }

  // —— 4. 散热能力 ——
  if (s.cpu && s.cooler) {
    const cap = s.cooler.coolingCapacity || 0
    const tdp = s.cpu.tdp || 0
    if (cap >= tdp * 1.3) {
      pros.push({
        title: '散热压得住',
        desc: `散热解热能力约 ${cap}W，对比 CPU ${tdp}W 的功耗有富余，长时间满载温度也更稳。`,
      })
    }
  }

  // —— 5. 内存 ——
  if (s.ram) {
    const cap = Number(s.ram.capacity) || 0
    if (cap <= 16) {
      score -= 5
      tips.push({
        title: '内存建议加到 32G',
        desc: `当前是 ${cap}G，日常够用，但大型游戏、剪辑或多开程序会吃紧，加到 32G 体验提升明显。`,
      })
    } else if (cap >= 32) {
      pros.push({
        title: '内存容量充裕',
        desc: `${cap}G 内存，游戏、多任务、生产力应用都能从容应对。`,
      })
    }
    if (s.ram.memoryType === 'DDR5') {
      tips.push({
        title: 'DDR5 平台，升级空间好',
        desc: 'DDR5 是目前主流，后续加内存、换更大容量都方便，也更适合新一代平台。',
      })
    }
  }

  // —— 6. 用途判断 ——
  const tags = collectTags(s)
  const usage = []
  if (tags.some((t) => /游戏|电竞|3D|高刷/.test(t))) usage.push('游戏')
  if (tags.some((t) => /生产力|设计|剪辑|渲染|办公/.test(t))) usage.push('生产力')
  if (tags.some((t) => /旗舰|高端/.test(t))) usage.push('高端发烧')
  if (tags.some((t) => /性价比|入门/.test(t))) usage.push('性价比')
  if (!usage.length) usage.push('日常使用')

  // —— 7. 性价比 ——
  if (ct >= 0 && gt >= 0) {
    const perfLevel = (ct + gt) / 2
    // 估算这套性能档次的"合理价格区间"
    const fair = 3000 + perfLevel * 3200
    if (total <= fair * 0.9) {
      score += 4
      pros.push({
        title: '价格花得值',
        desc: `整套 ¥${total.toLocaleString('zh-CN')}，对于这个性能档次来说很划算。`,
      })
    } else if (total > fair * 1.25) {
      score -= 6
      cons.push({
        title: '部分配件溢价偏高',
        desc: `整套 ¥${total.toLocaleString('zh-CN')}，高于同档次配置的常见价位，可以在品牌或型号上再对比一下。`,
      })
    }
  }

  // —— 8. 完整度提醒 ——
  if (selectedCount < 8) {
    tips.push({
      title: '配置还没选全',
      desc: `目前选了 ${selectedCount}/8 件，补全后分析会更准确，也能检查出更多潜在冲突。`,
    })
  }

  // 分数收口
  score = Math.max(20, Math.min(100, Math.round(score)))
  const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
  const gradeLabel = {
    S: '堪称完美',
    A: '相当不错',
    B: '整体合理',
    C: '尚需打磨',
    D: '建议重配',
  }[grade]

  // 一句话总评
  let verdict
  if (errors.length) {
    verdict = `这套配置有 ${errors.length} 处硬伤必须先解决，否则可能装不上或点不亮，处理完再考虑下单。`
  } else if (score >= 85) {
    verdict = `整体是一套${gradeLabel}的配置，${usage.join(' / ')}都能胜任，配件搭配也比较均衡，可以放心下手。`
  } else if (score >= 70) {
    verdict = `整体${gradeLabel}，能满足${usage.join(' / ')}需求，按下面的建议小调一下会更理想。`
  } else {
    verdict = `这套配置还能再优化，建议重点看下面的短板，调整后性价比和稳定性会好很多。`
  }

  // 保证每类至少不空（UI 更好看）
  if (!pros.length) {
    pros.push({ title: '搭好了基础框架', desc: '已经选了核心配件，继续补全就能得到更完整的点评。' })
  }

  return {
    score,
    grade,
    gradeLabel,
    verdict,
    usage,
    pros,
    cons,
    tips,
    total,
    power,
    selectedCount,
  }
}
