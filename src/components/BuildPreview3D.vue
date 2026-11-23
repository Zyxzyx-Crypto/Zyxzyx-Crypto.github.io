<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useBuildStore } from '@/stores/build'

const store = useBuildStore()

const container = ref(null)

let renderer, scene, camera, controls, animationId
let partsGroup // 内部配件组，选中变化时重建
let caseGroup // 机箱外壳组，随选中机箱变化
let rgbLight // 机箱内 RGB 氛围灯
let spinningFans = [] // 需要旋转的风扇（rebuild 时重建）

// 品牌主色（供配件主体着色）
const brandHues = {
  Intel: 0x4f9cff,
  AMD: 0xff4f4f,
  NVIDIA: 0x6cff6c,
  ASUS: 0xff9f4f,
  MSI: 0xff4f9f,
  Gigabyte: 0xffd54f,
  ASRock: 0x8fb3ff,
  Corsair: 0x4fd5ff,
  Samsung: 0x4f7fff,
  WD: 0x7f9fff,
  Crucial: 0x9f6cff,
  Noctua: 0xb08a5c,
  'Cooler Master': 0x8f5cff,
  NZXT: 0xe8e8e8,
  'Fractal Design': 0x6c9c8f,
  Kingston: 0xff6c4f,
  'G.Skill': 0xffb84f,
  Seasonic: 0x4fffbf,
  DeepCool: 0x5fb3ff,
  Thermalright: 0x9fe0c0,
  'Lian Li': 0xc0d0ee,
  Seagate: 0x7fcf8f,
  Arctic: 0x7fd0ff,
  Lexar: 0xff8f5f,
  Solidigm: 0x8fbfff,
  SilverStone: 0xc0c8d8,
  Hyte: 0xff6f9f,
}

function partColor(part) {
  if (!part) return 0x555555
  return brandHues[part.brand] || 0x888888
}

// 金属材质（启用环境反射，真实感的关键）
const metal = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.35,
    metalness: opts.metalness ?? 0.65,
    envMapIntensity: opts.envMapIntensity ?? 1.0,
  })

// 拉丝金属（散热鳍片、背板）
const brushedMetal = (color) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.9,
    envMapIntensity: 1.2,
  })

// 塑料（风扇扇叶、外壳）
const plastic = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: 0.1,
    envMapIntensity: 0.5,
  })

// 发光材质（RGB 用）
const glow = (color, intensity = 0.6) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.2,
    emissive: color,
    emissiveIntensity: intensity,
  })

function initScene() {
  const el = container.value
  const w = el.clientWidth
  const h = el.clientHeight

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()

  // —— 环境反射（PMREM 室内环境，金属/玻璃质感的关键，纯程序化无外部文件） ——
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  // 远景雾，增加空间纵深
  scene.fog = new THREE.Fog(0x0a0f18, 18, 42)

  camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
  camera.position.set(8, 6, 11)
  camera.lookAt(0, 0.2, 0)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 0.2, 0)
  controls.minDistance = 4
  controls.maxDistance = 22
  controls.maxPolarAngle = Math.PI * 0.75
  // 空闲时缓慢自动旋转，用户拖动即停
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.7
  controls.addEventListener('start', () => {
    controls.autoRotate = false
  })

  // —— 光照系统 ——
  const ambient = new THREE.AmbientLight(0xbfd0ff, 0.35)
  scene.add(ambient)

  // 主光（高清阴影）
  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(6, 10, 6)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -8
  key.shadow.camera.right = 8
  key.shadow.camera.top = 8
  key.shadow.camera.bottom = -8
  key.shadow.camera.far = 40
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.02
  scene.add(key)

  // 补光（冷色）
  const fill = new THREE.DirectionalLight(0x8899ff, 0.5)
  fill.position.set(-5, 3, -4)
  scene.add(fill)

  // 轮廓光（从后上方勾勒边缘）
  const rim = new THREE.DirectionalLight(0x99bbff, 1.0)
  rim.position.set(-4, 8, -8)
  scene.add(rim)

  // 机箱内 RGB 氛围灯（跟随用户选择的灯效颜色）
  rgbLight = new THREE.PointLight(rgbHex(), 10, 12, 2)
  rgbLight.position.set(0, 1.6, 1.0)
  scene.add(rgbLight)

  // 展示台：圆形金属台面 + 外圈
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.5, 0.18, 64),
    brushedMetal(0x1a2230),
  )
  platform.position.y = -2.09
  platform.receiveShadow = true
  scene.add(platform)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.25, 0.03, 12, 80),
    glow(0x4f6cff, 0.8),
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = -2.0
  scene.add(ring)

  // 地面（哑光深色，反射环境光）
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({
      color: 0x0d1420,
      roughness: 0.5,
      metalness: 0.5,
      envMapIntensity: 0.6,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -2.19
  ground.receiveShadow = true
  scene.add(ground)

  buildCase()
  partsGroup = new THREE.Group()
  scene.add(partsGroup)

  window.addEventListener('resize', onResize)
}

function rgbHex() {
  const hex = store.rgbColor.replace('#', '')
  return parseInt(hex, 16)
}

// 机箱外观方案：不同风格对应不同配色
const caseStyles = {
  'white-minimal': {
    frame: 0xd8d8e0,
    beam: 0xb8b8c4,
    front: 0xe8e8ee,
    grill: 0xc8c8d4,
    glass: 0xffffff,
    shroud: 0xd0d0da,
  },
  'black-wood': {
    frame: 0x1c1c22,
    beam: 0x2a2a30,
    front: 0x6b4f35,
    grill: 0x3a3a40,
    glass: 0xcfe0ff,
    shroud: 0x22222a,
  },
}

function casePalette() {
  const style = store.selected.case?.style || 'white-minimal'
  return caseStyles[style] || caseStyles['white-minimal']
}

function buildCase() {
  caseGroup = new THREE.Group()
  scene.add(caseGroup)
  rebuildCase()
}

function disposeChildren(group) {
  while (group.children.length) {
    const c = group.children.pop()
    c.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
}

// 生成一片真实风扇扇叶的实体几何。
// 用「带厚度的弯曲叶片」：叶根宽、叶尖窄，沿径向延伸，绕 Z 轴旋转。
// 叶片做成实体（有厚度），颜色鲜明，保证在任何角度都清晰可见。
function buildBladeGeometry(radius) {
  const r0 = radius * 0.25 // 叶根半径
  const r1 = radius * 0.95 // 叶尖半径
  const rootChord = radius * 0.55 // 叶根弦长（宽）
  const tipChord = radius * 0.30 // 叶尖弦长（窄）
  const thickness = radius * 0.08 // 叶片实体厚度

  // 用 ExtrudeGeometry：先画叶片轮廓（俯视），再沿 Z 挤出厚度
  const shape = new THREE.Shape()
  const halfRoot = rootChord / 2
  const halfTip = tipChord / 2
  const sweep = radius * 0.3 // 叶尖向后掠的弧度
  // 轮廓：叶根左下 -> 叶尖外侧 -> 叶根右下，形成一片弯曲叶片
  shape.moveTo(r0, -halfRoot)
  shape.quadraticCurveTo(
    (r0 + r1) / 2 + sweep, -halfTip,
    r1, -halfTip + sweep * 0.3,
  )
  shape.lineTo(r1, halfTip - sweep * 0.3)
  shape.quadraticCurveTo(
    (r0 + r1) / 2 + sweep, halfTip,
    r0, halfRoot,
  )
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.2,
    bevelSize: thickness * 0.2,
    bevelSegments: 2,
    curveSegments: 12,
  })
  // Extrude 默认沿 +Z 挤出，把叶片移到中心（厚度居中）
  geo.translate(0, 0, -thickness / 2)
  return geo
}

// 真实风扇：镂空外框 + 轮毂 + 带扭转的曲面扇叶（沿局部 Z 轴旋转）
function makeFan(radius, { rgbColor = null, bladeColor = 0x14141a } = {}) {
  const fan = new THREE.Group()

  // 外框：四条边拼成镂空方框（不能用实心板，会挡住扇叶）
  const frameMat = plastic(0x101014)
  const half = radius + 0.04
  const bar = 0.06
  const edges = [
    [0, half, half * 2 + bar, bar], // 上
    [0, -half, half * 2 + bar, bar], // 下
    [half, 0, bar, half * 2 - bar], // 右
    [-half, 0, bar, half * 2 - bar], // 左
  ]
  for (const [ex, ey, w, h] of edges) {
    const bar3d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), frameMat)
    bar3d.position.set(ex, ey, 0)
    fan.add(bar3d)
  }
  // 四角固定孔
  for (const [cx, cy] of [[half, half], [half, -half], [-half, half], [-half, -half]]) {
    const corner = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), frameMat)
    corner.rotation.x = Math.PI / 2
    corner.position.set(cx, cy, 0)
    fan.add(corner)
  }

  // 旋转体（轮毂 + 扇叶），之后动画围绕 z 轴转
  const rotor = new THREE.Group()
  rotor.position.z = 0.015

  // 轮毂：底部大圆盘 + 顶部小凸起（真实风扇的双层轮毂）
  const hubMat = plastic(0x1c1c22, { roughness: 0.4 })
  const hubBase = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.34, radius * 0.4, 0.08, 24),
    hubMat,
  )
  hubBase.rotation.x = Math.PI / 2
  rotor.add(hubBase)
  const hubTop = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.2, radius * 0.22, 0.05, 20),
    hubMat,
  )
  hubTop.rotation.x = Math.PI / 2
  hubTop.position.z = 0.03
  rotor.add(hubTop)

  // 扇叶：实体几何，每片包在 holder 里绕 z 转到对应角度
  const bladeGeo = buildBladeGeometry(radius)
  // 叶片颜色要鲜明：非 RGB 风扇用浅灰亮色（而不是纯黑，否则融入背景看不见）
  const bladeMat = rgbColor != null
    ? glow(rgbColor, 0.8)
    : plastic(0xcfd4de, { roughness: 0.3 })
  const bladeCount = 7
  for (let i = 0; i < bladeCount; i++) {
    const holder = new THREE.Group()
    // 叶片沿周向均匀分布，绕风扇面法线（z）转到各自角度
    holder.rotation.z = (i / bladeCount) * Math.PI * 2
    const blade = new THREE.Mesh(bladeGeo, bladeMat)
    holder.add(blade)
    rotor.add(holder)
  }
  fan.add(rotor)
  fan.userData.rotor = rotor
  spinningFans.push(rotor)

  // RGB 灯圈
  if (rgbColor != null) {
    const ringLight = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.92, 0.02, 8, 40),
      glow(rgbColor, 1.2),
    )
    ringLight.position.z = 0.045
    fan.add(ringLight)
  }

  return fan
}

function rebuildCase() {
  // 清空旧外壳（旧后置风扇转子会随 dispose 脱离场景，animate 里会自动跳过）
  disposeChildren(caseGroup)

  const pal = casePalette()
  const W = 3.8
  const H = 4.8
  const D = 2.8
  const baseY = -2.0

  // 机箱四柱金属框架
  const frameMat = brushedMetal(pal.frame)
  const pillar = (x, z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, 0.12), frameMat)
    p.position.set(x, baseY + H / 2, z)
    p.castShadow = true
    caseGroup.add(p)
  }
  pillar(-W / 2 + 0.06, -D / 2 + 0.06)
  pillar(W / 2 - 0.06, -D / 2 + 0.06)
  pillar(-W / 2 + 0.06, D / 2 - 0.06)
  pillar(W / 2 - 0.06, D / 2 - 0.06)

  // 顶部 / 底部横梁
  const beamMat = brushedMetal(pal.beam)
  const beam = (x, y, z, sx, sy, sz) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), beamMat)
    b.position.set(x, y, z)
    b.castShadow = true
    caseGroup.add(b)
  }
  beam(0, baseY + H, 0, W, 0.12, D)
  beam(0, baseY, 0, W, 0.12, D)

  // 背板（主板安装板）
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, H - 0.3, D - 0.3),
    metal(0x2a2d36, { roughness: 0.55, metalness: 0.5 }),
  )
  tray.position.set(-W / 2 + 0.14, baseY + H / 2, 0)
  tray.receiveShadow = true
  caseGroup.add(tray)

  // 玻璃侧板（右侧，物理材质：高透光 + 清漆层反射）
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: pal.glass,
    metalness: 0.1,
    roughness: 0.04,
    transparent: true,
    opacity: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
  })
  const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, H - 0.3, 0.02), glassMat)
  rightGlass.position.set(0, baseY + H / 2, D / 2 - 0.1)
  caseGroup.add(rightGlass)

  // 前面板（封闭，木质机箱用木色）
  const frontMat = metal(pal.front, { roughness: 0.55, metalness: 0.2 })
  const front = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, H - 0.3, 0.06), frontMat)
  front.position.set(0, baseY + H / 2, -D / 2 + 0.1)
  caseGroup.add(front)

  // 电源屏蔽罩（下置电源仓，真实机箱的标志性结构）
  const shroud = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.3, 0.08, D - 0.3),
    metal(pal.shroud, { roughness: 0.5, metalness: 0.4 }),
  )
  shroud.position.set(0, baseY + 0.95, 0)
  shroud.castShadow = true
  shroud.receiveShadow = true
  caseGroup.add(shroud)
  // 屏蔽罩侧板
  const shroudSide = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.3, 0.9, 0.04),
    metal(pal.shroud, { roughness: 0.5, metalness: 0.4 }),
  )
  shroudSide.position.set(0, baseY + 0.5, D / 2 - 0.35)
  caseGroup.add(shroudSide)

  // 顶部散热格栅
  const grillMat = brushedMetal(pal.grill)
  for (let i = 0; i < 10; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, 0.04, 0.08), grillMat)
    bar.position.set(0, baseY + H - 0.1, -0.5 + i * 0.15)
    caseGroup.add(bar)
  }

  // 后置排风扇（真实扇叶）
  const rearFan = makeFan(0.42)
  rearFan.position.set(-W / 2 + 0.24, baseY + 3.3, 0)
  rearFan.rotation.y = Math.PI / 2
  caseGroup.add(rearFan)

  // 底部脚垫
  const footMat = plastic(0x0c0c10, { roughness: 0.8 })
  for (const fx of [-1.5, 1.5]) {
    for (const fz of [-1.0, 1.0]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.15, 16), footMat)
      foot.position.set(fx, baseY - 0.08, fz)
      caseGroup.add(foot)
    }
  }
}

function clearParts() {
  if (!partsGroup) return
  // 配件组里的风扇转子会随重建失效，直接清空整个数组，
  // 机箱组的风扇转子在 rebuildCase 里重新登记（见 rebuildCase 末尾）。
  spinningFans = []
  disposeChildren(partsGroup)
}

function addMesh(parent, geo, mat, x, y, z, opts = {}) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  if (opts.cast) m.castShadow = true
  if (opts.receive) m.receiveShadow = true
  if (opts.rot) m.rotation.set(...opts.rot)
  parent.add(m)
  return m
}

function rebuildParts() {
  clearParts()
  const s = store.selected
  const baseY = -2.0

  // —— 主板 ——
  if (s.motherboard) {
    const mb = new THREE.Group()

    // PCB 基板
    const mbMat = new THREE.MeshStandardMaterial({
      color: 0x16211a,
      roughness: 0.5,
      metalness: 0.3,
      envMapIntensity: 0.7,
    })
    addMesh(mb, new THREE.BoxGeometry(3.0, 0.08, 2.4), mbMat, 0, 0, 0, { cast: true, receive: true })

    // PCB 上的线路纹理（细长条模拟走线）
    const traceMat = glow(0x2a4a3a, 0.15)
    for (let i = 0; i < 8; i++) {
      addMesh(mb, new THREE.BoxGeometry(2.6, 0.005, 0.015), traceMat, 0, 0.045, -1.0 + i * 0.28, {})
    }

    // VRM 散热片（带鳍片细节）
    const vrmMat = brushedMetal(0x3a3a48)
    for (const vz of [-0.55, 0.45]) {
      const vrm = new THREE.Group()
      addMesh(vrm, new THREE.BoxGeometry(0.9, 0.1, 0.4), vrmMat, 0, 0, 0, { cast: true })
      for (let i = 0; i < 6; i++) {
        addMesh(vrm, new THREE.BoxGeometry(0.86, 0.14, 0.02), vrmMat, 0, 0.1, -0.15 + i * 0.06, {})
      }
      vrm.position.set(-0.9, 0.16, vz)
      mb.add(vrm)
    }

    // 供电电容（小圆柱阵列）
    const capMat = metal(0x303038, { roughness: 0.3, metalness: 0.8 })
    for (let i = 0; i < 6; i++) {
      addMesh(mb, new THREE.CylinderGeometry(0.04, 0.04, 0.12, 10), capMat, -0.35, 0.1, -0.7 + i * 0.22, { cast: true })
    }

    // I/O 挡板
    addMesh(mb, new THREE.BoxGeometry(0.06, 0.9, 2.2), brushedMetal(0x555566), -1.55, 0.5, 0, { cast: true })

    // PCIe 插槽（带卡扣色）
    const slotMat = plastic(0x14141c, { roughness: 0.4 })
    for (let i = 0; i < 3; i++) {
      addMesh(mb, new THREE.BoxGeometry(0.14, 0.08, 1.6), slotMat, 0.5, 0.07 + i * 0.28, 0.2, { cast: true })
    }

    // 内存插槽（4 条）
    for (let i = 0; i < 4; i++) {
      addMesh(mb, new THREE.BoxGeometry(0.05, 0.06, 1.3), slotMat, -0.62 + i * 0.12, 0.07, -0.2, {})
    }

    // 芯片组散热片
    addMesh(mb, new THREE.BoxGeometry(0.6, 0.12, 0.6), brushedMetal(0x333344), 0.6, 0.1, -0.6, { cast: true })

    mb.position.set(0, baseY + 1.35, 0)
    partsGroup.add(mb)
  } else {
    // 未选主板时的占位板
    addMesh(partsGroup, new THREE.BoxGeometry(3.0, 0.08, 2.4), metal(0x333333, { roughness: 0.6 }), 0, baseY + 1.35, 0, { cast: true, receive: true })
  }

  // —— CPU ——
  if (s.cpu) {
    const c = partColor(s.cpu)
    // 插槽基座
    addMesh(partsGroup, new THREE.BoxGeometry(0.85, 0.06, 0.85), plastic(0x1c1c22), -0.9, baseY + 1.41, 0, { cast: true })
    // CPU 金属顶盖（IHS，高反光）
    addMesh(partsGroup, new THREE.BoxGeometry(0.7, 0.07, 0.7), metal(c, { roughness: 0.15, metalness: 0.95, envMapIntensity: 1.4 }), -0.9, baseY + 1.47, 0, { cast: true })
  }

  // —— 内存条 ——
  if (s.ram) {
    const c = partColor(s.ram)
    const rgb = rgbHex()
    for (const rx of [-0.58, -0.34]) {
      const stick = new THREE.Group()
      // 散热马甲（双面）
      addMesh(stick, new THREE.BoxGeometry(0.05, 1.05, 1.15), metal(c, { roughness: 0.35, metalness: 0.8 }), 0, 0, 0, { cast: true })
      // 马甲纹理凹槽
      for (let i = 0; i < 5; i++) {
        addMesh(stick, new THREE.BoxGeometry(0.06, 0.02, 1.0), metal(0x222228, { roughness: 0.4 }), 0, -0.35 + i * 0.18, 0, {})
      }
      // 顶部 RGB 灯条（扩散罩发光）
      addMesh(stick, new THREE.BoxGeometry(0.07, 0.09, 1.18), glow(rgb, 1.1), 0, 0.58, 0, {})
      stick.position.set(rx, baseY + 2.0, -0.2)
      partsGroup.add(stick)
    }
  }

  // —— 显卡 ——
  if (s.gpu) {
    const c = partColor(s.gpu)
    const rgb = rgbHex()
    const gpuLen = Math.min(2.6, (s.gpu.length || 300) / 130)
    const gpu = new THREE.Group()

    // 导流罩主体（略带棱角的双层结构）
    addMesh(gpu, new THREE.BoxGeometry(gpuLen, 0.5, 0.95), metal(c, { roughness: 0.3, metalness: 0.7 }), 0, 0, 0, { cast: true })
    addMesh(gpu, new THREE.BoxGeometry(gpuLen * 0.96, 0.54, 0.85), plastic(0x16161c, { roughness: 0.35 }), 0, 0, 0, { cast: true })

    // 金属背板（拉丝）
    addMesh(gpu, new THREE.BoxGeometry(gpuLen, 0.03, 0.95), brushedMetal(0x22222c), 0, 0.28, 0, {})

    // 侧面 RGB 灯带（品牌 LOGO 位置）
    addMesh(gpu, new THREE.BoxGeometry(gpuLen * 0.7, 0.05, 0.02), glow(rgb, 1.2), 0, 0.18, 0.49, {})

    // 尾部散热鳍片出风口
    const finMat = brushedMetal(0x3c3c46)
    for (let i = 0; i < 12; i++) {
      addMesh(gpu, new THREE.BoxGeometry(0.05, 0.4, 0.9), finMat, gpuLen / 2 - 0.01, 0, -0.44 + i * 0.08, {})
    }

    // 8pin 供电接口
    addMesh(gpu, new THREE.BoxGeometry(0.18, 0.1, 0.12), plastic(0xf0f0f0, { roughness: 0.4 }), gpuLen / 2 - 0.4, 0.3, -0.3, {})

    // 三个真实风扇（扇叶可旋转，朝向 +z 面朝观察者，确保可见）
    for (let i = -1; i <= 1; i++) {
      const fan = makeFan(0.3)
      fan.position.set(i * (gpuLen / 3.1), 0, 0.48)
      gpu.add(fan)
    }

    gpu.position.set(0.2, baseY + 1.75, 0.55)
    partsGroup.add(gpu)
  }

  // —— 散热器 ——
  if (s.cooler) {
    const c = partColor(s.cooler)
    const rgb = rgbHex()
    const isAIO = (s.cooler.coolerHeight || 0) <= 60

    if (isAIO) {
      // 水冷：冷排（顶部）+ 三个排风扇 + 泵头 + 弯曲水管
      const rad = new THREE.Group()
      addMesh(rad, new THREE.BoxGeometry(2.6, 0.14, 0.6), plastic(0x1c1c22, { roughness: 0.45 }), 0, 0, 0, { cast: true })
      // 冷排鳍片纹理
      for (let i = 0; i < 16; i++) {
        addMesh(rad, new THREE.BoxGeometry(2.56, 0.02, 0.02), brushedMetal(0x3a3a44), 0, 0.08, -0.27 + i * 0.036, {})
      }
      // 冷排风扇（向上吹）
      for (let i = -1; i <= 1; i++) {
        const fan = makeFan(0.26, { rgbColor: rgb })
        fan.rotation.x = Math.PI / 2
        fan.position.set(i * 0.85, 0.12, 0)
        rad.add(fan)
      }
      rad.position.set(0, baseY + 4.35, 0.6)
      partsGroup.add(rad)

      // 泵头（带 RGB 光环）
      addMesh(partsGroup, new THREE.CylinderGeometry(0.32, 0.36, 0.3, 24), plastic(0x1a1a20, { roughness: 0.3 }), -0.9, baseY + 1.62, 0, { cast: true })
      addMesh(partsGroup, new THREE.TorusGeometry(0.3, 0.03, 10, 32), glow(rgb, 1.3), -0.9, baseY + 1.74, 0, { rot: [Math.PI / 2, 0, 0] })

      // 水管（真实曲线管道）
      const tubeMat = plastic(0x141418, { roughness: 0.7 })
      const tubeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.75, baseY + 1.7, 0.15),
        new THREE.Vector3(-0.3, baseY + 2.6, 0.4),
        new THREE.Vector3(-0.6, baseY + 3.6, 0.55),
        new THREE.Vector3(-1.0, baseY + 4.3, 0.6),
      ])
      partsGroup.add(new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 32, 0.045, 10), tubeMat))
      const tubeCurve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.05, baseY + 1.7, 0.1),
        new THREE.Vector3(-0.6, baseY + 2.4, 0.5),
        new THREE.Vector3(0.0, baseY + 3.6, 0.6),
        new THREE.Vector3(0.4, baseY + 4.3, 0.6),
      ])
      partsGroup.add(new THREE.Mesh(new THREE.TubeGeometry(tubeCurve2, 32, 0.045, 10), tubeMat))
    } else {
      // 风冷塔：密集鳍片 + 六根热管 + 真实风扇
      const tower = new THREE.Group()
      const finMat = brushedMetal(c)
      // 鳍片更薄更密，更接近真实
      for (let i = 0; i < 26; i++) {
        addMesh(tower, new THREE.BoxGeometry(1.15, 0.018, 1.15), finMat, 0, i * 0.055, 0, {})
      }
      // 底部均热板
      addMesh(tower, new THREE.BoxGeometry(0.8, 0.08, 0.8), metal(0x8a6a3a, { roughness: 0.25, metalness: 0.95 }), 0, -0.08, 0, {})
      // 六根热管（铜色，穿出顶部）
      const pipeMat = metal(0xb87333, { roughness: 0.25, metalness: 0.95, envMapIntensity: 1.3 })
      for (const [px, pz] of [[-0.3, 0.3], [0, 0.35], [0.3, 0.3], [-0.3, -0.3], [0, -0.35], [0.3, -0.3]]) {
        addMesh(tower, new THREE.CylinderGeometry(0.035, 0.035, 1.75, 8), pipeMat, px, 0.72, pz, {})
      }
      // 前挂风扇（真实扇叶）
      const fan = makeFan(0.5)
      fan.position.set(0, 0.72, 0.62)
      tower.add(fan)
      tower.position.set(-0.9, baseY + 1.55, 0)
      partsGroup.add(tower)
    }
  }

  // —— 电源（在屏蔽罩下方，露出风扇面） ——
  if (s.psu) {
    const c = partColor(s.psu)
    const psu = new THREE.Group()
    addMesh(psu, new THREE.BoxGeometry(1.7, 0.8, 1.25), metal(c, { roughness: 0.45, metalness: 0.6 }), 0, 0, 0, { cast: true })
    // 顶部风扇格栅（圆孔阵列用同心圆模拟）
    addMesh(psu, new THREE.CylinderGeometry(0.38, 0.38, 0.02, 24), plastic(0x101014, { roughness: 0.4 }), 0, 0.41, 0, {})
    for (let i = 0; i < 3; i++) {
      addMesh(psu, new THREE.TorusGeometry(0.12 + i * 0.1, 0.008, 6, 24), metal(0x2c2c34, { roughness: 0.4 }), 0, 0.42, 0, { rot: [Math.PI / 2, 0, 0] })
    }
    // 侧面标签
    addMesh(psu, new THREE.BoxGeometry(1.0, 0.4, 0.01), glow(0xf0f0f0, 0.15), 0, 0, 0.63, {})
    psu.position.set(0, baseY + 0.48, -0.4)
    partsGroup.add(psu)
  }

  // —— SSD（M.2，装在主板散热装甲下） ——
  if (s.storage) {
    const c = partColor(s.storage)
    addMesh(partsGroup, new THREE.BoxGeometry(1.0, 0.04, 0.5), plastic(0x14141a, { roughness: 0.3 }), 0.9, baseY + 1.42, 0.6, { cast: true })
    // 散热装甲
    addMesh(partsGroup, new THREE.BoxGeometry(0.95, 0.05, 0.45), metal(c, { roughness: 0.3, metalness: 0.85 }), 0.9, baseY + 1.46, 0.6, {})
    // 装甲凹槽
    for (let i = 0; i < 4; i++) {
      addMesh(partsGroup, new THREE.BoxGeometry(0.9, 0.02, 0.04), metal(0x1c1c22, { roughness: 0.4 }), 0.9, baseY + 1.49, 0.45 + i * 0.1, {})
    }
  }

  // —— 前面板 RGB 风扇（真实扇叶 + 灯圈） ——
  if (s.case) {
    const fanRGB = rgbHex()
    for (let i = 0; i < 2; i++) {
      const fan = makeFan(0.5, { rgbColor: fanRGB })
      fan.position.set(-0.85 + i * 1.7, baseY + 2.2, -1.28)
      partsGroup.add(fan)
    }
  }
}

function onResize() {
  if (!renderer || !container.value) return
  const w = container.value.clientWidth
  const h = container.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

let lastTime = 0
function animate(time = 0) {
  animationId = requestAnimationFrame(animate)
  const dt = Math.min((time - lastTime) / 1000, 0.05)
  lastTime = time

  // 风扇转动（约每秒 12 弧度，视觉上有动感但不至于糊）
  // 跳过已脱离场景的转子（重建后残留的旧对象）
  for (const rotor of spinningFans) {
    if (rotor.parent) rotor.rotation.z -= 12 * dt
  }

  // RGB 氛围灯呼吸
  if (rgbLight) {
    const pulse = 0.85 + Math.sin(time * 0.002) * 0.15
    rgbLight.intensity = 10 * pulse
    rgbLight.color.setHex(rgbHex())
  }

  controls.update()
  renderer.render(scene, camera)
}

onMounted(() => {
  initScene()
  rebuildParts()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  controls.dispose()
  renderer.dispose()
  container.value?.removeChild(renderer.domElement)
})

watch(
  () => store.selected,
  () => {
    rebuildParts()
    // 机箱变化时同步更新外壳外观
    rebuildCase()
  },
  { deep: true },
)

// RGB 颜色变化时重建（内存灯条 + 机箱风扇）
watch(
  () => store.rgbColor,
  () => {
    rebuildParts()
  },
)
</script>

<template>
  <div
    ref="container"
    class="h-[420px] w-full overflow-hidden rounded-xl border border-ink-700/70 bg-gradient-to-b from-ink-900 to-ink-950 sm:h-[460px]"
  />
</template>
