// repositories/indicatorEvidence.js
const db = require('../db/knex');

exports.mapExists = async ({ indicator_id, evidence_type_id }) => {// เช็คว่ามี mapping นี้ในตาราง indicator_evidence หรือไม่
  const row = await db('indicator_evidence')
    .where({ indicator_id, evidence_type_id })
    .first();
  return !!row;
};
