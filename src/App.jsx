import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long' })

const PRIORITY = {
  high:   { label: '!', color: '#e05c5c', bg: '#1e1010', border: '#4a1a1a' },
  medium: { label: '~', color: '#e09a3a', bg: '#1c1608', border: '#42300a' },
  low:    { label: '↓', color: '#4a8fa8', bg: '#0a1820', border: '#163040' },
  none:   { label: '·', color: '#444',    bg: '#161616', border: '#2a2a2a' },
}
const PRIORITY_ORDER = ['high', 'medium', 'low', 'none']

function getWeekKey(offset = 0) {
  const now = new Date()
  now.setDate(now.getDate() + offset * 7)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  return `week-${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`
}

export default function App({ user }) {
  const [tasks, setTasks] = useState({})
  const [activeDay, setActiveDay] = useState(TODAY || 'Monday')
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState('none')
  const [showCompleted, setShowCompleted] = useState(false)
  const [view, setView] = useState('day')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [carryModal, setCarryModal] = useState(null)
  const [carrySelected, setCarrySelected] = useState([])

  const WEEK_KEY = getWeekKey(0)
  const PREV_WEEK_KEY = getWeekKey(-1)

  // Load tasks from Supabase
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select('data')
        .eq('user_id', user.id)
        .eq('id', `${user.id}-${WEEK_KEY}`)
        .single()

      if (data?.data) setTasks(data.data)
      else setTasks({})
      setLoading(false)
    }
    load()
  }, [user.id, WEEK_KEY])

  const save = useCallback(async (updated) => {
    setSaving(true)
    await supabase.from('todos').upsert({
      id: `${user.id}-${WEEK_KEY}`,
      user_id: user.id,
      data: updated,
      updated_at: new Date().toISOString()
    })
    setSaving(false)
  }, [user.id, WEEK_KEY])

  function addTask() {
    if (!newTask.trim()) return
    const updated = { ...tasks }
    if (!updated[activeDay]) updated[activeDay] = []
    updated[activeDay] = [...updated[activeDay], {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      priority: newPriority
    }]
    setTasks(updated)
    save(updated)
    setNewTask('')
    setNewPriority('none')
  }

  function toggleTask(day, id) {
    const updated = { ...tasks }
    updated[day] = updated[day].map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    save(updated)
  }

  function deleteTask(day, id) {
    const updated = { ...tasks }
    updated[day] = updated[day].filter(t => t.id !== id)
    setTasks(updated)
    save(updated)
  }

  function cyclePriority(day, id) {
    const updated = { ...tasks }
    updated[day] = updated[day].map(t => {
      if (t.id !== id) return t
      const next = PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(t.priority || 'none') + 1) % PRIORITY_ORDER.length]
      return { ...t, priority: next }
    })
    setTasks(updated)
    save(updated)
  }

  async function openCarryModal() {
    const { data } = await supabase
      .from('todos')
      .select('data')
      .eq('user_id', user.id)
      .eq('id', `${user.id}-${PREV_WEEK_KEY}`)
      .single()

    if (!data?.data) { alert('No previous week data found.'); return }

    const incomplete = {}
    DAYS.forEach(d => {
      const items = (data.data[d] || []).filter(t => !t.done)
      if (items.length > 0) incomplete[d] = items
    })
    if (Object.keys(incomplete).length === 0) { alert('No incomplete tasks from last week.'); return }
    setCarryModal(incomplete)
    setCarrySelected([])
  }

  function confirmCarry() {
    if (!carrySelected.length) { setCarryModal(null); return }
    const updated = { ...tasks }
    Object.values(carryModal).forEach(items => {
      items.forEach(t => {
        if (carrySelected.includes(t.id)) {
          if (!updated[activeDay]) updated[activeDay] = []
          updated[activeDay].push({ ...t, id: Date.now() + Math.random() + '', done: false, carried: true })
        }
      })
    })
    setTasks(updated)
    save(updated)
    setCarryModal(null)
    setCarrySelected([])
  }

  const sortByPriority = items => [...items].sort((a, b) =>
    PRIORITY_ORDER.indexOf(a.priority || 'none') - PRIORITY_ORDER.indexOf(b.priority || 'none')
  )

  const dayTasks = tasks[activeDay] || []
  const pending = sortByPriority(dayTasks.filter(t => !t.done))
  const done = dayTasks.filter(t => t.done)
  const visible = showCompleted ? [...pending, ...done] : pending
  const totalPending = DAYS.reduce((acc, d) => acc + (tasks[d] || []).filter(t => !t.done).length, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", color: '#555', fontSize: 14 }}>
      loading...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0ede8', fontFamily: "'DM Mono', 'Courier New', monospace", maxWidth: 520, margin: '0 auto', padding: '0 0 80px 0' }}>

      {/* Header */}
      <div style={{ padding: '28px 20px 16px', borderBottom: '1px solid #1e1e1e', position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>this week</div>
            <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em' }}>
              {totalPending === 0 ? 'all clear ✓' : `${totalPending} to do`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={openCarryModal} style={{ background: '#1a1a1a', color: '#888', border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'inherit' }}>
              ↩ carry
            </button>
            <button onClick={() => setView(view === 'day' ? 'week' : 'day')} style={{ background: view === 'week' ? '#f0ede8' : '#1a1a1a', color: view === 'week' ? '#0f0f0f' : '#888', border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'inherit' }}>
              {view === 'week' ? 'day' : 'week'}
            </button>
            <button onClick={() => supabase.auth.signOut()} title="sign out" style={{ background: '#161616', color: '#444', border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⏻
            </button>
          </div>
        </div>

        {/* Day pills */}
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
          {DAYS.map((day, i) => {
            const di = tasks[day] || []
            const count = di.filter(t => !t.done).length
            const hasHigh = di.some(t => !t.done && t.priority === 'high')
            const isToday = day === TODAY, isActive = day === activeDay
            return (
              <button key={day} onClick={() => { setActiveDay(day); setView('day') }} style={{ flexShrink: 0, background: isActive ? '#f0ede8' : isToday ? '#1e1e1e' : '#161616', color: isActive ? '#0f0f0f' : isToday ? '#f0ede8' : '#555', border: isToday && !isActive ? '1px solid #333' : '1px solid transparent', borderRadius: 8, padding: '7px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span>{SHORT[i]}</span>
                {count > 0 && <span style={{ background: hasHigh ? (isActive ? '#e05c5c' : '#4a1a1a') : (isActive ? '#0f0f0f' : '#f0ede8'), color: hasHigh ? '#fff' : (isActive ? '#f0ede8' : '#0f0f0f'), borderRadius: 999, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 'bold' }}>{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day view */}
      {view === 'day' && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16 }}>
              {activeDay}
              {activeDay === TODAY && <span style={{ fontSize: 10, color: '#555', marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>today</span>}
            </div>
            {done.length > 0 && (
              <button onClick={() => setShowCompleted(!showCompleted)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {showCompleted ? 'hide done' : `+${done.length} done`}
              </button>
            )}
          </div>

          {visible.length === 0 && <div style={{ color: '#333', fontSize: 13, paddingTop: 8 }}>no tasks yet</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {visible.map(task => {
              const p = PRIORITY[task.priority || 'none']
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: task.done ? '#111' : p.bg, borderRadius: 10, borderLeft: `2px solid ${task.done ? '#1e1e1e' : p.border}`, transition: 'all 0.15s' }}>
                  <button onClick={() => !task.done && cyclePriority(activeDay, task.id)} style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${task.done ? '#222' : p.border}`, background: 'transparent', cursor: task.done ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: task.done ? '#2a2a2a' : p.color, fontWeight: 'bold', fontFamily: 'inherit' }}>
                    {PRIORITY[task.priority || 'none'].label}
                  </button>
                  <button onClick={() => toggleTask(activeDay, task.id)} style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: task.done ? '2px solid #2a7a2a' : '2px solid #333', background: task.done ? '#1a3d1a' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {task.done && <span style={{ color: '#4caf50', fontSize: 10 }}>✓</span>}
                  </button>
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4, color: task.done ? '#3a3a3a' : '#d4d0ca', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.carried && !task.done && <span style={{ fontSize: 9, color: '#555', marginRight: 5 }}>↩</span>}
                    {task.text}
                  </span>
                  <button onClick={() => deleteTask(activeDay, task.id)} style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1, fontFamily: 'inherit' }}>×</button>
                </div>
              )
            })}
          </div>

          {/* Priority + add */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              {PRIORITY_ORDER.map(p => (
                <button key={p} onClick={() => setNewPriority(p)} style={{ flex: 1, padding: '7px 4px', background: newPriority === p ? PRIORITY[p].bg : '#131313', border: `1px solid ${newPriority === p ? PRIORITY[p].border : '#1e1e1e'}`, borderRadius: 7, color: newPriority === p ? PRIORITY[p].color : '#3a3a3a', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.1s' }}>
                  {p === 'none' ? '—' : p}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder={`add to ${SHORT[DAYS.indexOf(activeDay)]}...`} style={{ flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', color: '#f0ede8', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={addTask} style={{ background: newTask.trim() ? '#f0ede8' : '#1a1a1a', color: newTask.trim() ? '#0f0f0f' : '#333', border: 'none', borderRadius: 10, padding: '12px 16px', fontSize: 18, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>+</button>
            </div>
          </div>
        </div>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>all days</div>
          {DAYS.map(day => {
            const di = tasks[day] || []
            const p = sortByPriority(di.filter(t => !t.done))
            const d = di.filter(t => t.done)
            if (di.length === 0) return null
            return (
              <div key={day} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: day === TODAY ? '#f0ede8' : '#666' }}>
                    {day}{day === TODAY && <span style={{ color: '#555', marginLeft: 6 }}>· today</span>}
                  </span>
                  <span style={{ fontSize: 11, color: '#444' }}>{d.length}/{di.length} done</span>
                </div>
                {p.map(task => {
                  const pr = PRIORITY[task.priority || 'none']
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: pr.bg, borderRadius: 8, marginBottom: 2, borderLeft: `2px solid ${pr.border}` }}>
                      <button onClick={() => toggleTask(day, task.id)} style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #333', background: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                      {task.priority !== 'none' && <span style={{ fontSize: 11, color: pr.color, fontWeight: 'bold' }}>{pr.label}</span>}
                      <span style={{ fontSize: 13, color: '#c8c4be' }}>{task.text}</span>
                    </div>
                  )
                })}
                {d.length > 0 && <div style={{ fontSize: 11, color: '#333', padding: '4px 12px' }}>+ {d.length} completed</div>}
              </div>
            )
          })}
          {totalPending === 0 && <div style={{ color: '#333', fontSize: 13 }}>nothing pending this week</div>}
        </div>
      )}

      {/* Carry modal */}
      {carryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#141414', width: '100%', maxWidth: 520, margin: '0 auto', borderRadius: '18px 18px 0 0', padding: '24px 20px 48px', maxHeight: '78vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 15 }}>carry forward</div>
              <button onClick={() => setCarryModal(null)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 20, letterSpacing: '0.06em' }}>
              incomplete from last week → adding to {activeDay}
            </div>
            {Object.entries(carryModal).map(([day, items]) => (
              <div key={day} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#555', marginBottom: 8 }}>{day}</div>
                {items.map(task => {
                  const selected = carrySelected.includes(task.id)
                  const pr = PRIORITY[task.priority || 'none']
                  return (
                    <div key={task.id} onClick={() => setCarrySelected(prev => prev.includes(task.id) ? prev.filter(x => x !== task.id) : [...prev, task.id])} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: selected ? pr.bg : '#1a1a1a', borderRadius: 8, marginBottom: 2, cursor: 'pointer', border: `1px solid ${selected ? pr.border : '#252525'}` }}>
                      <div style={{ width: 17, height: 17, borderRadius: 4, border: `2px solid ${selected ? '#f0ede8' : '#333'}`, background: selected ? '#f0ede8' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <span style={{ color: '#0f0f0f', fontSize: 10, fontWeight: 'bold' }}>✓</span>}
                      </div>
                      {task.priority && task.priority !== 'none' && <span style={{ fontSize: 10, color: pr.color }}>{pr.label}</span>}
                      <span style={{ fontSize: 13, color: selected ? '#f0ede8' : '#777' }}>{task.text}</span>
                    </div>
                  )
                })}
              </div>
            ))}
            <button onClick={confirmCarry} style={{ width: '100%', marginTop: 8, background: carrySelected.length ? '#f0ede8' : '#1e1e1e', color: carrySelected.length ? '#0f0f0f' : '#444', border: 'none', borderRadius: 10, padding: '14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s' }}>
              {carrySelected.length ? `add ${carrySelected.length} task${carrySelected.length > 1 ? 's' : ''} to ${activeDay}` : 'select tasks above'}
            </button>
          </div>
        </div>
      )}

      {saving && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#1a1a1a', color: '#555', fontSize: 10, padding: '6px 10px', borderRadius: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>saving...</div>
      )}
    </div>
  )
}
