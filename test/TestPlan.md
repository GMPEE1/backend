# แผนทดสอบซอฟต์แวร์: ระบบประเมินบุคลากร (สอดคล้องเกณฑ์การแข่งขัน ปวช.)
**เวอร์ชัน:** 1.0  
**ผู้จัดทำ:** kruoak / QA Team  
**วันที่:** 2025-10-10  
**อ้างอิงเกณฑ์:** เอกสาร “การจัดทำเกณฑ์ (ระดับจังหวัด ภาค ชาติ) ปวช.6872.docx” fileciteturn0file0

---

## 1) วัตถุประสงค์การทดสอบ
- ตรวจสอบความถูกต้อง ครบถ้วน และความสอดคล้องของซอฟต์แวร์กับข้อกำหนดในเอกสารอ้างอิง โดยเฉพาะหมวด **การพัฒนา API**, **การพัฒนาระบบตามบทบาท**, และ **การทดสอบโปรแกรม**
- ยึดตาม **Testing Pyramid**: Unit > Service/Integration > E2E/UI และยึด **AAA Pattern (Arrange–Act–Assert)** ในทุก test case
- จัดทำ **Traceability** ระหว่าง Requirement ↔ Test Suite ↔ Test Case

## 2) ขอบเขต (Scope)
**ฟังก์ชันหลักตามบทบาท**
- ฝ่ายบริหารบุคลากร (5.1) — จัดการช่วงเวลา, หัวข้อ, ตัวชี้วัด, กรรมการ, มอบหมาย, รายงาน
- ผู้รับการประเมิน (5.2) — ลงทะเบียน, กรอก/แนบหลักฐาน, ประเมินตนเอง, Export
- กรรมการผู้ประเมิน (5.3) — เห็นงานที่ได้รับมอบหมาย, ให้คะแนน/ความเห็น, ลงนาม/ยกเลิก

**API (หมวด 6.x)**
- CRUD ที่จำเป็น
- Login/JWT, Authorization/Role
- File Upload
- Error/Exception Handling
- Response format (status, message, data)

**การทดสอบโปรแกรม (หมวด 7.x)**
- Login, Insert, Update, Validate input, Specific functions (คำนวณคะแนน/การเรียง), ทดสอบบริการ 3 รายการขึ้นไป, Console/Network error-free, Responsive

## 3) Testing Pyramid & อัตราส่วนความพยายาม
- **Unit Tests** (55%) — โมดูลบริสุทธิ์/ฟังก์ชันคำนวณ, Validators, Utilities
- **Service/Integration Tests** (30%) — Repository + DB, API + Middleware (Auth/Upload), Contract tests (OpenAPI)
- **E2E/UI Tests** (15%) — เส้นทางหลักของผู้ใช้ 3 บทบาท, การนำเสนอข้อมูล และ Responsive smoke

## 4) กลยุทธ์และเครื่องมือ
- **Unit:** Vitest + ts-node/ES modules (หรือ Jest) สำหรับฟังก์ชันคำนวณคะแนน, validators, helpers
- **Service/Integration:** Supertest ทดสอบ Express routes, Testcontainers/หรือ Docker Compose สำหรับ DB ชั่วคราว, Multer test สำหรับ Upload, jsonwebtoken สำหรับ auth flow
- **Contract (API):** openapi-enforcer/openapi-validator-middleware เพื่อตรวจโครงสร้าง response/params สอดคล้องสเปก
- **E2E/UI:** Playwright หรือ Cypress (เลือกอย่างใดอย่างหนึ่ง) โฟกัส happy path และ critical regressions
- **Static/QA:** ESLint, Prettier, Type coverage; ตรวจ no-console error ใน DevTools Network/Console
- **Data:** Factory/Fixture (e.g., @faker-js/faker), Seed ข้อมูลขั้นต่ำ

## 5) การออกแบบ Test Suite
### 5.1 Unit Suites
- `score/computeIndicatorScore.spec` — ฟังก์ชันสเกล 1–4 และ yes/no
- `validation/userInput.spec` — อีเมล, ความยาว, ช่องว่าง, ช่วงเวลาเปิด-ปิด
- `security/jwt.spec` — ลงนาม/ถอดรหัส/หมดอายุ/สิทธิ์ role
- `files/mimeWhitelist.spec` — ตรรกะ whitelist/ขนาดสูงสุด
- `utils/sortAndAggregate.spec` — เรียงผลและสถิติรายงาน

### 5.2 Service/Integration Suites
- `auth/login.spec` — POST /api/auth/login (ถูก/ผิด/หมดอายุ JWT)
- `periods/crud.spec` — CRUD รอบการประเมิน + validation วันที่
- `topicsIndicators/crud.spec` — หัวข้อ/ตัวชี้วัด/น้ำหนัก/ชนิดหลักฐาน
- `assignments/flow.spec` — มอบหมายกรรมการ → เห็นงานในฝั่งกรรมการ
- `evidence/upload.spec` — POST /api/evidence (ชนิดไฟล์/ขนาด/การ map ตัวชี้วัด)
- `results/computeAndReport.spec` — รวมคะแนนต่อบุคคล + รายงาน
- `errors/handling.spec` — 400/401/403/404/422/500 สอดคล้องรูปแบบ JSON
- **Contract tests** — ทุก endpoint ตรงตาม OpenAPI (status/schema)

### 5.3 E2E/UI Suites (Playwright/Cypress)
- เส้นทาง “ผู้รับการประเมิน”: Login → กรอกตัวชี้วัด → แนบหลักฐาน → ประเมินตนเอง → Export
- เส้นทาง “กรรมการ”: Login → เห็นรายการที่ต้องประเมิน → ให้คะแนน/คอมเมนต์ → ลงนาม/ยกเลิก
- เส้นทาง “บุคลากร/แอดมิน”: สร้างรอบ → กำหนดหัวข้อ/ตัวชี้วัด (สเกล 1–4/Yes-No) → มอบหมายกรรมการ → รายงาน
- ตรวจ **Responsive**: เบรคพอยท์หลัก (มือถือ/แท็บเล็ต/เดสก์ท็อป)
- ตรวจ **Console/Network**: ไม่มี error แดง/failed requests

## 6) เกณฑ์ยอมรับ (Acceptance) & ความสมบูรณ์
- ผ่าน Unit ≥ 90% ของกรณีเชิงตรรกะสำคัญ; coverage ไฟล์คำนวณ ≥ 85%
- ผ่าน Contract tests (100% endpoints ในสโคป)
- ผ่าน E2E happy paths ของสามบทบาท และ Responsive smokes
- อัตรา HTTP 5xx ใน test run = 0; โครงสร้าง response `{status,message,data}` สม่ำเสมอ
- Upload รองรับชนิดไฟล์ตาม policy และป้องกันไฟล์เกินขนาด/ชนิดไม่อนุญาต
- AuthZ: บทบาทที่ไม่ได้รับอนุญาตถูกปฏิเสธด้วย 403 เสมอ

## 7) การติดตามข้อกำหนด (Traceability Matrix – ย่อ)
- **(5.1.x)** → Admin suites (`periods/crud`, `topicsIndicators/crud`, `assignments/flow`, `results/computeAndReport`)
- **(5.2.x)** → Evaluatee E2E + evidence/upload
- **(5.3.x)** → Evaluator E2E + assignments/flow
- **(6.1–6.10)** → API suites ครบทุกข้อ (GET/POST/UPLOAD/LOGIN/JWT/ERROR/STRUCTURE/SECURITY)
- **(7.1–7.8)** → ชุดทดสอบโปรแกรม/Responsive/DevTools
(เลขข้ออ้างอิงตรงกับเอกสารเกณฑ์) fileciteturn0file0

## 8) แผนรันทดสอบ (CI)
- `npm run lint && npm run test:unit`
- `npm run test:integration` (spin DB/container)
- `npm run test:contract`
- `npm run test:e2e:headless`
- เก็บ artifacts: JUnit XML, coverage, screenshots (E2E), allure (ถ้ามี)

## 9) ความเสี่ยง/บรรเทา
- ความซ้ำซ้อนข้อมูล seed → ใช้ transaction/rollback ต่อ test
- Upload I/O หนัก → ใช้ tmpdir per test, ล้างไฟล์หลังจบ
- เวลา/โควต้า CI → แยก job และ parallelize โดเมน

---

## ภาคผนวก A: แนวทาง AAA (ตัวอย่าง)
**Arrange:** เตรียม DB/seed, เตรียม payload/JWT, mock clock  
**Act:** เรียกฟังก์ชัน/ส่ง HTTP request
**Assert:** ตรวจ status/data/schema/side-effect เช่น DB rows, ไฟล์ที่บันทึก

ตัวอย่างใน CSV `testcases.csv` ที่แนบ