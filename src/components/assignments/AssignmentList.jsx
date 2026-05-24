import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  calculateAssignmentProgress,
  getAssignmentStatus,
  getProgressColor,
} from '../../utils/assignmentUtils'
import { formatDateTime } from '../../utils/dateUtils'

// 拖拽到滚动区域边缘时，停留一小段时间后自动滚动，方便跨多条作业排序。
const DRAG_AUTO_SCROLL_DELAY_MS = 500
const DRAG_AUTO_SCROLL_EDGE_SIZE = 80
const DRAG_AUTO_SCROLL_MIN_SPEED = 1
const DRAG_AUTO_SCROLL_MAX_SPEED = 6
const cardClass =
  'assignment-card flex w-full items-stretch gap-3 rounded-lg border border-[var(--border)] bg-[var(--glass-panel)] p-4 backdrop-blur-lg transition-[border-color,box-shadow,transform]'
const actionButtonBaseClass =
  'assignment-action-button rounded-md border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm font-extrabold text-[var(--foreground)] transition hover:bg-[var(--muted)] active:scale-[0.98]'
const confirmButtonClass =
  'rounded-md border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--muted)]'
const infoPillClass =
  'assignment-info-pill min-w-0 rounded-md bg-[var(--glass-panel-strong)] px-3 py-2'

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
    <div className={infoPillClass}>
      <span className="block text-xs font-bold text-[var(--muted-foreground)]">
        {label}
      </span>
      <strong className="mt-1 block break-words text-sm font-extrabold text-[var(--foreground)]">
        {value || '—'}
      </strong>
    </div>
  )
}

// 作业卡片上的操作按钮统一封装，便于保持编辑/删除按钮风格一致。
function AssignmentActionButton({
  children,
  danger = false,
  onClick,
  variant = '',
}) {
  return (
    <button
      className={`${actionButtonBaseClass} ${
        danger
          ? 'danger border-[rgba(255,122,138,0.65)] bg-[#2d191b] text-[#ffc3ca] hover:bg-[#3a1f22]'
          : ''
      } ${
        variant === 'edit'
          ? 'edit border-[rgba(87,191,218,0.65)] bg-[#17313a] text-[#bdefff] hover:bg-[#1d3d48]'
          : ''
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

// 删除和完成都需要二次确认，弹窗通过 Portal 脱离列表布局。
function ConfirmDialog({ confirmTone = 'default', message, onCancel, onConfirm }) {
  return createPortal(
    <div
      className="confirm-dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,0.58)] p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        aria-modal="true"
        className="confirm-dialog w-[min(360px,calc(100vw-32px))] rounded-lg border border-[var(--border)] bg-[var(--glass-panel)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur-lg"
        role="dialog"
      >
        <p className="m-0 text-base font-bold text-[var(--foreground)]">{message}</p>
        <div className="confirm-dialog-actions mt-5 flex justify-end gap-3">
          <button className={confirmButtonClass} type="button" onClick={onCancel}>
            取消
          </button>
          <button
            className={`${confirmButtonClass} ${
              confirmTone === 'danger'
                ? 'danger border-[rgba(255,122,138,0.75)] bg-[#2d191b] text-[#ffc3ca] hover:bg-[#3a1f22]'
                : ''
            }`}
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
  // pendingAction 记录当前等待确认的操作，避免为删除/完成各写一套弹窗状态。
  const [pendingAction, setPendingAction] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const closeDialog = () => {
    setPendingAction(null)
  }

  const confirmPendingAction = () => {
    if (pendingAction === 'delete') {
      closeDialog()
      // 先播放离场动画，动画结束后再真正从数据中删除。
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
        className={`${cardClass} ${highlighted ? 'highlighted' : ''} ${
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
          <div className="assignment-card-main flex items-start justify-between gap-4 max-md:flex-col">
            <div className="assignment-card-heading min-w-0">
              <div className="assignment-title-row flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="m-0 min-w-0 break-words text-xl font-extrabold text-[var(--foreground)]">
                  {assignment.title}
                </h2>
                <span className={`assignment-status ${status.tone}`}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="assignment-card-actions flex shrink-0 flex-wrap justify-end gap-2 max-md:justify-start">
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
                    className="complete-badge grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
                    title="已完成"
                    aria-label="已完成"
                  >
                    <CheckIcon />
                  </span>
                </span>
              ) : (
                <button
                  className="complete-button rounded-md border border-transparent bg-[#4bae50] px-3 py-2 text-sm font-extrabold text-white transition hover:bg-[#449b48] active:scale-[0.98]"
                  onClick={() => setPendingAction('complete')}
                  type="button"
                >
                  标记完成
                </button>
              )}
            </div>
          </div>

          <div className="assignment-info-grid mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <InfoPill label="作业详情" value={assignment.detail} />
            <InfoPill label="课程" value={assignment.course} />
            <InfoPill
              label="截止日期"
              value={formatDateTime(assignment.deadline)}
            />
          </div>

          {!assignment.completed && (
            <div
              className="assignment-progress-track mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel-strong)]"
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
  // 拖拽过程中的中间顺序保存在 ref/state 中，松手后再提交给上层持久化。
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

    // FLIP 动画：先把卡片放回旧位置，再交给 CSS transition 过渡到新位置。
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

    // 拖拽时根据鼠标位置实时重排临时顺序，不直接修改原始 assignments。
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

      // 根据指针穿过其他卡片中心线的位置，计算拖拽卡片应插入的索引。
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
      // 指针停在边缘一小段时间后才滚动，避免正常拖拽经过边缘时误触发。
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
      // 松手时才把最终顺序提交给父组件，减少拖拽过程中的持久化写入。
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
    // 拖拽开始时固定当前列表 id 顺序，后续只在这份顺序上移动目标卡片。
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
