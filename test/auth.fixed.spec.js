// auth.fixed.spec.js
import { describe, it, expect, beforeAll, vi } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import request from 'supertest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 👇 ปรับให้ตรงกับไฟล์ที่ export ตัว app (ไม่ใช่ไฟล์ที่ .listen)
const APP_PATH = path.resolve(__dirname, '../app.js')

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
})

// ✅ ใช้ function declaration (hoist ได้) เพื่อหลบ TDZ
function usersFactory () {
  return {
    default: {
      findByEmail: async (email) => {
        if (email === 't.it01@ccollege.ac.th') {
          return {
            id: 4,
            email,
            name_th: 'ครูไอที 01',
            role: 'evaluatee',
            status: 'active',
            password_hash: '$2b$10$dummy'
          }
        }
        return null
      }
    },
    // รองรับ require() แบบ CJS
    findByEmail: async (email) => {
      if (email === 't.it01@ccollege.ac.th') {
        return {
          id: 4,
          email,
          name_th: 'ครูไอที 01',
          role: 'evaluatee',
          status: 'active',
          password_hash: '$2b$10$dummy'
        }
      }
      return null
    }
  }
}

// ✅ ครอบทั้งรูปแบบ import มี/ไม่มี .js
vi.mock('../repositories/users', usersFactory)
vi.mock('../repositories/users.js', usersFactory)

// ✅ mock bcrypt ให้ผ่านเฉพาะ password = 'password123'
vi.mock('bcrypt', () => ({
  default: { compare: async (plain) => plain === 'password123' },
  compare: async (plain) => plain === 'password123'
}))

// นำเข้าแอปหลังตั้ง mock เสร็จ
const importApp = async () => {
  const mod = await import(APP_PATH)
  return mod.default || mod.app || mod
}

describe('POST /api/auth/login', () => {
  it('400 when email/password missing', async () => {
    const app = await importApp()
    const r = await request(app).post('/api/auth/login').send({})
    expect(r.status).toBe(400)
    expect(r.body.success).toBe(false)
  })

  it('401 when email not found', async () => {
    const app = await importApp()
    const r = await request(app).post('/api/auth/login').send({
      email: 'x@ccollege.ac.th', password: 'password123'
    })
    expect(r.status).toBe(401)
    expect(r.body.success).toBe(false)
  })

  it('401 when wrong password', async () => {
    const app = await importApp()
    const r = await request(app).post('/api/auth/login').send({
      email: 't.it01@ccollege.ac.th', password: 'wrong'
    })
    expect(r.status).toBe(401)
    expect(r.body.success).toBe(false)
  })

  it('200 returns accessToken and user', async () => {
    const app = await importApp()
    const r = await request(app).post('/api/auth/login').send({
      email: 't.it01@ccollege.ac.th', password: 'password123'
    })
    expect(r.status).toBe(200)
    expect(r.body.success).toBe(true)
    expect(r.body).toHaveProperty('accessToken')
    expect(r.body.user).toMatchObject({
      id: 4, email: 't.it01@ccollege.ac.th', role: 'evaluatee'
    })
  })
})
