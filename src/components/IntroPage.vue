<script setup>
defineProps({
  config: Object,
})
defineEmits(['start'])
</script>

<template>
  <div class="page intro-page">
    <div class="card intro-card">
      <!-- R6 Logo 风格标题 -->
      <div class="r6-logo">
        <div class="r6-hex">
          <svg viewBox="0 0 100 100" class="hex-svg">
            <polygon points="50,3 93,25 93,75 50,97 7,75 7,25" fill="none" stroke="currentColor" stroke-width="2"/>
            <text x="50" y="58" text-anchor="middle" font-size="28" font-weight="900" fill="currentColor">R6</text>
          </svg>
        </div>
        <h1 class="intro-title">R6TI</h1>
        <p class="intro-subtitle">战术人格测试</p>
        <p class="intro-tagline">{{ config.display.subtitle }}</p>
      </div>

      <div class="intro-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-num">32</span>
            <span class="info-label">战术问题</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="info-num">77</span>
            <span class="info-label">干员人格</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="info-num">15</span>
            <span class="info-label">战术维度</span>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-glow" @click="$emit('start')">
        <span class="btn-icon">&#9654;</span>
        开始部署
      </button>

      <p class="intro-credit">基于 SBTI 算法 · 灵感来自哔哩哔哩<a href="https://space.bilibili.com/448719" target="_blank" rel="noopener">@正义的伙伴阿</a> 的节目效果</p>
      <p class="intro-credit intro-credit-support">支持 <a href="https://space.bilibili.com/3493297907567491" target="_blank" rel="noopener">彩虹六号攻势</a>喵，支持彩虹六号攻势谢谢喵</p>
      <a href="https://r6.qq.com/cp/R62026410activity/" target="_blank" rel="noopener" class="r6-ad-banner">
        彩虹六号攻势 · 现已开放首测先遣资格招募！
      </a>
      <p class="intro-note">{{ config.display.funNote }}</p>
    </div>
  </div>
</template>
