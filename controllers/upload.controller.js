const path = require('path');
const fs = require('fs');
const attRepo = require('../repositories/attachments');
const asgRepo = require('../repositories/assignments');
const mapRepo = require('../repositories/indicatorEvidence');
const db = require('../db/knex');

// ---------- helpers ----------
function safeUnlink(abs) {
  try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
}
function relFromUploads(absPath) {
  // ให้ได้ path แบบ relative ต่อโฟลเดอร์ uploads และใช้ slash เดียว
  return path
    .relative(path.join(__dirname, '..', 'uploads'), absPath)
    .replace(/\\/g, '/');
}
async function isPeriodActive(period_id) {
  const row = await db('evaluation_periods').where({ id: period_id, is_active: 1 }).first(); 
  // return row or undefined หมายความว่า period_id ที่ส่งมา ต้องเป็นเลข และต้องมีในตาราง evaluation_periods และ is_active=1  เพื่อให้ period นั้นเปิดอยู่
  return !!row;
}

// =====================================================================
// Evaluatee: CREATE (อัปโหลดหลักฐานของตัวเอง)
// Body: { period_id, indicator_id, evidence_type_id } + file
// =====================================================================
exports.uploadEvidence = async (req, res, next) => {
  console.log('uploadEvidence body=', req.body);
  console.log('uploadEvidence file=', req.file);
  console.log('uploadEvidence user=', req.user);
  console.log('uploadEvidence user.id=', req.user?.id);
  console.log('uploadEvidence user.role=', req.user?.role);
  console.log('uploadEvidence user.email=', req.user?.email); 
  try {
    const evaluatee_id = Number(req.user?.id);// ต้องมี user.id จาก JWT เสมอ  return 401 ถ้าไม่มี   ถ้ามี return 400
        if (!evaluatee_id) return res.status(401).json({ success:false, message:'invalid user' });
    const { period_id, indicator_id, evidence_type_id } = req.body || {};

    if (!req.file) return res.status(400).json({ success:false, message:'ไม่ได้ส่ง file มาด้วย' });
    if (!period_id || !indicator_id || !evidence_type_id) {
      return res.status(400).json({ success:false, message:'missing period_id/indicator_id/evidence_type_id' });
    }

    // ต้องถูก assign ใน period นั้น
    const okAssign = await asgRepo.hasEvaluateeInPeriod({  //return true/false
      period_id: Number(period_id),
      evaluatee_id
    });
    if (!okAssign) return res.status(400).json({ success:false, message:'evaluatee not assigned in the period' });

    // period ต้องเปิดอยู่
    if (!(await isPeriodActive(Number(period_id)))) {  //คือ period_id ที่ส่งมา ต้องเป็นเลข และต้องมีในตาราง evaluation_periods และ is_active=1
      //isPeriodActive return true/false  
      return res.status(403).json({ success:false, message:'period closed' });
    }

    // mapping indicator-evidence_type ต้องถูกต้อง (มีในตาราง indicator_evidence)หรือไม่
    const okMap = await mapRepo.mapExists({
      indicator_id: Number(indicator_id),
      evidence_type_id: Number(evidence_type_id)
    });
    if (!okMap) return res.status(400).json({ success:false, message:'invalid indicator/evidence_type pair' });
    // บันทึกลงตาราง attachments
    // console.log('req.file.path=', req.file.path);
    const storage_path = relFromUploads(req.file.path);
    console.log('storage_path=', storage_path);
    const [id] = await db('attachments').insert({
      period_id: Number(period_id),
      evaluatee_id,
      indicator_id: Number(indicator_id),
      evidence_type_id: Number(evidence_type_id),
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      storage_path
    });

    const created = await attRepo.findById(id);
    res.status(201).json({ success:true, data: { ...created, url: `/uploads/${created.storage_path}` }});
  } catch (e) { next(e); }
};

// =====================================================================
// Evaluatee: LIST ของตัวเอง
// Query optional: period_id, indicator_id, evidence_type_id
// =====================================================================
exports.listMine = async (req, res, next) => {
  try {
    const evaluatee_id = Number(req.user?.id);
    const { period_id, indicator_id, evidence_type_id } = req.query || {};

    let q = db('attachments').where({ evaluatee_id }).orderBy('id', 'desc');
    if (period_id) q = q.andWhere({ period_id: Number(period_id) });
    if (indicator_id) q = q.andWhere({ indicator_id: Number(indicator_id) });
    if (evidence_type_id) q = q.andWhere({ evidence_type_id: Number(evidence_type_id) });

    const rows = await q;
    const data = rows.map(r => ({ ...r, url:`/uploads/${r.storage_path}` }));
    res.json({ success:true, data });
  } catch (e) { next(e); }
};

// =====================================================================
// Evaluatee: DELETE ของตัวเอง (ลบได้เฉพาะช่วงที่ period ยังเปิด)
// =====================================================================
exports.deleteMine = async (req, res, next) => {
  try {
    const evaluatee_id = Number(req.user?.id);
    const id = Number(req.params.id);
    const row = await attRepo.findById(id);

    if (!row || row.evaluatee_id !== evaluatee_id) {
      return res.status(404).json({ success:false, message:'not found' });
    }
    if (!(await isPeriodActive(row.period_id))) {
      return res.status(403).json({ success:false, message:'period closed' });
    }

    const abs = path.join(__dirname, '..', 'uploads', row.storage_path);
    await db('attachments').where({ id }).del();
    safeUnlink(abs);

    res.json({ success:true, message:'deleted' });
  } catch (e) { next(e); }
};

// =====================================================================
// Evaluatee: UPDATE FILE ของตัวเอง  (ของเดิมของคุณ)
// =====================================================================
exports.updateFileMine = async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    const id = Number(req.params.id);
    if (!req.file) return res.status(400).json({ success:false, message:'no file' });

    const row = await attRepo.findById(id);
    if (!row || row.evaluatee_id !== userId) return res.status(404).json({ success:false, message:'not found' });

    if (!(await isPeriodActive(row.period_id))) {
      return res.status(403).json({ success:false, message:'period closed' });
    }

    const oldAbs = path.join(__dirname, '..', 'uploads', row.storage_path);
    const newRel = relFromUploads(req.file.path);

    await db('attachments').where({ id }).update({
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      storage_path: newRel
    });

    safeUnlink(oldAbs);
    const updated = await attRepo.findById(id);
    res.json({ success:true, data: { ...updated, url: `/uploads/${updated.storage_path}` }});
  } catch (e) { next(e); }
};

// =====================================================================
// Evaluatee: UPDATE META ของตัวเอง (ของเดิมของคุณ)
// =====================================================================
exports.updateMetaMine = async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    const id = Number(req.params.id);
    const { indicator_id, evidence_type_id } = req.body || {};

    const row = await attRepo.findById(id);
    if (!row || row.evaluatee_id !== userId) return res.status(404).json({ success:false, message:'not found' });

    if (!(await isPeriodActive(row.period_id))) {
      return res.status(403).json({ success:false, message:'period closed' });
    }

    const newIndicator = indicator_id ? Number(indicator_id) : row.indicator_id;
    const newEvType   = evidence_type_id ? Number(evidence_type_id) : row.evidence_type_id;

    const okMap = await mapRepo.mapExists({ indicator_id: newIndicator, evidence_type_id: newEvType });
    if (!okMap) return res.status(400).json({ success:false, message:'invalid indicator/evidence_type pair' });

    await db('attachments').where({ id }).update({
      indicator_id: newIndicator,
      evidence_type_id: newEvType
    });

    const updated = await attRepo.findById(id);
    res.json({ success:true, data: { ...updated, url: `/uploads/${updated.storage_path}` }});
  } catch (e) { next(e); }
};

// =====================================================================
// Evaluator: LIST หลักฐานของ evaluatee ที่ดูแล
// Query optional: period_id
// =====================================================================
exports.listForEvaluator = async (req, res, next) => {
  try {
    const evaluateeId = Number(req.params.evaluateeId);
    const { period_id } = req.query || {};

    let q = db('attachments').where({ evaluatee_id: evaluateeId }).orderBy('id', 'desc');
    if (period_id) q = q.andWhere({ period_id: Number(period_id) });

    // (ถ้าต้องการตรวจสิทธิ์ evaluator ↔ evaluatee เพิ่ม เติมที่นี่)
    const rows = await q;
    const data = rows.map(r => ({ ...r, url:`/uploads/${r.storage_path}` }));
    res.json({ success:true, data });
  } catch (e) { next(e); }
};
