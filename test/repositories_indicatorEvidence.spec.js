// tests/repositories_indicatorEvidence.spec.js
import { describe, it, expect, vi } from 'vitest'

// in-memory map for pair existence
const pairs = new Set(['2|3']) // ตัวอย่าง: indicator_id=2 รับ evidence_type_id=3

vi.mock('../db/knex', () => ({
  default: (table) => ({
    where: (cond) => ({
      first: async () => {
        if (table !== 'indicator_evidence') return null
        const k = `${Number(cond.indicator_id)}|${Number(cond.evidence_type_id)}`
        return pairs.has(k) ? { indicator_id: Number(cond.indicator_id), evidence_type_id: Number(cond.evidence_type_id) } : null
      }
    })
  })
}))

import repo from '../repositories/indicatorEvidence'

describe('indicatorEvidence.mapExists', () => {
  it('true when mapping exists', async () => {
    const ok = await repo.mapExists(2,3)
    expect(ok).toBe(true)
  })
  it('false when mapping absent', async () => {
    const ok = await repo.mapExists(2,999)
    expect(ok).toBe(false)
  })
})
