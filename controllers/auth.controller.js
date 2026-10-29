// controllers/auth.controller.js
// เวอร์ชันสอนนักศึกษา: routes -> controller -> knex (ไม่มี repository ชั้นกลาง)

const db = require("../db/knex");  // ใช้ knex ต่อ DB โดยตรง
const jwt = require("jsonwebtoken");

// ช่วย: เลือกฟิลด์ที่จะส่งกลับ (อย่าส่ง password_hash)
const pickPublic = (row) =>
  row && ({ id: row.u_id, name: row.u_name, email: row.u_email, role: row.u_role, status: row.u_pw_status});

/**
 * POST /api/auth/login
 * body: { email, password }
 * 200: { success:true, accessToken, user:{ id,name,email,role } }
 * 400: ข้อมูลไม่ครบ
 * 401: อีเมล/รหัสผ่านไม่ถูกต้อง
 */
exports.login = async (req, res, next) => {
  try {
    const { u_email, u_password } = req.body || {};
    if (!u_email || !u_password) {
      return res
        .status(400)
        .json({ success: false, message: "email and password required" });
    }

    // 1) ค้นผู้ใช้จากอีเมล (ต้องดึง password_hash มาด้วย เพื่อตรวจรหัสผ่าน)
    const users = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")
      .where({ u_email })
      .first();

    if (!users) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials-email" });
    }

    // 2) เปรียบเทียบรหัสผ่าน
    const password = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")
      .where({ u_password })
      .first();
    if (!password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials-password" });
    }

    // 3) สร้าง JWT
    const token = jwt.sign(
      { id: users.u_id, role: users.u_role, name: users.u_name }, // payload
      process.env.JWT_SECRET,                                // ความลับจาก .env
      { expiresIn: process.env.JWT_EXPIRES || "1h" }         // อายุโทเค็น
    );

    // 4) ส่งผลลัพธ์ (อย่าส่ง password_hash ออกไป)
    return res.json({
      success: true,
      accessToken: token,
      users: pickPublic(users),
    });
  } catch (e) {
    next(e); // ให้ error handler กลางจัดการ
  }
};
// หมายเหตุ: ในระบบจริง ควรมีการล็อกกิจกรรมการล็อกอิน (login audit) ด้วย