/**
 * R6TI 评分引擎 — 基于 SBTI 算法，适配彩虹六号干员匹配
 */

/**
 * 按维度求和：每维度 2 题，分值相加 (范围 2-6)
 */
export function calcDimensionScores(answers, questions) {
  const scores = {}
  for (const q of questions) {
    if (answers[q.id] == null) continue
    scores[q.dim] = (scores[q.dim] || 0) + answers[q.id]
  }
  return scores
}

/**
 * 原始分 → L/M/H 等级
 */
export function scoresToLevels(scores, thresholds) {
  const levels = {}
  for (const [dim, score] of Object.entries(scores)) {
    if (score <= thresholds.L[1]) levels[dim] = 'L'
    else if (score >= thresholds.H[0]) levels[dim] = 'H'
    else levels[dim] = 'M'
  }
  return levels
}

const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * 解析干员的 pattern 字符串
 * "HHH-HMH-MHH-HHH-MHM" → ['H','H','H','H','M','H','M','H','H','H','H','H','M','H','M']
 */
export function parsePattern(pattern) {
  return pattern.replace(/-/g, '').split('')
}

/**
 * 计算用户向量与类型 pattern 的曼哈顿距离
 */
export function matchType(userLevels, dimOrder, pattern) {
  const typeLevels = parsePattern(pattern)
  let distance = 0
  let exact = 0

  for (let i = 0; i < dimOrder.length; i++) {
    const userVal = LEVEL_NUM[userLevels[dimOrder[i]]] || 2
    const typeVal = LEVEL_NUM[typeLevels[i]] || 2
    const diff = Math.abs(userVal - typeVal)
    distance += diff
    if (diff === 0) exact++
  }

  const similarity = Math.max(0, Math.round((1 - distance / 30) * 100))
  return { distance, exact, similarity }
}

/**
 * 彩蛋亲和力加成
 * 根据用户答题中的特殊选项，对特定干员给予距离减少（提升匹配概率）
 */
export function calcAffinityBonuses(answers) {
  const bonuses = {}

  // 统计答题倾向
  const values = Object.values(answers).filter((v) => typeof v === 'number')
  const aggressiveCount = values.filter((v) => v === 3).length
  const cautiousCount = values.filter((v) => v === 1).length

  // 特殊问题检测
  const cmdGateChoice = answers['cmd_gate_q1']

  // 前线突击手 → 突击类干员加成
  if (cmdGateChoice === 1) {
    bonuses['ASH'] = -7
    bonuses['FUZE'] = -5
    bonuses['SLEDGE'] = -4
    bonuses['ZOFIA'] = -4
    bonuses['RAM'] = -3
    bonuses['AMARU'] = -3
    bonuses['BLITZ'] = -2
  }
  // 技术专家 → 科技类干员加成
  if (cmdGateChoice === 2) {
    bonuses['IQ'] = -7
    bonuses['DOKKAEBI'] = -5
    bonuses['MIRA'] = -4
    bonuses['TWITCH'] = -4
    bonuses['OSA'] = -3
    bonuses['SOLIS'] = -2
    bonuses['JAGER'] = -2
  }
  // 情报特工 → 隐匿/情报类干员加成
  if (cmdGateChoice === 4) {
    bonuses['CAVEIRA'] = -5
    bonuses['VIGIL'] = -4
    bonuses['ZERO'] = -7
    bonuses['NOKK'] = -5
    bonuses['SOLID_SNAKE'] = -4
    bonuses['VALKYRIE'] = -2
    bonuses['GRIM'] = -2
  }
  // 医疗官 → 支援/治疗类干员加成
  if (cmdGateChoice === 5) {
    bonuses['DOC'] = -7
    bonuses['MONTAGNE'] = -4
    bonuses['FINKA'] = -5
    bonuses['THUNDERBIRD'] = -4
    bonuses['ROOK'] = -3
    bonuses['TUBARAO'] = -2
  }

  // 超级激进玩家 → Tachanka 加成（致敬Lord）
  if (aggressiveCount >= 14) {
    bonuses['TACHANKA'] = (bonuses['TACHANKA'] || 0) - 5
    bonuses['ORYX'] = (bonuses['ORYX'] || 0) - 3
    bonuses['CLASH'] = (bonuses['CLASH'] || 0) - 2
  }

  // 超级佛系玩家 → Echo, Mute 加成
  if (cautiousCount >= 12) {
    bonuses['ECHO'] = (bonuses['ECHO'] || 0) - 5
    bonuses['MUTE'] = (bonuses['MUTE'] || 0) - 3
    bonuses['LESION'] = (bonuses['LESION'] || 0) - 2
  }

  // 中庸之道 → 均衡/多面手干员加成
  const midCount = values.filter((v) => v === 2).length
  if (midCount >= 14) {
    bonuses['RAUORA'] = (bonuses['RAUORA'] || 0) - 5
    bonuses['BUCK'] = (bonuses['BUCK'] || 0) - 3
    bonuses['WAMAI'] = (bonuses['WAMAI'] || 0) - 2
  }

  return bonuses
}

/**
 * 匹配所有类型，排序，应用特殊覆盖和彩蛋加成
 */
export function determineResult(userLevels, dimOrder, standardTypes, specialTypes, options = {}) {
  const { isSix = false, isRecruit = false, affinityBonuses = {}, fallbackThreshold = 55 } = options

  const rankings = standardTypes.map((type) => {
    const match = matchType(userLevels, dimOrder, type.pattern)
    // 应用彩蛋亲和力加成
    const bonus = affinityBonuses[type.code] || 0
    const adjustedDistance = Math.max(0, match.distance + bonus)
    const adjustedSimilarity = Math.max(0, Math.round((1 - adjustedDistance / 30) * 100))
    return {
      ...type,
      ...match,
      distance: adjustedDistance,
      similarity: adjustedSimilarity,
    }
  })

  // 排序：距离升序 → 精准命中降序 → 相似度降序 → code字母序（稳定排序）
  rankings.sort((a, b) => a.distance - b.distance || b.exact - a.exact || b.similarity - a.similarity || a.code.localeCompare(b.code))

  const best = rankings[0]
  const six = specialTypes.find((t) => t.code === 'SIX')
  const recruit = specialTypes.find((t) => t.code === 'RECRUIT')

  // Six 指挥官覆盖
  if (isSix && six) {
    return {
      primary: { ...six, similarity: best.similarity, exact: best.exact },
      secondary: best,
      rankings,
      mode: 'six',
    }
  }

  // Recruit 厕所题直接触发
  if (isRecruit && recruit) {
    return {
      primary: {
        ...recruit,
        intro: recruit.trap_intro,
        desc: recruit.trap_desc,
        similarity: null,
        exact: null,
      },
      secondary: best,
      rankings,
      mode: 'recruit_trap',
    }
  }

  // Recruit 新兵兜底（自然触发）
  if (best.similarity < fallbackThreshold && recruit) {
    return {
      primary: { ...recruit, similarity: best.similarity, exact: best.exact },
      secondary: best,
      rankings,
      mode: 'fallback',
    }
  }

  return {
    primary: best,
    secondary: rankings[1] || null,
    rankings,
    mode: 'normal',
  }
}
