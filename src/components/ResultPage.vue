<script setup>
import { computed } from 'vue'
import RadarChart from './RadarChart.vue'

const props = defineProps({
  result: Object,
  userLevels: Object,
  dimensions: Object,
  config: Object,
})
defineEmits(['restart'])

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }

const kicker = computed(() => {
  if (props.result.mode === 'six') return '隐藏人格已激活'
  if (props.result.mode === 'fallback') return '系统强制兜底'
  return '你的干员人格'
})

const primary = computed(() => props.result.primary)
const secondary = computed(() => props.result.secondary)
const showSecondary = computed(() =>
  props.result.secondary && (props.result.mode === 'six' || props.result.mode === 'fallback')
)
const top5 = computed(() => props.result.rankings.slice(0, 5))

const badgeText = computed(() => {
  const p = primary.value
  let text = `匹配度 ${p.similarity}%`
  if (p.exact != null) text += ` · 精准命中 ${p.exact}/15 维`
  return text
})

const disclaimer = computed(() =>
  props.result.mode === 'normal'
    ? props.config.display.funNote
    : props.config.display.funNoteSpecial
)

const sideClass = computed(() => {
  const side = primary.value.side
  if (side === '攻击方') return 'side-attack'
  if (side === '防守方') return 'side-defend'
  return ''
})
</script>

<template>
  <div class="page result-page">
    <div class="card result-card">
      <!-- 扫描动画 -->
      <div class="scan-line"></div>

      <!-- Kicker -->
      <p class="result-kicker">{{ kicker }}</p>

      <!-- 主类型 -->
      <h2 class="result-code" :class="sideClass">{{ primary.code }}</h2>
      <p class="result-name">{{ primary.cn }}</p>

      <!-- 阵营标签 -->
      <span v-if="primary.side" class="side-badge" :class="sideClass">
        {{ primary.side }}
      </span>
      <span v-if="primary.ctu" class="ctu-badge">{{ primary.ctu }}</span>

      <!-- 匹配度 -->
      <div class="result-badge">{{ badgeText }}</div>

      <!-- Intro -->
      <p class="result-intro">"{{ primary.intro }}"</p>

      <!-- 描述 -->
      <p class="result-desc">{{ primary.desc }}</p>

      <!-- 次要匹配 -->
      <div v-if="showSecondary" class="result-secondary">
        <p class="secondary-label">
          {{ result.mode === 'six' ? '你最接近的标准干员' : '最接近的标准干员' }}
        </p>
        <p class="secondary-info">
          {{ secondary.code }}（{{ secondary.cn }}）· 匹配度 {{ secondary.similarity }}%
        </p>
      </div>

      <!-- 雷达图 -->
      <h3 class="section-title">战术维度分析</h3>
      <RadarChart
        :userLevels="userLevels"
        :dimOrder="dimensions.order"
        :dimDefs="dimensions.definitions"
      />

      <!-- 维度详情 -->
      <div class="dimensions-detail">
        <div v-for="dim in dimensions.order" :key="dim" class="dim-row">
          <div class="dim-header">
            <span class="dim-name">{{ dimensions.definitions[dim]?.name }}</span>
            <span class="dim-level" :class="LEVEL_CLASS[userLevels[dim] || 'M']">
              {{ LEVEL_LABEL[userLevels[dim] || 'M'] }}
            </span>
          </div>
          <div class="dim-desc">{{ dimensions.definitions[dim]?.levels[userLevels[dim] || 'M'] }}</div>
        </div>
      </div>

      <!-- TOP 5 -->
      <h3 class="section-title">最接近的 5 位干员</h3>
      <div class="top-list">
        <div v-for="(t, i) in top5" :key="t.code" class="top-item">
          <span class="top-rank">#{{ i + 1 }}</span>
          <span class="top-code">{{ t.code }}</span>
          <span class="top-name">{{ t.cn }}</span>
          <span class="top-sim">{{ t.similarity }}%</span>
        </div>
      </div>

      <!-- 免责声明 -->
      <div class="disclaimer">{{ disclaimer }}</div>

      <!-- 操作按钮 -->
      <div class="result-actions">
        <button class="btn btn-primary btn-glow" @click="$emit('restart')">
          重新部署
        </button>
      </div>
    </div>
  </div>
</template>
