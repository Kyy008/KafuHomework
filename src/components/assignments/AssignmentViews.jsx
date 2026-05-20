import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateAssignmentProgress,
  getAssignmentStatus,
  getProgressColor,
} from '../../utils/assignmentUtils'
import {
  formatDateOnly,
  formatDateTime,
  formatDateTimeInputValue,
  formatTimeOnly,
  getAssignmentFormData,
  getCalendarDays,
  getDefaultDeadlineDate,
  getMonthTitle,
  isPastCalendarDay,
  isSameCalendarDay,
  parseLocalDateTimeValue,
} from '../../utils/dateUtils'

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
      <div aria-modal="true" className="confirm-dialog" role="dialog">
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

export function AssignmentList({
  assignments,
  now,
  onDelete,
  onToggleComplete,
}) {
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

export function StatsSection({ stats }) {
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
    setDraftDate(
      parseLocalDateTimeValue(value) ?? getDefaultDeadlineDate(minDeadline),
    )
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

export function AssignmentForm({ assignment = null, minDeadline, onSubmit }) {
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

export function EditAssignmentView({
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
