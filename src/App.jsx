import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import appIcon from './assets/icon/icon.png'

// ============================================================
// KafuHomework —— 作业管理系统
// ============================================================

const STORAGE_KEY = 'ddl-reminder-assignments'

const createDateByOffset = (dayOffset, hour = 20, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const createInitialAssignments = () => [
  {
    id: 1,
    title: '轻量化第三次作业',
    detail: '完成 React 作业管理系统核心功能开发，并补充作业报告。',
    course: '轻量化软件开发',
    deadline: createDateByOffset(3, 22, 0),
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: 2,
    title: '行教课课程反思',
    detail: '整理课堂笔记，提交课程学习反思。',
    course: '行教课',
    deadline: createDateByOffset(1, 19, 0),
    createdAt: new Date().toISOString(),
    completed: false,
  },
  {
    id: 3,
    title: '外教课展示准备',
    detail: '准备小组展示材料，检查演讲稿和 PPT。',
    course: '外教课',
    deadline: createDateByOffset(7, 14, 0),
    createdAt: new Date().toISOString(),
    completed: true,
  },
]

const isValidAssignment = (assignment) =>
  assignment &&
  typeof assignment.id !== 'undefined' &&
  typeof assignment.title === 'string' &&
  typeof assignment.detail === 'string' &&
  typeof assignment.course === 'string' &&
  typeof assignment.deadline === 'string' &&
  typeof assignment.createdAt === 'string' &&
  typeof assignment.completed === 'boolean'

const loadAssignments = () => {
  try {
    const storedAssignments = localStorage.getItem(STORAGE_KEY)

    if (!storedAssignments) {
      return createInitialAssignments()
    }

    const parsedAssignments = JSON.parse(storedAssignments)

    if (
      !Array.isArray(parsedAssignments) ||
      parsedAssignments.length === 0 ||
      !parsedAssignments.every(isValidAssignment)
    ) {
      return createInitialAssignments()
    }

    return parsedAssignments
  } catch {
    return createInitialAssignments()
  }
}

const useAssignmentStore = () => {
  const [assignments, setAssignments] = useState(loadAssignments)
  const [keyword, setKeyword] = useState('')
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  }, [assignments])

  const filteredAssignments = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    if (!normalizedKeyword) {
      return assignments
    }

    return assignments.filter((assignment) => {
      const searchableText = [
        assignment.title,
        assignment.course,
        assignment.detail,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedKeyword)
    })
  }, [assignments, keyword])

  const addAssignment = (formData) => {
    const newAssignment = {
      id: Date.now(),
      title: formData.title,
      detail: formData.detail,
      course: formData.course,
      deadline: formData.deadline,
      createdAt: new Date().toISOString(),
      completed: false,
    }

    setAssignments((currentAssignments) => [
      newAssignment,
      ...currentAssignments,
    ])
  }

  const deleteAssignment = (id) => {
    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.id !== id),
    )
    setSelectedAssignment((currentAssignment) =>
      currentAssignment?.id === id ? null : currentAssignment,
    )
    setEditingAssignment((currentAssignment) =>
      currentAssignment?.id === id ? null : currentAssignment,
    )
  }

  const saveAssignment = (updatedAssignment) => {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === updatedAssignment.id
          ? { ...assignment, ...updatedAssignment }
          : assignment,
      ),
    )
    setEditingAssignment((currentAssignment) =>
      currentAssignment?.id === updatedAssignment.id
        ? { ...currentAssignment, ...updatedAssignment }
        : currentAssignment,
    )
  }

  const toggleComplete = (id) => {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === id
          ? { ...assignment, completed: !assignment.completed }
          : assignment,
      ),
    )
  }

  return {
    assignments,
    keyword,
    filteredAssignments,
    editingAssignment,
    selectedAssignment,
    setKeyword,
    setEditingAssignment,
    setSelectedAssignment,
    addAssignment,
    deleteAssignment,
    saveAssignment,
    toggleComplete,
  }
}

const EDIT_ACTIONS = [
  { id: 'add', label: '添加作业', icon: 'add' },
  { id: 'edit', label: '编辑作业', icon: 'edit' },
]

const HOUR_MS = 60 * 60 * 1000
const URGENT_THRESHOLD_MS = 6 * HOUR_MS
const APPROACHING_THRESHOLD_MS = 48 * HOUR_MS
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

const getViewTitle = (activeView) => {
  if (activeView === 'add') return '添加作业'
  if (activeView === 'edit') return '编辑作业'
  return '查看作业'
}

const formatDateTimeInputValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

const getAssignmentFormData = (assignment) => {
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

const parseLocalDateTimeValue = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getDefaultDeadlineDate = (minDeadline) => {
  const minDate = parseLocalDateTimeValue(minDeadline) ?? new Date()
  const defaultDate = new Date(minDate.getTime() + HOUR_MS)
  defaultDate.setSeconds(0, 0)
  defaultDate.setMinutes(Math.ceil(defaultDate.getMinutes() / 5) * 5)
  return defaultDate
}

const isSameCalendarDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()

const isPastCalendarDay = (date, minDeadline) => {
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

const getCalendarDays = (visibleMonth) => {
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

const getMonthTitle = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    year: 'numeric',
  }).format(date)

const formatDateOnly = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date)

const formatTimeOnly = (date) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

const formatDateTime = (isoDate) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))

const getAssignmentStatus = (assignment, now = new Date()) => {
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

const getAssignmentStats = (assignments, now) =>
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

const calculateAssignmentProgress = (assignment, now = new Date()) => {
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

const getProgressColor = (progress) => {
  const clampedProgress = clampPercentage(progress)
  const startColor = hexToRgb(PROGRESS_START_COLOR)
  const midColor = hexToRgb(PROGRESS_MID_COLOR)
  const endColor = hexToRgb(PROGRESS_END_COLOR)

  if (clampedProgress <= 50) {
    return rgbToCss(mixRgb(startColor, midColor, clampedProgress / 50))
  }

  return rgbToCss(mixRgb(midColor, endColor, (clampedProgress - 50) / 50))
}

function ChevronIcon({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={`sidebar-chevron ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SidebarIcon({ className = '', name }) {
  const commonProps = {
    'aria-hidden': true,
    className: `sidebar-icon ${className}`,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '2',
    viewBox: '0 0 24 24',
  }

  if (name === 'view') {
    return (
      <svg {...commonProps}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
      </svg>
    )
  }

  if (name === 'group') {
    return (
      <svg {...commonProps}>
        <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M8 9h8" />
        <path d="M8 15h5" />
      </svg>
    )
  }

  if (name === 'menu') {
    return (
      <svg {...commonProps}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    )
  }

  if (name === 'add') {
    return (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    )
  }

  if (name === 'edit') {
    return (
      <svg {...commonProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M15 6 9 12l6 6" />
    </svg>
  )
}

function TreeButton({ active, collapsed, icon, label, onClick }) {
  return (
    <button
      aria-label={label}
      className={`tree-button ${active ? 'active' : ''} ${
        collapsed ? 'collapsed' : ''
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <SidebarIcon name={icon} />
      <span className="tree-label">{label}</span>
    </button>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="check-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="assignment-info-pill">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function AssignmentActionButton({ children, danger = false, onClick }) {
  return (
    <button
      className={`assignment-action-button ${danger ? 'danger' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function ConfirmDialog({ confirmTone = 'default', message, onCancel, onConfirm }) {
  return (
    <div className="confirm-dialog-backdrop" role="presentation">
      <div
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button
            className={confirmTone === 'danger' ? 'danger' : ''}
            type="button"
            onClick={onConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignmentCard({ assignment, now, onDelete, onToggleComplete }) {
  const status = getAssignmentStatus(assignment, now)
  const progress = calculateAssignmentProgress(assignment, now)
  const [pendingAction, setPendingAction] = useState(null)

  const closeDialog = () => {
    setPendingAction(null)
  }

  const confirmPendingAction = () => {
    if (pendingAction === 'delete') {
      onDelete(assignment.id)
    }

    if (pendingAction === 'complete') {
      onToggleComplete(assignment.id)
    }

    closeDialog()
  }

  return (
    <>
      <article className="assignment-card">
        <div className="assignment-card-main">
          <div className="assignment-card-heading">
            <div className="assignment-title-row">
              <h2>{assignment.title}</h2>
              <span className={`assignment-status ${status.tone}`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="assignment-card-actions">
            <AssignmentActionButton
              danger
              onClick={() => setPendingAction('delete')}
            >
              删除作业
            </AssignmentActionButton>

            {assignment.completed ? (
              <span className="complete-badge-slot">
                <span
                  className="complete-badge"
                  title="已完成"
                  aria-label="已完成"
                >
                  <CheckIcon />
                </span>
              </span>
            ) : (
              <button
                className="complete-button"
                onClick={() => setPendingAction('complete')}
                type="button"
              >
                标记完成
              </button>
            )}
          </div>
        </div>

        <div className="assignment-info-grid">
          <InfoPill label="作业详情" value={assignment.detail} />
          <InfoPill label="课程" value={assignment.course} />
          <InfoPill label="截止日期" value={formatDateTime(assignment.deadline)} />
        </div>

        {!assignment.completed && (
          <div
            className="assignment-progress-track"
            aria-label={`作业进度 ${Math.round(progress)}%`}
            title={`作业进度 ${Math.round(progress)}%`}
          >
            <div
              className="assignment-progress-bar"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(progress),
              }}
            />
          </div>
        )}
      </article>

      {pendingAction && (
        <ConfirmDialog
          confirmTone={pendingAction === 'delete' ? 'danger' : 'default'}
          message={
            pendingAction === 'delete' ? '是否确认删除？' : '是否确认完成？'
          }
          onCancel={closeDialog}
          onConfirm={confirmPendingAction}
        />
      )}
    </>
  )
}

function AssignmentList({ assignments, now, onDelete, onToggleComplete }) {
  if (assignments.length === 0) {
    return null
  }

  return (
    <section className="assignment-list">
      {assignments.map((assignment) => (
        <AssignmentCard
          assignment={assignment}
          key={assignment.id}
          now={now}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </section>
  )
}

function StatBlock({ label, tone, value }) {
  return (
    <div className={`stat-card ${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  )
}

function StatsSection({ stats }) {
  return (
    <section className="stats-section">
      <StatBlock label="进行中" tone="active" value={stats.active} />
      <StatBlock label="临近截止" tone="approaching" value={stats.approaching} />
      <StatBlock label="紧急作业" tone="urgent" value={stats.urgent} />
      <StatBlock label="已完成" tone="completed" value={stats.completed} />
    </section>
  )
}

function CalendarDatePicker({ minDeadline, onChange, value }) {
  const pickerRef = useRef(null)
  const initialDate =
    parseLocalDateTimeValue(value) ?? getDefaultDeadlineDate(minDeadline)
  const [isOpen, setIsOpen] = useState(false)
  const [draftDate, setDraftDate] = useState(initialDate)
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  )

  const calendarDays = getCalendarDays(visibleMonth)
  const selectedValue = parseLocalDateTimeValue(value)
  const minDate = parseLocalDateTimeValue(minDeadline) ?? new Date()
  const draftIsValid = draftDate > minDate

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  const openPicker = () => {
    const nextDate =
      parseLocalDateTimeValue(value) ?? getDefaultDeadlineDate(minDeadline)
    setDraftDate(nextDate)
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1))
    setIsOpen(true)
  }

  const updateDraftDay = (day) => {
    setDraftDate(
      new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        draftDate.getHours(),
        draftDate.getMinutes(),
      ),
    )
  }

  const commitDraft = () => {
    if (!draftIsValid) {
      return
    }

    onChange(formatDateTimeInputValue(draftDate))
    setIsOpen(false)
  }

  return (
    <div className="date-picker" ref={pickerRef}>
      <button className="date-picker-trigger" type="button" onClick={openPicker}>
        {selectedValue ? formatDateOnly(selectedValue) : '—'}
      </button>

      {isOpen && (
        <div className="date-picker-popover">
          <div className="calendar-header">
            <button
              className="calendar-jump-button"
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear() - 1,
                    visibleMonth.getMonth(),
                    1,
                  ),
                )
              }
              aria-label="上一年"
            >
              «
            </button>
            <div className="calendar-month-controls">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      visibleMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                aria-label="上一月"
              >
                ‹
              </button>
              <strong>{getMonthTitle(visibleMonth)}</strong>
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      visibleMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                aria-label="下一月"
              >
                ›
              </button>
            </div>
            <button
              className="calendar-jump-button"
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear() + 1,
                    visibleMonth.getMonth(),
                    1,
                  ),
                )
              }
              aria-label="下一年"
            >
              »
            </button>
          </div>

          <div className="calendar-weekdays">
            {['日', '一', '二', '三', '四', '五', '六'].map((dayName) => (
              <span key={dayName}>{dayName}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <span className="calendar-empty-day" key={index} />
              }

              const disabled = isPastCalendarDay(day, minDeadline)
              const selected = isSameCalendarDay(day, draftDate)

              return (
                <button
                  className={selected ? 'selected' : ''}
                  disabled={disabled}
                  key={day.toISOString()}
                  type="button"
                  onClick={() => updateDraftDay(day)}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {!draftIsValid && (
            <p className="calendar-error">截止日期必须晚于当前时间。</p>
          )}

          <div className="calendar-actions">
            <button type="button" onClick={() => setIsOpen(false)}>
              取消
            </button>
            <button type="button" disabled={!draftIsValid} onClick={commitDraft}>
              确认
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TimePicker({ minDeadline, onChange, value }) {
  const pickerRef = useRef(null)
  const initialDate =
    parseLocalDateTimeValue(value) ?? getDefaultDeadlineDate(minDeadline)
  const [isOpen, setIsOpen] = useState(false)
  const [draftDate, setDraftDate] = useState(initialDate)
  const minDate = parseLocalDateTimeValue(minDeadline) ?? new Date()
  const selectedValue = parseLocalDateTimeValue(value)
  const draftIsValid = draftDate > minDate

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  const openPicker = () => {
    setDraftDate(parseLocalDateTimeValue(value) ?? getDefaultDeadlineDate(minDeadline))
    setIsOpen(true)
  }

  const updateDraftTime = (part, nextValue) => {
    const nextDate = new Date(draftDate)

    if (part === 'hour') {
      nextDate.setHours(Number(nextValue))
    } else {
      nextDate.setMinutes(Number(nextValue))
    }

    setDraftDate(nextDate)
  }

  const commitDraft = () => {
    if (!draftIsValid) {
      return
    }

    onChange(formatDateTimeInputValue(draftDate))
    setIsOpen(false)
  }

  return (
    <div className="date-picker time-picker" ref={pickerRef}>
      <button className="date-picker-trigger" type="button" onClick={openPicker}>
        {selectedValue ? formatTimeOnly(selectedValue) : '—'}
      </button>

      {isOpen && (
        <div className="date-picker-popover time-picker-popover">
          <div className="time-picker-row">
            <label>
              <span>时</span>
              <select
                value={String(draftDate.getHours()).padStart(2, '0')}
                onChange={(event) => updateDraftTime('hour', event.target.value)}
              >
                {Array.from({ length: 24 }, (_, hour) => {
                  const optionValue = String(hour).padStart(2, '0')
                  return (
                    <option key={optionValue} value={optionValue}>
                      {optionValue}
                    </option>
                  )
                })}
              </select>
            </label>
            <label>
              <span>分</span>
              <select
                value={String(draftDate.getMinutes()).padStart(2, '0')}
                onChange={(event) =>
                  updateDraftTime('minute', event.target.value)
                }
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const optionValue = String(index * 5).padStart(2, '0')
                  return (
                    <option key={optionValue} value={optionValue}>
                      {optionValue}
                    </option>
                  )
                })}
              </select>
            </label>
          </div>

          {!draftIsValid && (
            <p className="calendar-error">截止时间必须晚于当前时间。</p>
          )}

          <div className="calendar-actions">
            <button type="button" onClick={() => setIsOpen(false)}>
              取消
            </button>
            <button type="button" disabled={!draftIsValid} onClick={commitDraft}>
              确认
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AssignmentForm({ assignment = null, minDeadline, onSubmit }) {
  const isEditing = Boolean(assignment)
  const [formData, setFormData] = useState(() =>
    getAssignmentFormData(assignment),
  )
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
    setError('')
  }

  const handleDeadlineChange = (value) => {
    setFormData((currentData) => ({ ...currentData, deadline: value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextAssignment = {
      title: formData.title.trim(),
      detail: formData.detail.trim(),
      course: formData.course.trim(),
      deadline: formData.deadline,
    }

    if (!nextAssignment.title) {
      setError('请填写作业名称。')
      return
    }

    if (!nextAssignment.deadline) {
      setError('请选择截止日期和截止时间。')
      return
    }

    const deadlineDate = new Date(nextAssignment.deadline)

    if (Number.isNaN(deadlineDate.getTime())) {
      setError('截止日期格式不正确，请重新选择。')
      return
    }

    if (deadlineDate <= new Date()) {
      setError('截止日期必须晚于当前时间。')
      return
    }

    onSubmit({
      ...nextAssignment,
      deadline: deadlineDate.toISOString(),
    })
  }

  const handleReset = () => {
    setFormData(getAssignmentFormData(assignment))
    setError('')
  }

  return (
    <section className="assignment-form-panel">
      <form className="assignment-form" onSubmit={handleSubmit}>
        <label>
          <span>作业名称</span>
          <input
            name="title"
            onChange={handleChange}
            type="text"
            value={formData.title}
          />
        </label>

        <label>
          <span>作业详情</span>
          <textarea
            name="detail"
            onChange={handleChange}
            rows="5"
            value={formData.detail}
          />
        </label>

        <div className="assignment-form-grid">
          <label>
            <span>对应课程</span>
            <input
              name="course"
              onChange={handleChange}
              type="text"
              value={formData.course}
            />
          </label>

          <label>
            <span>截止日期</span>
            <CalendarDatePicker
              minDeadline={minDeadline}
              onChange={handleDeadlineChange}
              value={formData.deadline}
            />
          </label>

          <label>
            <span>截止时间</span>
            <TimePicker
              minDeadline={minDeadline}
              onChange={handleDeadlineChange}
              value={formData.deadline}
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="assignment-form-actions">
          <button className="form-submit-button" type="submit">
            {isEditing ? '保存修改' : '添加作业'}
          </button>
          <button className="form-reset-button" type="button" onClick={handleReset}>
            {isEditing ? '还原' : '重置'}
          </button>
        </div>
      </form>
    </section>
  )
}

function EditAssignmentListItem({ active, assignment, now, onSelect }) {
  const status = getAssignmentStatus(assignment, now)

  return (
    <button
      className={`edit-assignment-item ${active ? 'active' : ''}`}
      onClick={() => onSelect(assignment)}
      type="button"
    >
      <div className="edit-assignment-item-title">
        <strong>{assignment.title}</strong>
        <span className={`assignment-status ${status.tone}`}>
          {status.label}
        </span>
      </div>
      <div className="edit-assignment-item-meta">
        <span>{assignment.course || '未填写课程'}</span>
        <span>{formatDateTime(assignment.deadline)}</span>
      </div>
    </button>
  )
}

function EditAssignmentView({
  assignments,
  editingAssignment,
  minDeadline,
  now,
  onSave,
  onSelect,
}) {
  const [savedAssignmentId, setSavedAssignmentId] = useState(null)
  const selectedAssignment = useMemo(
    () =>
      assignments.find(
        (assignment) => assignment.id === editingAssignment?.id,
      ) ?? null,
    [assignments, editingAssignment],
  )

  useEffect(() => {
    if (assignments.length === 0) {
      if (editingAssignment) {
        onSelect(null)
      }

      return
    }

    if (!selectedAssignment) {
      onSelect(assignments[0])
    }
  }, [assignments, editingAssignment, onSelect, selectedAssignment])

  if (assignments.length === 0) {
    return (
      <section className="edit-assignment-view">
        <div className="edit-empty-panel">
          <h2>暂无可编辑作业</h2>
          <p>添加作业后，可以在这里修改作业名称、详情、课程和截止时间。</p>
        </div>
      </section>
    )
  }

  const handleSave = (formData) => {
    const updatedAssignment = {
      ...selectedAssignment,
      ...formData,
    }

    onSave(updatedAssignment)
    onSelect(updatedAssignment)
    setSavedAssignmentId(updatedAssignment.id)
  }

  return (
    <section className="edit-assignment-view">
      <aside className="edit-assignment-list-panel" aria-label="可编辑作业列表">
        <div className="edit-panel-heading">
          <h2>选择作业</h2>
          <span>{assignments.length} 项</span>
        </div>

        <div className="edit-assignment-list">
          {assignments.map((assignment) => (
            <EditAssignmentListItem
              active={assignment.id === selectedAssignment?.id}
              assignment={assignment}
              key={assignment.id}
              now={now}
              onSelect={onSelect}
            />
          ))}
        </div>
      </aside>

      <div className="edit-assignment-form-area">
        <div className="edit-panel-heading">
          <h2>编辑内容</h2>
          {selectedAssignment && (
            <span>{selectedAssignment.completed ? '已完成' : '未完成'}</span>
          )}
        </div>

        {savedAssignmentId === selectedAssignment?.id && (
          <p className="form-success">保存成功。</p>
        )}

        {selectedAssignment ? (
          <AssignmentForm
            assignment={selectedAssignment}
            key={selectedAssignment.id}
            minDeadline={minDeadline}
            onSubmit={handleSave}
          />
        ) : (
          <div className="edit-empty-panel">
            <h2>请选择作业</h2>
            <p>从左侧列表中选择一个作业后即可编辑。</p>
          </div>
        )}
      </div>
    </section>
  )
}

function App() {
  const [activeView, setActiveView] = useState('view')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isEditMenuExpanded, setIsEditMenuExpanded] = useState(true)
  const [now, setNow] = useState(() => new Date())
  const assignmentStore = useAssignmentStore()
  const assignmentStats = useMemo(
    () => getAssignmentStats(assignmentStore.assignments, now),
    [assignmentStore.assignments, now],
  )
  const minDeadline = useMemo(() => formatDateTimeInputValue(now), [now])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div
      className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      data-active-view={activeView}
      data-assignment-count={assignmentStore.assignments.length}
      data-filtered-count={assignmentStore.filteredAssignments.length}
    >
      <header className="topbar">
        <a className="brand" href="/" aria-label="KafuHomework">
          <img className="brand-icon" src={appIcon} alt="" />
          <span className="brand-name">KafuHomework</span>
        </a>
        <div className="account-area">
          <span className="account-name">Kyy008</span>
          <button className="logout-button" type="button">
            退出登录
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar" aria-label="主导航">
          <div
            className={`sidebar-collapse-row ${
              isSidebarCollapsed ? 'collapsed' : ''
            }`}
          >
            <button
              className="collapse-button"
              type="button"
              aria-label={isSidebarCollapsed ? '展开侧边导航栏' : '收起侧边导航栏'}
              title={isSidebarCollapsed ? '展开侧边导航栏' : '收起侧边导航栏'}
              onClick={() =>
                setIsSidebarCollapsed((currentValue) => !currentValue)
              }
            >
              <SidebarIcon
                className={isSidebarCollapsed ? 'rotated' : ''}
                name="collapse"
              />
            </button>
          </div>

          <nav className="side-nav">
            <TreeButton
              active={activeView === 'view'}
              collapsed={isSidebarCollapsed}
              icon="view"
              label="查看作业"
              onClick={() => setActiveView('view')}
            />

            <div className="nav-group">
              <button
                aria-expanded={isEditMenuExpanded}
                aria-label="作业编辑"
                className={`edit-group-button ${
                  activeView === 'add' || activeView === 'edit' ? 'active' : ''
                } ${isSidebarCollapsed ? 'collapsed' : ''}`}
                onClick={() =>
                  setIsEditMenuExpanded((isExpanded) => !isExpanded)
                }
                title="作业编辑"
                type="button"
              >
                <SidebarIcon name="group" />
                <span className="tree-label">作业编辑</span>
                <ChevronIcon className={isEditMenuExpanded ? 'rotated' : ''} />
              </button>

              <div
                className={`nav-children ${
                  isEditMenuExpanded ? 'expanded' : ''
                } ${isSidebarCollapsed ? 'collapsed' : ''}`}
              >
                <div className="nav-children-inner">
                  <div className="nav-children-stack">
                    {EDIT_ACTIONS.map((action) => (
                      <TreeButton
                        active={activeView === action.id}
                        collapsed={isSidebarCollapsed}
                        icon={action.icon}
                        key={action.id}
                        label={action.label}
                        onClick={() => setActiveView(action.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        <main className="workspace" aria-label={getViewTitle(activeView)}>
          {activeView === 'view' ? (
            <div className="view-dashboard">
              <StatsSection stats={assignmentStats} />
              <AssignmentList
                assignments={assignmentStore.filteredAssignments}
                now={now}
                onDelete={assignmentStore.deleteAssignment}
                onToggleComplete={assignmentStore.toggleComplete}
              />
            </div>
          ) : activeView === 'add' ? (
            <AssignmentForm
              minDeadline={minDeadline}
              onSubmit={(formData) => {
                assignmentStore.addAssignment(formData)
                setActiveView('view')
              }}
            />
          ) : activeView === 'edit' ? (
            <EditAssignmentView
              assignments={assignmentStore.assignments}
              editingAssignment={assignmentStore.editingAssignment}
              minDeadline={minDeadline}
              now={now}
              onSave={assignmentStore.saveAssignment}
              onSelect={assignmentStore.setEditingAssignment}
            />
          ) : (
            <section className="empty-view" />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
