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

const totalCount = computed(() => queue.value.length)
const progress = computed(() => (current.value / totalCount.value) * 100)
const progressText = computed(() => `${current.value} / ${totalCount.value}`)
const currentQuestion = computed(() => queue.value[current.value])

function selectOption(question, option) {
  if (transitioning.value) return
  transitioning.value = true

  answers.value[question.id] = option.value

  // 指挥官之门：如果选了"指挥全局"，插入追问
  if (question.id === props.config.commandGate.questionId && option.value === props.config.commandGate.triggerValue) {
    queue.value = insertAfter(queue.value, question.id, cmdGateQ2)
  }

  // Six 检测
  if (question.id === 'cmd_gate_q2' && option.value === props.config.commandGate.sixTriggerValue) {
    isSix.value = true
  }

  // 厕所题：选了无所谓，直接标记 RECRUIT
  if (question.id === 'recruit_trap_q' && option.recruit) {
    isRecruit.value = true
  }

  setTimeout(() => {
    current.value++
    if (current.value >= totalCount.value) {
      emit('complete', answers.value, isSix.value, isRecruit.value)
    }
    transitioning.value = false
  }, 200)
}

function restart() {
  queue.value = insertAtRandom(insertAtRandom(shuffle(props.questions.main), cmdGateQ1), recruitTrapQ)
  current.value = 0
  answers.value = {}
  isSix.value = false
  isRecruit.value = false
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
      <Transition name="question-slide" mode="out-in">
        <div :key="currentQuestion?.id" class="question-area">
          <p class="question-text">{{ currentQuestion?.text }}</p>

          <div class="options-area">
            <button
              v-for="(opt, idx) in currentQuestion?.options"
              :key="idx"
              class="btn btn-option"
              @click="selectOption(currentQuestion, opt)"
            >
              <span class="option-marker">{{ String.fromCharCode(65 + idx) }}</span>
              {{ opt.label }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
