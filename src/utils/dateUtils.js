export const HOUR_MS = 60 * 60 * 1000

export const formatDateTimeInputValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export const getAssignmentFormData = (assignment) => {
  if (!assignment) {
    return {
      title: '',
      detail: '',
      course: '',
      deadline: '',
    }
  }

  const deadlineDate = new Date(assignment.deadline)

  return {
    title: assignment.title,
    detail: assignment.detail,
    course: assignment.course,
    deadline: Number.isNaN(deadlineDate.getTime())
      ? ''
      : formatDateTimeInputValue(deadlineDate),
  }
}

export const parseLocalDateTimeValue = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const getDefaultDeadlineDate = (minDeadline) => {
  const minDate = parseLocalDateTimeValue(minDeadline) ?? new Date()
  const defaultDate = new Date(minDate.getTime() + HOUR_MS)
  defaultDate.setSeconds(0, 0)
  defaultDate.setMinutes(Math.ceil(defaultDate.getMinutes() / 5) * 5)
  return defaultDate
}

export const isSameCalendarDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

export const isPastCalendarDay = (date, minDeadline) => {
  const minDate = parseLocalDateTimeValue(minDeadline) ?? new Date()
  const dayEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  )

  return dayEnd <= minDate
}

export const getCalendarDays = (visibleMonth) => {
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmptyDays = firstDay.getDay()

  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      return new Date(year, month, index + 1)
    }),
  ]
}

export const getMonthTitle = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    year: 'numeric',
  }).format(date)

export const formatDateOnly = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date)

export const formatTimeOnly = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

export const formatDateTime = (isoDate) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
