const repository = require('../gen/generic.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { formatDatesInData } = require('../../utils/date.util');

const createRecord = async (table, data) => {
  console.log("🚀 ~ createRecord ~ data:", data)
  return await repository.createRecord(table, data);
};

const getByBeneficiaryId = async (table, beneficiary_id) => {
  const records = await repository.findByBeneficiaryId(table, beneficiary_id);
  return records.length ? records.map(record => formatDatesInData(record, ['created_at', 'updated_at', 'vaccination_date'])) : [];
};

const getByBeneficiaryIdOrdered = async (table, beneficiary_id, columnDate) => {
  const records = await repository.findByBeneficiaryId(table, beneficiary_id, columnDate);
  return records.length ? records.map(record => formatDatesInData(record, ['created_at', 'updated_at', 'vaccination_date'])) : [];
};

const updateRecord = async (table, id, data) => {
  const existingRecord = await repository.findById(table, id);
  if (!existingRecord) {
    throw new NotFoundError(`${table} no encontrado`);
  }
  return await repository.updateRecord(table, id, data);
};

const removeRecord = async (table, id) => {
  const existingRecord = await repository.findById(table, id);
  if (!existingRecord) {
    throw new NotFoundError(`${table} no encontrado`);
  }
  return await repository.removeRecord(table, id);
};

module.exports = {
  createRecord,
  getByBeneficiaryId,
  updateRecord,
  removeRecord,
  getByBeneficiaryIdOrdered
};