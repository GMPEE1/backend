// repositories/assignments.js
const db = require('../db/knex');
const TABLE = 'assignments';

// ยืนยันว่า evaluatee อยู่ในงวดนั้น (ไม่ผูก evaluator)
exports.hasEvaluateeInPeriod = async ({ period_id, evaluatee_id }) => {
  const row = await db(TABLE).where({ period_id, evaluatee_id }).first();
  return !!row;
};

// ยืนยันสิทธิ evaluator ต่อ evaluatee ในงวดนั้น
exports.hasPairInPeriod = async ({ period_id, evaluator_id, evaluatee_id }) => {
  const row = await db(TABLE)
    .where({ period_id, evaluator_id, evaluatee_id })
    .first();
  return !!row;
};
