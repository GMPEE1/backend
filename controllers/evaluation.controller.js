
const db = require("../db/knex");

// exports.getEva = async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const evalu = await db("evaluation")
//       .leftJoin(
//         "topic",
//         "evaluation.topic_id",
//         "topic.topic_id"
//       )
//       .select(
//         "evaluation.eva_id",
//         "evaluation.date_start",
//         "evaluation.date_end",
//         "evaluation.topic_id",
//         "topic.topic_name"
//       )
//       .where("eva_id", id)
//       .first()

//     const evau = await db("evauser")
//       .leftJoin(
//         "users",
//         "evauser.u_id",
//         "users.u_id"
//       )
//       .select(
//         "users.u_id",
//         "users.u_name",
//         "evauser.right"
//       )
//       .where("evauser.eva_id", evalu.eva_id)

//     const ind = await db("indicator")
//       .leftJoin(
//         "topic",
//         "indicator.topic_id",
//         "topic.topic_id"
//       )
//       .leftJoin(
//         "score",
//         "indicator.score_id",
//         "score.score_id"
//       )
//       .select(
//         "indicator.ind_id",
//         "indicator.ind_name",
//         "indicator.ind_score",
//         "indicator.score_id",
//         "score.score_max",
//         "score.score_step1",
//         "score.score_step2",
//         "score.score_step3",
//       )
//       .where("indicator.topic_id", evalu.topic_id)

//     evalu.evauser = evau;
//     evalu.indicator = ind;
//     res.status(201).json({
//       success: true,
//       data: {
//         evaluation: evalu
//       }
//     })
//   } catch (e) {
//     next(e);
//   }
// };

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
        "users.u_name",
        "evauser.right",
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
