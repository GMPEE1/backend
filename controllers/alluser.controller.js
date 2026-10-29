const db = require("../db/knex"); 

exports.getAllUser = async (req, res, next) => {
  try {
    const users = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")

    return res.json({
      success: true,
      items: users,
      total: users.length
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.getEva = async (req, res, next) => {
  try {
    const users = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")
      .where( "u_role", "E" )
    return res.json({
      success: true,
      items: users,
      total: users.length
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const users = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")
      .where( "u_role", "U" )
    return res.json({
      success: true,
      items: users,
      total: users.length
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.editUser = async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ success: false, message: "Missing user ID" });
    const users = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")
      .where("u_id", id)
      .first();

    return res.json({
      success: true,
      items: users,
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Missing user ID" });

    const { u_name, u_email, u_role, u_password, u_pw_status } = req.body || {};
    const payload = {};

    // 1) เก็บเฉพาะฟิลด์ที่ส่งเข้ามา (ไม่บังคับต้องส่งครบ)
    if (u_name != null) payload.u_name = u_name;
    if (u_email != null) payload.u_email = u_email;
    if (u_role != null) payload.u_role = u_role;
    if (u_password != null) payload.u_password = u_password;
    if (u_pw_status != null) payload.u_pw_status = u_pw_status;

    // 4) update และตรวจว่ามีแถวที่ถูกอัปเดตไหม
    const affected = await db("users").where("u_id", id).update(payload);
    if (!affected) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 5) อ่านข้อมูลล่าสุดกลับเพื่อส่งให้ client (ไม่รวม password_hash)
    const updated = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_password", "u_pw_status")
      .where("u_id", id)
      .first();

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { u_name, u_email, u_password = "12345678", u_role = "U", u_pw_status = 0 } = req.body || {};

    // 1) ตรวจว่ามีฟิลด์จำเป็นไหม
    if (!u_name || !u_email) {
      return res
        .status(400)
        .json({ success: false, message: "name, email" });
    }

    // 2) ตรวจอีเมลซ้ำ (ต้อง unique)
    const exists = await db("users").where({ u_email }).first();
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    // 4) insert และอ่านกลับมาเพื่อส่งให้ client
    const [insertId] = await db("users").insert({
      u_name,
      u_email,
      u_password,
      u_role,
      u_pw_status,
    });
    const created = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_pw_status")
      .where({ u_id: insertId })
      .first();

    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
};

exports.createEva = async (req, res, next) => {
  try {
    const { u_name, u_email, u_password = "12345678", u_role = "E", u_pw_status = 0 } = req.body || {};

    // 1) ตรวจว่ามีฟิลด์จำเป็นไหม
    if (!u_name || !u_email) {
      return res
        .status(400)
        .json({ success: false, message: "name, email" });
    }

    // 2) ตรวจอีเมลซ้ำ (ต้อง unique)
    const exists = await db("users").where({ u_email }).first();
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    // 4) insert และอ่านกลับมาเพื่อส่งให้ client
    const [insertId] = await db("users").insert({
      u_name,
      u_email,
      u_password,
      u_role,
      u_pw_status,
    });
    const created = await db("users")
      .select("u_id", "u_name", "u_email", "u_role", "u_pw_status")
      .where({ u_id: insertId })
      .first();

    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
};

exports.removeUser = async (req, res, next) => {
  try {
    
    const affected = await db("users").where({ u_id: req.params.id }).del();
    if (!affected) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // convention: ลบสำเร็จตอบ success: true พอ ไม่ต้องคืนข้อมูล
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {

    const affected = await db("users")
    .where({ u_id: req.params.id })
    .update({
        u_password: "12345678",
        u_pw_status: 0
    })
    if (!affected) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // convention: ลบสำเร็จตอบ success: true พอ ไม่ต้องคืนข้อมูล
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Missing user ID" });

    const { u_password, u_pw_status } = req.body || {};
    const payload = {};

    if (u_password != null) payload.u_password = u_password;
    if (u_pw_status != null) payload.u_pw_status = u_pw_status;

    // 4) update และตรวจว่ามีแถวที่ถูกอัปเดตไหม
    const affected = await db("users").where("u_id", id).update(payload);
    if (!affected) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 5) อ่านข้อมูลล่าสุดกลับเพื่อส่งให้ client (ไม่รวม password_hash)
    const updated = await db("users")
      .select("u_password", "u_pw_status")
      .where("u_id", id)
      .first();

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

exports.editInfo = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { u_name, u_email, u_password } = req.body;
    const payload = {};

    if (!id) return res.status(400).json({ success: false, message: "Missing user ID" });

    if (u_name != null) payload.u_name = u_name;
    if (u_email != null) payload.u_email = u_email;
    if (u_password != null) payload.u_password = u_password;
    
    await db("users").where("u_id", id).update(payload);

    res.status(201).json({
      success: true,
      message: "แก้ไขข้อมูลเสร็จสิ้น" 
    })
  } catch (e) {
    next(e);
  }
}