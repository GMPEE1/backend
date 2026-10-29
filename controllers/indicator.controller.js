const db = require("../db/knex"); 
const path = require("path");

const relFromUploads = (filePath) => {
  const uploadsDir = path.resolve(__dirname, "../uploads");

  return path.relative(uploadsDir, filePath).replace(/\\/g, "/");
};

exports.getInd = async (req, res, next) => {
  try {
    const ind = await db("indicator")
    .leftJoin(
      "topic",
      "indicator.topic_id",
      "topic.topic_id"
    )
    .leftJoin(
      "score",
      "indicator.score_id",
      "score.score_id"
    )
    .select(
      "indicator.ind_id",
      "indicator.ind_name",
      "indicator.ind_score",
      "indicator.topic_id",
      "topic.topic_name",
      "indicator.score_id",
      "score.score_max",
      "score.score_step1",
      "score.score_step2",
      "score.score_step3",
    )

    return res.json({
      success: true,
      items: ind,
      total: ind.length
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.editInd = async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ success: false, message: "Missing indicator ID" });
    const ind = await db("indicator")
    .leftJoin(
        "topic",
        "indicator.topic_id",
        "topic.topic_id"
    )
    .leftJoin(
      "score",
      "indicator.score_id",
      "score.score_id"
    )
    .select(
      "indicator.ind_id",
      "indicator.ind_name",
      "indicator.ind_score",
      "indicator.topic_id",
      "topic.topic_name",
      "indicator.score_id",
      "score.score_max",
      "score.score_step1",
      "score.score_step2",
      "score.score_step3",
    )
    .where( "ind_id", id)
    .first();

    return res.json({
      success: true,
      items: ind,
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.getdetail = async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ success: false, message: "Missing topic ID" });
    
    const topic = await db("topic").where("topic_id", id).first();

    const indicators = await db("indicator")
    .leftJoin(
      "topic",
      "indicator.topic_id",
      "topic.topic_id"
    )
    .leftJoin(
      "score",
      "indicator.score_id",
      "score.score_id"
    )
    .select(
      "indicator.ind_id",
      "indicator.ind_name",
      "indicator.ind_score",
      "indicator.score_id",
      "score.score_max",
      "score.score_step1",
      "score.score_step2",
      "score.score_step3",
    )
    .where( "indicator.topic_id", topic.topic_id)

    return res.json({
      success: true,
      data: {
        topic_id: topic.topic_id,
        topic_name: topic.topic_name,
        indicators: indicators
      }
    });
  } catch (e) {
    next(e); // ส่งต่อให้ error middleware รวมศูนย์การจัดการ error
  }
};

exports.updateInd = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Missing indicator ID" });

    const { ind_name, ind_score, topic_id, score_max } = req.body
    const score = {score_max};

    if (ind_score == 1) {
      score.score_step1 = score_max / 4 * 1;
      score.score_step2 = score_max / 4 * 2;
      score.score_step3 = score_max / 4 * 3;
    } else {
      score.score_step1 = 0
      score.score_step2 = 0
      score.score_step3 = 0
    }

    const affected = await db("indicator").where("ind_id", id).update({ind_name, ind_score, topic_id});
    if (!affected) {
      return res.status(404).json({ success: false, message: "Indicator not found" });
    }

    const indicator = await db("indicator").where("ind_id", id).first("score_id");

    const upscore = await db("score").where("score_id", indicator.score_id).update(score);
    if (!upscore) {
      return res.status(404).json({ success: false, message: "Score not found" });
    }

    const updated = await db("indicator")
    .leftJoin(
      "topic",
      "indicator.topic_id",
      "topic.topic_id"
    )
    .leftJoin(
      "score",
      "indicator.score_id",
      "score.score_id"
    )
    .select(
      "indicator.ind_id",
      "indicator.ind_name",
      "indicator.ind_score",
      "indicator.topic_id",
      "topic.topic_name",
      "indicator.score_id",
      "score.score_max",
      "score.score_step1",
      "score.score_step2",
      "score.score_step3",
    )
    .where("ind_id", id)
    .first();

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

exports.createInd = async (req, res, next) => {
  try {
    const { ind_name, ind_score, topic_id, score_max} = req.body || {};
    const score = {score_max};

    console.log(req.file);
    console.log(req.body);

    if (!ind_name) {
      return res
        .status(400)
        .json({ success: false, message: "name" });
    }

    if (ind_score == 1) {
      score.score_step1 = score_max / 4 * 1;
      score.score_step2 = score_max / 4 * 2;
      score.score_step3 = score_max / 4 * 3;
    } else {
      score.score_step1 = 0
      score.score_step2 = 0
      score.score_step3 = 0
    }

    if (!req.file) return res.status(400).json({ success:false, message:'ไม่ได้ส่ง file มาด้วย' });

    const storage_path = relFromUploads(req.file.path);

    const [score_id] = await db("score").insert(score);
    const [insertId] = await db("indicator").insert({
      ind_name,
      ind_score,
      topic_id, 
      score_id,
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      storage_path
    });

    const created = await db("indicator")
    .leftJoin(
      "topic",
      "indicator.topic_id",
      "topic.topic_id"
    )
    .select(
      "indicator.ind_id",
      "indicator.ind_name",
      "indicator.ind_score",
      "indicator.topic_id",
      "topic.topic_name",
      "indicator.score_id",
      "indicator.storage_path",
      "indicator.file_name",
      "indicator.mime_type"
    )
    .where("ind_id", insertId)
    .first();

    res.status(201).json({ success: true, data: created, url: `/uploads/${created.storage_path}`});
  } catch (e) {
    next(e);
  }
};

exports.removeInd = async (req, res, next) => {
  try {
    const id = req.params.id;
    const indicator = await db("indicator").where("ind_id", id).first("score_id");
    if (!indicator) {
      return res.status(404).json({ success: false, message: "Score id not found" });
    } else {
      await db("score").where({ score_id: indicator.score_id}).del();
    }
    const affected = await db("indicator").where("ind_id", id).del();
    if (!affected) {
      return res.status(404).json({ success: false, message: "Indicator not found" });
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};