const WompiPaymentService = require('../wompi/user.payment.service');
const userService = require('../users/user.service');
const planService = require('../plans/plan.service');
const pool = require('../../config/connection');
const wompiService = new WompiPaymentService();

// Iniciar proceso de pago
const createPayment = async (req, res) => {
  try {
    console.log('Iniciando proceso de pago con datos:', req.body);
    const { planId } = req.body;
    const userId = req.user.id; // Asumiendo que tienes middleware de autenticación

    console.log(`Procesando pago - Usuario: ${userId}, Plan: ${planId}`);

    // Obtener email del usuario
    const user = await userService.getUserById(userId);
    if (!user) {
      console.error(`Usuario no encontrado: ${userId}`);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener detalles del plan
    const plan = await planService.getPlanById(planId);

    if (!plan) {
      console.error(`Plan no encontrado: ${planId}`);
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    console.log('Datos del plan:', plan);

    // Iniciar transacción de pago
    const transaction = await wompiService.createPaymentTransaction(
      plan.price, // Precio del plan
      'COP', // Moneda
      userId, // ID del usuario
      planId, // ID del plan
      user.email // Email del usuario
    );

    console.log('Transacción creada exitosamente:', transaction.id);

    // Estructura de respuesta para el cliente
    const response = {
      transactionId: transaction.id,
      publicKey: wompiService.wompiPublicKey,
      redirectUrl: transaction.data?.checkout_url,
    };

    console.log('Enviando respuesta al cliente:', response);

    if (!response.redirectUrl) {
      console.error('URL de redirección no disponible');
      return res
        .status(500)
        .json({ error: 'No se pudo generar la URL de pago' });
    }

    res.json(response);
  } catch (error) {
    console.error('Error creando pago:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
};

// Webhook para Wompi
const handleWebhook = async (req, res) => {
  try {
    console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

    // Verificar que sea un evento de actualización de transacción
    const { event, data, environment } = req.body;

    if (event !== 'transaction.updated') {
      console.log(`Evento ignorado: ${event}`);
      return res.json({ success: false, message: 'Evento no procesable' });
    }

    if (!data || !data.transaction) {
      console.log('Webhook sin datos de transacción');
      return res.json({ success: false, message: 'Datos incompletos' });
    }

    const transaction = data.transaction;
    console.log(
      'Datos de transacción recibidos:',
      JSON.stringify(transaction, null, 2)
    );

    // Verificar estado de la transacción
    if (transaction.status !== 'APPROVED') {
      console.log(`Transacción no aprobada: ${transaction.status}`);
      return res.json({ success: false, status: transaction.status });
    }

    // Extraer el ID del payment link
    const paymentLinkId = transaction.payment_link_id;
    if (!paymentLinkId) {
      console.log('No se encontró ID de payment link');
      return res.json({ success: false, message: 'Datos incompletos' });
    }

    console.log(`Payment Link ID: ${paymentLinkId}`);

    // Buscar en base de datos
    const query = `
      SELECT ut.user_id, ut.plan_id, ut.status, p.name as plan_name
      FROM user_transactions ut
      JOIN plans p ON ut.plan_id = p.id
      WHERE ut.transaction_id = $1
    `;

    const result = await pool.query(query, [paymentLinkId]);

    if (result.rows.length === 0) {
      console.log(`No se encontró transacción en BD: ${paymentLinkId}`);
      return res.json({ success: false, message: 'Transacción no encontrada' });
    }

    const dbTransaction = result.rows[0];

    // Si ya está aprobada, no hacer nada
    if (dbTransaction.status === 'APPROVED') {
      console.log('Transacción ya estaba aprobada en la BD');
      return res.json({ success: true, message: 'Ya procesada' });
    }

    // Actualizar estado en la BD
    await pool.query(
      `UPDATE user_transactions SET status = $1, updated_at = NOW() WHERE transaction_id = $2`,
      ['APPROVED', paymentLinkId]
    );

    // Actualizar plan del usuario
    await wompiService.updateUserPlan(
      dbTransaction.user_id,
      dbTransaction.plan_id
    );

    console.log(
      `Plan ${dbTransaction.plan_name} activado para usuario ${dbTransaction.user_id}`
    );

    return res.json({
      success: true,
      message: 'Plan activado correctamente',
      userId: dbTransaction.user_id,
      planId: dbTransaction.plan_id,
      planName: dbTransaction.plan_name,
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    // Responder siempre 200 para que Wompi considere entregado el webhook
    return res.json({
      success: false,
      error: error.message,
      message: 'Error interno procesando webhook',
    });
  }
};

// Verificar estado de transacción
const verifyTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log(`Verificando transacción: ${transactionId}`);

    // Obtener detalles de la transacción
    const transaction = await wompiService.getTransactionDetails(transactionId);
    console.log('Estado de transacción:', transaction.status);

    // Verificar si está aprobada
    const isApproved = transaction.status === 'APPROVED';

    // Si está aprobada y no se ha actualizado en nuestra base, actualizarla
    if (isApproved) {
      // Extraer referencia del link (si existe)
      const reference = transaction.reference;
      if (reference && reference.startsWith('plan_')) {
        const parts = reference.split('_');
        if (parts.length >= 3) {
          const planId = parts[1];
          const userId = parts[2].split('_')[0]; // Por si tiene timestamp

          // Actualizar el plan del usuario
          await wompiService.updateUserPlan(userId, planId);
        }
      }
    }

    res.json({ success: isApproved });
  } catch (error) {
    console.error('Error verificando transacción:', error);
    res.status(500).json({ error: 'Error verificando transacción' });
  }
};

// Obtener historial de pagos
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo middleware de autenticación
    console.log(`Obteniendo historial de pagos para usuario: ${userId}`);

    const history = await wompiService.getUserPaymentHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error obteniendo historial de pagos' });
  }
};

const simulateWebhook = async (req, res) => {
  const { transactionId, status } = req.body;
  // Procesar como si fuera un webhook real
  await processTransaction(transactionId, status);
  res.json({ success: true });
};

// Añade este método en payments.controller.js
const getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Buscar en nuestra base de datos
    const query = `
      SELECT * FROM user_transactions WHERE transaction_id = $1
    `;

    const result = await pool.query(query, [transactionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Transacción no encontrada',
        transactionId,
      });
    }

    // Obtener detalles de Wompi
    const wompiDetails = await wompiService.getTransactionDetails(
      transactionId
    );

    res.json({
      localTransaction: result.rows[0],
      wompiDetails,
    });
  } catch (error) {
    console.error('Error obteniendo estado de transacción:', error);
    res.status(500).json({ error: 'Error obteniendo detalles de transacción' });
  }
};

const verifyTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log(`Verificando detalles de transacción: ${transactionId}`);

    if (!transactionId) {
      return res.json({
        success: false,
        statusMessage: 'ID de transacción no proporcionado',
      });
    }

    // Primero verificar si existe en nuestra BD
    try {
      const query = `
        SELECT 
          ut.transaction_id, 
          ut.status, 
          ut.user_id, 
          ut.plan_id,
          p.name as plan_name,
          p.description as plan_description,
          p.duration_days,
          u.email as user_email
        FROM user_transactions ut
        JOIN plans p ON ut.plan_id = p.id
        JOIN users u ON ut.user_id = u.id
        WHERE ut.transaction_id = $1
      `;

      const result = await pool.query(query, [transactionId]);

      if (result.rows.length === 0) {
        console.log(`Transacción ${transactionId} no encontrada en BD local`);
        return res.json({
          success: false,
          statusMessage: 'Transacción no encontrada en la base de datos',
        });
      }

      const transaction = result.rows[0];

      // Si ya está aprobada en nuestra base de datos
      if (transaction.status === 'APPROVED') {
        console.log(`Transacción ${transactionId} ya aprobada en BD local`);
        return res.json({
          success: true,
          planId: transaction.plan_id,
          planName: transaction.plan_name,
          planDescription: transaction.plan_description,
          statusMessage: 'Pago aprobado y plan asignado',
        });
      }

      // Si no está aprobada, consultar a Wompi
      try {
        console.log(
          `Consultando estado en Wompi para transacción ${transactionId}`
        );
        const wompiDetails = await wompiService.getTransactionDetails(
          transactionId
        );

        // Asegurarse de que wompiDetails tenga un estado
        const wompiStatus =
          wompiDetails?.status || wompiDetails?.data?.status || 'PENDING';
        console.log(`Estado en Wompi: ${wompiStatus}`);

        const isApproved = wompiStatus === 'APPROVED';

        if (isApproved) {
          // Actualizar estado en la BD
          await pool.query(
            `UPDATE user_transactions SET status = 'APPROVED', updated_at = NOW() WHERE transaction_id = $1`,
            [transactionId]
          );

          // Actualizar plan del usuario
          await wompiService.updateUserPlan(
            transaction.user_id,
            transaction.plan_id
          );

          console.log(`Plan actualizado para usuario ${transaction.user_id}`);

          return res.json({
            success: true,
            planId: transaction.plan_id,
            planName: transaction.plan_name,
            planDescription: transaction.plan_description,
            statusMessage: 'Pago aprobado y plan asignado',
          });
        } else {
          return res.json({
            success: false,
            planId: transaction.plan_id,
            planName: transaction.plan_name,
            statusMessage: `Estado del pago: ${wompiStatus}`,
          });
        }
      } catch (wompiError) {
        console.error('Error consultando Wompi:', wompiError);

        // Devolver una respuesta de error más detallada pero sin fallar
        return res.json({
          success: false,
          planId: transaction.plan_id,
          planName: transaction.plan_name,
          statusMessage: 'Error consultando el estado en Wompi',
          errorDetails: wompiError.message,
        });
      }
    } catch (dbError) {
      console.error('Error de BD:', dbError);
      return res.json({
        success: false,
        statusMessage: 'Error accediendo a la base de datos',
        errorDetails: dbError.message,
      });
    }
  } catch (error) {
    console.error('Error general verificando detalles de transacción:', error);
    // Responder con 200 pero indicando error en vez de 500
    return res.json({
      success: false,
      error: 'Error verificando transacción',
      statusMessage: 'Error interno del servidor',
      errorDetails: error.message,
    });
  }
};

module.exports = {
  createPayment,
  handleWebhook,
  verifyTransaction,
  getPaymentHistory,
  simulateWebhook,
  getTransactionStatus,
  verifyTransactionDetails,
};
