import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { maxStagePosition } from '../lib/stagePosition'

export default function PipelineManager({ open, onClose, onComplete, selectedPipelineId }) {
  const [pipelines, setPipelines] = useState([])
  const [stages, setStages] = useState([])
  const [editingPipeline, setEditingPipeline] = useState(null)
  const [editingStage, setEditingStage] = useState(null)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pipelines') // 'pipelines' | 'stages'
  const [currentPipelineId, setCurrentPipelineId] = useState(selectedPipelineId || null)

  async function fetchData() {
    const [pRes, sRes] = await Promise.all([
      supabase.from('pipelines').select('id, name').order('name'),
      supabase.from('stages').select('id, pipeline_id, name, position').order('position'),
    ])
    if (pRes.data) setPipelines(pRes.data)
    if (sRes.data) setStages(sRes.data)
    const list = pRes.data || []
    setCurrentPipelineId((prev) => {
      if (list.length === 0) return null
      if (selectedPipelineId != null && list.some((p) => p.id === selectedPipelineId)) {
        return selectedPipelineId
      }
      if (prev != null && list.some((p) => p.id === prev)) return prev
      return list[0].id
    })
  }

  useEffect(() => {
    if (open) {
      setError(null)
      setNewPipelineName('')
      setNewStageName('')
      setEditingPipeline(null)
      setEditingStage(null)
      fetchData()
    }
  }, [open, selectedPipelineId])

  const currentPipeline = pipelines.find((p) => p.id === currentPipelineId)
  const currentStages = stages
    .filter((s) => s.pipeline_id === currentPipelineId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  async function createPipeline() {
    const name = newPipelineName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    const { data, error: err } = await supabase.from('pipelines').insert({ name }).select('id, name').single()
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setPipelines((prev) => [...prev, data])
    setNewPipelineName('')
    setCurrentPipelineId(data.id)
    setActiveTab('stages')
    onComplete?.()
  }

  async function updatePipeline() {
    const name = (editingPipeline?.name || '').trim()
    if (!name || !editingPipeline) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('pipelines').update({ name }).eq('id', editingPipeline.id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setPipelines((prev) => prev.map((p) => (p.id === editingPipeline.id ? { ...p, name } : p)))
    setEditingPipeline(null)
    onComplete?.()
  }

  async function deletePipeline(id) {
    if (!confirm('Delete this pipeline and all its stages and deals?')) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('pipelines').delete().eq('id', id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setPipelines((prev) => {
      const next = prev.filter((p) => p.id !== id)
      setCurrentPipelineId((curr) => (curr === id ? next[0]?.id ?? null : curr))
      return next
    })
    setEditingPipeline(null)
    onComplete?.()
  }

  async function createStage() {
    const name = newStageName.trim()
    if (!name || !currentPipelineId) return
    setSaving(true)
    setError(null)
    const maxPos = maxStagePosition(currentStages)
    const { data, error: err } = await supabase
      .from('stages')
      .insert({ pipeline_id: currentPipelineId, name, position: maxPos + 1 })
      .select('id, pipeline_id, name, position')
      .single()
    setSaving(false)
    if (err) {
      let msg = err.message
      if (/row-level security|rls/i.test(msg || '')) {
        msg +=
          ' Open Supabase → SQL Editor and run supabase-rls-policies.sql (or the policy section of supabase-setup.sql).'
      }
      setError(msg)
      return
    }
    setStages((prev) => [...prev, data])
    setNewStageName('')
    onComplete?.()
  }

  async function updateStage() {
    const name = (editingStage?.name || '').trim()
    if (!name || !editingStage) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('stages').update({ name }).eq('id', editingStage.id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setStages((prev) => prev.map((s) => (s.id === editingStage.id ? { ...s, name } : s)))
    setEditingStage(null)
    onComplete?.()
  }

  async function deleteStage(id) {
    if (!confirm('Delete this stage? Deals in it will be unassigned.')) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('stages').delete().eq('id', id)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setStages((prev) => prev.filter((s) => s.id !== id))
    setEditingStage(null)
    onComplete?.()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Manage Pipelines & Stages</h2>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('pipelines')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'pipelines' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Pipelines
          </button>
          <button
            onClick={() => setActiveTab('stages')}
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'stages' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Stages
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {activeTab === 'pipelines' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New pipeline name"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createPipeline()}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
                <button
                  onClick={createPipeline}
                  disabled={!newPipelineName.trim() || saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Pipeline
                </button>
              </div>
              <div className="space-y-2">
                {pipelines.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      currentPipelineId === p.id ? 'border-slate-300 bg-slate-50' : 'border-slate-200'
                    }`}
                  >
                    {editingPipeline?.id === p.id ? (
                      <>
                        <input
                          type="text"
                          value={editingPipeline.name}
                          onChange={(e) => setEditingPipeline({ ...editingPipeline, name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && updatePipeline()}
                          className="flex-1 px-2 py-1 border border-slate-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={updatePipeline}
                          disabled={saving}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingPipeline(null)} className="text-sm text-slate-500 hover:underline">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setCurrentPipelineId(p.id)}
                          className="flex-1 text-left font-medium text-slate-800 hover:text-slate-600"
                        >
                          {p.name}
                        </button>
                        <button
                          onClick={() => setEditingPipeline(p)}
                          className="text-sm text-slate-500 hover:text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePipeline(p.id)}
                          disabled={saving}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-4">
              {!currentPipelineId ? (
                <p className="text-slate-500">Create a pipeline first, then add stages to it.</p>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    Stages for <strong>{currentPipeline?.name}</strong>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New stage name"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createStage()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                    <button
                      onClick={createStage}
                      disabled={!newStageName.trim() || saving}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Stage
                    </button>
                  </div>
                  <div className="space-y-2">
                    {currentStages.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white"
                      >
                        {editingStage?.id === s.id ? (
                          <>
                            <input
                              type="text"
                              value={editingStage.name}
                              onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateStage()}
                              className="flex-1 px-2 py-1 border border-slate-300 rounded"
                              autoFocus
                            />
                            <button
                              onClick={updateStage}
                              disabled={saving}
                              className="text-sm text-green-600 hover:underline"
                            >
                              Save
                            </button>
                            <button onClick={() => setEditingStage(null)} className="text-sm text-slate-500 hover:underline">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 font-medium text-slate-800">{s.name}</span>
                            <button
                              onClick={() => setEditingStage(s)}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStage(s.id)}
                              disabled={saving}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
