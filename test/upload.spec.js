// tests/upload.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import path from 'path'
beforeEach(() => { process.env.JWT_SECRET = 'test-secret' })

// 1) mock upload.single('file') → ใส่ req.file ปลอม
vi.mock('../middlewares/upload', () => ({
  default: {
    single: () => (req, _res, next) => {
      req.file = {
        originalname: 'tiny.png',
        mimetype: 'image/png',
        size: 8,
        path: path.join(__dirname, '../uploads/1/11/tiny.png')
      }
      next()
    }
  }
}))

// 2) mock business repos
vi.mock('../repositories/assignments', () => ({ hasEvaluateeInPeriod: vi.fn(async () => true) }))
vi.mock('../repositories/indicatorEvidence', () => ({ mapExists: vi.fn(async () => true) }))
vi.mock('../repositories/attachments', () => ({
  findById: vi.fn(async (id) => ({
    id,
    period_id: 1,
    evaluatee_id: 11,
    indicator_id: 2,
    evidence_type_id: 3,
    file_name: 'tiny.png',
    mime_type: 'image/png',
    size_bytes: 8,
    storage_path: '1/11/tiny.png'
  }))
}))

// 3) mock knex: periods & attachments (ไม่มีคอลัมน์ note)
vi.mock('../db/knex', () => {
  let auto = 100
  const periods = [{ id:1, is_active:1 }]
  const attachments = []
  const table = (t) => {
    if (t === 'evaluation_periods') return {
      where: (c) => ({ first: async () => periods.find(p => (!c.id || p.id===Number(c.id)) && (c.is_active==null || p.is_active===c.is_active)) || null })
    }
    if (t === 'attachments') return {
      insert: async (payload) => { const id = ++auto; attachments.push({ id, ...payload }); return [id] },
      where: (c) => ({ first: async () => attachments.find(a => a.id === c.id) || null, del: async () => {} })
    }
    return { where: () => ({ first: async () => null }) }
  }
  return { default: table, __esModule: true }
})

import app from '../app'
const bearer = (payload) => `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`

describe('POST /api/upload/evidence', () => {
  it('401 without token', async () => {
    const r = await request(app).post('/api/upload/evidence')
    expect(r.status).toBe(401)
  })
  it('400 when missing required fields', async () => {
    const r = await request(app).post('/api/upload/evidence')
      .set('Authorization', bearer({ id:11, role:'evaluatee' }))
      .field('period_id','1') // ขาด indicator_id/evidence_type_id
    expect(r.status).toBe(400)
  })
  it('201 when upload ok', async () => {
    const r = await request(app).post('/api/upload/evidence')
      .set('Authorization', bearer({ id:11, role:'evaluatee' }))
      .field('period_id','1')
      .field('indicator_id','2')
      .field('evidence_type_id','3') // mapping ถูกต้องตามสคีมา
    expect(r.status).toBe(201)
    expect(r.body.success).toBe(true)
    expect(r.body.data).toMatchObject({
      period_id: 1, evaluatee_id: 11, indicator_id: 2, evidence_type_id: 3,
      file_name: 'tiny.png', mime_type: 'image/png', size_bytes: 8
    })
    expect(r.body.data).toHaveProperty('url') // controller คืน url ที่คำนวณจาก storage_path
  })
})
