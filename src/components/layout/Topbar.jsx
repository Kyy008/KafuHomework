import appIcon from '../../assets/icon/icon.png'

export function Topbar({ onLogout, username }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="KafuHomework">
        <img className="brand-icon" src={appIcon} alt="" />
        <span className="brand-name">KafuHomework</span>
      </a>
      <div className="account-area">
        <span className="account-name">{username}</span>
        <button className="logout-button" type="button" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </header>
  )
}
