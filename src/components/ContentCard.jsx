function formatDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ContentCard({
  item, stage, stageIndex, stages, onMove, onDelete, onEdit,
  onResearchChange, onAddImage, onRemoveImage, onRecordingToggle, onSyncCalendar,
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = item.dueDate ? new Date(`${item.dueDate}T00:00:00`) : null
  const daysUntilDue = due ? Math.round((due - today) / 86400000) : null
  const deadlineLabel = daysUntilDue !== null && stage !== 'Published'
    ? daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue` : daysUntilDue === 0 ? 'Due today' : daysUntilDue <= 3 ? `Due in ${daysUntilDue} days` : ''
    : ''
  return (
    <article className="card">
      <div className="card-top">
        <div className="card-color" style={{ background: '#000' }} />
        <div className="card-actions">
          <button className="btn-edit" onClick={() => onEdit(item)} title="Edit item" aria-label="Edit item">
            <i className="fa-solid fa-pen"></i>
          </button>
          <button className="btn-delete" onClick={() => onDelete(item.id)} aria-label="Delete item">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <h3>{item.title}</h3>

      <div className="card-meta">
        {item.priority && <span className={'priority-badge priority-' + item.priority.toLowerCase()}>{item.priority}</span>}
        {item.platform && <span className="platform-badge"><i className="fa-solid fa-share-nodes"></i> {item.platform}</span>}
        {(item.tags || []).map(tag => <span key={tag} className="tag-badge">#{tag}</span>)}
      </div>

      {(item.startDate || item.dueDate || item.publishDate) && (
        <div className="card-dates">
          {item.startDate && <span className="date-text">Start: {formatDate(item.startDate)}</span>}
          {item.dueDate && <span className="date-text">Due: {formatDate(item.dueDate)}</span>}
          {item.publishDate && <span className="date-text">Publish: {formatDate(item.publishDate)}</span>}
        </div>
      )}
      {deadlineLabel && <p className={'deadline-warning' + (daysUntilDue < 0 ? ' overdue' : '')}><i className="fa-solid fa-clock"></i> {deadlineLabel}</p>}
      {(item.assignee || item.platformDetails) && <p className="card-details">{item.assignee && `Assignee: ${item.assignee}`}{item.assignee && item.platformDetails && ' · '}{item.platformDetails && item.platformDetails}</p>}

      {stage === 'Research' && (
        <div className="research-section">
          <textarea className="research-input" placeholder="Add notes, links, references..." value={item.research || ''} onChange={e => onResearchChange(item.id, e.target.value)} />
          <div className="image-upload-area">
            <label className="image-upload-btn">
              <input type="file" accept="image/*" hidden onChange={e => { if (e.target.files[0]) onAddImage(item.id, e.target.files[0]); e.target.value = '' }} />
              <i className="fa-solid fa-camera"></i> Add Image
            </label>
          </div>
          {(item.images || []).length > 0 && (
            <div className="image-grid">
              {(item.images || []).map((image, index) => (
                <div key={index} className="image-thumb">
                  <img src={typeof image === 'string' ? image : image.url} alt="Research reference" />
                  <button className="remove-image" onClick={() => onRemoveImage(item.id, index)} aria-label="Remove image"><i className="fa-solid fa-xmark"></i></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === 'Recordings' && (
        <div className="recording-section">
          <p className="section-label">What to record:</p>
          <div className="recording-options">
            {['Intro', 'Main Content', 'Closing', 'B-Roll'].map(section => (
              <label key={section} className={'recording-option' + ((item.recordings || []).includes(section) ? ' active' : '')}>
                <input type="checkbox" checked={(item.recordings || []).includes(section)} onChange={() => onRecordingToggle(item.id, section)} />
                {section}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="card-footer">
        {stageIndex > 0 && <button className="btn-move btn-back" onClick={() => onMove(item.id, stages[stageIndex - 1])}><i className="fa-solid fa-arrow-left"></i> Back</button>}
        {stageIndex < stages.length - 1 && <button className="btn-move btn-next" onClick={() => onMove(item.id, stages[stageIndex + 1])}>Next <i className="fa-solid fa-arrow-right"></i></button>}
        {stage === 'Published' && <span className="done-badge"><i className="fa-solid fa-check"></i> Done</span>}
      </div>
      {(item.dueDate || item.publishDate) && <button className="calendar-sync" onClick={() => onSyncCalendar(item.id)}><i className="fa-regular fa-calendar-plus"></i> {item.calendarEventId ? 'Update Calendar' : 'Sync to Calendar'}</button>}
    </article>
  )
}
