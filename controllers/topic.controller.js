const db = require("../db/knex");

exports.getTopic = async (req, res, next) => {
  try {
    const topic = await db("topic")
      .select("*")

    return res.json({
      success: true,
      items: topic,
      total: topic.length
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.editTopic = async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ success: false, message: "Missing topic ID" });
    const topic = await db("topic")
      .select("*")
      .where("topic_id", id)
      .first();

    return res.json({
      success: true,
      items: topic,
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Missing topic ID" });

    const { topic_name } = req.body

    const affected = await db("topic").where("topic_id", id).update({topic_name});
    if (!affected) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    const updated = await db("topic")
      .select("*")
      .where("topic_id", id)
      .first();

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

exports.createTopic = async (req, res, next) => {
  try {
    const { topic_name } = req.body || {};

    if (!topic_name) {
      return res
        .status(400)
        .json({ success: false, message: "topic_name" });
    }

    const [insertId] = await db("topic").insert({ topic_name });
    const created = await db("topic")
      .select("*")
      .where({ topic_id: insertId })
      .first();

    res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
};

exports.removeTopic = async (req, res, next) => {
  try {

    const topic = await db("topic").where({ topic_id: req.params.id }).del();
    await db("indicator").where({ topic_id: req.params.id }).del();
    if (!topic) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};