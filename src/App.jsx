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
      <main className="auth-page">
        <section className="auth-card auth-loading-card">
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
      className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      data-active-view={activeView}
      data-assignment-count={assignmentStore.assignments.length}
    >
      <Topbar onLogout={auth.logout} username={auth.user.username} />

      <div className="app-body">
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

        <main className="workspace" aria-label={getViewTitle(activeView)}>
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
            <section className="empty-view" />
          )}
        </main>
      </div>

      <MobileBottomNav activeView={activeView} onChangeView={setActiveView} />
    </div>
  )
}

export default App
