// tests/middlewares_auth.spec.js
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import auth from '../middlewares/auth'
beforeEach(() => { process.env.JWT_SECRET = 'test-secret' })

function mini(roleRequired) {
  const app = express()
  app.get('/p', auth(roleRequired), (req,res)=>res.json({ok:true, user:req.user}))
  return app
}
const bearer = (payload) => `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}`

describe('auth(role)', () => {
  it('401 when missing token', async () => {
    const r = await request(mini('admin')).get('/p')
    expect(r.status).toBe(401)
  })
  it('403 when role mismatch', async () => {
    const r = await request(mini('admin')).get('/p')
      .set('Authorization', bearer({ id:1, role:'evaluatee' }))
    expect(r.status).toBe(403)
  })
  it('200 when role ok', async () => {
    const r = await request(mini('admin')).get('/p')
      .set('Authorization', bearer({ id:2, role:'admin' }))
    expect(r.status).toBe(200)
    expect(r.body.ok).toBe(true)
  })
})
