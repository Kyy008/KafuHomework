import { useEffect, useMemo, useState } from 'react'
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
    setEditingAssignment(null)
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

const getViewTitle = (activeView) => {
  if (activeView === 'add') return '添加作业'
  if (activeView === 'edit') return '编辑作业'
  return '查看作业'
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

function App() {
  const [activeView, setActiveView] = useState('view')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isEditMenuExpanded, setIsEditMenuExpanded] = useState(true)
  const assignmentStore = useAssignmentStore()

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
          <section className="empty-view" />
        </main>
      </div>
    </div>
  )
}

export default App
