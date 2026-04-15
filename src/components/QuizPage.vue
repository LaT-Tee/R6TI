<script setup>
import { ref, computed } from 'vue'
import { shuffle, insertAtRandom, insertAfter } from '../utils.js'

const props = defineProps({
  questions: Object,
  config: Object,
})
const emit = defineEmits(['complete'])

const cmdGateQ1 = props.questions.special.find((q) => q.id === props.config.commandGate.questionId)
const cmdGateQ2 = props.questions.special.find((q) => q.id === 'cmd_gate_q2')
const recruitTrapQ = props.questions.special.find((q) => q.id === 'recruit_trap_q')

const queue = ref(insertAtRandom(insertAtRandom(shuffle(props.questions.main), cmdGateQ1), recruitTrapQ))
const current = ref(0)
const answers = ref({})
const isSix = ref(false)
const isRecruit = ref(false)
const transitioning = ref(false)
const highWatermark = ref(0)
const goingBack = ref(false)

const totalCount = computed(() => queue.value.length)
const progress = computed(() => (current.value / totalCount.value) * 100)
const progressText = computed(() => `${current.value} / ${totalCount.value}`)
const currentQuestion = computed(() => queue.value[current.value])
const transitionName = computed(() => goingBack.value ? 'question-slide-back' : 'question-slide')

const canGoBack = computed(() => current.value > 0 && !transitioning.value)
const canGoNext = computed(() => current.value < highWatermark.value && !transitioning.value)

function selectOption(question, option) {
  if (transitioning.value) return

  const prevAnswer = answers.value[question.id]
  answers.value[question.id] = option.value

  // 指挥官之门：处理 cmdGateQ2 的插入与移除
  if (question.id === props.config.commandGate.questionId) {
    const wasTrigger = prevAnswer === props.config.commandGate.triggerValue
    const isTrigger = option.value === props.config.commandGate.triggerValue
    if (!wasTrigger && isTrigger) {
      queue.value = insertAfter(queue.value, question.id, cmdGateQ2)
      highWatermark.value = current.value + 1
    } else if (wasTrigger && !isTrigger) {
      queue.value = queue.value.filter((q) => q.id !== 'cmd_gate_q2')
      delete answers.value['cmd_gate_q2']
      isSix.value = false
      highWatermark.value = current.value + 1
    }
  }

  // Six 检测
  if (question.id === 'cmd_gate_q2') {
    isSix.value = option.value === props.config.commandGate.sixTriggerValue
  }

  // 厕所题
  if (question.id === 'recruit_trap_q') {
    isRecruit.value = !!option.recruit
  }

  // 只在最前沿时自动跳下一题
  if (current.value === highWatermark.value) {
    transitioning.value = true
    goingBack.value = false
    setTimeout(() => {
      current.value++
      highWatermark.value = current.value
      if (current.value >= totalCount.value) {
        emit('complete', answers.value, isSix.value, isRecruit.value)
      }
      transitioning.value = false
    }, 200)
  }
}

function goBack() {
  if (!canGoBack.value) return
  goingBack.value = true
  current.value--
}

function goNext() {
  if (!canGoNext.value) return
  goingBack.value = false
  current.value++
}

function restart() {
  queue.value = insertAtRandom(insertAtRandom(shuffle(props.questions.main), cmdGateQ1), recruitTrapQ)
  current.value = 0
  answers.value = {}
  isSix.value = false
  isRecruit.value = false
  highWatermark.value = 0
  goingBack.value = false
}

defineExpose({ restart })
</script>

<template>
  <div class="page quiz-page">
    <div class="card quiz-card">
      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-text">{{ progressText }}</div>

      <!-- 题目 -->
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentQuestion?.id" class="question-area">
          <p class="question-text">{{ currentQuestion?.text }}</p>

          <div class="options-area">
            <button
              v-for="(opt, idx) in currentQuestion?.options"
              :key="idx"
              class="btn btn-option"
              :class="{ 'btn-option-selected': answers[currentQuestion?.id] === opt.value }"
              @click="selectOption(currentQuestion, opt)"
            >
              <span class="option-marker">{{ String.fromCharCode(65 + idx) }}</span>
              {{ opt.label }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- 导航按钮 -->
      <div class="quiz-nav">
        <button class="btn-nav" :disabled="!canGoBack" @click="goBack">‹ 上一题</button>
        <button class="btn-nav" :disabled="!canGoNext" @click="goNext">下一题 ›</button>
      </div>
    </div>
  </div>
</template>
