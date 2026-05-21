import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  AssignmentForm,
  ViewAssignments,
} from './components/assignments/AssignmentViews'
import { AuthPage } from './components/auth/AuthPage'
import { MobileBottomNav, Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { useAuth } from './hooks/useAuth'
import { useAssignmentStore } from './hooks/useAssignmentStore'
import { formatDateTimeInputValue } from './utils/dateUtils'

const getViewTitle = (activeView) => {
  if (activeView === 'add') return '添加作业'
  return '查看作业'
}

const appShellClass =
  'app-shell min-h-screen text-[var(--foreground)]'
const appBodyClass = 'app-body flex min-h-[calc(100vh-var(--topbar-height))]'
const workspaceClass =
  'workspace min-w-0 flex-1 overflow-y-auto bg-transparent px-8 py-6 max-md:px-4 max-md:pb-[calc(var(--mobile-bottom-nav-height)+24px)]'
const authLoadingCardClass =
  'auth-card auth-loading-card w-[min(100%,420px)] border border-[var(--border)] bg-[rgba(36,36,36,0.72)] p-7 text-center backdrop-blur-lg'
const emptyViewClass = 'empty-view min-h-full'

function App() {
  const [activeView, setActiveView] = useState('view')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isEditMenuExpanded, setIsEditMenuExpanded] = useState(true)
  const [highlightedAssignmentId, setHighlightedAssignmentId] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const auth = useAuth()
  const assignmentStore = useAssignmentStore()
  const minDeadline = useMemo(() => formatDateTimeInputValue(now), [now])
  const clearHighlightedAssignment = useCallback(() => {
    setHighlightedAssignmentId(null)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  if (auth.isAuthLoading) {
    return (
      <main className="auth-page grid min-h-screen place-items-center p-6 text-[var(--foreground)]">
        <section className={authLoadingCardClass}>
          <p>正在校验登录状态...</p>
        </section>
      </main>
    )
  }

  if (!auth.user) {
    return (
      <AuthPage
        authError={auth.authError}
        onLogin={auth.login}
        onRegister={auth.register}
        setAuthError={auth.setAuthError}
      />
    )
  }

  return (
    <div
      className={`${appShellClass} ${
        isSidebarCollapsed ? 'sidebar-collapsed' : ''
      }`}
      data-active-view={activeView}
      data-assignment-count={assignmentStore.assignments.length}
    >
      <Topbar onLogout={auth.logout} username={auth.user.username} />

      <div className={appBodyClass}>
        <Sidebar
          activeView={activeView}
          isCollapsed={isSidebarCollapsed}
          isEditMenuExpanded={isEditMenuExpanded}
          onChangeView={setActiveView}
          onToggleCollapse={() =>
            setIsSidebarCollapsed((currentValue) => !currentValue)
          }
          onToggleEditMenu={() =>
            setIsEditMenuExpanded((isExpanded) => !isExpanded)
          }
        />

        <main className={workspaceClass} aria-label={getViewTitle(activeView)}>
          {activeView === 'view' ? (
            <ViewAssignments
              assignments={assignmentStore.assignments}
              highlightedAssignmentId={highlightedAssignmentId}
              minDeadline={minDeadline}
              now={now}
              onDelete={assignmentStore.deleteAssignment}
              onReorder={assignmentStore.reorderAssignments}
              onSave={assignmentStore.saveAssignment}
              onHighlightComplete={clearHighlightedAssignment}
              onToggleComplete={assignmentStore.toggleComplete}
            />
          ) : activeView === 'add' ? (
            <AssignmentForm
              minDeadline={minDeadline}
              onSubmit={(formData) => {
                const newAssignment = assignmentStore.addAssignment(formData)
                setHighlightedAssignmentId(newAssignment.id)
                setActiveView('view')
              }}
            />
          ) : (
            <section className={emptyViewClass} />
          )}
        </main>
      </div>

      <MobileBottomNav activeView={activeView} onChangeView={setActiveView} />
    </div>
  )
}

export default App
