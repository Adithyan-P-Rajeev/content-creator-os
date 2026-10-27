import { useEffect, useState } from 'react'
import { authApi } from './api'
import Header from './components/Header'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import Dashboard from './pages/Dashboard'

function Landing({ user, onAuthenticated, onOpenDashboard }) {
  const [showLogin, setShowLogin] = useState(false)

  function startApp() {
    if (user) onOpenDashboard()
    else setShowLogin(true)
  }

  return (
    <div className="landing">
      <Header onStart={startApp} onLogin={() => setShowLogin(true)} />
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">Content workflow tool</p>
          <h1>From idea<br />to published.</h1>
        </div>
      </section>
      <Footer />
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={onAuthenticated} />}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('contentCreatorToken')
    if (!token) {
      setCheckingSession(false)
      return
    }

    authApi.me(token)
      .then(result => setUser(result.user))
      .catch(() => {
        localStorage.removeItem('contentCreatorToken')
        localStorage.removeItem('contentCreatorUser')
      })
      .finally(() => setCheckingSession(false))
  }, [])

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser)
    setPage('dashboard')
  }

  function handleUserUpdated(updatedUser) {
    setUser(updatedUser)
    localStorage.setItem('contentCreatorUser', JSON.stringify(updatedUser))
  }

  async function handleLogout() {
    const token = localStorage.getItem('contentCreatorToken')
    try {
      if (token) await authApi.logout(token)
    } finally {
      localStorage.removeItem('contentCreatorToken')
      localStorage.removeItem('contentCreatorUser')
      setUser(null)
      setPage('landing')
    }
  }

  if (checkingSession) return <div className="app-loading">Checking your session…</div>

  return page === 'landing'
    ? <Landing user={user} onAuthenticated={handleAuthenticated} onOpenDashboard={() => setPage('dashboard')} />
    : <Dashboard user={user} onBack={() => setPage('landing')} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />
}
