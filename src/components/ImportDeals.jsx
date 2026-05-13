import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.some((v) => v)) rows.push(values)
  }
  return { headers, rows }
}

export default function ImportDeals({ onComplete }) {
  const [open, setOpen] = useState(false)
  const [pipelines, setPipelines] = useState([])
  const [stages, setStages] = useState([])
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [titleCol, setTitleCol] = useState('')
  const [valueCol, setValueCol] = useState('')
  const [stageId, setStageId] = useState('')
  const [pipelineId, setPipelineId] = useState('')
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      supabase.from('pipelines').select('id, name').then(({ data }) => setPipelines(data || []))
      supabase.from('stages').select('id, pipeline_id, name, position').order('position').then(({ data }) => setStages(data || []))
    }
  }, [open])

  useEffect(() => {
    if (pipelineId) {
      const s = stages.filter((st) => st.pipeline_id === pipelineId).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      setStageId(s[0]?.id || '')
    } else setStageId('')
  }, [pipelineId, stages])

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const { headers, rows } = parseCSV(ev.target.result)
        if (headers.length === 0 || rows.length === 0) {
          setError('CSV has no headers or data rows.')
          setParsed(null)
          return
        }
        setParsed({ headers, rows })
        setTitleCol(headers[0])
        setValueCol(headers.find((h) => /value|amount|price|deal/i.test(h)) || headers[1] || headers[0])
      } catch (err) {
        setError('Could not parse CSV.')
        setParsed(null)
      }
    }
    reader.readAsText(f)
  }

  async function doImport() {
    if (!parsed || !stageId || !pipelineId) return
    setImporting(true)
    setError(null)
    let count = 0
    const titleIdx = parsed.headers.indexOf(titleCol)
    const valueIdx = parsed.headers.indexOf(valueCol)
    if (titleIdx < 0) {
      setError('Deal title column not found.')
      setImporting(false)
      return
    }
    for (const row of parsed.rows) {
      const title = row[titleIdx] || 'Untitled Deal'
      const val = valueIdx >= 0 ? parseFloat(String(row[valueIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0
      const { error: insertErr } = await supabase.from('deals').insert({
        pipeline_id: pipelineId,
        stage_id: stageId,
        title,
        value: val,
      })
      if (!insertErr) count++
    }
    setImported(count)
    setImporting(false)
    if (count > 0) {
      onComplete?.()
    }
  }

  function close() {
    setOpen(false)
    setFile(null)
    setParsed(null)
    setImported(0)
    setError(null)
  }

  const pipelineStages = stages.filter((s) => s.pipeline_id === pipelineId).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
      >
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={close}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Import deals from CSV</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CSV file</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFile}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {file && <p className="text-sm text-slate-500 mt-1">{file.name}</p>}
                </div>

                {parsed && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Pipeline</label>
                      <select
                        value={pipelineId}
                        onChange={(e) => setPipelineId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="">Select pipeline</option>
                        {pipelines.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                      <select
                        value={stageId}
                        onChange={(e) => setStageId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="">Select stage</option>
                        {pipelineStages.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Deal title (from CSV column)</label>
                      <select
                        value={titleCol}
                        onChange={(e) => setTitleCol(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      >
                        {parsed.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Deal value (from CSV column)</label>
                      <select
                        value={valueCol}
                        onChange={(e) => setValueCol(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="">— Skip —</option>
                        {parsed.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-slate-500">{parsed.rows.length} row(s) will be imported.</p>
                  </>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
                {imported > 0 && <p className="text-sm text-green-600 font-medium">{imported} deal(s) imported successfully.</p>}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={doImport}
                  disabled={!parsed || !stageId || !pipelineId || importing}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing…' : 'Import'}
                </button>
                <button
                  onClick={close}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  {imported > 0 ? 'Done' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
