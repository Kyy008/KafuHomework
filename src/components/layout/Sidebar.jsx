const EDIT_ACTIONS = [
  { id: 'add', label: '添加作业', icon: 'add' },
]

const MOBILE_NAV_ACTIONS = [
  { id: 'view', label: '查看作业', icon: 'view' },
  ...EDIT_ACTIONS,
]

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

export function Sidebar({
  activeView,
  isCollapsed,
  isEditMenuExpanded,
  onChangeView,
  onToggleCollapse,
  onToggleEditMenu,
}) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className={`sidebar-collapse-row ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          className="collapse-button"
          type="button"
          aria-label={isCollapsed ? '展开侧边导航栏' : '收起侧边导航栏'}
          title={isCollapsed ? '展开侧边导航栏' : '收起侧边导航栏'}
          onClick={onToggleCollapse}
        >
          <SidebarIcon
            className={isCollapsed ? 'rotated' : ''}
            name="collapse"
          />
        </button>
      </div>

      <nav className="side-nav">
        <TreeButton
          active={activeView === 'view'}
          collapsed={isCollapsed}
          icon="view"
          label="查看作业"
          onClick={() => onChangeView('view')}
        />

        <div className="nav-group">
          <button
            aria-expanded={isEditMenuExpanded}
            aria-label="作业编辑"
            className={`edit-group-button ${
              activeView === 'add' ? 'active' : ''
            } ${isCollapsed ? 'collapsed' : ''}`}
            onClick={onToggleEditMenu}
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
            } ${isCollapsed ? 'collapsed' : ''}`}
          >
            <div className="nav-children-inner">
              <div className="nav-children-stack">
                {EDIT_ACTIONS.map((action) => (
                  <TreeButton
                    active={activeView === action.id}
                    collapsed={isCollapsed}
                    icon={action.icon}
                    key={action.id}
                    label={action.label}
                    onClick={() => onChangeView(action.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export function MobileBottomNav({ activeView, onChangeView }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="移动端主导航">
      {MOBILE_NAV_ACTIONS.map((action) => (
        <button
          aria-label={action.label}
          aria-current={activeView === action.id ? 'page' : undefined}
          className={`mobile-nav-button ${
            activeView === action.id ? 'active' : ''
          }`}
          key={action.id}
          onClick={() => onChangeView(action.id)}
          type="button"
        >
          <SidebarIcon name={action.icon} />
          <span>{action.label}</span>
        </button>
      ))}
    </nav>
  )
}
