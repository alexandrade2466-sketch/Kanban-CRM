import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { maxStagePosition } from '../lib/stagePosition'

export default function AddStageInline({ pipelineId, onComplete, existingStages }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState(null)

  async function handleAdd() {
    const n = name.trim()
    if (!n || !pipelineId) return
    setSaving(true)
    setError(null)
    const maxPos = maxStagePosition(existingStages)
    const { error: insertErr } = await supabase
      .from('stages')
      .insert({ pipeline_id: pipelineId, name: n, position: maxPos + 1 })
    setSaving(false)
    if (insertErr) {
      let msg = insertErr.message || 'Could not add stage'
      if (/row-level security|rls/i.test(msg)) {
        msg +=
          ' Open Supabase → SQL Editor and run the policy section of supabase-setup.sql (or supabase-rls-policies.sql).'
      }
      setError(msg)
      return
    }
    setName('')
    setExpanded(false)
    onComplete?.()
  }

  return (
    <div className="flex-shrink-0 w-72">
      {expanded ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
          {error && (
            <p className="text-sm text-red-600 mb-2" role="alert">
              {error}
            </p>
          )}
          <input
            type="text"
            placeholder="Stage name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setExpanded(false)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || saving}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setExpanded(false)} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-200">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setError(null)
            setExpanded(true)
          }}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 p-6 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
        >
          + Add Stage
        </button>
      )}
    </div>
  )
}
