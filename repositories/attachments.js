// repositories/attachments.js
const db = require('../db/knex');

const TABLE = 'attachments';

exports.create = async (payload) => {
  const [id] = await db(TABLE).insert(payload);
  return exports.findById(id);
};

exports.findById = async (id) => {
  return db(TABLE).where({ id }).first();
};

exports.listMine = async ({ evaluatee_id, period_id, indicator_id }) => {
  let q = db(TABLE).where({ evaluatee_id });
  if (period_id) q = q.andWhere({ period_id });
  if (indicator_id) q = q.andWhere({ indicator_id });
  return q.orderBy('created_at', 'desc');
};

exports.listAdmin = async (filters = {}) => {
  let q = db(TABLE);
  if (filters.period_id) q = q.where({ period_id: filters.period_id });
  if (filters.evaluatee_id) q = q.where({ evaluatee_id: filters.evaluatee_id });
  if (filters.indicator_id) q = q.where({ indicator_id: filters.indicator_id });
  return q.orderBy('created_at', 'desc');
};

exports.removeByOwner = async ({ id, evaluatee_id }) => {
  return db(TABLE).where({ id, evaluatee_id }).del();
};

exports.removeByAdmin = async (id) => {
  return db(TABLE).where({ id }).del();
};
