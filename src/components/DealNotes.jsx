import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function DealNotes({ deal, open, onClose }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchNotes() {
    if (!deal?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('id, content, created_at')
      .eq('deal_id', deal.id)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (!error) setNotes(data || [])
  }

  useEffect(() => {
    if (open && deal) fetchNotes()
  }, [open, deal?.id])

  async function handleAddNote() {
    const content = newNote.trim()
    if (!content || !deal?.id) return
    setSaving(true)
    const { error } = await supabase.from('notes').insert({ deal_id: deal.id, content })
    setSaving(false)
    if (!error) {
      setNewNote('')
      fetchNotes()
    }
  }

  const value = deal?.value != null ? Number(deal.value) : 0
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{deal?.title || 'Untitled Deal'}</h2>
            <p className="text-slate-600 text-sm mt-0.5">{formattedValue}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 shrink-0">
          <label className="block text-sm font-medium text-slate-700 mb-2">Add note</label>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type your note here…"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || saving}
            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Note history</h3>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-slate-500 text-sm">No notes yet. Add one above.</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <p className="text-slate-800 text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-slate-500 text-xs mt-2">{formatDateTime(note.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
