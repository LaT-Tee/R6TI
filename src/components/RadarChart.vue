<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  userLevels: Object,
  dimOrder: Array,
  dimDefs: Object,
})

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const canvas = ref(null)

function draw() {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const size = 320
  canvas.value.width = size * dpr
  canvas.value.height = size * dpr
  canvas.value.style.width = size + 'px'
  canvas.value.style.height = size + 'px'
  ctx.scale(dpr, dpr)

  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 40
  const n = props.dimOrder.length
  const angleStep = (Math.PI * 2) / n
  const startAngle = -Math.PI / 2

  ctx.clearRect(0, 0, size, size)

  // 背景圆环 (3层)
  for (let level = 3; level >= 1; level--) {
    const r = (level / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle =
      level === 3
        ? 'rgba(255, 106, 0, 0.06)'
        : level === 2
          ? 'rgba(255, 106, 0, 0.04)'
          : 'rgba(255, 106, 0, 0.02)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 106, 0, 0.15)'
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // 轴线 + 标签
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(255, 106, 0, 0.12)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    const labelR = maxR + 22
    const lx = cx + Math.cos(angle) * labelR
    const ly = cy + Math.sin(angle) * labelR
    const dim = props.dimOrder[i]
    const label = props.dimDefs[dim]?.name?.replace(/^[A-Za-z0-9]+\s*/, '') || dim
    ctx.fillStyle = '#7d8590'
    ctx.fillText(label, lx, ly)
  }

  // 数据多边形
  const values = props.dimOrder.map((dim) => LEVEL_NUM[props.userLevels[dim]] || 2)

  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(255, 106, 0, 0.2)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 106, 0, 0.8)'
  ctx.lineWidth = 2
  ctx.stroke()

  // 数据点
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ff6a00'
    ctx.fill()
    ctx.strokeStyle = '#0d1117'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

onMounted(draw)
watch(() => props.userLevels, draw, { deep: true })
</script>

<template>
  <canvas ref="canvas" class="radar-chart"></canvas>
</template>
