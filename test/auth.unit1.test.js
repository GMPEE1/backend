// tests/auth.controller.unit.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1) mock dependencies ที่ controller ใช้
vi.mock('../repositories/users.js', () => {
  const findByEmail = vi.fn()
  return {
    default: { findByEmail },  // กรณี controller import แบบ default
    findByEmail                 // กรณี import แบบ named
  }
})

vi.mock('bcrypt', () => {
  const compare = vi.fn()
  return {
    default: { compare },
    compare
  }
})

vi.mock('jsonwebtoken', () => {
  const sign = vi.fn(() => 'dummy.jwt')
  return {
    default: { sign },
    sign
  }
})

let usersRepoMod, bcryptMod, jwtMod, authCtrl

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'

  // นำเข้าโมดูลหลัง mock เสมอ
  usersRepoMod = await import('../repositories/users.js')
  bcryptMod = await import('bcrypt')
  jwtMod = await import('jsonwebtoken')
  authCtrl = (await import('../controllers/auth.controller.js')).default
})

// helpers
const getFindByEmail = () =>
  (usersRepoMod.default?.findByEmail ?? usersRepoMod.findByEmail)

const getBcryptCompare = () =>
  (bcryptMod.default?.compare ?? bcryptMod.compare)

function mockReq(body = {}) { return { body } }
function mockRes() {
  const res = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('auth.controller.login (unit)', () => {
  it('200 returns token and user', async () => {
    // 1) บอก repo ให้หาเจอ user จำลอง
    const repoFind = getFindByEmail()
    repoFind.mockResolvedValueOnce({
      id: 4,
      email: 't.it01@ccollege.ac.th',
      name_th: 'ครูไอที 01',
      role: 'evaluatee',
      status: 'active',
      password_hash: 'hash'   // แค่ค่า placeholder
    })

    // 2) บอก bcrypt ว่ารหัสผ่านถูก
    const compare = getBcryptCompare()
    compare.mockResolvedValueOnce(true)

    const req = mockReq({ email: 't.it01@ccollege.ac.th', password: 'password123' })
    const res = mockRes()

    await authCtrl.login(req, res, vi.fn())

    // ✅ ยืนยันเส้นทางตรรกะถูกเรียกตามคาด
    expect(repoFind).toHaveBeenCalledWith('t.it01@ccollege.ac.th')
    expect(compare).toHaveBeenCalledWith('password123', 'hash')

    // ✅ ยืนยันผลลัพธ์
    expect(res.status).not.toHaveBeenCalled() // 200 โดยปริยาย
    expect(res.json).toHaveBeenCalled()

    const payload = res.json.mock.calls[0][0]
    expect(payload.success).toBe(true)
    expect(payload).toHaveProperty('accessToken', 'dummy.jwt')
    expect(payload.user).toMatchObject({ id: 4, role: 'evaluatee' })
  })
})
