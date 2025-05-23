const axios = require('axios');
const crypto = require('crypto');
const pool = require('../../config/connection');
const { PaymentError } = require('../../core/errors');

class WompiPaymentService {
  constructor() {
    this.wompiPublicKey = process.env.WOMPI_PUBLIC_KEY || '';
    this.wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY || '';
    this.wompiBaseUrl =
      process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
  }

  // Generar link de pago
  async createPaymentTransaction(amount, currency, userId, planId, userEmail) {
    try {


      // Validar que el plan exista y el monto sea correcto
      const planInfo = await this.getPlanDetails(planId);

      if (!planInfo) {
        throw new PaymentError('El plan seleccionado no existe');
      }

      // Parsear el precio correctamente
      // Eliminar puntos y comas para manejar formato como "250.000" o "250,000"
      const cleanPrice = planInfo.price
        .toString()
        .replace(/\./g, '')
        .replace(/,/g, '');

      // Convertir a número y luego a centavos
      const priceInCents = parseInt(cleanPrice);



      // Crear referencia única
      const reference = `plan_${planId}_${userId}_${Date.now()}`;

      // La nueva API de Wompi utiliza payment_links para crear enlaces de pago
      const payload = {
        name: `Plan ${planInfo.name}`,
        description:
          planInfo.description || `Suscripción al plan ${planInfo.name}`,
        single_use: true,
        currency,
        amount_in_cents: priceInCents,
        redirect_url:
          process.env.WOMPI_REDIRECT_URL ||
          'https://beneficiate.co/home-desktop',
        expires_at: this.getExpirationDate(),
        collect_shipping: false,
        sku: `PLAN-${planId}`,
        customs: [
          {
            key: 'user_id',
            value: userId.toString(),
          },
          {
            key: 'plan_id',
            value: planId.toString(),
          },
          {
            key: 'email',
            value: userEmail,
          },
        ],
      };



      const response = await axios.post(
        `${this.wompiBaseUrl}/payment_links`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.wompiPrivateKey}`,
            'Content-Type': 'application/json',
          },
        }
      );


      // Extraer correctamente el ID de la transacción
      const transactionId = response.data.data?.id || response.data.id;

      if (!transactionId) {
        console.error('No se pudo obtener ID de transacción de la respuesta');
        throw new PaymentError('Error obteniendo ID de transacción');
      }


      // Guardar transacción en base de datos
      await this.saveTransactionLog(
        userId,
        planId,
        transactionId,
        planInfo.price,
        reference,
        planInfo.name,
        currency
      );

      // Extraer la URL de pago correctamente
      const checkoutUrl =
        response.data.data?.url ||
        response.data.url ||
        `https://checkout.wompi.co/l/${transactionId}`;

      return {
        id: transactionId,
        data: {
          checkout_url: checkoutUrl,
        },
      };
    } catch (error) {
      // Asegurarse de acceder correctamente a los detalles del error
      const errorDetail = error.response?.data || error.message;
      console.error('Error creando transacción:', errorDetail);

      // Si es un error de validación, mostrar detalles específicos
      if (errorDetail && errorDetail.error) {
        console.error(
          'Detalles del error:',
          JSON.stringify(errorDetail.error, null, 2)
        );
      }

      throw new PaymentError('No se pudo crear la transacción de pago');
    }
  }

  // Obtener fecha de expiración (24 horas desde ahora)
  getExpirationDate() {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString();
  }

  // Obtener detalles del plan
  async getPlanDetails(planId) {
    try {
      const query =
        'SELECT id, name, price, description FROM plans WHERE id = $1';
      const result = await pool.query(query, [planId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error obteniendo detalles del plan:', error);
      return null;
    }
  }

  // Verificar firma y estado de transacción
  async validateWompiPayment(transactionId, signature) {
    try {
      // Obtener detalles de la transacción
      const transactionResponse = await axios.get(
        `${this.wompiBaseUrl}/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.wompiPrivateKey}`,
          },
        }
      );

      const transaction =
        transactionResponse.data.data || transactionResponse.data;

      // Verificar firma
      const expectedSignature = this.generateSignature(transaction);

      const isValid =
        expectedSignature === signature && transaction.status === 'APPROVED';

      // Actualizar estado de transacción
      await this.updateTransactionStatus(
        transactionId,
        transaction.status,
        isValid
      );

      return isValid;
    } catch (error) {
      console.error('Error validando pago:', error);
      return false;
    }
  }

  // Webhook para procesar pagos
  async handleWompiWebhook(payload) {
    const { event, data, timestamp, signature, environment } = payload;

    if (event === 'transaction.updated') {
      try {
        // Extraer datos de la transacción
        const transaction = data.transaction;

        // Verificar si está aprobada
        if (transaction.status === 'APPROVED') {
          // Obtener el ID del payment_link
          const paymentLinkId = transaction.payment_link_id;

          if (!paymentLinkId) {
            console.error('No se encontró paymentLinkId en el webhook');
            return { success: false };
          }

          // Buscar en nuestra base de datos la transacción correspondiente
          const query = `
          SELECT user_id, plan_id 
          FROM user_transactions 
          WHERE transaction_id = $1
        `;

          const result = await pool.query(query, [paymentLinkId]);

          if (result.rows.length === 0) {
            console.error(
              `No se encontró la transacción con ID: ${paymentLinkId}`
            );
            return { success: false };
          }

          const { user_id, plan_id } = result.rows[0];

          if (user_id && plan_id) {
            // Actualizar plan de usuario
            await this.updateUserPlan(user_id, plan_id);
            return { success: true };
          } else {
            console.error(
              'No se pudieron extraer userId y planId de la transacción en BD'
            );
            return { success: false };
          }
        } else {
          return { success: false };
        }
      } catch (error) {
        console.error('Error procesando webhook:', error);
        throw new PaymentError('Error procesando webhook de Wompi');
      }
    } else {
      return { success: false, message: 'Evento no procesable' };
    }
  }

  // Actualizar plan de usuario después de pago
  async updateUserPlan(userId, planId) {
    try {
      // Iniciar transacción
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // 1. Actualizar tabla users
        const userUpdateQuery = `
          UPDATE users 
          SET plan_id = $1
          WHERE id = $2
          RETURNING *
        `;

        const userResult = await client.query(userUpdateQuery, [
          planId,
          userId,
        ]);

        if (userResult.rows.length === 0) {
          throw new PaymentError('Usuario no encontrado');
        }

        // 2. Obtener detalles del plan
        const planResult = await client.query(
          'SELECT * FROM plans WHERE id = $1',
          [planId]
        );

        if (planResult.rows.length === 0) {
          throw new PaymentError('Plan no encontrado');
        }

        const plan = planResult.rows[0];

        // 3. Registrar el pago
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + plan.duration_days);

        const paymentQuery = `
          INSERT INTO payments (
            user_id, 
            plan_id, 
            amount, 
            payment_method, 
            status,
            start_date,
            end_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        await client.query(paymentQuery, [
          userId,
          planId,
          plan.price,
          'WOMPI',
          'APPROVED',
          now,
          endDate,
        ]);

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error actualizando plan de usuario:', error);
      throw new PaymentError('No se pudo actualizar el plan de usuario');
    }
  }

  // Guardar log de transacción
  async saveTransactionLog(
    userId,
    planId,
    transactionId,
    amount,
    reference,
    planName = '',
    currency = 'COP'
  ) {
    try {


      const query = `
      INSERT INTO user_transactions (
        user_id, 
        plan_id, 
        transaction_id, 
        amount, 
        reference, 
        status,
        plan_name,
        currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

      await pool.query(query, [
        userId,
        planId,
        transactionId,
        amount,
        reference,
        'PENDING',
        planName,
        currency,
      ]);

    } catch (error) {
      console.error('Error guardando log de transacción:', error);
    }
  }

  // Actualizar estado de transacción
  async updateTransactionStatus(transactionId, status, isValid) {
    try {
      const query = `
        UPDATE user_transactions 
        SET status = $1, 
            is_valid = $2,
            updated_at = NOW() 
        WHERE transaction_id = $3
      `;

      await pool.query(query, [status, isValid, transactionId]);
    } catch (error) {
      console.error('Error actualizando estado de transacción:', error);
    }
  }

  // Generar firma para validación
  generateSignature(transaction) {
    const signatureData = `${transaction.id}${transaction.status}${transaction.amount_in_cents}`;
    return crypto
      .createHmac('sha256', this.wompiPrivateKey)
      .update(signatureData)
      .digest('hex');
  }

async getTransactionDetails(transactionId) {
  try {
    
    // Primero intentar como payment_link
    try {
      const response = await axios.get(
        `${this.wompiBaseUrl}/payment_links/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.wompiPrivateKey}`
          }
        }
      );
      
      
      // Extraer data anidada si existe
      const linkData = response.data.data || response.data;
      
      // Buscar transacciones asociadas a este payment link
      try {
        const txResponse = await axios.get(
          `${this.wompiBaseUrl}/transactions?payment_link_id=${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${this.wompiPrivateKey}`
            }
          }
        );
        
        const transactions = txResponse.data?.data || [];
        
        if (transactions.length > 0) {
          // Ordenar por fecha descendente
          transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const latestTx = transactions[0];
          
          // Combinar datos del link con la transacción más reciente
          return {
            ...linkData,
            status: latestTx.status,
            transaction: latestTx
          };
        }
      } catch (txError) {
      }
      
      // Si no hay transacciones o falló la búsqueda, devolver el payment link
      return {
        ...linkData,
        status: 'PENDING' // Asumimos pendiente si no hay transacciones
      };
    } catch (linkError) {
      
      // Si falla como payment link, intentar como transacción
      const response = await axios.get(
        `${this.wompiBaseUrl}/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.wompiPrivateKey}`
          }
        }
      );
      
      const txData = response.data.data || response.data;
      
      return txData;
    }
  } catch (error) {
    console.error('Error obteniendo detalles de la transacción:', error.message);
    // En vez de fallar, devolver un objeto con estado predeterminado
    return {
      id: transactionId,
      status: 'UNKNOWN',
      error: error.message
    };
  }
}

  // Obtener historial de pagos de un usuario
  async getUserPaymentHistory(userId) {
    try {
      const query = `
        SELECT p.id, p.user_id, p.plan_id, p.amount, p.payment_method, 
               p.status, p.start_date, p.end_date, p.created_at,
               pl.name as plan_name, pl.description as plan_description
        FROM payments p
        JOIN plans pl ON p.plan_id = pl.id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      throw new PaymentError('No se pudo obtener el historial de pagos');
    }
  }
}

module.exports = WompiPaymentService;
