import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAssignmentStats } from '../../utils/assignmentUtils'
import {
  formatDateOnly,
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
import { AssignmentList } from './AssignmentList'

const DEFAULT_QUERY = {
  course: '',
  detail: '',
  endDate: '',
  startDate: '',
  title: '',
}

const PAGE_SIZE_OPTIONS = ['5', '10', '20', 'all']
const SORT_FIELD_OPTIONS = [
  { label: '自定义排序', value: 'custom' },
  { label: '截止日期', value: 'deadline' },
  { label: '创建时间', value: 'createdAt' },
]
const SORT_ORDER_OPTIONS = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' },
]
const panelClass =
  'rounded-lg border border-[var(--border)] bg-[var(--glass-panel)] p-4 backdrop-blur-lg'
const fieldLabelClass =
  'grid gap-2 text-sm font-bold text-[var(--foreground)]'
const fieldControlClass =
  'min-h-10 w-full rounded-md border border-[var(--border)] bg-[rgba(15,18,13,0.58)] px-2.5 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(207,217,244,0.14)]'
const submitButtonClass =
  'form-submit-button h-10 rounded-md border border-transparent bg-[var(--primary)] px-4 text-sm font-extrabold text-[var(--primary-foreground)] transition hover:bg-[#dde6ff] active:scale-[0.98]'
const resetButtonClass =
  'form-reset-button h-10 rounded-md border border-[var(--border)] bg-[var(--panel-strong)] px-4 text-sm font-extrabold text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.98]'
const errorTextClass =
  'mt-3 rounded-md bg-[rgba(255,122,138,0.1)] px-3 py-2 text-sm font-bold text-[#ffc3ca]'

const normalizeText = (value) => value.trim().toLowerCase()

const includesKeyword = (value, keyword) =>
  !keyword || value.toLowerCase().includes(keyword)

const getDayStart = (value) => (value ? new Date(`${value}T00:00:00`) : null)

const getDayEnd = (value) => (value ? new Date(`${value}T23:59:59.999`) : null)

const filterAssignmentsByQuery = (assignments, query) => {
  const titleKeyword = normalizeText(query.title)
  const detailKeyword = normalizeText(query.detail)
  const courseKeyword = normalizeText(query.course)
  const startDate = getDayStart(query.startDate)
  const endDate = getDayEnd(query.endDate)

  return assignments.filter((assignment) => {
    const deadline = new Date(assignment.deadline)

    if (!includesKeyword(assignment.title, titleKeyword)) {
      return false
    }

    if (!includesKeyword(assignment.detail, detailKeyword)) {
      return false
    }

    if (!includesKeyword(assignment.course, courseKeyword)) {
      return false
    }

    if (startDate && deadline < startDate) {
      return false
    }

    if (endDate && deadline > endDate) {
      return false
    }

    return true
  })
}

const getCustomOrder = (assignment) =>
  Number.isFinite(assignment.order) ? assignment.order : Number.MAX_SAFE_INTEGER

const sortAssignments = (assignments, field, order) =>
  [...assignments].sort((leftAssignment, rightAssignment) => {
    if (field === 'custom') {
      const orderResult =
        getCustomOrder(leftAssignment) - getCustomOrder(rightAssignment)

      if (orderResult !== 0) {
        return orderResult
      }
    }

    const comparedField = field === 'custom' ? 'createdAt' : field
    const leftTime = new Date(leftAssignment[comparedField]).getTime()
    const rightTime = new Date(rightAssignment[comparedField]).getTime()
    const result = leftTime - rightTime

    return order === 'asc' ? result : -result
  })

function EditAssignmentDialog({
  assignment,
  minDeadline,
  onClose,
  onSave,
}) {
  const handleSubmit = (formData) => {
    onSave({
      ...assignment,
      ...formData,
    })
    onClose()
  }

  return createPortal(
    <div className="confirm-dialog-backdrop" role="presentation">
      <div
        aria-modal="true"
        className="assignment-edit-dialog"
        role="dialog"
      >
        <div className="assignment-edit-dialog-heading">
          <h2>编辑作业</h2>
          <button type="button" onClick={onClose} aria-label="关闭编辑弹窗">
            ×
          </button>
        </div>
        <AssignmentForm
          assignment={assignment}
          key={assignment.id}
          minDeadline={minDeadline}
          onSubmit={handleSubmit}
        />
      </div>
    </div>,
    document.body,
  )
}

function StatBlock({ label, tone, value }) {
  return (
    <div
      className={`stat-card ${tone} min-h-[76px] rounded-lg border p-4 text-white`}
    >
      <p className="m-0 text-sm font-bold">{label}</p>
      <strong className="mt-1.5 block text-2xl font-extrabold leading-none">
        {value}
      </strong>
    </div>
  )
}

export function StatsSection({ stats }) {
  return (
    <section className="stats-section grid grid-cols-4 gap-4 max-md:grid-cols-2">
      <StatBlock label="进行中" tone="active" value={stats.active} />
      <StatBlock label="临近截止" tone="approaching" value={stats.approaching} />
      <StatBlock label="紧急作业" tone="urgent" value={stats.urgent} />
      <StatBlock label="已完成" tone="completed" value={stats.completed} />
    </section>
  )
}

function AssignmentQueryPanel({
  draftQuery,
  error,
  sortField,
  sortOrder,
  onChange,
  onReset,
  onSortFieldChange,
  onSortOrderChange,
  onSubmit,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target
    onChange(name, value)
  }

  return (
    <section className={`assignment-query-panel ${panelClass}`}>
      <form
        className="assignment-query-form grid grid-cols-[repeat(5,minmax(0,1fr))_auto] items-end gap-3 max-lg:grid-cols-2 max-md:grid-cols-1"
        onSubmit={onSubmit}
      >
        <label className={fieldLabelClass}>
          <span>作业名称</span>
          <input
            className={fieldControlClass}
            name="title"
            onChange={handleChange}
            type="text"
            value={draftQuery.title}
          />
        </label>

        <label className={fieldLabelClass}>
          <span>作业描述</span>
          <input
            className={fieldControlClass}
            name="detail"
            onChange={handleChange}
            type="text"
            value={draftQuery.detail}
          />
        </label>

        <label className={fieldLabelClass}>
          <span>课程名</span>
          <input
            className={fieldControlClass}
            name="course"
            onChange={handleChange}
            type="text"
            value={draftQuery.course}
          />
        </label>

        <label className={fieldLabelClass}>
          <span>截止起始日期</span>
          <input
            className={fieldControlClass}
            name="startDate"
            onChange={handleChange}
            type="date"
            value={draftQuery.startDate}
          />
        </label>

        <label className={fieldLabelClass}>
          <span>截止结束日期</span>
          <input
            className={fieldControlClass}
            name="endDate"
            onChange={handleChange}
            type="date"
            value={draftQuery.endDate}
          />
        </label>

        <div className="assignment-query-actions flex gap-2 whitespace-nowrap max-lg:col-span-2 max-md:col-span-1">
          <button className={submitButtonClass} type="submit">
            查询
          </button>
          <button className={resetButtonClass} type="button" onClick={onReset}>
            重置
          </button>
        </div>
      </form>

      {error && <p className={`assignment-query-error ${errorTextClass}`}>{error}</p>}

      <div className="assignment-sort-controls mt-3 flex flex-wrap gap-3">
        <label className={`${fieldLabelClass} min-w-36`}>
          <span>排序字段</span>
          <select
            className={fieldControlClass}
            value={sortField}
            onChange={(event) => onSortFieldChange(event.target.value)}
          >
            {SORT_FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {sortField !== 'custom' && (
          <label className={`${fieldLabelClass} min-w-36`}>
            <span>排序方式</span>
            <select
              className={fieldControlClass}
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value)}
            >
              {SORT_ORDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  )
}

function AssignmentPagination({
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageCount,
  pageSize,
  totalItems,
}) {
  if (totalItems === 0) {
    return null
  }

  return (
    <section
      className={`assignment-pagination ${panelClass} flex flex-wrap items-center justify-between gap-3`}
      aria-label="作业分页"
    >
      <div className="pagination-size-control flex items-center gap-2 text-sm font-bold text-[var(--muted-foreground)]">
        <span>每页</span>
        <select
          className={fieldControlClass}
          aria-label="选择每页作业数量"
          value={pageSize}
          onChange={(event) => onPageSizeChange(event.target.value)}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? '全部' : option}
            </option>
          ))}
        </select>
      </div>

      <div className="pagination-page-list flex flex-wrap gap-2">
        <button
          className={resetButtonClass}
          disabled={currentPage <= 1}
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
        >
          上一页
        </button>

        {Array.from({ length: pageCount }, (_, index) => {
          const page = index + 1

          return (
            <button
              className={`${resetButtonClass} ${
                page === currentPage
                  ? 'active border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : ''
              }`}
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        })}

        <button
          className={resetButtonClass}
          disabled={currentPage >= pageCount}
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </button>
      </div>

      <span className="pagination-summary text-sm font-bold text-[var(--muted-foreground)]">
        第 {currentPage} / {pageCount} 页，共 {totalItems} 项
      </span>
    </section>
  )
}

export function ViewAssignments({
  assignments,
  highlightedAssignmentId = null,
  minDeadline,
  now,
  onDelete,
  onHighlightComplete,
  onReorder,
  onSave,
  onToggleComplete,
}) {
  const scrollAreaRef = useRef(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [draftQuery, setDraftQuery] = useState(DEFAULT_QUERY)
  const [appliedQuery, setAppliedQuery] = useState(DEFAULT_QUERY)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState('5')
  const [queryError, setQueryError] = useState('')
  const [sortField, setSortField] = useState('deadline')
  const [sortOrder, setSortOrder] = useState('asc')
  const isCustomSort = sortField === 'custom'
  const effectivePageSize = isCustomSort ? 'all' : pageSize

  const queriedAssignments = useMemo(
    () => filterAssignmentsByQuery(assignments, appliedQuery),
    [assignments, appliedQuery],
  )
  const stats = useMemo(
    () => getAssignmentStats(queriedAssignments, now),
    [queriedAssignments, now],
  )
  const sortedAssignments = useMemo(
    () => sortAssignments(queriedAssignments, sortField, sortOrder),
    [queriedAssignments, sortField, sortOrder],
  )
  const pageCount =
    effectivePageSize === 'all'
      ? 1
      : Math.max(
          1,
          Math.ceil(sortedAssignments.length / Number(effectivePageSize)),
        )
  const safeCurrentPage = Math.min(currentPage, pageCount)
  const listAnimationKey = `${JSON.stringify(appliedQuery)}-${sortField}-${sortOrder}-${effectivePageSize}-${safeCurrentPage}-${sortedAssignments
    .map((assignment) => assignment.id)
    .join('-')}`
  const pagedAssignments = useMemo(() => {
    if (effectivePageSize === 'all') {
      return sortedAssignments
    }

    const size = Number(effectivePageSize)
    const startIndex = (safeCurrentPage - 1) * size
    return sortedAssignments.slice(startIndex, startIndex + size)
  }, [effectivePageSize, safeCurrentPage, sortedAssignments])

  useEffect(() => {
    if (!highlightedAssignmentId) {
      return
    }

    const targetCard = scrollAreaRef.current?.querySelector(
      `[data-assignment-id="${highlightedAssignmentId}"]`,
    )

    if (!targetCard) {
      return
    }

    const scrollTimer = window.setTimeout(() => {
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)

    const finishTimer = window.setTimeout(() => {
      onHighlightComplete?.()
    }, 2600)

    return () => {
      window.clearTimeout(scrollTimer)
      window.clearTimeout(finishTimer)
    }
  }, [highlightedAssignmentId, onHighlightComplete, pagedAssignments])

  const handleQueryChange = (name, value) => {
    setDraftQuery((currentQuery) => ({ ...currentQuery, [name]: value }))
    setQueryError('')
  }

  const handleQuerySubmit = (event) => {
    event.preventDefault()

    if (
      draftQuery.startDate &&
      draftQuery.endDate &&
      draftQuery.startDate > draftQuery.endDate
    ) {
      setQueryError('截止起始日期不能晚于截止结束日期。')
      return
    }

    setAppliedQuery(draftQuery)
    setCurrentPage(1)
    setQueryError('')
  }

  const handleQueryReset = () => {
    setDraftQuery(DEFAULT_QUERY)
    setAppliedQuery(DEFAULT_QUERY)
    setCurrentPage(1)
    setQueryError('')
  }

  const handlePageSizeChange = (nextPageSize) => {
    setPageSize(isCustomSort ? 'all' : nextPageSize)
    setCurrentPage(1)
  }

  const handleSortFieldChange = (nextSortField) => {
    setSortField(nextSortField)
    if (nextSortField === 'custom') {
      setSortOrder('asc')
      setPageSize('all')
    }
    setCurrentPage(1)
  }

  const handleSortOrderChange = (nextSortOrder) => {
    setSortOrder(nextSortOrder)
    setCurrentPage(1)
  }

  return (
    <div className="view-dashboard mx-auto flex h-[calc(100vh-var(--topbar-height)-48px)] w-[min(100%,1120px)] flex-col gap-5 overflow-hidden">
      <StatsSection stats={stats} />
      <div
        className="view-scroll-area flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1"
        ref={scrollAreaRef}
      >
        <AssignmentQueryPanel
          draftQuery={draftQuery}
          error={queryError}
          sortField={sortField}
          sortOrder={sortOrder}
          onChange={handleQueryChange}
          onReset={handleQueryReset}
          onSortFieldChange={handleSortFieldChange}
          onSortOrderChange={handleSortOrderChange}
          onSubmit={handleQuerySubmit}
        />

        {editingAssignment && (
          <EditAssignmentDialog
            assignment={editingAssignment}
            minDeadline={minDeadline}
            onClose={() => setEditingAssignment(null)}
            onSave={onSave}
          />
        )}

        {queriedAssignments.length > 0 ? (
          <>
            <AssignmentList
              animationKey={listAnimationKey}
              assignments={pagedAssignments}
              canReorder={isCustomSort}
              highlightedAssignmentId={highlightedAssignmentId}
              now={now}
              onDelete={onDelete}
              onEdit={setEditingAssignment}
              onReorder={onReorder}
              onToggleComplete={onToggleComplete}
            />
            <AssignmentPagination
              currentPage={safeCurrentPage}
              pageCount={pageCount}
              pageSize={effectivePageSize}
              totalItems={queriedAssignments.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        ) : (
          <section className={`assignment-empty-result ${panelClass}`}>
            <h2 className="m-0 text-xl font-extrabold text-[var(--foreground)]">
              没有符合条件的作业
            </h2>
            <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
              调整查询条件后再试一次。
            </p>
          </section>
        )}
      </div>
    </div>
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
    <section className={`assignment-form-panel ${panelClass} mx-auto w-[min(100%,760px)] p-6`}>
      <form className="assignment-form grid gap-4" onSubmit={handleSubmit}>
        <label className={fieldLabelClass}>
          <span>作业名称</span>
          <input
            className={fieldControlClass}
            name="title"
            onChange={handleChange}
            type="text"
            value={formData.title}
          />
        </label>

        <label className={fieldLabelClass}>
          <span>作业详情</span>
          <textarea
            className={`${fieldControlClass} min-h-32 resize-y`}
            name="detail"
            onChange={handleChange}
            rows="5"
            value={formData.detail}
          />
        </label>

        <div className="assignment-form-grid grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <label className={fieldLabelClass}>
            <span>对应课程</span>
            <input
              className={fieldControlClass}
              name="course"
              onChange={handleChange}
              type="text"
              value={formData.course}
            />
          </label>

          <label className={fieldLabelClass}>
            <span>截止日期</span>
            <CalendarDatePicker
              minDeadline={minDeadline}
              onChange={handleDeadlineChange}
              value={formData.deadline}
            />
          </label>

          <label className={fieldLabelClass}>
            <span>截止时间</span>
            <TimePicker
              minDeadline={minDeadline}
              onChange={handleDeadlineChange}
              value={formData.deadline}
            />
          </label>
        </div>

        {error && <p className={`form-error ${errorTextClass}`}>{error}</p>}

        <div className="assignment-form-actions flex flex-wrap gap-3">
          <button className={submitButtonClass} type="submit">
            {isEditing ? '保存修改' : '添加作业'}
          </button>
          <button className={resetButtonClass} type="button" onClick={handleReset}>
            {isEditing ? '还原' : '重置'}
          </button>
        </div>
      </form>
    </section>
  )
}
