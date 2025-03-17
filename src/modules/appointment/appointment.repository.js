const pool = require('../../config/connection');

const createAppointment = async ({
  user_id,
  beneficiary_id,
  specialty_id,
  professional_id,
  status,
  notes,
  is_for_beneficiary,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO medical_appointments (user_id, beneficiary_id, status, notes, is_for_beneficiary, professional_id, specialty_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    // Reordenamos los valores para que coincidan con la consulta:
    const values = [
      user_id,
      beneficiary_id,
      status,
      notes,
      is_for_beneficiary,
      professional_id,
      specialty_id,
    ];

    const result = await client.query(insertQuery, values);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(error.message);
  } finally {
    client.release();
  }
};

const createNewAppointment = async ({
  user_id,
  beneficiary_id,
  specialty_id,
  professional_id,
  appointment_date,
  appointment_time,
  duration_minutes = 30,
  status,
  notes,
  is_for_beneficiary,
  first_time,
  control,
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO medical_appointments (user_id, beneficiary_id, status, notes, is_for_beneficiary, professional_id, specialty_id, appointment_date, appointment_time, duration_minutes, first_time, control)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    // Reordenamos los valores para que coincidan con la consulta:
    const values = [
      user_id,
      beneficiary_id,
      status,
      notes,
      is_for_beneficiary,
      professional_id,
      specialty_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      first_time,
      control,
    ];

    const result = await client.query(insertQuery, values);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(error.message);
  } finally {
    client.release();
  }
};


// Obtener una cita por ID
const getAppointment = async (id) => {
  const query = `SELECT * FROM medical_appointments WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const getAppointmentsByUserId = async (id) => {
  const query = `SELECT * FROM medical_appointments WHERE user_id = $1 ORDER BY appointment_date DESC`;
  const result = await pool.query(query, [id]);
  return result.rows;
};


// Actualizar una cita
const updateAppointment = async (id, data) => {
  console.log("🚀 ~ updateAppointment ~ data:", data)
  const {
    appointment_date,
    appointment_time,
    duration_minutes,
    status,
    notes,
    beneficiary_id,
    professional_id,
    specialty_id,
    is_for_beneficiary,
    first_time,
    control,
  } = data;
  
  let setClauses = [];
  let values = [];
  let idx = 1;
  
  if (appointment_date !== undefined) {
    setClauses.push(`appointment_date = $${idx}`);
    values.push(appointment_date);
    idx++;
  }
  if (appointment_time !== undefined) {
    setClauses.push(`appointment_time = $${idx}`);
    values.push(appointment_time);
    idx++;
  }
  if (duration_minutes !== undefined) {
    setClauses.push(`duration_minutes = $${idx}`);
    values.push(duration_minutes);
    idx++;
  }
  if (status !== undefined) {
    setClauses.push(`status = $${idx}`);
    values.push(status);
    idx++;
  }
  if (notes !== undefined) {
    setClauses.push(`notes = $${idx}`);
    values.push(notes);
    idx++;
  }
  if (beneficiary_id !== undefined) {
    setClauses.push(`beneficiary_id = $${idx}`);
    values.push(beneficiary_id);
    idx++;
  }
  if (professional_id !== undefined) {
    setClauses.push(`professional_id = $${idx}`);
    values.push(professional_id);
    idx++;
  }
  if (is_for_beneficiary !== undefined) {
    setClauses.push(`is_for_beneficiary = $${idx}`);
    values.push(is_for_beneficiary);
    idx++;
  }
  if (first_time !== undefined) {
    setClauses.push(`first_time = $${idx}`);
    values.push(first_time);
    idx++;
  }

  if (control !== undefined) {
    setClauses.push(`control = $${idx}`);
    values.push(control);
    idx++;
  }

  if (specialty_id !== undefined) {
    setClauses.push(`specialty_id = $${idx}`);
    values.push(specialty_id);
    idx++;
  }
  
  if (setClauses.length === 0) {
    throw new Error("No hay campos para actualizar");
  }
  
  const query = `UPDATE medical_appointments SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`;
  values.push(id);
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Cancelar una cita
const cancelAppointment = async (id) => {
  const query = `DELETE FROM medical_appointments WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);

  if (result.rows.length > 0) {
    sendNotification(result.rows[0].user_id, 'Su cita ha sido cancelada.');
  }
  return result.rows[0];
};


// Reprogramar una cita
const rescheduleAppointment = async (id, newDate) => {
  const query = `UPDATE medical_appointments SET appointment_date = $1, status = 'RESCHEDULED' WHERE id = $2 RETURNING *`;
  const values = [newDate, id];
  const result = await pool.query(query, values);

  if (result.rows.length > 0) {
    sendNotification(result.rows[0].user_id, 'Su cita ha sido reprogramada.');
  }
  return result.rows[0];
};

// Obtener todas las citas
const getAllAppointments = async () => {
  const query = `SELECT * FROM medical_appointments ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

// Obtener citas por usuario
const getAppointmentsByUser = async (userId) => {
  const query = `SELECT * FROM medical_appointments WHERE user_id = $1 AND is_for_beneficiary = false`;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Obtener citas por beneficiario
const getAppointmentsByBeneficiary = async (beneficiaryId) => {
  const query = `SELECT * FROM medical_appointments WHERE beneficiary_id = $1 AND is_for_beneficiary = true`;
  const result = await pool.query(query, [beneficiaryId]);
  return result.rows;
};

// Obtener citas con filtros avanzados para el call center

const getAppointmentsForCallCenter = async ({
  status,
  startDate,
  endDate,
  beneficiaryId,
  isForBeneficiary,
  page = 1,
  limit = 10,
}) => {
  let query = `SELECT * FROM medical_appointments WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) FROM medical_appointments WHERE 1=1`;
  let values = [];
  let countValues = [];


  // Validar status contra el enum
  const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED"];
  if (status && !validStatuses.includes(status.toUpperCase())) {
    throw new Error("❌ Status inválido");
  }

  if (status) {
    query += ` AND status = $${values.length + 1}`;
    countQuery += ` AND status = $${countValues.length + 1}`;
    values.push(status.toUpperCase());
    countValues.push(status.toUpperCase());
  }

  if (startDate && endDate) {
    query += ` AND appointment_date BETWEEN $${values.length + 1} AND $${values.length + 2}`;
    countQuery += ` AND appointment_date BETWEEN $${countValues.length + 1} AND $${countValues.length + 2}`;
    values.push(new Date(startDate), new Date(endDate));
    countValues.push(new Date(startDate), new Date(endDate));
  }

   // Aplicar filtro de `is_for_beneficiary`
   if (isForBeneficiary !== undefined) {
  query += ` AND is_for_beneficiary = $${values.length + 1}`;
  countQuery += ` AND is_for_beneficiary = $${countValues.length + 1}`;
  values.push(isForBeneficiary);
  countValues.push(isForBeneficiary);
}

  if (beneficiaryId !== null) {
    query += ` AND beneficiary_id = $${values.length + 1}`;
    countQuery += ` AND beneficiary_id = $${countValues.length + 1}`;
    values.push(beneficiaryId); // No need to parse again, it's already an int or null
    countValues.push(beneficiaryId);
}

  query += ` ORDER BY appointment_date ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  try {
    // Obtener citas con filtros y paginación
    const result = await pool.query(query, values);

    // Obtener el total de citas con los mismos filtros
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    return {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: result.rows,
    };
  } catch (error) {
    console.error('❌ Error en consulta SQL:', error);
    throw new Error(`Error en la consulta de citas: ${error.message}`);
  }
};

const expireOldAppointments = async (twoHoursAgo) => {
  const query = `
    UPDATE medical_appointments
    SET status = 'EXPIRED'
    WHERE status = 'PENDING'
      AND created_at < $1
    RETURNING *;
  `;
  const result = await pool.query(query, [twoHoursAgo]);
  return result;
};


// Notificación de eventos
const sendNotification = async (userId, message) => {
  console.log(`Enviando notificación a usuario ${userId}: ${message}`);
};

module.exports = {
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  getAppointmentsByUser,
  getAppointmentsByBeneficiary,
  getAppointmentsForCallCenter,
  sendNotification,
  expireOldAppointments,
  getAppointmentsByUserId,
  createNewAppointment
};
