const WompiPaymentService = require('../wompi/user.payment.service');
const userService = require('../users/user.service');
const planService = require('../plans/plan.service');

const wompiService = new WompiPaymentService();

// Iniciar proceso de pago
const createPayment = async (req, res) => {
  try {
    console.log('Iniciando proceso de pago con datos:', req.body);
    const { planId } = req.body;
    const userId = req.user.id;  // Asumiendo que tienes middleware de autenticación

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
      plan.price,  // Precio del plan
      'COP',      // Moneda
      userId,     // ID del usuario
      planId,     // ID del plan
      user.email  // Email del usuario
    );

    console.log('Transacción creada exitosamente:', transaction.id);

    // Estructura de respuesta para el cliente
    const response = {
      transactionId: transaction.id,
      publicKey: wompiService.wompiPublicKey,
      redirectUrl: transaction.data?.checkout_url
    };

    console.log('Enviando respuesta al cliente:', response);
    
    if (!response.redirectUrl) {
      console.error('URL de redirección no disponible');
      return res.status(500).json({ error: 'No se pudo generar la URL de pago' });
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
    const result = await wompiService.handleWompiWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
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
    const userId = req.user.id;  // Asumiendo middleware de autenticación
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

module.exports = {
  createPayment,
  handleWebhook,
  verifyTransaction,
  getPaymentHistory,
  simulateWebhook
};