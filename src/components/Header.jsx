export default function Header({ onStart, onLogin }) {
  return (
    <nav className="landing-nav">
      <div className="landing-brand">
        <span className="brand-pill">OS</span>
        Content Creator
      </div>
      <div className="landing-nav-actions">
        <button className="landing-nav-btn" onClick={onLogin}>Log in</button>
        <button className="landing-nav-btn landing-nav-btn-solid" onClick={onStart}>Launch app →</button>
      </div>
    </nav>
  )
}
