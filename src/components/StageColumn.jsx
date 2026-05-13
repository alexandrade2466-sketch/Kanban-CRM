import { useDroppable } from '@dnd-kit/core'
import DealCard from './DealCard'

export default function StageColumn({ stage, deals, onOpenNotes }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  })

  const totalValue = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalValue)

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-xl border overflow-hidden flex flex-col transition-colors ${
        isOver ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="p-4 border-b border-slate-200 bg-white">
        <h3 className="font-semibold text-slate-800">{stage.name}</h3>
        <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
          <span>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
          <span className="font-medium text-slate-700">{formattedTotal}</span>
        </div>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-2 min-h-[120px]">
        {deals.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No deals</p>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} onOpenNotes={onOpenNotes} />)
        )}
      </div>
    </div>
  )
}
