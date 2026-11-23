import { defineStore } from 'pinia'
import parts from '@/data/parts'
import { checkCompatibility, filterCompatibleParts } from '@/utils/compatibility'

// 装机流程顺序（BuildCores 风格的分布流程）
export const buildSteps = [
  { key: 'cpu', name: 'CPU', label: '处理器' },
  { key: 'motherboard', name: 'Motherboard', label: '主板' },
  { key: 'ram', name: 'Memory', label: '内存' },
  { key: 'storage', name: 'Storage', label: '存储' },
  { key: 'gpu', name: 'Graphics Card', label: '显卡' },
  { key: 'psu', name: 'Power Supply', label: '电源' },
  { key: 'cooler', name: 'Cooler', label: '散热' },
  { key: 'case', name: 'Case', label: '机箱' },
]

// 每个分类当前可选的配件列表
export function partsOf(category) {
  return parts.filter((p) => p.category === category)
}

// 配置单构建器状态：每个分类至多选一件，实时汇总总价/功耗/重量
export const useBuildStore = defineStore('build', {
  state: () => ({
    // 已选配件，key 为分类（如 'cpu'），value 为配件对象或 null
    selected: {
      cpu: null,
      motherboard: null,
      ram: null,
      storage: null,
      gpu: null,
      psu: null,
      cooler: null,
      case: null,
    },
    activeStep: 'cpu',
    // 装机模式：beginner（小白，前置过滤）/ expert（达人，自由选+后置检查）
    mode: 'beginner',
    // RGB 灯效颜色（十六进制字符串）
    rgbColor: '#44aaff',
  }),
  getters: {
    totalPrice: (state) =>
      Object.values(state.selected)
        .filter(Boolean)
        .reduce((sum, p) => sum + p.price, 0),

    // 总功耗估算：CPU TDP + 显卡 powerDraw + 基础功耗 75W
    estPowerDraw: (state) => {
      const cpuTdp = state.selected.cpu?.tdp || 0
      const gpuDraw = state.selected.gpu?.powerDraw || 0
      return cpuTdp + gpuDraw + 75
    },

    // 兼容性检查结果（复用规则引擎）
    compatibilityIssues: (state) => checkCompatibility(state.selected),

    // 是否完全兼容（无 error 级问题）
    isCompatible: (state) =>
      !checkCompatibility(state.selected).some((it) => it.level === 'error'),

    selectedCount: (state) => Object.values(state.selected).filter(Boolean).length,

    // 当前步骤的可选配件（小白模式已做前置过滤）
    // 返回 { compatible, incompatible }；达人模式返回全部为 compatible
    currentCandidates: (state) => {
      const cat = state.activeStep
      const all = parts.filter((p) => p.category === cat)
      if (state.mode === 'expert') {
        return { compatible: all, incompatible: [] }
      }
      return filterCompatibleParts(state.selected, cat, parts)
    },

    // 生成配置单纯文本（用于复制/下载）
    summaryText: (state) => {
      const labels = {
        cpu: 'CPU',
        motherboard: '主板',
        ram: '内存',
        storage: '存储',
        gpu: '显卡',
        psu: '电源',
        cooler: '散热',
        case: '机箱',
      }
      const lines = []
      lines.push('CoreForge · PC 装机配置单')
      lines.push('----------------------------------------')
      for (const [key, label] of Object.entries(labels)) {
        const p = state.selected[key]
        if (p) {
          lines.push(`${label}: ${p.name}  (¥${p.price.toLocaleString('zh-CN')})`)
        } else {
          lines.push(`${label}: 未选择`)
        }
      }
      lines.push('----------------------------------------')
      const total = Object.values(state.selected)
        .filter(Boolean)
        .reduce((sum, p) => sum + p.price, 0)
      lines.push(`总价: ¥${total.toLocaleString('zh-CN')}`)
      const cpuTdp = state.selected.cpu?.tdp || 0
      const gpuDraw = state.selected.gpu?.powerDraw || 0
      lines.push(`预估功耗: ${cpuTdp + gpuDraw + 75} W`)

      const issues = checkCompatibility(state.selected)
      const errors = issues.filter((it) => it.level === 'error')
      lines.push('----------------------------------------')
      if (!errors.length) {
        lines.push('兼容性: ✅ 全部兼容')
      } else {
        lines.push(`兼容性: ❌ 存在 ${errors.length} 项冲突`)
        for (const it of issues) {
          lines.push(`  ${it.level === 'error' ? '✗' : '⚠'} ${it.title} - ${it.detail}`)
        }
      }
      return lines.join('\n')
    },
  },
  actions: {
    // 选择某分类的配件（替换同类）
    select(category, part) {
      this.selected[category] = part
    },
    remove(category) {
      this.selected[category] = null
    },
    clearAll() {
      for (const k of Object.keys(this.selected)) {
        this.selected[k] = null
      }
      this.activeStep = 'cpu'
    },
    setStep(key) {
      this.activeStep = key
    },
    setMode(mode) {
      this.mode = mode
    },
    setRgb(color) {
      this.rgbColor = color
    },
  },
})