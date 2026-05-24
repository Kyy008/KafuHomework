import { HOUR_MS } from './dateUtils'

export const URGENT_THRESHOLD_MS = 6 * HOUR_MS
export const APPROACHING_THRESHOLD_MS = 48 * HOUR_MS

const PROGRESS_START_COLOR = '#4bae50'
const PROGRESS_MID_COLOR = '#f5c84c'
const PROGRESS_END_COLOR = '#ff0000'

const STATUS_META = {
  active: {
    label: '进行中',
    tone: 'active',
  },
  approaching: {
    label: '临近',
    tone: 'warning',
  },
  urgent: {
    label: '紧急',
    tone: 'danger',
  },
  completed: {
    label: '已完成',
    tone: 'success',
  },
}

export const getAssignmentStatus = (assignment, now = new Date()) => {
  if (assignment.completed) {
    return STATUS_META.completed
  }

  const deadlineTime = new Date(assignment.deadline).getTime()

  if (Number.isNaN(deadlineTime)) {
    return STATUS_META.active
  }

  const remainingMs = deadlineTime - now.getTime()

  if (remainingMs <= URGENT_THRESHOLD_MS) {
    return STATUS_META.urgent
  }

  if (remainingMs <= APPROACHING_THRESHOLD_MS) {
    return STATUS_META.approaching
  }

  return STATUS_META.active
}

const getRemainingMs = (assignment, now) => {
  const deadlineTime = new Date(assignment.deadline).getTime()

  if (Number.isNaN(deadlineTime)) {
    return Number.POSITIVE_INFINITY
  }

  return deadlineTime - now.getTime()
}

export const getAssignmentStats = (assignments, now) =>
  assignments.reduce(
    (stats, assignment) => {
      if (assignment.completed) {
        return { ...stats, completed: stats.completed + 1 }
      }

      const remainingMs = getRemainingMs(assignment, now)
      const nextStats = { ...stats, active: stats.active + 1 }

      if (remainingMs <= URGENT_THRESHOLD_MS) {
        return { ...nextStats, urgent: nextStats.urgent + 1 }
      }

      if (
        remainingMs > URGENT_THRESHOLD_MS &&
        remainingMs <= APPROACHING_THRESHOLD_MS
      ) {
        return { ...nextStats, approaching: nextStats.approaching + 1 }
      }

      return nextStats
    },
    {
      active: 0,
      approaching: 0,
      urgent: 0,
      completed: 0,
    },
  )

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

export const calculateAssignmentProgress = (assignment, now = new Date()) => {
  if (assignment.completed) {
    return 100
  }

  const startTime = new Date(assignment.createdAt).getTime()
  const deadlineTime = new Date(assignment.deadline).getTime()
  const nowTime = now.getTime()

  if (Number.isNaN(startTime) || Number.isNaN(deadlineTime)) {
    return 0
  }

  const totalMs = deadlineTime - startTime

  if (totalMs <= 0) {
    return nowTime >= deadlineTime ? 100 : 0
  }

  // 进度条表达“从创建到截止已经过去了多少时间”，用于提示紧迫程度。
  return clampPercentage(((nowTime - startTime) / totalMs) * 100)
}

const hexToRgb = (hex) => {
  const normalizedHex = hex.replace('#', '')

  return {
    red: Number.parseInt(normalizedHex.slice(0, 2), 16),
    green: Number.parseInt(normalizedHex.slice(2, 4), 16),
    blue: Number.parseInt(normalizedHex.slice(4, 6), 16),
  }
}

const mixRgb = (from, to, amount) => ({
  red: Math.round(from.red + (to.red - from.red) * amount),
  green: Math.round(from.green + (to.green - from.green) * amount),
  blue: Math.round(from.blue + (to.blue - from.blue) * amount),
})

const rgbToCss = ({ blue, green, red }) => `rgb(${red} ${green} ${blue})`

export const getProgressColor = (progress) => {
  const clampedProgress = clampPercentage(progress)
  const startColor = hexToRgb(PROGRESS_START_COLOR)
  const midColor = hexToRgb(PROGRESS_MID_COLOR)
  const endColor = hexToRgb(PROGRESS_END_COLOR)

  if (clampedProgress <= 50) {
    return rgbToCss(mixRgb(startColor, midColor, clampedProgress / 50))
  }

  // 50% 后从黄色逐渐过渡到红色，让临近截止的作业更醒目。
  return rgbToCss(mixRgb(midColor, endColor, (clampedProgress - 50) / 50))
}
