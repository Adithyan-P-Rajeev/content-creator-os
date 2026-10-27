import { useState } from 'react'
import { platforms } from '../constants/platforms'

const stages = ['Draft', 'Idea', 'Research', 'Recordings', 'Published']

export default function NewIdeaForm({ onCreate }) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [platform, setPlatform] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [stage, setStage] = useState('Idea')
  const [priority, setPriority] = useState('Medium')
  const [tags, setTags] = useState('')
  const [assignee, setAssignee] = useState('')
  const [platformDetails, setPlatformDetails] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return

    await onCreate({
      title: title.trim(),
      stage,
      research: '',
      recordings: [],
      images: [],
      startDate,
      dueDate,
      publishDate,
      priority,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      assignee: assignee.trim(),
      platform,
      platformDetails: platformDetails.trim(),
    })
  }

  return (
    <form className="add-form add-form-dates" onSubmit={handleSubmit}>
      <div className="add-form-row"><i className="fa-solid fa-lightbulb form-icon"></i><input value={title} onChange={event => setTitle(event.target.value)} placeholder="What's your content idea?" autoFocus /><button type="submit">Add Idea</button></div>
      <div className="add-form-dates-row">
        <label className="date-field"><span>Start date</span><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
        <label className="date-field"><span>Due date</span><input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} min={startDate || undefined} /></label>
        <label className="date-field"><span>Platform</span><select value={platform} onChange={event => setPlatform(event.target.value)}><option value="">Choose a platform</option>{platforms.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
      </div>
      <div className="add-form-dates-row">
        <label className="date-field"><span>Workflow stage</span><select value={stage} onChange={event => setStage(event.target.value)}>{stages.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
        <label className="date-field"><span>Priority</span><select value={priority} onChange={event => setPriority(event.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
        <label className="date-field"><span>Publish / schedule date</span><input type="date" value={publishDate} onChange={event => setPublishDate(event.target.value)} /></label>
      </div>
      <div className="add-form-dates-row">
        <label className="date-field"><span>Assignee</span><input value={assignee} onChange={event => setAssignee(event.target.value)} placeholder="Name" /></label>
        <label className="date-field"><span>Platform details</span><input value={platformDetails} onChange={event => setPlatformDetails(event.target.value)} placeholder="Format, URL, notes" /></label>
      </div>
      <label className="date-field"><span>Tags (comma-separated)</span><input value={tags} onChange={event => setTags(event.target.value)} placeholder="youtube, tutorial" /></label>
    </form>
  )
}
