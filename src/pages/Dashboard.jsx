import { useEffect, useState } from 'react'
import useItems from '../hooks/useItems'
import { itemsApi } from '../api'
import DashboardNav from '../components/DashboardNav'
import ContentCard from '../components/ContentCard'
import EditIdeaModal from '../components/EditIdeaModal'
import ProfileModal from '../components/ProfileModal'
import DashboardFilters from '../components/DashboardFilters'
import CalendarView from '../components/CalendarView'
import NewIdeaForm from '../components/NewIdeaForm'
import { filterItems, getOverdueItems } from '../utils/itemFilters'

const defaultStages = ['Draft', 'Idea', 'Research', 'Recordings', 'Published']
const icons = {
  Idea: <i className="fa-solid fa-lightbulb"></i>,
  Research: <i className="fa-solid fa-magnifying-glass"></i>,
  Recordings: <i className="fa-solid fa-clapperboard"></i>,
  Published: <i className="fa-solid fa-circle-check"></i>,
}

export default function Dashboard({ user, onBack, onLogout, onUserUpdated }) {
  const { items, loading, error, setError, createItem, updateItem, removeItem, replaceItem } = useItems()
  const [stage, setStage] = useState('Idea')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState(null)
  const [view, setView] = useState('board')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [filters, setFilters] = useState({ priority: '', platform: '', due: '' })

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  function notify(message, type = 'success') {
    setToast({ message, type })
  }

  function updateFilter(name, value) {
    setFilters(current => ({ ...current, [name]: value }))
  }

  function clearFilters() {
    setFilters({ priority: '', platform: '', due: '' })
  }

  async function addItem(payload) {
    try {
      await createItem(payload)
      setShowForm(false)
      setStage(payload.stage)
      notify('Idea added successfully')
    } catch {
      setError('Failed to add idea')
      notify('Failed to add idea', 'error')
    }
  }

  async function moveItem(id, to) {
    try {
      await updateItem(id, { stage: to })
      notify(`Moved to ${to}`)
    } catch {
      setError('Failed to move item')
      notify('Failed to move item', 'error')
    }
  }

  async function deleteItem(id) {
    try {
      await removeItem(id)
      notify('Item deleted')
    } catch {
      setError('Failed to delete item')
      notify('Failed to delete item', 'error')
    }
  }

  const stages = [...defaultStages, ...items.map(item => item.stage).filter(current => current && !defaultStages.includes(current))]

  async function saveEdit(id, changes) {
    try {
      await updateItem(id, changes)
      setEditItem(null)
      notify('Idea updated')
    } catch {
      notify('Failed to update idea', 'error')
    }
  }

  async function setResearch(id, research) {
    try {
      await updateItem(id, { research })
    } catch {
      setError('Failed to save research')
    }
  }

  async function syncCalendar(id) {
    try {
      const updatedItem = await itemsApi.syncCalendar(id)
      replaceItem(updatedItem)
      notify('Calendar event synced')
    } catch (requestError) {
      notify(requestError.response?.data?.message || 'Could not sync Calendar', 'error')
    }
  }

  async function toggleRecording(id, section) {
    const item = items.find(current => current.id === id)
    if (!item) return
    const recordings = (item.recordings || []).includes(section)
      ? item.recordings.filter(recording => recording !== section)
      : [...(item.recordings || []), section]

    try {
      await updateItem(id, { recordings })
      notify('Recordings updated')
    } catch {
      setError('Failed to update recordings')
      notify('Failed to update recordings', 'error')
    }
  }

  function addImage(id, file) {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const item = items.find(current => current.id === id)
        if (typeof reader.result !== 'string') throw new Error('Could not read the selected image.')
        const uploaded = await itemsApi.uploadImage(reader.result, id)
        const images = [...((item && item.images) || []), uploaded]
        await updateItem(id, { images })
        notify('Image added')
      } catch (requestError) {
        const message = requestError.response?.data?.message || requestError.message || 'Failed to save image'
        setError(message)
        notify(message, 'error')
      }
    }
    reader.onerror = () => {
      setError('Could not read the selected image')
      notify('Could not read the selected image', 'error')
    }
    reader.readAsDataURL(file)
  }

  async function removeImage(id, imageIndex) {
    const item = items.find(current => current.id === id)
    if (!item) return
    const images = (item.images || []).filter((_, index) => index !== imageIndex)

    try {
      await updateItem(id, { images })
      const removedImage = item.images?.[imageIndex]
      if (removedImage && typeof removedImage !== 'string' && removedImage.publicId) await itemsApi.deleteImage(removedImage.publicId)
      notify('Image removed')
    } catch {
      setError('Failed to remove image')
      notify('Failed to remove image', 'error')
    }
  }

  const stageIndex = stages.indexOf(stage)
  const filteredItems = filterItems(items, filters, search)
  const visibleItems = filterItems(items, filters, search, stage)
  const activeItems = items.filter(item => item.stage !== 'Published')
  const overdueItems = getOverdueItems(items)

  return (
    <div className="dashboard">
      <DashboardNav user={user} onBack={onBack} onLogout={onLogout} onOpenProfile={() => setShowProfile(true)} showForm={showForm} onToggleForm={() => setShowForm(current => !current)} />

      <div className="dash-body">
        <div className="sidebar-wrapper">
          <aside className="sidebar">
            <div className="sidebar-section">
              <p className="sidebar-label">Overview</p>
              <div className="sidebar-stats">
                <div className="sstat"><span className="sstat-num">{items.length}</span><span className="sstat-text">Total</span></div>
                <div className="sstat"><span className="sstat-num">{items.filter(item => item.stage !== 'Published').length}</span><span className="sstat-text">In Progress</span></div>
                <div className="sstat"><span className="sstat-num">{items.filter(item => item.stage === 'Published').length}</span><span className="sstat-text">Published</span></div>
              </div>
            </div>

            <div className="sidebar-section">
              <p className="sidebar-label">Stages</p>
              <nav className="stage-nav">
                {stages.map(currentStage => (
                  <button key={currentStage} className={'stage-nav-item' + (stage === currentStage ? ' active' : '')} onClick={() => setStage(currentStage)}>
                  <span className="stage-nav-icon">{icons[currentStage] || <i className="fa-solid fa-layer-group"></i>}</span>
                    <span className="stage-nav-label">{currentStage}</span>
                    <span className="stage-nav-count">{items.filter(item => item.stage === currentStage).length}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="sidebar-section">
              <p className="sidebar-label">Pipeline</p>
              <div className="pipeline-track">
                {stages.map((currentStage, index) => (
                  <div key={currentStage} className="pipeline-step">
                    <div className="pipeline-dot" style={{ background: items.some(item => item.stage === currentStage) ? '#000' : '#e5e7eb' }} />
                    {index < stages.length - 1 && <div className="pipeline-line" />}
                  </div>
                ))}
              </div>
              <div className="pipeline-labels">{stages.map(currentStage => <span key={currentStage} className="pipeline-lbl">{currentStage}</span>)}</div>
              <div className="analytics-summary"><strong>{items.length ? Math.round((items.filter(item => item.stage === 'Published').length / items.length) * 100) : 0}%</strong> completion · <strong>{overdueItems.length}</strong> overdue</div>
            </div>
          </aside>
        </div>

        <main className="main-area">
          <div className="main-header">
            <div className="main-title-row"><span className="main-stage-icon">{icons[stage] || <i className="fa-solid fa-layer-group"></i>}</span><h1 className="main-title">{stage}</h1><span className="main-count">{visibleItems.length}</span></div>
              {user?.journey && <p className="creator-focus"><i className="fa-solid fa-compass"></i> Creator focus: {user.journey}</p>}
            <p className="main-subtitle">
              {stage === 'Idea' && 'Capture your content ideas before they slip away.'}
              {stage === 'Research' && 'Add notes, links, and reference images for each idea.'}
              {stage === 'Recordings' && 'Plan what to record — intro, content, closing, or b-roll.'}
              {stage === 'Published' && 'Your finished content. Great work!'}
            </p>
          </div>
          {overdueItems.length > 0 && <div className="deadline-banner"><i className="fa-solid fa-triangle-exclamation"></i> {overdueItems.length} active item{overdueItems.length === 1 ? '' : 's'} overdue. Items are sorted by nearest deadline.</div>}

          <div className="toolbar">
            <div className="search-wrap"><i className="fa-solid fa-magnifying-glass"></i><input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or research notes..." />
              {search && <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Clear search"><i className="fa-solid fa-xmark"></i></button>}
            </div>
            <button type="button" className="view-toggle" onClick={() => setView(current => current === 'board' ? 'calendar' : 'board')}><i className="fa-regular fa-calendar"></i> {view === 'board' ? 'Calendar' : 'Board'}</button>
          </div>
          <DashboardFilters filters={{ ...filters, platforms: [...new Set(items.map(item => item.platform).filter(Boolean))] }} onChange={updateFilter} onClear={clearFilters} />

          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
          {loading && <p style={{ color: '#6b7280', marginBottom: 12 }}>Loading items from API…</p>}

          {showForm && <NewIdeaForm onCreate={addItem} />}

          {view === 'calendar' ? <CalendarView items={filteredItems} month={calendarMonth} onMonthChange={setCalendarMonth} onSelectItem={setEditItem} /> : <div className="cards-grid">
            {!loading && !error && visibleItems.length === 0 && <p style={{ color: '#9ca3af', gridColumn: '1 / -1' }}>{query ? 'No items match your search.' : 'No items in this stage yet.'}</p>}
            {visibleItems.map(item => <ContentCard key={item.id} item={item} stage={stage} stageIndex={stageIndex} stages={stages} onMove={moveItem} onDelete={setDeleteItemId} onEdit={setEditItem} onResearchChange={setResearch} onAddImage={addImage} onRemoveImage={removeImage} onRecordingToggle={toggleRecording} onSyncCalendar={syncCalendar} />)}
          </div>}
        </main>
      </div>

      {editItem && <EditIdeaModal item={editItem} onClose={() => setEditItem(null)} onSave={saveEdit} />}
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onLogout={onLogout} onUserUpdated={onUserUpdated} />}
      {deleteItemId && <div className="modal-overlay" onClick={() => setDeleteItemId(null)}><section className="edit-modal delete-modal" onClick={event => event.stopPropagation()}><div className="edit-modal-head"><h3>Delete this item?</h3><button className="modal-close" onClick={() => setDeleteItemId(null)} aria-label="Close"><i className="fa-solid fa-xmark"></i></button></div><p>This action cannot be undone.</p><div className="modal-actions"><button type="button" className="cancel-delete" onClick={() => setDeleteItemId(null)}>Cancel</button><button type="button" className="confirm-delete" onClick={() => { deleteItem(deleteItemId); setDeleteItemId(null) }}>Delete item</button></div></section></div>}
      {toast && <div className={'toast toast-' + toast.type}><i className={toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'}></i>{toast.message}</div>}
    </div>
  )
}
