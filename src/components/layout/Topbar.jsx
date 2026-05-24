import appIcon from '../../assets/icon/icon.png'

const topbarClass =
  'topbar flex h-[var(--topbar-height)] items-center justify-between border-b border-[var(--border)] bg-[var(--glass-topbar)] px-8 backdrop-blur-lg max-md:px-4'
const brandClass =
  'brand inline-flex min-w-0 items-center gap-2 text-[var(--foreground)] no-underline'
const brandIconClass = 'brand-icon h-9 w-9 shrink-0 object-contain'
const brandNameClass =
  'brand-name truncate text-lg font-extrabold text-[var(--foreground)]'
const accountAreaClass = 'account-area flex min-w-0 items-center gap-3'
const accountNameClass =
  'account-name max-w-40 truncate text-sm font-bold text-[var(--muted-foreground)]'
const logoutButtonClass =
  'logout-button min-h-10 rounded-md border border-[var(--border)] bg-[var(--panel-strong)] px-3 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--danger)] hover:text-[var(--danger)] active:scale-[0.98]'

// 顶部栏只负责展示品牌、当前用户和退出登录入口。
export function Topbar({ onLogout, username }) {
  return (
    <header className={topbarClass}>
      <a className={brandClass} href="/" aria-label="KafuHomework">
        <img className={brandIconClass} src={appIcon} alt="" />
        <span className={brandNameClass}>KafuHomework</span>
      </a>
      <div className={accountAreaClass}>
        <span className={accountNameClass}>{username}</span>
        <button className={logoutButtonClass} type="button" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </header>
  )
}
