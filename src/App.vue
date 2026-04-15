<script setup>
import { ref, reactive } from 'vue'
import { calcDimensionScores, scoresToLevels, determineResult, calcAffinityBonuses } from './engine.js'
import IntroPage from './components/IntroPage.vue'
import QuizPage from './components/QuizPage.vue'
import ResultPage from './components/ResultPage.vue'
import questions from './data/questions.json'
import dimensions from './data/dimensions.json'
import types from './data/types.json'
import config from './data/config.json'

const page = ref('intro') // intro | quiz | result
const result = ref(null)
const userLevels = ref(null)

function onStart() {
  page.value = 'quiz'
  window.scrollTo(0, 0)
}

function onQuizComplete(answers, isSix, isRecruit) {
  const scores = calcDimensionScores(answers, questions.main)
  const levels = scoresToLevels(scores, config.scoring.levelThresholds)
  const affinityBonuses = calcAffinityBonuses(answers)
  const res = determineResult(levels, dimensions.order, types.standard, types.special, {
    isSix,
    isRecruit,
    affinityBonuses,
    fallbackThreshold: config.scoring.fallbackThreshold,
  })
  result.value = res
  userLevels.value = levels
  page.value = 'result'
  window.scrollTo(0, 0)
}

function onRestart() {
  result.value = null
  userLevels.value = null
  page.value = 'quiz'
  window.scrollTo(0, 0)
}
</script>

<template>
  <div id="r6ti-app">
    <!-- 背景六边形装饰 -->
    <div class="hex-bg" aria-hidden="true">
      <div v-for="i in 12" :key="i" class="hex-dot" :style="{
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: (Math.random() * 5) + 's',
        opacity: 0.03 + Math.random() * 0.05,
      }"></div>
    </div>

    <Transition name="page-fade" mode="out-in">
      <IntroPage v-if="page === 'intro'" :config="config" @start="onStart" />
      <QuizPage
        v-else-if="page === 'quiz'"
        :questions="questions"
        :config="config"
        @complete="onQuizComplete"
      />
      <ResultPage
        v-else-if="page === 'result'"
        :result="result"
        :userLevels="userLevels"
        :dimensions="dimensions"
        :config="config"
        @restart="onRestart"
      />
    </Transition>
  </div>
</template>

<style src="./style.css"></style>
