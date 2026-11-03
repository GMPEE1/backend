
const db = require("../db/knex");
const path = require('path');

function relFromUploads(absPath) {
  // ให้ได้ path แบบ relative ต่อโฟลเดอร์ uploads และใช้ slash เดียว
  return path
    .relative(path.join(__dirname, '..', 'uploads'), absPath)
    .replace(/\\/g, '/');
}

exports.getEva = async (req, res, next) => {
  try {
    const id = req.params.id;
    const evalu = await db("evaluation")
      .leftJoin(
        "topic",
        "evaluation.topic_id",
        "topic.topic_id"
      )
      .select(
        "evaluation.eva_id",
        "evaluation.date_start",
        "evaluation.date_end",
        "evaluation.topic_id",
        "topic.topic_name"
      )
      .where("eva_id", id)
      .first()

    const evau = await db("evauser")
      .leftJoin(
        "users",
        "evauser.u_id",
        "users.u_id"
      )
      .select(
        "users.u_id",
        "users.u_name",
        "evauser.right"
      )
      .where("evauser.eva_id", evalu.eva_id)

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
        "indicator.score_id",
        "score.score_max",
        "score.score_step1",
        "score.score_step2",
        "score.score_step3",
      )
      .where("indicator.topic_id", evalu.topic_id)

    evalu.evauser = evau;
    evalu.indicator = ind;
    res.status(201).json({
      success: true,
      data: {
        evaluation: evalu
      }
    })
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = req.body;
    const evauser = data.evaUsers;
    await db.transaction(async (trx) => {
      const [eva_id] = await trx("evaluation").insert({
        date_start: data.date_start,
        date_end: data.date_end,
        topic_id: data.topic_id
      });

      const evauserData = evauser.map((item) => ({
        ...item,
        eva_id: eva_id
      }));
      await trx("evauser").insert(evauserData);
      
    })

    res.status(201).json({
       success: true,
       message: "เพิ่มข้อมูลสำเร็จ",
    });

  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const evau = await db("evauser")
      .select("eva_id")
      .where({ u_id: req.params.id})
    const evaId = evau.map((item) => item.eva_id);
    const data = await db("evauser")
      .leftJoin(
        "evaluation",
        "evauser.eva_id",
        "evaluation.eva_id"
      )
      .leftJoin(
        "topic",
        "evaluation.topic_id",
        "topic.topic_id"
      )
      .leftJoin(
        "users",
        "evauser.u_id",
        "users.u_id"
      )
      .select(
        "evaluation.eva_id",
        "users.u_id",
        "users.u_name",
        "evauser.right",
        "evaluation.topic_id",
        "topic.topic_name"
      )
      .where("evauser.right", "U")
      .whereIn("evauser.eva_id", evaId)
    return res.status(200).json({
      success: true,
      data: data,
      total: data.length
    });
  } catch (e) {
    next(e);
  }
}

exports.getInd = async (req, res, next) => {
  try {
    const { topic_id, u_id, ueva_id } = req.params;

    const topic = await db("topic")
      .where("topic_id", topic_id)
      .first();

    const user = await db("users")
      .select("u_id","u_name")
      .where("u_id", u_id)
      .first();

    const indicator = await db("indicator")
      .leftJoin("score", "indicator.score_id", "score.score_id")
      .select(
        "indicator.ind_id",
        "indicator.ind_name",
        "indicator.ind_score",
        "score.score_max",
        "score.score_step1",
        "score.score_step2",
        "score.score_step3"
      )
      .where("indicator.topic_id", topic_id);

    const results = await db("evaluation_results")
      .select("ind_id", "choose")
      .where({ topic_id, u_id, ueva_id });

    for (const ind of indicator) {
      ind.choose = results.find(r => r.ind_id === ind.ind_id)?.choose ?? 0;
    }

    res.status(200).json({
      success: true,
      evaluated: results.length > 0,
      data: { topic, user, indicator },
      total: indicator.length
    });

  } catch (e) {
    next(e);
  }
};

exports.createEvaresults = async (req, res, next) => {
  try {
    const data = req.body;
    await db("evaluation_results").insert(data)
    res.status(201).json({
      success: true,
      message: "เพิ่มข้อมูลเสร็จสิ้น"
    })
  } catch (e) {
    next(e);
  }
}

exports.updateEvaresults = async (req, res, next) => {
  try {
    const { topic_id, u_id, ueva_id } = req.params;
    const data = req.body;

    await db.transaction(async (trx) => {
      await Promise.all(
        data.map(item =>
          trx("evaluation_results")
            .where({
              topic_id,
              ind_id: item.ind_id,
              u_id,
              ueva_id
            })
            .update({
              choose: item.choose
            })
        )
      );
    });
    res.status(201).json({
      success: true,
      message: "แก้ไขข้อมูลสำเร็จ"
    })
  } catch (e) {
    next(e);
  }
}

exports.evidence = async (req,res,next) => {
  try {
    const { topic_id, u_id, url } = req.body;

    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: "URL ไม่ถูกต้อง"
      });
    }

    await db("evidence")
      .insert({
        topic_id,
        u_id,
        url
      })
    res.status(201).json({
      success: true,
      message: "เพิ่มหลักฐานสำเร็จ",
    })
  } catch (e) {
    next(e);
  }
}

exports.getEvidence = async (req,res,next) => {
  try {
    const id = req.params.id;
    const t_id = req.params.topic_id;

    const topic = await db("evidence")
      .leftJoin(
        "topic",
        "evidence.topic_id",
        "topic.topic_id"
      )
      .select(
        "evidence.topic_id",
        "topic.topic_name"
      )
      .where("evidence.topic_id", t_id)
      .first()

    const url = await db("evidence")
      .select("evidence.url")
      .where("evidence.topic_id", t_id)
      .where("evidence.u_id", id);
    res.status(201).json({
      success: true,
      data: {
        topic,
        url
      },
      total: url.length
    })
  } catch (e) {
    next(e);
  }
}

exports.comment = async (req,res,next) => {
  try {
    const { topic_id, u_id, u_comment_id, comment } = req.body;

    if(!comment) return res.status(400).json({
        success: false,
        message: "กรุณาคอมเมนต์"
      });

    await db("comment")
      .insert({
        topic_id,
        u_id,
        u_comment_id,
        comment
      })
    res.status(201).json({
      success: true,
      message: "คอมเมนต์สำเร็จ",
    })
  } catch (e) {
    next(e);
  }
}

exports.getComment = async (req,res,next) => {
  try {
    const id = req.params.id;
    const t_id = req.params.topic_id;

    const topic = await db("comment")
      .leftJoin(
        "topic",
        "comment.topic_id",
        "topic.topic_id"
      )
      .select(
        "comment.topic_id",
        "topic.topic_name"
      )
      .where("comment.topic_id", t_id)
      .first()

    const comment = await db("comment")
      .leftJoin(
        "users",
        "comment.u_comment_id",
        "users.u_id",
      )
      .select(
        "comment.u_comment_id",
        "users.u_name",
        "comment.comment"
      )
      .where("comment.topic_id", t_id)
      .where("comment.u_id", id);

    const users = [];
    comment.forEach(item => {
      let user = users.find(
        u => u.u_comment_id === item.u_comment_id
      );

      if (!user) {
        user = {
          u_comment_id: item.u_comment_id,
          u_name: item.u_name,
          comments: []
        };

        users.push(user);
      }

      user.comments.push(item.comment);
    });

    res.status(201).json({
      success: true,
      data: {
        topic,
        users
      },
      total: users.length
    })
  } catch (e) {
    next(e);
  }
}