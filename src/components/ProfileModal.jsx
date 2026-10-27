import { useEffect, useState } from 'react'
import { authApi, AUTH_URL } from '../api'

const creatorFocuses = ['Educational & Tutorials', 'Lifestyle & Vlogs', 'Travel & Adventure', 'Tech & Gaming', 'Fitness & Wellness', 'Arts, Music & Dance', 'Business & Personal Brand', 'Other']

export default function ProfileModal({ user, onClose, onLogout, onUserUpdated }) {
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase()
  const [journey, setJourney] = useState(user?.journey || '')
  const [saving, setSaving] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function receiveCalendarConnection(event) {
      if (event.origin !== new URL(AUTH_URL).origin || event.data?.type !== 'google-calendar-connected') return
      try {
        const result = await authApi.me(localStorage.getItem('contentCreatorToken'))
        onUserUpdated(result.user)
      } catch { setError('Calendar connected, but the profile could not be refreshed.') }
    }
    window.addEventListener('message', receiveCalendarConnection)
    return () => window.removeEventListener('message', receiveCalendarConnection)
  }, [onUserUpdated])

  async function saveFocus() {
    if (!journey || journey === user?.journey) return
    try {
      setSaving(true)
      setError('')
      const result = await authApi.updateProfile(localStorage.getItem('contentCreatorToken'), journey)
      onUserUpdated(result.user)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update creator focus.')
    } finally {
      setSaving(false)
    }
  }

  async function connectCalendar() {
    try {
      setCalendarLoading(true)
      setError('')
      const result = await authApi.calendarConnect(localStorage.getItem('contentCreatorToken'))
      window.open(result.url, 'google-calendar-connect', 'width=560,height=700')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not start Google Calendar connection.')
    } finally {
      setCalendarLoading(false)
    }
  }

  async function disconnectCalendar() {
    try {
      setCalendarLoading(true)
      const result = await authApi.calendarDisconnect(localStorage.getItem('contentCreatorToken'))
      onUserUpdated(result.user)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not disconnect Google Calendar.')
    } finally {
      setCalendarLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="profile-modal" onClick={event => event.stopPropagation()} aria-label="Your profile">
        <button className="modal-close" onClick={onClose} aria-label="Close profile">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="profile-avatar">{initial}</div>
        <h2>{user?.name || 'Your profile'}</h2>
        <p className="profile-subtitle">Set the focus that shapes your content workflow.</p>

        <div className="profile-details">
          <div><span>Email</span><strong>{user?.email}</strong></div>
          <div className="journey-detail">
            <span>Creator focus</span>
            <select value={journey} onChange={event => setJourney(event.target.value)}>
              {!creatorFocuses.includes(journey) && journey && <option value={journey}>{journey}</option>}
              {creatorFocuses.map(focus => <option key={focus} value={focus}>{focus}</option>)}
            </select>
            <button type="button" className="save-focus" onClick={saveFocus} disabled={saving || journey === user?.journey}>{saving ? 'Saving…' : 'Save focus'}</button>
            {error && <small className="profile-error">{error}</small>}
          </div>
          <div><span>Account ID</span><strong>{user?.id}</strong></div>
          <div className="journey-detail"><span>Google Calendar</span><strong>{user?.calendarConnected ? 'Connected' : 'Not connected'}</strong><button type="button" className="save-focus" onClick={user?.calendarConnected ? disconnectCalendar : connectCalendar} disabled={calendarLoading}>{calendarLoading ? 'Please wait…' : user?.calendarConnected ? 'Disconnect Calendar' : 'Connect Calendar'}</button></div>
        </div>
        <button className="profile-logout" onClick={onLogout}>Log out</button>
      </section>
    </div>
  )
}
