// routes/attachments.js
const express = require("express");
const router = express.Router();
const db = require("../db/knex");
const asgRepo = require("../repositories/assignments");
const authz = require("../middlewares/auth"); // ถูกแก้จาก authz เป็น auth เพราะไฟล์นี้ใช้ authz ไม่ได้
const upload = require("../middlewares/upload");

// GET /api/periods/active
router.get(
  "/periods/active",
  authz("evaluatee", "evaluator", "admin"),
  async (req, res) => {
    const rows = await db("evaluation_periods")
      .where({ is_active: 1 })
      .orderBy("id", "desc");
    res.json(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name_th: r.name_th || r.name || r.title,
      }))
    );
  }
);

// GET /api/indicators?period_id=..  (ตัวอย่าง: filter ตาม active; หากมี mapping กับ period ให้ JOIN ตามจริง)
router.get(
  "/indicators",
  authz("evaluatee", "evaluator", "admin"),
  async (req, res) => {
    const { period_id } = req.query;
    let q = db("indicators").where({ active: 1 });
    // ถ้าระบบของคุณมีตารางเชื่อม indicator กับ period ให้ JOIN/WHERE เพิ่มตามจริงที่นี่
    res.json(await q.select("id", "code", "name_th", "type"));
  }
);

// GET /api/indicators/:id/evidence-types
// router.get('/indicators/:id/evidence-types', authz('evaluatee','evaluator','admin'), async (req, res) => {
//   const id = req.params.id;
//   const rows = await db('indicator_evidence as ie')
//     .join('evidence_types as et', 'et.id', 'ie.evidence_type_id')
//     .where('ie.indicator_id', id)
//     .select('et.id','et.name_th','et.mime_csv','et.mime_list_json','et.max_mb');
//   const mapped = rows.map(r => ({
//     id: r.id,
//     name_th: r.name_th,
//     // รองรับได้ทั้ง mime_list_json (JSON) และ mime_csv (CSV)
//     mime_list: r.mime_list_json ? JSON.parse(r.mime_list_json) :
//                (r.mime_csv ? String(r.mime_csv).split(',').map(s => s.trim()).filter(Boolean) : []),
//     max_mb: Number(r.max_mb || 10)
//   }));
//   res.json(mapped);
// });

// GET /api/indicators/:id/evidence-types
router.get(
  "/indicators/:id/evidence-types",
  authz("evaluatee", "evaluator", "admin"),
  async (req, res) => {
    const id = req.params.id;
    const rows = await db("indicator_evidence as ie")
      .join("evidence_types as et", "et.id", "ie.evidence_type_id")
      .where("ie.indicator_id", id)
      .select("et.id", "et.name_th"); // สคีมามีเท่านี้
    // คืนค่าเริ่มต้น (ฝั่งหน้าเว็บก็มี default ซ้ำชั้น ปลอดภัย)
    const mapped = rows.map((r) => ({
      id: r.id,
      name_th: r.name_th,
      mime_list: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
      max_mb: 10,
    }));
    res.json(mapped);
  }
);

// POST /api/attachments
router.post(
  "/attachments",
  authz("evaluatee", "evaluator"),
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        period_id,
        indicator_id,
        evidence_type_id,
        note,
        evaluatee_id: bodyEvaluatee,
      } = req.body;
      if (!period_id || !indicator_id || !evidence_type_id || !req.file) {
        return res.status(422).json({ message: "Missing required fields" });
      }

      // 1) period active
      const per = await db("evaluation_periods")
        .where({ id: period_id, is_active: 1 })
        .first();
      if (!per) return res.status(404).json({ message: "Period not active" });

      // 2) indicator exists
      const ind = await db("indicators")
        .where({ id: indicator_id, active: 1 })
        .first();
      if (!ind) return res.status(404).json({ message: "Indicator not found" });

      // 3) indicator ↔ evidence allowed
      const allowed = await db("indicator_evidence")
        .where({ indicator_id, evidence_type_id })
        .first();
      if (!allowed)
        return res
          .status(409)
          .json({ message: "Evidence type not allowed for this indicator" });

      // 4) resolve evaluatee + check rights
      const { id: userId, role } = req.user;
      let evaluatee_id;
      if (role === "evaluatee") {
        evaluatee_id = userId;
        const ok = await asgRepo.hasEvaluateeInPeriod({
          period_id,
          evaluatee_id,
        });
        if (!ok)
          return res
            .status(403)
            .json({ message: "You are not in this period" });
      } else if (role === "evaluator") {
        evaluatee_id = Number(bodyEvaluatee);
        if (!evaluatee_id)
          return res
            .status(422)
            .json({ message: "evaluatee_id required for evaluator" });
        const ok = await asgRepo.hasPairInPeriod({
          period_id,
          evaluator_id: userId,
          evaluatee_id,
        });
        if (!ok)
          return res
            .status(403)
            .json({ message: "Not assigned to this evaluatee in this period" });
      } else {
        return res.status(403).json({ message: "Unsupported role" });
      }

      // 5) Optional: ตรวจ MIME/size ตาม policy ฝั่ง server (แนะนำให้มีตารางกำหนดชัด)
      // ข้ามในตัวอย่างนี้ (เพราะได้ตรวจหน้าเว็บแล้ว) แต่ควรเพิ่มจริงจังในระบบ production

      const [id] = await db("attachments").insert({
        period_id,
        evaluatee_id,
        indicator_id,
        evidence_type_id,
        file_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
        storage_path: req.file.path,
        note: note || null,
      });

      res.status(201).json({
        id,
        message: "uploaded",
        meta: {
          period_id: Number(period_id),
          indicator_id: Number(indicator_id),
          evidence_type_id: Number(evidence_type_id),
          evaluatee_id,
        },
        file: {
          name: req.file.originalname,
          mime: req.file.mimetype,
          size_bytes: req.file.size,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal error", detail: err.message });
    }
  }
);

module.exports = router;
