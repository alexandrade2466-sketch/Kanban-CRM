import { useState, useEffect } from 'react'
import { DndContext } from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import StageColumn from './StageColumn'
import AddStageInline from './AddStageInline'
import DealNotes from './DealNotes'

export default function KanbanBoard({ pipelineId, onRefresh, onManagePipelines }) {
  const [pipelines, setPipelines] = useState([])
  const [stages, setStages] = useState([])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelineId || null)
  const [notesDeal, setNotesDeal] = useState(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [pipelinesRes, stagesRes, dealsRes] = await Promise.all([
        supabase.from('pipelines').select('id, name').order('id'),
        supabase.from('stages').select('id, pipeline_id, name, position').order('position'),
        supabase.from('deals').select('id, pipeline_id, stage_id, title, value'),
      ])

      if (pipelinesRes.error) throw pipelinesRes.error
      if (stagesRes.error) throw stagesRes.error
      if (dealsRes.error) throw dealsRes.error

      setPipelines(pipelinesRes.data || [])
      setStages(stagesRes.data || [])
      setDeals(dealsRes.data || [])

      if (!selectedPipelineId && pipelinesRes.data?.length) {
        setSelectedPipelineId(pipelinesRes.data[0].id)
      }
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (pipelineId) setSelectedPipelineId(pipelineId)
  }, [pipelineId])

  function resolveDropStageId(overId) {
    const s = String(overId)
    if (s.startsWith('stage-')) {
      const raw = s.slice('stage-'.length)
      const stage = stages.find((st) => String(st.id) === raw)
      return stage ? stage.id : null
    }
    if (s.startsWith('deal-')) {
      const raw = s.slice('deal-'.length)
      const targetDeal = deals.find((d) => String(d.id) === raw)
      return targetDeal?.stage_id ?? null
    }
    return null
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const activeStr = String(active.id)
    if (!activeStr.startsWith('deal-')) return
    const dealIdRaw = activeStr.slice('deal-'.length)
    const deal = deals.find((d) => String(d.id) === dealIdRaw)
    const newStageId = resolveDropStageId(over.id)
    if (newStageId == null || !deal) return
    if (deal.stage_id == newStageId) return

    // Optimistically update UI
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage_id: newStageId } : d))
    )

    const { error: updateError } = await supabase
      .from('deals')
      .update({ stage_id: newStageId })
      .eq('id', deal.id)

    if (updateError) {
      setError(updateError.message)
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading pipelines and deals…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        <strong>Error:</strong> {error}
      </div>
    )
  }

  const pipelineStages = stages
    .filter((s) => s.pipeline_id === selectedPipelineId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const getDealsForStage = (stageId) =>
    deals.filter(
      (d) =>
        d.stage_id === stageId &&
        (d.pipeline_id == null || d.pipeline_id === selectedPipelineId)
    )

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId)

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border-2 border-dashed border-slate-300 bg-white/50">
        <p className="text-slate-600 text-lg mb-2">No pipelines yet</p>
        <p className="text-slate-500 text-sm mb-4">Create your first pipeline to get started.</p>
        {onManagePipelines && (
          <button
            onClick={onManagePipelines}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            Create Pipeline
          </button>
        )}
      </div>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {pipelines.length > 1 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {pipelines.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPipelineId(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPipelineId === p.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {selectedPipeline && (
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {selectedPipeline.name}
          </h2>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={getDealsForStage(stage.id)}
              onOpenNotes={setNotesDeal}
            />
          ))}
          {selectedPipelineId && (
            <AddStageInline
              pipelineId={selectedPipelineId}
              onComplete={fetchData}
              existingStages={pipelineStages}
            />
          )}
        </div>
      </div>
      <DealNotes
        deal={notesDeal}
        open={!!notesDeal}
        onClose={() => setNotesDeal(null)}
      />
    </DndContext>
  )
}
