import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export default function DealCard({ deal, onOpenNotes }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: { deal },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const value = deal.value != null ? Number(deal.value) : 0
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white rounded-lg shadow-sm border border-slate-200 p-3 hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-slate-300' : ''
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing -m-1 p-1">
        <h4 className="font-medium text-slate-800 text-sm truncate">{deal.title || 'Untitled Deal'}</h4>
        <p className="text-slate-600 text-sm mt-1 font-medium">{formattedValue}</p>
      </div>
      {onOpenNotes && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenNotes(deal)
          }}
          className="absolute top-2 right-2 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          title="Add notes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  )
}
