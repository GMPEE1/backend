// test1/auth.unit.test.js
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// ---- ปิดเสียง DB (ครอบหลาย specifier ที่เจอบ่อย) ----
vi.mock('./db/knex',        () => ({ default: {} }))
vi.mock('./db/knex.js',     () => ({ default: {} }))
vi.mock('../db/knex',       () => ({ default: {} }))
vi.mock('../db/knex.js',    () => ({ default: {} }))
vi.mock('../../db/knex',    () => ({ default: {} }))
vi.mock('../../db/knex.js', () => ({ default: {} }))

// ---- mock users repository (ใช้ function declaration เพื่อ hoist) ----
function usersFactory() {
  const findByEmail = vi.fn()
  return { default: { findByEmail }, findByEmail }
}
// **ถ้าคอนโทรลเลอร์ import คนละ path ให้เพิ่ม vi.mock(pathนั้น, usersFactory)**
vi.mock('../repositories/users',    usersFactory)
vi.mock('../repositories/users.js', usersFactory)
vi.mock('../../repositories/users', usersFactory)
vi.mock('../../repositories/users.js', usersFactory)

// ---- mock bcrypt / jwt ----
vi.mock('bcrypt', () => {
  const compare = vi.fn()
  return { default: { compare }, compare }
})
vi.mock('jsonwebtoken', () => {
  const sign = vi.fn(() => 'dummy.jwt')
  return { default: { sign }, sign }
})

// ===== import controller หลัง mock =====
let authCtrl, usersRepoMod, bcryptMod
beforeAll(async () => {
  // นำเข้าตัวที่ตรงกับโปรเจกต์จริงของครู
  usersRepoMod = await import('../repositories/users.js')
  bcryptMod    = await import('bcrypt')

  // ถ้าคอนโทรลเลอร์ใช้ path อื่น ให้สลับลองด้านล่าง
  try {
    const mod = await import('../controllers/auth.controller.js')
    authCtrl = mod.default?.login ? mod.default : mod
  } catch {
    const mod = await import('../controllers/auth.controller') // เผื่อไม่มี .js
    authCtrl = mod.default?.login ? mod.default : mod
  }
})

function mockReq(body = {}) { return { body } }
function mockRes() {
  const res = {}
  res.status = vi.fn(() => res)
  res.json   = vi.fn(() => res)
  return res
}
const repoFind      = () => (usersRepoMod.default?.findByEmail ?? usersRepoMod.findByEmail)
const bcryptCompare = () => (bcryptMod.default?.compare ?? bcryptMod.compare)

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

function expect401Either(res, next) {
  // A) ตอบเองด้วย res.status(401)
  const viaStatus = res.status.mock.calls.some(([code]) => code === 401)
  // B) ส่งผ่าน next(err) โดยมี status = 401
  const viaNext = next.mock.calls[0] &&
    ((next.mock.calls[0][0]?.status ?? next.mock.calls[0][0]?.statusCode) === 401)
  expect(viaStatus || viaNext).toBe(true)
}

describe('auth.controller.login (unit)', () => {
  it('400 when email/password missing', async () => {
    const res  = mockRes()
    const next = vi.fn()

    await authCtrl.login(mockReq({}), res, next)

    // กรณี 400 ส่วนใหญ่คอนโทรลเลอร์ตอบเอง
    const viaStatus400 = res.status.mock.calls.some(([code]) => code === 400)
    const viaNext400   = next.mock.calls[0] &&
      ((next.mock.calls[0][0]?.status ?? next.mock.calls[0][0]?.statusCode) === 400)
    expect(viaStatus400 || viaNext400).toBe(true)
  })

  it('401 when email not found', async () => {
    repoFind().mockResolvedValueOnce(null)

    const res  = mockRes()
    const next = vi.fn()

    await authCtrl.login(
      mockReq({ email: 'x@ccollege.ac.th', username: 'x@ccollege.ac.th', password: 'password123' }),
      res,
      next
    )

    expect401Either(res, next)
  })

  it('401 when wrong password', async () => {
    repoFind().mockResolvedValueOnce({
      id: 4, email: 't.it01@ccollege.ac.th', name_th: 'ครูไอที 01',
      role: 'evaluatee', status: 'active', password_hash: 'hash'
    })
    bcryptCompare().mockResolvedValueOnce(false)

    const res  = mockRes()
    const next = vi.fn()

    await authCtrl.login(
      mockReq({ email: 't.it01@ccollege.ac.th', username: 't.it01@ccollege.ac.th', password: 'wrong' }),
      res,
      next
    )

    expect401Either(res, next)
  })

  it('200 returns token and user', async () => {
    repoFind().mockResolvedValueOnce({
      id: 4, email: 't.it01@ccollege.ac.th', name_th: 'ครูไอที 01',
      role: 'evaluatee', status: 'active', password_hash: 'hash'
    })
    bcryptCompare().mockResolvedValueOnce(true)

    const res  = mockRes()
    const next = vi.fn()

    await authCtrl.login(
      mockReq({ email: 't.it01@ccollege.ac.th', username: 't.it01@ccollege.ac.th', password: 'password123' }),
      res,
      next
    )

    // สำเร็จ → ไม่ควรไป next(err)
    expect(next).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalled()
    const payload = res.json.mock.calls[0][0]
    expect(payload.success).toBe(true)
    expect(payload).toHaveProperty('accessToken', 'dummy.jwt')
    expect(payload.user).toMatchObject({ id: 4, role: 'evaluatee' })
  })
})
