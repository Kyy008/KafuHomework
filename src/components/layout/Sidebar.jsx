const EDIT_ACTIONS = [
  { id: 'add', label: '添加作业', icon: 'add' },
]

// 桌面端侧边栏和移动端底部栏共用同一份导航配置，避免两个入口不一致。
const MOBILE_NAV_ACTIONS = [
  { id: 'view', label: '查看作业', icon: 'view' },
  ...EDIT_ACTIONS,
]

const sidebarClass =
  'sidebar hidden w-[var(--sidebar-expanded-width)] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--glass-sidebar)] px-4 py-5 backdrop-blur-lg transition-[width,padding] duration-300 md:block'
const collapseRowClass =
  'sidebar-collapse-row mb-4 flex justify-end'
const collapseButtonClass =
  'collapse-button grid h-10 w-10 place-items-center rounded-md border border-[var(--border)] bg-transparent text-[var(--muted-foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]'
const sideNavClass = 'side-nav grid gap-2'
const navGroupClass = 'nav-group grid gap-2'
const navChildrenClass = 'nav-children overflow-hidden transition-[max-height] duration-300'
const navChildrenInnerClass = 'nav-children-inner pl-3'
const navChildrenStackClass = 'nav-children-stack grid gap-2'
const treeButtonBaseClass =
  'tree-button flex min-h-11 w-full items-center gap-3 rounded-md border border-transparent bg-transparent px-3 text-left text-sm font-bold text-[var(--muted-foreground)] transition hover:bg-[rgba(32,36,29,0.58)] hover:text-[var(--foreground)]'
const treeButtonActiveClass =
  'active border-[var(--primary)] bg-[rgba(38,50,69,0.58)] text-[var(--primary)]'
const treeButtonCollapsedClass = 'collapsed justify-center px-2'
const treeLabelClass = 'tree-label min-w-0 truncate'
const editGroupButtonClass =
  'edit-group-button flex min-h-11 w-full items-center gap-3 rounded-md border border-transparent bg-transparent px-3 text-left text-sm font-bold text-[var(--muted-foreground)] transition hover:bg-[rgba(32,36,29,0.58)] hover:text-[var(--foreground)]'
const mobileBottomNavClass =
  'mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid min-h-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom))] grid-cols-2 border-t border-[var(--border)] bg-[var(--glass-panel)] px-2.5 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-lg md:hidden'
const mobileButtonClass =
  'mobile-nav-button grid place-items-center gap-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs font-extrabold text-[var(--muted-foreground)] transition active:scale-[0.98]'
const mobileButtonActiveClass =
  'active border-[var(--primary)] bg-[rgba(38,50,69,0.58)] text-[var(--primary)]'

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

// 抽出通用树形按钮，统一处理 active、collapsed 两类导航状态。
function TreeButton({ active, collapsed, icon, label, onClick }) {
  return (
    <button
      aria-label={label}
      className={`${treeButtonBaseClass} ${
        active ? treeButtonActiveClass : ''
      } ${collapsed ? treeButtonCollapsedClass : ''
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <SidebarIcon name={icon} />
      <span className={treeLabelClass}>{label}</span>
    </button>
  )
}

// 桌面端导航支持收起和二级菜单展开，用于保留更多工作区宽度。
export function Sidebar({
  activeView,
  isCollapsed,
  isEditMenuExpanded,
  onChangeView,
  onToggleCollapse,
  onToggleEditMenu,
}) {
  return (
    <aside className={sidebarClass} aria-label="主导航">
      <div className={`${collapseRowClass} ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          className={collapseButtonClass}
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

      <nav className={sideNavClass}>
        <TreeButton
          active={activeView === 'view'}
          collapsed={isCollapsed}
          icon="view"
          label="查看作业"
          onClick={() => onChangeView('view')}
        />

        <div className={navGroupClass}>
          <button
            aria-expanded={isEditMenuExpanded}
            aria-label="作业编辑"
            className={`${editGroupButtonClass} ${
              activeView === 'add' ? treeButtonActiveClass : ''
            } ${isCollapsed ? treeButtonCollapsedClass : ''}`}
            onClick={onToggleEditMenu}
            title="作业编辑"
            type="button"
          >
            <SidebarIcon name="group" />
            <span className={treeLabelClass}>作业编辑</span>
            <ChevronIcon className={isEditMenuExpanded ? 'rotated' : ''} />
          </button>

          <div
            className={`${navChildrenClass} ${
              isEditMenuExpanded ? 'expanded' : ''
            } ${isCollapsed ? 'collapsed' : ''}`}
          >
            <div className={navChildrenInnerClass}>
              <div className={navChildrenStackClass}>
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

// 小屏幕不显示侧边栏，改用底部导航减少横向空间占用。
export function MobileBottomNav({ activeView, onChangeView }) {
  return (
    <nav className={mobileBottomNavClass} aria-label="移动端主导航">
      {MOBILE_NAV_ACTIONS.map((action) => (
        <button
          aria-label={action.label}
          aria-current={activeView === action.id ? 'page' : undefined}
          className={`${mobileButtonClass} ${
            activeView === action.id ? mobileButtonActiveClass : ''
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
