// test/health.spec.js

// import { describe, it, expect } from 'vitest';
// import request from 'supertest';
// import { app } from '../app'; // นำเข้าแอปหลักของคุณ

// describe('HEALTH CHECK', () => {
//   it('GET /health should return OK', async () => {
//     const response = await request(app).get('/health');
//     expect(response.status).toBe(200);
//     expect(response.text).toBe('OK');
//   });
// });
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'        // ✅ default import ให้ตรงกับ module.exports = app

describe('HEALTH CHECK', () => {
  it('GET /health ตอบกลับ service and time', async () => {
    const r = await request(app).get('/health')
    expect(r.status).toBe(200)
    // ✓ ตรวจว่าเป็น JSON ที่มี service และ time
    expect(r.body).toHaveProperty('service', 'okoak')
    expect(typeof r.body.time).toBe('string') // เป็น ISO string
  })
})
