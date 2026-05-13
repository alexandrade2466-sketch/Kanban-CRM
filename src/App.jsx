import { useState } from 'react'
import KanbanBoard from './components/KanbanBoard'
import ImportDeals from './components/ImportDeals'
import PipelineManager from './components/PipelineManager'
import { isLocalMode } from './supabaseClient'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [manageOpen, setManageOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Kanban CRM</h1>
            <p className="text-slate-600 text-sm mt-0.5">Pipelines, stages & deals</p>
            {isLocalMode && (
              <p className="text-amber-800 text-xs mt-1.5 max-w-xl">
                Demo mode: data stays in this browser only (localStorage). Add{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in{' '}
                <code className="bg-amber-100 px-1 rounded">.env</code> to use Supabase instead.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setManageOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
            >
              Manage Pipelines
            </button>
            <ImportDeals onComplete={() => setRefreshKey((k) => k + 1)} />
          </div>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <KanbanBoard key={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} onManagePipelines={() => setManageOpen(true)} />
      </main>
      <PipelineManager
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onComplete={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}

export default App
