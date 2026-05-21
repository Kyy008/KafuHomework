import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  calculateAssignmentProgress,
  getAssignmentStatus,
  getProgressColor,
} from '../../utils/assignmentUtils'
import { formatDateTime } from '../../utils/dateUtils'

const DRAG_AUTO_SCROLL_DELAY_MS = 500
const DRAG_AUTO_SCROLL_EDGE_SIZE = 80
const DRAG_AUTO_SCROLL_MIN_SPEED = 1
const DRAG_AUTO_SCROLL_MAX_SPEED = 6

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
  const autoScrollAnimationFrameRef = useRef(null)
  const autoScrollDelayTimerRef = useRef(null)
  const autoScrollDirectionRef = useRef(0)
  const lastPointerYRef = useRef(null)
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

    const clearAutoScroll = () => {
      if (autoScrollDelayTimerRef.current) {
        window.clearTimeout(autoScrollDelayTimerRef.current)
        autoScrollDelayTimerRef.current = null
      }

      if (autoScrollAnimationFrameRef.current) {
        window.cancelAnimationFrame(autoScrollAnimationFrameRef.current)
        autoScrollAnimationFrameRef.current = null
      }

      autoScrollDirectionRef.current = 0
    }

    const getScrollArea = () => listRef.current?.closest('.view-scroll-area')

    const updateDragOrder = (clientY) => {
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
        (card) => clientY < card.centerY,
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

    const getAutoScrollDirection = (clientY) => {
      const scrollArea = getScrollArea()

      if (!scrollArea) {
        return 0
      }

      const rect = scrollArea.getBoundingClientRect()
      const canScrollUp = scrollArea.scrollTop > 0
      const canScrollDown =
        scrollArea.scrollTop + scrollArea.clientHeight < scrollArea.scrollHeight

      if (clientY < rect.top + DRAG_AUTO_SCROLL_EDGE_SIZE && canScrollUp) {
        return -1
      }

      if (
        clientY > rect.bottom - DRAG_AUTO_SCROLL_EDGE_SIZE &&
        canScrollDown
      ) {
        return 1
      }

      return 0
    }

    const getAutoScrollSpeed = (clientY, direction) => {
      const scrollArea = getScrollArea()

      if (!scrollArea) {
        return 0
      }

      const rect = scrollArea.getBoundingClientRect()
      const distanceIntoEdge =
        direction < 0
          ? rect.top + DRAG_AUTO_SCROLL_EDGE_SIZE - clientY
          : clientY - (rect.bottom - DRAG_AUTO_SCROLL_EDGE_SIZE)
      const edgeRatio = Math.min(
        1,
        Math.max(0, distanceIntoEdge / DRAG_AUTO_SCROLL_EDGE_SIZE),
      )

      return (
        DRAG_AUTO_SCROLL_MIN_SPEED +
        edgeRatio * DRAG_AUTO_SCROLL_MAX_SPEED
      )
    }

    const runAutoScroll = () => {
      const scrollArea = getScrollArea()
      const pointerY = lastPointerYRef.current
      const direction = autoScrollDirectionRef.current

      if (!scrollArea || pointerY === null || direction === 0) {
        clearAutoScroll()
        return
      }

      const nextDirection = getAutoScrollDirection(pointerY)

      if (nextDirection !== direction) {
        clearAutoScroll()
        return
      }

      scrollArea.scrollTop += getAutoScrollSpeed(pointerY, direction) * direction
      updateDragOrder(pointerY)
      autoScrollAnimationFrameRef.current =
        window.requestAnimationFrame(runAutoScroll)
    }

    const scheduleAutoScroll = (clientY) => {
      const direction = getAutoScrollDirection(clientY)

      if (direction === 0) {
        clearAutoScroll()
        return
      }

      if (
        autoScrollDirectionRef.current === direction &&
        (autoScrollDelayTimerRef.current ||
          autoScrollAnimationFrameRef.current)
      ) {
        return
      }

      clearAutoScroll()
      autoScrollDirectionRef.current = direction
      autoScrollDelayTimerRef.current = window.setTimeout(() => {
        autoScrollDelayTimerRef.current = null
        autoScrollAnimationFrameRef.current =
          window.requestAnimationFrame(runAutoScroll)
      }, DRAG_AUTO_SCROLL_DELAY_MS)
    }

    const handlePointerMove = (event) => {
      event.preventDefault()
      lastPointerYRef.current = event.clientY
      updateDragOrder(event.clientY)
      scheduleAutoScroll(event.clientY)
    }

    const handlePointerEnd = () => {
      clearAutoScroll()
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
      clearAutoScroll()
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
    lastPointerYRef.current = event.clientY
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
