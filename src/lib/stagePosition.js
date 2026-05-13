/** Largest numeric position in a list of stages; safe for bad/null data. */
export function maxStagePosition(stages) {
  const values = (stages || []).map((s) => {
    const p = Number(s?.position)
    return Number.isFinite(p) ? p : 0
  })
  return values.length ? Math.max(0, ...values) : 0
}
