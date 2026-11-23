<script setup>
import { computed, ref, watch } from 'vue'

// 产品封面：优先显示 AI 生成的真实产品图（public/images/{id}.jpg），
// 单文件离线版从打包时注入的 window.__PRODUCT_IMAGES__ 映射读取 base64；
// 图片缺失或加载失败时自动回退到程序化 SVG（下方整套绘制逻辑）。
const props = defineProps({
  part: { type: Object, required: true },
  mode: { type: String, default: 'card' },
})

// 真实图片地址：单文件版读内联映射，否则读 public 目录
const realImage = computed(() => {
  const g = typeof window !== 'undefined' ? window.__PRODUCT_IMAGES__ : null
  if (g && g[props.part.id]) return g[props.part.id]
  return `/images/${props.part.id}.jpg`
})
// 图片加载失败则回退 SVG
const imgFailed = ref(false)
watch(() => props.part.id, () => { imgFailed.value = false })
const showReal = computed(() => !!realImage.value && !imgFailed.value)


/* ---------------- 品牌配色（决定画面主色调） ---------------- */
const brandColors = {
  Intel: { main: '#2b8cff', light: '#8ecbff', dark: '#0b3f7a' },
  AMD: { main: '#ff4136', light: '#ff9a91', dark: '#7d1510' },
  NVIDIA: { main: '#76b900', light: '#c2ee63', dark: '#355400' },
  ASUS: { main: '#8a5cff', light: '#c7aaff', dark: '#3d1e86' },
  MSI: { main: '#e00027', light: '#ff7a90', dark: '#6e0013' },
  Gigabyte: { main: '#e2231a', light: '#ff8a80', dark: '#6d0d08' },
  ASRock: { main: '#d81f3c', light: '#ff8da3', dark: '#6b0c1d' },
  Kingston: { main: '#ef1d2c', light: '#ff8e96', dark: '#730810' },
  'G.Skill': { main: '#e60023', light: '#ff8598', dark: '#6e0010' },
  Corsair: { main: '#ffc400', light: '#ffe58a', dark: '#7a5c00' },
  Crucial: { main: '#1e8fff', light: '#9ccdff', dark: '#0b3f7a' },
  Samsung: { main: '#3f6fff', light: '#a9bdff', dark: '#12277d' },
  WD: { main: '#57b9ff', light: '#b9e2ff', dark: '#0a4d78' },
  Seagate: { main: '#00a862', light: '#8ce0b6', dark: '#00522f' },
  Seasonic: { main: '#e0332f', light: '#ff9a97', dark: '#6e100e' },
  'Cooler Master': { main: '#ffb400', light: '#ffe29a', dark: '#7a5400' },
  Noctua: { main: '#b4232a', light: '#e58b8f', dark: '#5c0f13' },
  DeepCool: { main: '#2f9bff', light: '#a4d4ff', dark: '#0b4679' },
  NZXT: { main: '#ff2d9b', light: '#ffa6d6', dark: '#7d0b4a' },
  Thermalright: { main: '#e8342c', light: '#ff9992', dark: '#70110d' },
  'Fractal Design': { main: '#4a93d6', light: '#a8d2f5', dark: '#17456c' },
  'Lian Li': { main: '#9aa7bd', light: '#dbe3ef', dark: '#3b4658' },
}
const catFallback = {
  cpu: { main: '#2b8cff', light: '#8ecbff', dark: '#0b3f7a' },
  motherboard: { main: '#12b8a6', light: '#8ff0e4', dark: '#075048' },
  gpu: { main: '#76b900', light: '#c2ee63', dark: '#355400' },
  ram: { main: '#a855f7', light: '#d8b4fe', dark: '#4c1d95' },
  storage: { main: '#22b8d6', light: '#a5eaf5', dark: '#075264' },
  psu: { main: '#f59e0b', light: '#fde68a', dark: '#78350f' },
  cooler: { main: '#38bdf8', light: '#bae6fd', dark: '#0c4a6e' },
  case: { main: '#fb7185', light: '#fecdd3', dark: '#781b2b' },
}

const pid = computed(() => props.part.id)
const cat = computed(() => props.part.category)
const brand = computed(() => props.part.brand || '')
const name = computed(() => props.part.name || '')
const bc = computed(() => brandColors[brand.value] || catFallback[cat.value] || catFallback.cpu)
const brandGrad = computed(() => `url(#bg-${pid.value})`)
const metalGrad = computed(() => `url(#mg-${pid.value})`)

// 品牌短标（画在芯片顶盖 / 电源风扇中心）
const brandShort = computed(() => {
  const b = brand.value
  if (b === 'Gigabyte') return 'GIGABYTE'
  if (b === 'Cooler Master') return 'CM'
  if (b === 'Fractal Design') return 'FD'
  if (b === 'Lian Li') return 'LIAN LI'
  if (b === 'NVIDIA') return 'GEFORCE'
  return b.toUpperCase().slice(0, 8)
})

/* ---------------- 依参数变化的形态 ---------------- */
const isIntel = computed(() => brand.value === 'Intel')
const isAmdChip = computed(() => brand.value === 'AMD' && cat.value === 'cpu')
const socket = computed(() => props.part.socket || '')
const formFactor = computed(() => props.part.formFactor || '')
const memoryType = computed(() => props.part.memoryType || '')
const capacity = computed(() => props.part.capacity || 0)
const wattage = computed(() => props.part.wattage || 0)

// 显卡风扇数：旗舰型号 3 风扇，其余 2 风扇
const gpuFans = computed(() => (/4090|4080|5090|5080|7900|XTX|Ti SUPER/.test(name.value) ? 3 : 2))
const fanCenters = computed(() => (gpuFans.value === 3 ? [116, 200, 284] : [140, 260]))
const bladeAngles = [0, 51, 103, 154, 206, 257, 309]

// 散热：名字含这些关键字或大冷排 -> 水冷
const isLiquid = computed(() => /AIO|Liquid|Kraken|iCUE|MasterLiquid|360|240|水冷|H150|H100|CAPELLIX/.test(name.value))
// 风冷是否双塔（高端散热）
const isDualTower = computed(() => /NH-D15|AK620|Peerless Assassin|双塔/.test(name.value))

// CPU 针脚 / 触点阵列
const cpuPins = computed(() => {
  const arr = []
  for (let i = 0; i < 12; i++) {
    arr.push({ x: 120 + i * 11, y: 74, w: 6, h: 5 })
    arr.push({ x: 120 + i * 11, y: 211, w: 6, h: 5 })
  }
  for (let i = 0; i < 10; i++) {
    arr.push({ x: 116, y: 84 + i * 12, w: 5, h: 7 })
    arr.push({ x: 273, y: 84 + i * 12, w: 5, h: 7 })
  }
  return arr
})

// 主板内存插槽数量（ATX 4 条 / 其余 2 条）
const ramSlots = computed(() => (formFactor.value === 'ATX' ? 4 : 2))
// 存储容量文字
const capText = computed(() => {
  const m = (props.part.spec || name.value).match(/(\d+)\s*(TB|GB)/i)
  return m ? m[0].toUpperCase() : ''
})
// SSD 颗粒坐标（模板里不能用全局 Math，预计算）
const ssdChips = [
  { x: 256, y: 10 }, { x: 278, y: 10 }, { x: 256, y: 38 }, { x: 278, y: 38 },
]
// 电源瓦数 glow 强度（瓦数越大越亮）
const psuGlow = computed(() => Math.min(0.5, 0.16 + wattage.value / 3000))

const isNew = computed(() => (props.part.released || '') >= '2026-01')

// 底部型号文字断行
const nameLines = computed(() => {
  const n = name.value
  if (n.length <= 20) return [n]
  const mid = Math.ceil(n.length / 2)
  let cut = n.lastIndexOf(' ', mid)
  if (cut < 8) cut = n.indexOf(' ', mid)
  if (cut < 0) cut = mid
  return [n.slice(0, cut), n.slice(cut + (n[cut] === ' ' ? 1 : 0))]
})

const pcb = '#132a1c'
const pcbDark = '#0c1c13'
</script>

<template>
  <img
    v-if="showReal"
    :src="realImage"
    :alt="part.brand + ' ' + part.name"
    class="block h-full w-full bg-white object-cover"
    loading="lazy"
    @error="imgFailed = true"
  />
  <svg
    v-else
    viewBox="0 0 400 300"
    class="block h-full w-full"
    role="img"
    :aria-label="part.brand + ' ' + part.name"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient :id="`bg-${pid}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="bc.light" />
        <stop offset="55%" :stop-color="bc.main" />
        <stop offset="100%" :stop-color="bc.dark" />
      </linearGradient>
      <linearGradient :id="`mg-${pid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4b5563" />
        <stop offset="45%" stop-color="#1f2630" />
        <stop offset="100%" stop-color="#0d1117" />
      </linearGradient>
      <radialGradient :id="`halo-${pid}`" cx="50%" cy="45%" r="55%">
        <stop offset="0%" :stop-color="bc.main" stop-opacity="0.30" />
        <stop offset="100%" :stop-color="bc.dark" stop-opacity="0" />
      </radialGradient>
      <pattern :id="`grid-${pid}`" width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M26 0H0v26" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
        <circle cx="0" cy="0" r="1.3" fill="rgba(255,255,255,0.08)" />
      </pattern>
    </defs>

    <!-- 背景 -->
    <rect width="400" height="300" :fill="`url(#bg-${pid})`" opacity="0.20" />
    <rect width="400" height="300" :fill="`url(#grid-${pid})`" />
    <circle cx="200" cy="135" r="150" :fill="`url(#halo-${pid})`" />

    <!-- ============ CPU ============ -->
    <g v-if="cat === 'cpu'">
      <rect x="112" y="70" width="176" height="152" rx="7" fill="rgba(0,0,0,0.35)" />
      <rect x="112" y="68" width="176" height="152" rx="6" :fill="pcb" stroke="rgba(255,255,255,0.14)" />
      <g fill="#d9a441">
        <rect v-for="(p, i) in cpuPins" :key="i" :x="p.x" :y="p.y" :width="p.w" :height="p.h" rx="1" />
      </g>
      <rect x="138" y="94" width="124" height="100" rx="5" :fill="brandGrad" stroke="rgba(255,255,255,0.35)" />
      <rect x="138" y="94" width="124" height="16" rx="5" fill="rgba(255,255,255,0.14)" />
      <path d="M116 72 l11 0 l-5.5 9 z" fill="#f0c75e" />
      <text x="200" y="142" text-anchor="middle" font-size="24" font-weight="900" fill="#ffffff" opacity="0.94">{{ brandShort }}</text>
      <text x="200" y="166" text-anchor="middle" font-size="10" fill="#ffffff" opacity="0.75">{{ socket }}</text>
      <text x="200" y="182" text-anchor="middle" font-size="9" fill="#ffffff" opacity="0.55">{{ isIntel ? 'LGA' : isAmdChip ? 'AM5 / AM4' : 'CPU' }}</text>
    </g>

    <!-- ============ 主板 ============ -->
    <g v-else-if="cat === 'motherboard'">
      <rect x="78" y="52" width="244" height="196" rx="6" fill="rgba(0,0,0,0.35)" />
      <rect x="78" y="50" width="244" height="196" rx="5" :fill="pcb" stroke="rgba(255,255,255,0.14)" />
      <!-- CPU 插槽 -->
      <rect x="108" y="78" width="76" height="76" rx="3" fill="#0b0f14" stroke="#8892a0" stroke-width="1.5" />
      <rect x="114" y="84" width="64" height="64" rx="2" :fill="brandGrad" opacity="0.55" />
      <!-- 内存槽 -->
      <rect v-for="i in ramSlots" :key="i" :x="198 + i * 12" y="76" width="6" height="78" rx="2" :fill="i % 2 ? bc.main : '#e5e7eb'" opacity="0.9" />
      <!-- 散热马甲 -->
      <rect x="104" y="58" width="66" height="14" rx="3" :fill="brandGrad" />
      <rect x="104" y="168" width="52" height="20" rx="3" :fill="brandGrad" opacity="0.85" />
      <!-- PCIe 插槽 -->
      <rect x="112" y="200" width="180" height="7" rx="2" fill="#c9a227" />
      <rect x="112" y="216" width="110" height="6" rx="2" fill="#8a7030" />
      <!-- M.2 -->
      <rect x="200" y="196" width="86" height="6" rx="2" fill="#1f2937" stroke="#4b5563" />
      <text x="300" y="238" text-anchor="end" font-size="11" fill="#ffffff" opacity="0.7">{{ formFactor }}</text>
    </g>

    <!-- ============ 显卡 ============ -->
    <g v-else-if="cat === 'gpu'">
      <rect x="56" y="92" width="288" height="112" rx="9" fill="rgba(0,0,0,0.4)" />
      <rect x="56" y="90" width="288" height="112" rx="8" :fill="metalGrad" stroke="rgba(255,255,255,0.16)" />
      <rect x="56" y="90" width="288" height="9" rx="4" :fill="brandGrad" />
      <g v-for="(cx, i) in fanCenters" :key="i" :transform="`translate(${cx},148)`">
        <circle r="43" fill="#0b0e13" stroke="#2a3140" stroke-width="2" />
        <g v-for="a in bladeAngles" :key="a" :transform="`rotate(${a})`">
          <path d="M0 0 C7 -18 24 -24 33 -10 C22 -5 9 -3 0 0 Z" :fill="bc.light" opacity="0.85" />
        </g>
        <circle r="10" :fill="brandGrad" stroke="rgba(255,255,255,0.4)" />
        <circle r="4" fill="#0b0e13" />
      </g>
      <rect x="104" y="202" width="130" height="8" rx="2" fill="#c9a227" />
      <text x="344" y="112" text-anchor="end" font-size="11" font-weight="bold" :fill="bc.light">{{ gpuFans }} 风扇</text>
    </g>

    <!-- ============ 内存 ============ -->
    <g v-else-if="cat === 'ram'">
      <g v-for="(y, i) in [104, 158]" :key="i" :transform="`translate(0,${y})`">
        <rect x="58" y="0" width="284" height="40" rx="3" :fill="pcbDark" stroke="rgba(255,255,255,0.12)" />
        <rect x="58" y="2" width="284" height="17" rx="3" :fill="brandGrad" />
        <rect x="58" y="2" width="284" height="5" rx="2" :fill="bc.light" opacity="0.95" />
        <rect v-for="j in 8" :key="j" :x="68 + j * 34" y="23" width="25" height="11" rx="1" fill="#0a0d12" />
        <rect x="188" y="38" width="18" height="4" fill="#05070a" />
      </g>
      <text x="200" y="222" text-anchor="middle" font-size="12" font-weight="bold" :fill="bc.light">{{ memoryType }} · {{ capacity }}GB</text>
    </g>

    <!-- ============ 存储 (M.2 SSD) ============ -->
    <g v-else-if="cat === 'storage'" transform="translate(48,112) rotate(-5)">
      <rect x="0" y="0" width="304" height="70" rx="5" :fill="pcb" stroke="rgba(255,255,255,0.14)" />
      <rect x="0" y="22" width="42" height="26" rx="2" fill="#c9a227" />
      <rect x="46" y="8" width="198" height="54" rx="4" :fill="brandGrad" />
      <rect x="46" y="8" width="198" height="10" rx="4" fill="rgba(255,255,255,0.16)" />
      <text x="145" y="36" text-anchor="middle" font-size="15" font-weight="900" fill="#ffffff">{{ brandShort }}</text>
      <text x="145" y="52" text-anchor="middle" font-size="10" fill="#ffffff" opacity="0.85">{{ capText || 'NVMe SSD' }}</text>
      <rect v-for="(c, j) in ssdChips" :key="j" :x="c.x" :y="c.y" width="18" height="22" rx="1" fill="#0a0d12" />
    </g>

    <!-- ============ 电源 ============ -->
    <g v-else-if="cat === 'psu'">
      <rect x="108" y="62" width="184" height="168" rx="9" fill="rgba(0,0,0,0.4)" />
      <rect x="108" y="60" width="184" height="168" rx="8" :fill="metalGrad" stroke="rgba(255,255,255,0.16)" />
      <circle cx="200" cy="138" r="66" fill="#0b0e13" :stroke="bc.main" stroke-width="1.5" :opacity="0.55 + psuGlow" />
      <g v-for="i in 24" :key="i" :transform="`rotate(${i * 15} 200 138)`">
        <line x1="200" y1="76" x2="200" y2="200" stroke="#2a3140" stroke-width="2" />
      </g>
      <g v-for="a in bladeAngles" :key="a" :transform="`rotate(${a} 200 138) translate(200,138)`">
        <path d="M0 0 C10 -20 30 -26 42 -10 C28 -5 12 -3 0 0 Z" :fill="bc.light" opacity="0.6" />
      </g>
      <circle cx="200" cy="138" r="20" :fill="brandGrad" stroke="rgba(255,255,255,0.35)" />
      <g v-for="j in 6" :key="j">
        <rect :x="120 + j * 27" y="206" width="18" height="12" rx="2" fill="#0b0e13" stroke="#4b5563" />
      </g>
      <text x="200" y="252" text-anchor="middle" font-size="12" font-weight="bold" :fill="bc.light">{{ wattage }}W</text>
    </g>

    <!-- ============ 散热 ============ -->
    <g v-else-if="cat === 'cooler'">
      <template v-if="isLiquid">
        <!-- 冷排 + 风扇 -->
        <rect x="60" y="60" width="150" height="150" rx="5" :fill="metalGrad" stroke="rgba(255,255,255,0.14)" />
        <g v-for="cy in [95, 135, 175]" :key="cy" :transform="`translate(135,${cy})`">
          <circle r="19" fill="#0b0e13" stroke="#2a3140" stroke-width="1.5" />
          <g v-for="a in bladeAngles" :key="a" :transform="`rotate(${a})`">
            <path d="M0 0 C4 -9 12 -12 17 -5 C11 -2 5 -1 0 0 Z" :fill="bc.light" opacity="0.8" />
          </g>
        </g>
        <!-- 水管 -->
        <path d="M212 92 Q258 62 292 100" fill="none" stroke="#1f2937" stroke-width="9" stroke-linecap="round" />
        <path d="M212 178 Q258 208 292 170" fill="none" stroke="#1f2937" stroke-width="9" stroke-linecap="round" />
        <!-- 冷头 -->
        <circle cx="296" cy="135" r="44" fill="#0b0e13" stroke="#2a3140" stroke-width="2" />
        <circle cx="296" cy="135" r="30" :fill="brandGrad" stroke="rgba(255,255,255,0.35)" />
        <circle cx="296" cy="135" r="12" fill="#0b0e13" opacity="0.5" />
      </template>
      <template v-else>
        <!-- 塔式鳍片 -->
        <rect x="150" y="58" width="100" height="164" rx="3" :fill="metalGrad" stroke="rgba(255,255,255,0.12)" />
        <g v-for="i in 15" :key="i">
          <line x1="156" :y1="64 + i * 10" x2="244" :y2="64 + i * 10" stroke="#3a424e" stroke-width="2" />
        </g>
        <rect v-if="isDualTower" x="106" y="70" width="42" height="140" rx="3" :fill="metalGrad" stroke="rgba(255,255,255,0.12)" />
        <!-- 热管 -->
        <path d="M172 214 V96 h24 V214" fill="none" stroke="#c9843a" stroke-width="5" />
        <path d="M204 214 V96 h24 V214" fill="none" stroke="#c9843a" stroke-width="5" />
        <!-- 顶部风扇 -->
        <g transform="translate(200,92)">
          <circle r="30" fill="#0b0e13" stroke="#2a3140" stroke-width="2" />
          <g v-for="a in bladeAngles" :key="a" :transform="`rotate(${a})`">
            <path d="M0 0 C6 -14 17 -18 24 -7 C16 -3 8 -2 0 0 Z" :fill="bc.light" opacity="0.85" />
          </g>
          <circle r="8" :fill="brandGrad" />
        </g>
        <!-- 铜底 -->
        <rect x="170" y="220" width="60" height="12" rx="2" fill="#b87333" />
      </template>
    </g>

    <!-- ============ 机箱 ============ -->
    <g v-else-if="cat === 'case'">
      <rect x="112" y="40" width="176" height="214" rx="7" fill="rgba(0,0,0,0.4)" />
      <rect x="112" y="38" width="176" height="214" rx="6" :fill="metalGrad" stroke="rgba(255,255,255,0.16)" />
      <!-- 侧透玻璃 -->
      <rect x="124" y="50" width="138" height="190" rx="4" fill="rgba(110,170,240,0.07)" stroke="rgba(255,255,255,0.16)" />
      <!-- 内部主板 / 显卡轮廓 -->
      <rect x="134" y="64" width="96" height="96" rx="3" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" />
      <rect x="134" y="170" width="118" height="20" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="150" y="200" width="30" height="30" rx="14" fill="rgba(255,255,255,0.05)" />
      <!-- 前面板灯带 -->
      <rect x="282" y="46" width="10" height="198" :fill="brandGrad" />
      <!-- 顶部风扇 -->
      <g v-for="cx in [148, 186, 224]" :key="cx">
        <circle :cx="cx" cy="58" r="13" fill="#0b0e13" stroke="#2a3140" stroke-width="1.5" />
      </g>
      <text x="200" y="266" text-anchor="middle" font-size="11" fill="#ffffff" opacity="0.7">{{ formFactor || '中塔机箱' }}</text>
    </g>

    <!-- ===== 通用叠层：分类标签 / 新品角标 / 品牌型号 ===== -->
    <g transform="translate(16,18)">
      <rect width="82" height="23" rx="11" fill="rgba(0,0,0,0.42)" />
      <text x="41" y="15" text-anchor="middle" font-size="11" fill="#ffffff" opacity="0.9">
        {{ { cpu: 'CPU', motherboard: '主板', gpu: '显卡', ram: '内存', storage: '固态', psu: '电源', cooler: '散热', case: '机箱' }[cat] }}
      </text>
    </g>
    <g v-if="isNew" transform="translate(302,18)">
      <rect width="82" height="23" rx="11" :fill="bc.main" />
      <text x="41" y="15" text-anchor="middle" font-size="11" font-weight="bold" fill="#0b1220">2026 新品</text>
    </g>

    <rect x="0" y="222" width="400" height="78" fill="rgba(0,0,0,0.42)" />
    <text x="18" y="244" font-size="12" letter-spacing="1.5" :fill="bc.light" style="text-transform: uppercase">{{ part.brand }}</text>
    <text x="18" y="268" font-size="16" font-weight="bold" fill="#ffffff">{{ nameLines[0] }}</text>
    <text v-if="nameLines[1]" x="18" y="289" font-size="16" font-weight="bold" fill="#ffffff">{{ nameLines[1] }}</text>
  </svg>
</template>
