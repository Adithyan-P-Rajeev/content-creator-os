import { useState } from 'react'
import { authApi } from '../api'

const journeys = ['Educational & Tutorials', 'Lifestyle & Vlogs', 'Travel & Adventure', 'Tech & Gaming', 'Fitness & Wellness', 'Arts, Music & Dance', 'Business & Personal Brand', 'Other']

export default function LoginModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login') // login | register | forgot | reset
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [journey, setJourney] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please fill in email and password.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.login(email.trim(), password)
      localStorage.setItem('contentCreatorToken', result.token)
      localStorage.setItem('contentCreatorUser', JSON.stringify(result.user))
      onSuccess(result.user)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Is the auth server running on port 3002?')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password || !journey) {
      setError('Please fill in every field and choose your content journey.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.register(name.trim(), email.trim(), password, journey)
      localStorage.setItem('contentCreatorToken', result.token)
      localStorage.setItem('contentCreatorUser', JSON.stringify(result.user))
      onSuccess(result.user)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create an account.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!forgotEmail.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.forgotPassword(forgotEmail.trim())
      setNotice(result.message)
      if (result.resetToken) {
        setResetToken(result.resetToken)
        setMode('reset')
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the reset request.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (!resetToken || newPassword.length < 6) {
      setError('Enter the reset code and a password of at least 6 characters.')
      return
    }
    try {
      setSubmitting(true)
      const result = await authApi.resetPassword(resetToken, newPassword)
      setNotice(result.message)
      setMode('login')
      setPassword('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {mode === 'login' || mode === 'register' ? (
          <>
            <div className="login-modal-head">
              <span className="brand-pill">OS</span>
              <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p>{mode === 'login' ? 'Sign in to manage your content.' : 'Create an account to save your login.'}</p>
            </div>

            <form className="login-form" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              {mode === 'register' && (
                <>
                <label className="login-field">
                  <span>Name</span>
                  <div className="login-input-wrap">
                    <i className="fa-regular fa-user"></i>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus />
                  </div>
                </label>
                <label className="login-field">
                  <span>Choose your creator focus</span>
                  <div className="login-input-wrap">
                    <i className="fa-solid fa-video"></i>
                    <select value={journey} onChange={e => setJourney(e.target.value)}>
                      <option value="">What do you primarily create?</option>
                      {journeys.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </label>
                </>
              )}

              <label className="login-field">
                <span>Email</span>
                <div className="login-input-wrap">
                  <i className="fa-regular fa-envelope"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus={mode === 'login'}
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Password</span>
                <div className="login-input-wrap">
                  <i className="fa-solid fa-lock"></i>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <div className="login-form-row">
                {mode === 'login' ? <button type="button" className="login-link" onClick={() => { setMode('forgot'); setError(''); setNotice('') }}>Forgot password?</button> : <button type="button" className="login-link" onClick={() => { setMode('login'); setError('') }}>Already have an account?</button>}
              </div>

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-submit">
                {submitting ? 'Please wait…' : mode === 'login' ? <>Sign in <i className="fa-solid fa-arrow-right"></i></> : 'Create account'}
              </button>

              {mode === 'login' && <button type="button" className="login-back" onClick={() => { setMode('register'); setError('') }}>Create a new account</button>}
            </form>
          </>
        ) : mode === 'forgot' ? (
          <>
            <div className="login-modal-head">
              <span className="brand-pill">OS</span>
              <h2>Reset password</h2>
              <p>Enter your email and we’ll send a reset link.</p>
            </div>

            <form className="login-form" onSubmit={handleForgot}>
              <label className="login-field">
                <span>Email</span>
                <div className="login-input-wrap">
                  <i className="fa-regular fa-envelope"></i>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
              </label>

              {error && <p className="login-error">{error}</p>}
              {notice && <p className="login-notice">{notice}</p>}

              <button type="submit" className="login-submit">
                {submitting ? 'Please wait…' : 'Send reset link'}
              </button>

              <button
                type="button"
                className="login-back"
                onClick={() => { setMode('login'); setError(''); setNotice('') }}
              >
                ← Back to sign in
              </button>
            </form>
          </>
        ) : null}
        {mode === 'reset' && (
          <>
            <div className="login-modal-head">
              <span className="brand-pill">OS</span>
              <h2>Choose a new password</h2>
              <p>Use the local reset code below, then set a new password.</p>
            </div>
            <form className="login-form" onSubmit={handleReset}>
              <label className="login-field"><span>Reset code</span><div className="login-input-wrap"><input value={resetToken} onChange={e => setResetToken(e.target.value)} autoFocus /></div></label>
              <label className="login-field"><span>New password</span><div className="login-input-wrap"><i className="fa-solid fa-lock"></i><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" /></div></label>
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-submit">{submitting ? 'Please wait…' : 'Reset password'}</button>
              <button type="button" className="login-back" onClick={() => { setMode('login'); setError('') }}>← Back to sign in</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
