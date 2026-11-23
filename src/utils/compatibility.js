// 兼容性规则引擎（纯函数，独立于 UI，便于后续接入后端）
// 输入：已选配件对象 selected（key 为分类，value 为配件对象或 null）
// 输出：不兼容项列表 [{ id, level, title, detail, involved }]
//   level: 'error'（硬性不兼容）/ 'warning'（建议性提醒）
//   involved: 涉及的分类 key 数组，用于在 UI 上标红对应步骤

// 估算整机功耗（与 build store 一致：CPU TDP + 显卡功耗 + 其余 75W）
export function estimatePower(selected) {
  const cpuTdp = selected.cpu?.tdp || 0
  const gpuDraw = selected.gpu?.powerDraw || 0
  return cpuTdp + gpuDraw + 75
}

export function checkCompatibility(selected) {
  const issues = []
  const s = selected

  // 1. CPU 插槽 vs 主板插槽
  if (s.cpu && s.motherboard && s.cpu.socket !== s.motherboard.socket) {
    issues.push({
      id: 'socket',
      level: 'error',
      title: 'CPU 与主板插槽不匹配',
      detail: `${s.cpu.name}（${s.cpu.socket}）无法安装到 ${s.motherboard.name}（${s.motherboard.socket}）上`,
      involved: ['cpu', 'motherboard'],
    })
  }

  // 2. 主板内存类型 vs 内存类型
  if (s.motherboard && s.ram && s.motherboard.memoryType !== s.ram.memoryType) {
    issues.push({
      id: 'memory-type',
      level: 'error',
      title: '内存类型不匹配',
      detail: `${s.motherboard.name} 仅支持 ${s.motherboard.memoryType}，无法使用 ${s.ram.memoryType} 内存`,
      involved: ['motherboard', 'ram'],
    })
  }

  // 3. 电源瓦数 vs 整机功耗
  if (s.psu && (s.cpu || s.gpu)) {
    const power = estimatePower(s)
    if (s.psu.wattage < power) {
      issues.push({
        id: 'psu-wattage',
        level: 'error',
        title: '电源功率不足',
        detail: `整机预估功耗约 ${power}W，超出 ${s.psu.name}（${s.psu.wattage}W）的供电能力`,
        involved: ['psu', 'cpu', 'gpu'],
      })
    } else if (s.psu.wattage < power + 100) {
      issues.push({
        id: 'psu-headroom',
        level: 'warning',
        title: '电源余量偏小',
        detail: `整机预估功耗约 ${power}W，${s.psu.wattage}W 电源的余量不足 100W，建议留更多余量`,
        involved: ['psu'],
      })
    }
  }

  // 4. 显卡长度 vs 机箱限长
  if (s.gpu && s.case && s.gpu.length > s.case.maxGpuLength) {
    issues.push({
      id: 'gpu-length',
      level: 'error',
      title: '显卡过长，无法装入机箱',
      detail: `${s.gpu.name} 长 ${s.gpu.length}mm，超出 ${s.case.name} 的 ${s.case.maxGpuLength}mm 限长`,
      involved: ['gpu', 'case'],
    })
  }

  // 5. 散热器 vs 机箱
  // 注意：风冷看高度（coolerHeight），水冷（AIO）看冷排尺寸是否装得下。
  // 水冷 coolerHeight 是冷头高度（<60mm），不能拿来和机箱限高比，否则会漏检。
  if (s.cooler && s.case) {
    const isAIO = (s.cooler.coolerHeight || 0) <= 60
    if (!isAIO && s.cooler.coolerHeight > s.case.maxCoolerHeight) {
      issues.push({
        id: 'cooler-height',
        level: 'error',
        title: '散热器过高，无法装入机箱',
        detail: `${s.cooler.name} 高 ${s.cooler.coolerHeight}mm，超出 ${s.case.name} 的 ${s.case.maxCoolerHeight}mm 限高`,
        involved: ['cooler', 'case'],
      })
    }
    // 注：数据层暂无 supportsAIO 字段，故不对水冷冷排兼容性做判断，
    // 避免对所有水冷配置误报"可能不支持"。待数据补充该字段后再启用。
  }

  // 6. CPU 功耗 vs 散热解热能力
  if (s.cpu && s.cooler && s.cooler.coolingCapacity && s.cpu.tdp > s.cooler.coolingCapacity) {
    issues.push({
      id: 'cooler-capacity',
      level: 'warning',
      title: '散热器可能压不住 CPU',
      detail: `${s.cpu.name} 满载功耗 ${s.cpu.tdp}W，接近/超出 ${s.cooler.name} 的 ${s.cooler.coolingCapacity}W 解热能力`,
      involved: ['cpu', 'cooler'],
    })
  }

  return issues
}

// 判断某分类是否被某个不兼容项"涉及"（用于标红）
export function isCategoryInvolved(issues, category) {
  return issues.some((it) => it.involved.includes(category))
}

// —— 装机小白模式：前置兼容过滤 ——
// 根据当前已选配件，判断某个候选配件是否与之兼容。
// 返回 true 表示该配件与已选配件"不冲突"（可以被选择）。
// 与后置 checkCompatibility 互补：这里做"提前把关"，让小白只能选到能装上的配件。
export function isPartCompatible(selected, part) {
  const s = selected

  // 按候选配件的分类，检查它与已选配件之间的硬性约束
  switch (part.category) {
    // 主板：必须匹配 CPU 插槽
    case 'motherboard':
      if (s.cpu && s.cpu.socket !== part.socket) return false
      return true

    // 内存：必须匹配主板内存类型
    case 'ram':
      if (s.motherboard && s.motherboard.memoryType !== part.memoryType) return false
      return true

    // 显卡：不能超过机箱限长
    case 'gpu':
      if (s.case && part.length > s.case.maxGpuLength) return false
      return true

    // 电源：瓦数要带得动当前 CPU+显卡
    case 'psu': {
      const cpuTdp = s.cpu?.tdp || 0
      const gpuDraw = s.gpu?.powerDraw || 0
      const need = cpuTdp + gpuDraw + 75
      if (part.wattage < need) return false
      return true
    }

    // 散热器：风冷不能超过机箱限高；解热能力要压得住 CPU
    case 'cooler': {
      const isAIO = (part.coolerHeight || 0) <= 60
      if (s.case && !isAIO && part.coolerHeight > s.case.maxCoolerHeight) return false
      if (s.cpu && part.coolingCapacity && s.cpu.tdp > part.coolingCapacity) return false
      return true
    }

    // 机箱：要装得下已选显卡和风冷散热器
    case 'case': {
      if (s.gpu && s.gpu.length > part.maxGpuLength) return false
      if (s.cooler) {
        const isAIO = (s.cooler.coolerHeight || 0) <= 60
        if (!isAIO && s.cooler.coolerHeight > part.maxCoolerHeight) return false
      }
      return true
    }

    // CPU / 存储：无硬性前置约束（存储任意都兼容）
    default:
      return true
  }
}

// 过滤出与已选配件兼容的候选列表（小白模式用）。
// 返回 { compatible, incompatible }，incompatible 附带通俗的"为什么不能选"说明。
export function filterCompatibleParts(selected, category, allParts) {
  const compatible = []
  const incompatible = []
  for (const p of allParts) {
    if (p.category !== category) continue
    if (isPartCompatible(selected, p)) {
      compatible.push(p)
    } else {
      incompatible.push({ part: p, reason: incompatReason(selected, p) })
    }
  }
  return { compatible, incompatible }
}

// 生成通俗易懂的"不能选"原因（小白模式置灰提示）
function incompatReason(selected, part) {
  const s = selected
  switch (part.category) {
    case 'motherboard':
      return `与 ${s.cpu.name} 的插槽不符（需 ${s.cpu.socket}）`
    case 'ram':
      return `与 ${s.motherboard.name} 的内存类型不符（需 ${s.motherboard.memoryType}）`
    case 'gpu':
      return `长 ${part.length}mm，超出 ${s.case.name} 的 ${s.case.maxGpuLength}mm 限长`
    case 'psu': {
      const need = (s.cpu?.tdp || 0) + (s.gpu?.powerDraw || 0) + 75
      return `${part.wattage}W 带不动整机（约需 ${need}W 以上）`
    }
    case 'cooler': {
      const isAIO = (part.coolerHeight || 0) <= 60
      if (s.case && !isAIO && part.coolerHeight > s.case.maxCoolerHeight)
        return `高 ${part.coolerHeight}mm，超出机箱 ${s.case.maxCoolerHeight}mm 限高`
      if (s.cpu && part.coolingCapacity && s.cpu.tdp > part.coolingCapacity)
        return `解热 ${part.coolingCapacity}W，压不住 ${s.cpu.name}（${s.cpu.tdp}W）`
      return '与当前配置不兼容'
    }
    case 'case': {
      if (s.gpu && s.gpu.length > part.maxGpuLength)
        return `装不下 ${s.gpu.name}（长 ${s.gpu.length}mm）`
      return '与当前配置不兼容'
    }
    default:
      return '与当前配置不兼容'
  }
}