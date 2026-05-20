import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  AssignmentForm,
  EditAssignmentView,
  ViewAssignments,
} from './components/assignments/AssignmentViews'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { useAssignmentStore } from './hooks/useAssignmentStore'
import { formatDateTimeInputValue } from './utils/dateUtils'

const getViewTitle = (activeView) => {
  if (activeView === 'add') return '添加作业'
  if (activeView === 'edit') return '编辑作业'
  return '查看作业'
}

function App() {
  const [activeView, setActiveView] = useState('view')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isEditMenuExpanded, setIsEditMenuExpanded] = useState(true)
  const [now, setNow] = useState(() => new Date())
  const assignmentStore = useAssignmentStore()
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
    >
      <Topbar />

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
              now={now}
              onDelete={assignmentStore.deleteAssignment}
              onToggleComplete={assignmentStore.toggleComplete}
            />
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
