import { useState } from 'react'
import { platforms } from '../constants/platforms'

export default function EditIdeaModal({ item, onClose, onSave }) {
  const [title, setTitle] = useState(item.title || '')
  const [startDate, setStartDate] = useState(item.startDate || '')
  const [dueDate, setDueDate] = useState(item.dueDate || '')
  const [publishDate, setPublishDate] = useState(item.publishDate || '')
  const [stage, setStage] = useState(item.stage || 'Idea')
  const [priority, setPriority] = useState(item.priority || 'Medium')
  const [tags, setTags] = useState((item.tags || []).join(', '))
  const [assignee, setAssignee] = useState(item.assignee || '')
  const [platform, setPlatform] = useState(item.platform || '')
  const [platformDetails, setPlatformDetails] = useState(item.platformDetails || '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await onSave(item.id, {
      title: title.trim(),
      startDate: startDate || '',
      dueDate: dueDate || '',
      publishDate: publishDate || '',
      stage: stage.trim() || 'Idea',
      priority,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      assignee: assignee.trim(),
      platform: platform.trim(),
      platformDetails: platformDetails.trim(),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-head">
          <h3>Edit idea</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="edit-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Title</span>
            <div className="login-input-wrap">
              <input value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
          </label>
          <div className="add-form-dates-row">
            <label className="date-field">
              <span>Start date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label className="date-field">
              <span>Due date</span>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={startDate || undefined} />
            </label>
          </div>
          <div className="add-form-dates-row">
            <label className="date-field"><span>Workflow stage</span><input list="workflow-stages" value={stage} onChange={e => setStage(e.target.value)} /><datalist id="workflow-stages"><option value="Draft" /><option value="Idea" /><option value="Research" /><option value="Recordings" /><option value="Published" /></datalist></label>
            <label className="date-field"><span>Priority</span><select value={priority} onChange={e => setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
          </div>
          <div className="add-form-dates-row">
            <label className="date-field"><span>Publish / schedule date</span><input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} /></label>
            <label className="date-field"><span>Assignee</span><input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name" /></label>
          </div>
          <label className="login-field"><span>Tags (comma-separated)</span><div className="login-input-wrap"><input value={tags} onChange={e => setTags(e.target.value)} placeholder="youtube, tutorial" /></div></label>
          <div className="add-form-dates-row">
            <label className="date-field"><span>Platform</span><select value={platform} onChange={e => setPlatform(e.target.value)}><option value="">Choose a platform</option>{!platforms.includes(platform) && platform && <option value={platform}>{platform}</option>}{platforms.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="date-field"><span>Platform details</span><input value={platformDetails} onChange={e => setPlatformDetails(e.target.value)} placeholder="Format, URL, notes" /></label>
          </div>
          <button type="submit" className="login-submit">Save changes</button>
        </form>
      </div>
    </div>
  )
}
