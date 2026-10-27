export default function DashboardNav({ user, onBack, onLogout, onOpenProfile, showForm, onToggleForm }) {
  return (
    <nav className="dash-nav">
      <div className="nav-left">
        <button className="back-btn" onClick={onBack} aria-label="Back to landing page">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="brand">Content Creator OS</div>
      </div>
      <div className="dash-nav-actions">
        {user && <button className="profile-btn" onClick={onOpenProfile}><i className="fa-regular fa-user"></i> {user.name}</button>}
        <button className="logout-btn" onClick={onLogout}>Log out</button>
        <button className="btn-primary" onClick={onToggleForm}>
          {showForm ? 'Cancel' : <><i className="fa-solid fa-plus"></i> New Idea</>}
        </button>
      </div>
    </nav>
  )
}
