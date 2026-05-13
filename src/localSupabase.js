/**
 * In-browser CRM data (localStorage). Same chain shape as @supabase/supabase-js
 * for the operations this app uses — no cloud setup required.
 */
const STORAGE_KEY = 'kanban-crm-local-db'

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        pipelines: parsed.pipelines || [],
        stages: parsed.stages || [],
        deals: parsed.deals || [],
        notes: parsed.notes || [],
      }
    }
  } catch {
    /* ignore */
  }
  return seedDb()
}

function seedDb() {
  const pid = uuid()
  const s1 = uuid()
  const s2 = uuid()
  const s3 = uuid()
  const now = new Date().toISOString()
  const db = {
    pipelines: [{ id: pid, name: 'Sales', created_at: now }],
    stages: [
      { id: s1, pipeline_id: pid, name: 'New', position: 1, created_at: now },
      { id: s2, pipeline_id: pid, name: 'In progress', position: 2, created_at: now },
      { id: s3, pipeline_id: pid, name: 'Won', position: 3, created_at: now },
    ],
    deals: [
      {
        id: uuid(),
        pipeline_id: pid,
        stage_id: s1,
        title: 'Example deal',
        value: 12000,
        created_at: now,
      },
    ],
    notes: [],
  }
  saveDb(db)
  return db
}

function saveDb(db) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      pipelines: db.pipelines,
      stages: db.stages,
      deals: db.deals,
      notes: db.notes,
    })
  )
}

function projectRow(row, fieldsStr) {
  if (!fieldsStr || fieldsStr === '*') return { ...row }
  const keys = fieldsStr.split(',').map((s) => s.trim()).filter(Boolean)
  const out = {}
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(row, k)) out[k] = row[k]
  }
  return out
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every(({ col, val }) => row[col] == val)
  )
}

function sortRows(rows, col, ascending) {
  if (!col) return [...rows]
  const dir = ascending ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = a[col]
    const vb = b[col]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
}

function err(message) {
  return { message, code: 'LOCAL_DB' }
}

function runSelect(table, steps) {
  const db = loadDb()
  const rows = db[table] || []
  const filters = steps.filter((s) => s[0] === 'eq').map((s) => ({ col: s[1], val: s[2] }))
  const orderSteps = steps.filter((s) => s[0] === 'order')
  const lastOrder = orderSteps[orderSteps.length - 1]
  const selectStep = steps.find((s) => s[0] === 'select')
  const fields = selectStep ? selectStep[1] : '*'
  const wantSingle = steps.some((s) => s[0] === 'single')

  let list = applyFilters(rows, filters)
  if (lastOrder) list = sortRows(list, lastOrder[1], lastOrder[2])
  list = list.map((r) => projectRow(r, fields))

  if (wantSingle) {
    return { data: list[0] ?? null, error: list.length ? null : err('No rows') }
  }
  return { data: list, error: null }
}

function runInsert(table, steps) {
  const db = loadDb()
  const insertStep = steps.find((s) => s[0] === 'insert')
  const payloads = insertStep[1]
  const rows = Array.isArray(payloads) ? payloads : [payloads]
  const now = new Date().toISOString()
  const inserted = []

  for (const payload of rows) {
    const row = { ...payload }
    if (!row.id) row.id = uuid()
    if (!row.created_at) row.created_at = now
    if (table === 'stages' && row.position == null) row.position = 0
    if (table === 'deals' && row.value == null) row.value = 0
    db[table].push(row)
    inserted.push(row)
  }

  saveDb(db)

  const insertIdx = steps.findIndex((s) => s[0] === 'insert')
  const selectAfterInsert =
    insertIdx >= 0 ? steps.slice(insertIdx + 1).find((s) => s[0] === 'select') : null
  const wantSingle = steps.some((s) => s[0] === 'single')

  if (wantSingle && inserted.length === 1) {
    const fields = selectAfterInsert ? selectAfterInsert[1] : '*'
    return { data: projectRow(inserted[0], fields), error: null }
  }
  if (selectAfterInsert && inserted.length === 1) {
    return { data: projectRow(inserted[0], selectAfterInsert[1]), error: null }
  }
  if (inserted.length === 1) return { data: inserted[0], error: null }
  return { data: inserted, error: null }
}

function runUpdate(table, steps) {
  const db = loadDb()
  const updateStep = steps.find((s) => s[0] === 'update')
  const patch = updateStep[1]
  const filters = steps.filter((s) => s[0] === 'eq').map((s) => ({ col: s[1], val: s[2] }))
  const list = db[table] || []
  let n = 0
  for (const row of list) {
    if (filters.every(({ col, val }) => row[col] == val)) {
      Object.assign(row, patch)
      n++
    }
  }
  saveDb(db)
  return { data: null, error: null }
}

function runDelete(table, steps) {
  const db = loadDb()
  const filters = steps.filter((s) => s[0] === 'eq').map((s) => ({ col: s[1], val: s[2] }))
  if (filters.length === 0) {
    return { data: null, error: err('Delete requires a filter') }
  }
  const list = db[table] || []
  const idsToRemove = new Set(
    list.filter((row) => filters.every(({ col, val }) => row[col] == val)).map((r) => r.id)
  )
  if (idsToRemove.size === 0) {
    return { data: null, error: null }
  }

  if (table === 'pipelines') {
    const pids = idsToRemove
    const removedDealIds = new Set(
      db.deals.filter((d) => pids.has(d.pipeline_id)).map((d) => d.id)
    )
    db.notes = db.notes.filter((n) => !removedDealIds.has(n.deal_id))
    db.deals = db.deals.filter((d) => !pids.has(d.pipeline_id))
    db.stages = db.stages.filter((s) => !pids.has(s.pipeline_id))
    db.pipelines = db.pipelines.filter((p) => !pids.has(p.id))
  } else if (table === 'stages') {
    const sids = idsToRemove
    for (const d of db.deals) {
      if (sids.has(d.stage_id)) d.stage_id = null
    }
    db.stages = db.stages.filter((s) => !sids.has(s.id))
  } else if (table === 'deals') {
    const dids = idsToRemove
    db.notes = db.notes.filter((n) => !dids.has(n.deal_id))
    db.deals = db.deals.filter((d) => !dids.has(d.id))
  } else {
    db[table] = list.filter((row) => !idsToRemove.has(row.id))
  }

  saveDb(db)
  return { data: null, error: null }
}

function runSteps(table, steps) {
  if (steps.some((s) => s[0] === 'insert')) return runInsert(table, steps)
  if (steps.some((s) => s[0] === 'update')) return runUpdate(table, steps)
  if (steps.some((s) => s[0] === 'delete')) return runDelete(table, steps)
  return runSelect(table, steps)
}

function createThenable(table, steps) {
  const chain = {
    select(fields) {
      steps.push(['select', fields])
      return chain
    },
    insert(data) {
      steps.push(['insert', data])
      return chain
    },
    update(patch) {
      steps.push(['update', patch])
      return chain
    },
    delete() {
      steps.push(['delete'])
      return chain
    },
    eq(col, val) {
      steps.push(['eq', col, val])
      return chain
    },
    order(col, opts) {
      steps.push(['order', col, opts?.ascending !== false])
      return chain
    },
    single() {
      steps.push(['single'])
      return chain
    },
    then(onFulfilled) {
      try {
        const { data, error } = runSteps(table, steps)
        return Promise.resolve(onFulfilled({ data, error }))
      } catch (e) {
        return Promise.resolve(onFulfilled({ data: null, error: err(e.message || 'Unknown error') }))
      }
    },
    catch(onRejected) {
      return Promise.resolve(runSteps(table, steps)).catch(onRejected)
    },
  }
  return chain
}

function createLocalSupabase() {
  return {
    from(table) {
      return createThenable(table, [])
    },
  }
}

export function createLocalSupabaseMarked() {
  const inner = createLocalSupabase()
  return {
    __isLocalKanban: true,
    from: (t) => inner.from(t),
  }
}
