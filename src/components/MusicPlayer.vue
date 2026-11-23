<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWelcomeStore } from '@/stores/welcome'

const welcome = useWelcomeStore()

// 播放列表配置：把 mp3 文件放进 public/music/ 目录，对应填 "文件名.扩展名"
// 名称和封面可自定义
const playlist = [
  { title: '晴天', artist: '周杰伦', file: '晴天.mp3' },
]

const expanded = ref(false)
const playing = ref(false)
const currentIndex = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const audioEl = ref(null)
const listVisible = ref(false)

const current = computed(() => playlist[currentIndex.value])

function srcOf(track) {
  // 用 encodeURI 处理中文文件名，避免 URL 编码问题
  return '/music/' + encodeURI(track.file)
}

function togglePlay() {
  const audio = audioEl.value
  if (!audio) return
  if (playing.value) {
    audio.pause()
  } else {
    audio.play().catch(() => {
      // 无对应音频文件时静默失败
      playing.value = false
    })
  }
}

function playTrack(i) {
  currentIndex.value = i
  listVisible.value = false
  // 切到新曲目后自动播放
  const audio = audioEl.value
  if (!audio) return
  audio.currentTime = 0
  audio.play().then(() => {
    playing.value = true
  }).catch(() => {
    playing.value = false
  })
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % playlist.length
  if (playing.value) {
    playTrack(currentIndex.value)
  }
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + playlist.length) % playlist.length
  if (playing.value) playTrack(currentIndex.value)
}

function onTimeUpdate() {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

function onLoadedMetadata() {
  if (audioEl.value) duration.value = audioEl.value.duration
}

function onEnded() {
  playing.value = false
  // 自动下一首
  next()
}

function onVolume() {
  if (audioEl.value) audioEl.value.volume = volume.value
}

function seek(e) {
  const audio = audioEl.value
  if (!audio || !duration.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  audio.currentTime = ratio * duration.value
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m + ':' + String(sec).padStart(2, '0')
}

// 尝试自动播放
function tryAutoPlay() {
  const audio = audioEl.value
  if (!audio || playing.value) return
  audio.play().then(() => {
    playing.value = true
  }).catch(() => {
    // 浏览器拦截了自动播放（理论上点击进入时不会拦截）
    playing.value = false
  })
}

// 浏览器首次交互（点击/键盘）时自动播放（兜底）
function onFirstInteraction() {
  tryAutoPlay()
  window.removeEventListener('click', onFirstInteraction)
  window.removeEventListener('keydown', onFirstInteraction)
}

onMounted(() => {
  // 若用户已经"点击进入网站"，则尝试自动播放
  if (welcome.entered) tryAutoPlay()
  // 兜底：首次交互时自动播放
  window.addEventListener('click', onFirstInteraction)
  window.addEventListener('keydown', onFirstInteraction)
})

// 用户点击"进入网站"后触发播放（这是可靠的用户交互，不会被拦截）
watch(
  () => welcome.entered,
  (val) => {
    if (val) tryAutoPlay()
  },
)

onBeforeUnmount(() => {
  if (audioEl.value) audioEl.value.pause()
  window.removeEventListener('click', onFirstInteraction)
  window.removeEventListener('keydown', onFirstInteraction)
})
</script>

<template>
  <!-- 右下角悬浮播放器 -->
  <div class="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
    <!-- 展开面板 -->
    <div
      v-if="expanded"
      class="w-72 rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-2xl"
    >
      <!-- 顶部：曲目信息 + 收起 -->
      <div class="mb-3 flex items-start justify-between">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-txt-strong">
            {{ current.title }}
          </p>
          <p class="truncate text-xs text-txt-faint">
            {{ current.artist }}
          </p>
        </div>
        <button
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-txt-faint hover:text-txt-strong"
          @click="expanded = false"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <!-- 进度条 -->
      <div
        class="group h-1.5 cursor-pointer rounded-full bg-ink-700"
        @click="seek"
      >
        <div
          class="h-full rounded-full bg-brand-500"
          :style="{ width: (duration ? (currentTime / duration) * 100 : 0) + '%' }"
        />
      </div>
      <div class="mt-1 flex justify-between text-[11px] text-txt-faint">
        <span>{{ formatTime(currentTime) }}</span>
        <span>{{ formatTime(duration) }}</span>
      </div>

      <!-- 控制按钮 -->
      <div class="mt-3 flex items-center justify-center gap-4">
        <button
          class="text-txt-muted hover:text-txt-strong"
          @click="prev"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button
          class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-500"
          @click="togglePlay"
        >
          <svg
            v-if="!playing"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          </svg>
        </button>
        <button
          class="text-txt-muted hover:text-txt-strong"
          @click="next"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
          </svg>
        </button>
      </div>

      <!-- 底部：播放列表 + 音量 -->
      <div class="mt-3 flex items-center justify-between">
        <button
          class="text-xs text-txt-faint hover:text-txt-strong"
          @click="listVisible = !listVisible"
        >
          播放列表 ({{ playlist.length }})
        </button>
        <div class="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-txt-faint"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23V5.3A6.5 6.5 0 0 1 14 18.7v2.07A8.5 8.5 0 0 0 14 3.23z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="h-1 w-16 cursor-pointer accent-brand-500"
            :value="volume"
            @input="volume = Number($event.target.value); onVolume()"
          >
        </div>
      </div>

      <!-- 播放列表 -->
      <ul
        v-if="listVisible"
        class="mt-2 max-h-40 space-y-1 overflow-y-auto border-t border-ink-700 pt-2"
      >
        <li
          v-for="(t, i) in playlist"
          :key="t.file"
        >
          <button
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-ink-800"
            :class="i === currentIndex ? 'bg-ink-800 text-brand-400' : 'text-txt-muted'"
            @click="playTrack(i)"
          >
            <span class="truncate">{{ t.title }} - {{ t.artist }}</span>
            <span v-if="i === currentIndex">▶</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- 悬浮球 -->
    <button
      class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-500"
      @click="expanded = !expanded"
    >
      <svg
        v-if="!expanded"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
      </svg>
      <svg
        v-else
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- 隐藏的 audio 元素 -->
  <audio
    ref="audioEl"
    :src="srcOf(current)"
    autoplay
    preload="auto"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="onEnded"
    @play="playing = true"
    @pause="playing = false"
  />
</template>