import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  calculateAssignmentProgress,
  getAssignmentStats,
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

function AssignmentActionButton({
  children,
  danger = false,
  onClick,
  variant = '',
}) {
  return (
    <button
      className={`assignment-action-button ${danger ? 'danger' : ''} ${
        variant ? variant : ''
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

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

function ConfirmDialog({ confirmTone = 'default', message, onCancel, onConfirm }) {
  return createPortal(
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
    </div>,
    document.body,
  )
}

function AssignmentCard({
  assignment,
  canReorder = false,
  highlighted = false,
  isDragging = false,
  now,
  onDragStart,
  onDelete,
  onEdit,
  onToggleComplete,
}) {
  const status = getAssignmentStatus(assignment, now)
  const progress = calculateAssignmentProgress(assignment, now)
  const [pendingAction, setPendingAction] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const closeDialog = () => {
    setPendingAction(null)
  }

  const confirmPendingAction = () => {
    if (pendingAction === 'delete') {
      closeDialog()
      setIsDeleting(true)
      return
    }

    if (pendingAction === 'complete') {
      onToggleComplete(assignment.id)
    }

    closeDialog()
  }

  const handleAnimationEnd = (event) => {
    if (isDeleting && event.animationName === 'assignment-card-leave') {
      onDelete(assignment.id)
    }
  }

  return (
    <>
      <article
        className={`assignment-card ${highlighted ? 'highlighted' : ''} ${
          isDeleting ? 'deleting' : ''
        } ${isDragging ? 'dragging' : ''} ${
          canReorder ? 'reorderable' : ''
        }`}
        data-assignment-id={assignment.id}
        onAnimationEnd={handleAnimationEnd}
      >
        {canReorder && (
          <button
            aria-label={`拖动作业 ${assignment.title} 排序`}
            className="assignment-drag-handle"
            onPointerDown={(event) => onDragStart(assignment.id, event)}
            title="拖动排序"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        )}

        <div className="assignment-card-content">
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
                variant="edit"
                onClick={() => onEdit(assignment)}
              >
                编辑作业
              </AssignmentActionButton>

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
            <InfoPill
              label="截止日期"
              value={formatDateTime(assignment.deadline)}
            />
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
        </div>
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
  animationKey = 'default',
  assignments,
  canReorder = false,
  highlightedAssignmentId = null,
  now,
  onDelete,
  onEdit,
  onReorder,
  onToggleComplete,
}) {
  const listRef = useRef(null)
  const cardPositionsRef = useRef(new Map())
  const cardAnimationFrameRef = useRef(null)
  const orderedIdsRef = useRef([])
  const [draggingAssignmentId, setDraggingAssignmentId] = useState(null)
  const [dragOrderIds, setDragOrderIds] = useState(null)
  const isReordering = canReorder && draggingAssignmentId !== null

  const recordCardPositions = () => {
    const nextPositions = new Map()

    listRef.current
      ?.querySelectorAll('[data-assignment-id]')
      .forEach((cardElement) => {
        nextPositions.set(
          cardElement.dataset.assignmentId,
          cardElement.getBoundingClientRect().top,
        )
      })

    cardPositionsRef.current = nextPositions
  }

  useLayoutEffect(() => {
    if (!isReordering) {
      if (cardAnimationFrameRef.current) {
        window.cancelAnimationFrame(cardAnimationFrameRef.current)
        cardAnimationFrameRef.current = null
      }

      listRef.current?.querySelectorAll('[data-assignment-id]').forEach(
        (cardElement) => {
          cardElement.style.transition = ''
          cardElement.style.transform = ''
        },
      )
      cardPositionsRef.current = new Map()
      return undefined
    }

    if (!dragOrderIds) {
      return undefined
    }

    const previousPositions = cardPositionsRef.current

    if (previousPositions.size === 0) {
      return undefined
    }

    if (cardAnimationFrameRef.current) {
      window.cancelAnimationFrame(cardAnimationFrameRef.current)
    }

    const movedCards = Array.from(
      listRef.current?.querySelectorAll('[data-assignment-id]') ?? [],
    )
      .map((cardElement) => {
        const previousTop = previousPositions.get(
          cardElement.dataset.assignmentId,
        )

        if (typeof previousTop !== 'number') {
          return null
        }

        const currentTop = cardElement.getBoundingClientRect().top
        const deltaY = previousTop - currentTop

        if (Math.abs(deltaY) < 1) {
          return null
        }

        const isActiveCard =
          cardElement.dataset.assignmentId === draggingAssignmentId
        cardElement.style.transition = 'none'
        cardElement.style.transform = `translateY(${deltaY}px)${
          isActiveCard ? ' scale(0.995)' : ''
        }`

        return {
          element: cardElement,
          resetTransform: isActiveCard ? 'scale(0.995)' : '',
        }
      })
      .filter(Boolean)

    cardAnimationFrameRef.current = window.requestAnimationFrame(() => {
      movedCards.forEach(({ element, resetTransform }) => {
        element.style.transition = ''
        element.style.transform = resetTransform
      })
      cardAnimationFrameRef.current = null
    })

    return () => {
      if (cardAnimationFrameRef.current) {
        window.cancelAnimationFrame(cardAnimationFrameRef.current)
      }
    }
  }, [dragOrderIds, draggingAssignmentId, isReordering])

  useEffect(() => {
    if (!isReordering) {
      return undefined
    }

    const handlePointerMove = (event) => {
      event.preventDefault()

      if (!listRef.current) {
        return
      }

      const currentIds = orderedIdsRef.current

      if (currentIds.length === 0) {
        return
      }

      const draggingId = String(draggingAssignmentId)
      const fromIndex = currentIds.indexOf(draggingId)

      if (fromIndex === -1) {
        return
      }

      const staticCards = Array.from(
        listRef.current.querySelectorAll('[data-assignment-id]'),
      )
        .filter((cardElement) => cardElement.dataset.assignmentId !== draggingId)
        .map((cardElement) => {
          const rect = cardElement.getBoundingClientRect()

          return {
            id: cardElement.dataset.assignmentId,
            centerY: rect.top + rect.height / 2,
          }
        })

      const nextIndexCandidate = staticCards.findIndex(
        (card) => event.clientY < card.centerY,
      )
      const toIndex =
        nextIndexCandidate === -1 ? staticCards.length : nextIndexCandidate

      if (toIndex === fromIndex) {
        return
      }

      recordCardPositions()
      const nextIds = currentIds.filter((id) => id !== draggingId)
      nextIds.splice(toIndex, 0, draggingId)
      orderedIdsRef.current = nextIds
      setDragOrderIds(nextIds)
    }

    const handlePointerEnd = () => {
      onReorder?.(orderedIdsRef.current)
      setDraggingAssignmentId(null)
      setDragOrderIds(null)
    }

    window.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    })
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [draggingAssignmentId, isReordering, onReorder])

  if (assignments.length === 0) {
    return null
  }

  const assignmentById = new Map(
    assignments.map((assignment) => [String(assignment.id), assignment]),
  )
  const displayedAssignments = isReordering
    ? (dragOrderIds?.map((id) => assignmentById.get(id)).filter(Boolean) ??
      assignments)
    : assignments

  const handleDragStart = (assignmentId, event) => {
    if (!canReorder) {
      return
    }

    event.preventDefault()
    const nextOrderedIds = assignments.map((assignment) => String(assignment.id))
    orderedIdsRef.current = nextOrderedIds
    setDragOrderIds(nextOrderedIds)
    setDraggingAssignmentId(String(assignmentId))
  }

  return (
    <section
      className={`assignment-list ${canReorder ? 'reorder-enabled' : ''}`}
      key={animationKey}
      ref={listRef}
    >
      {displayedAssignments.map((assignment) => (
        <AssignmentCard
          assignment={assignment}
          canReorder={canReorder}
          highlighted={assignment.id === highlightedAssignmentId}
          isDragging={String(assignment.id) === draggingAssignmentId}
          key={assignment.id}
          now={now}
          onDragStart={handleDragStart}
          onDelete={onDelete}
          onEdit={onEdit}
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
    <section className="assignment-query-panel">
      <form className="assignment-query-form" onSubmit={onSubmit}>
        <label>
          <span>作业名称</span>
          <input
            name="title"
            onChange={handleChange}
            type="text"
            value={draftQuery.title}
          />
        </label>

        <label>
          <span>作业描述</span>
          <input
            name="detail"
            onChange={handleChange}
            type="text"
            value={draftQuery.detail}
          />
        </label>

        <label>
          <span>课程名</span>
          <input
            name="course"
            onChange={handleChange}
            type="text"
            value={draftQuery.course}
          />
        </label>

        <label>
          <span>截止起始日期</span>
          <input
            name="startDate"
            onChange={handleChange}
            type="date"
            value={draftQuery.startDate}
          />
        </label>

        <label>
          <span>截止结束日期</span>
          <input
            name="endDate"
            onChange={handleChange}
            type="date"
            value={draftQuery.endDate}
          />
        </label>

        <div className="assignment-query-actions">
          <button className="form-submit-button" type="submit">
            查询
          </button>
          <button className="form-reset-button" type="button" onClick={onReset}>
            重置
          </button>
        </div>
      </form>

      {error && <p className="assignment-query-error">{error}</p>}

      <div className="assignment-sort-controls">
        <label>
          <span>排序字段</span>
          <select
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
          <label>
            <span>排序方式</span>
            <select
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
    <section className="assignment-pagination" aria-label="作业分页">
      <div className="pagination-size-control">
        <span>每页</span>
        <select
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

      <div className="pagination-page-list">
        <button
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
              className={page === currentPage ? 'active' : ''}
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        })}

        <button
          disabled={currentPage >= pageCount}
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </button>
      </div>

      <span className="pagination-summary">
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
    <div className="view-dashboard">
      <StatsSection stats={stats} />
      <div className="view-scroll-area" ref={scrollAreaRef}>
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
          <section className="assignment-empty-result">
            <h2>没有符合条件的作业</h2>
            <p>调整查询条件后再试一次。</p>
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
