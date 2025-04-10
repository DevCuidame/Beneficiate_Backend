const axios = require('axios');
const crypto = require('crypto');
const pool = require('../../config/connection'); 
const { PaymentError } = require('../../core/errors');

class WompiPaymentService {
  constructor() {
    this.wompiPublicKey = process.env.WOMPI_PUBLIC_KEY || '';
    this.wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY || '';
    this.wompiBaseUrl = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
  }

  // Generar transacción de pago
  async createPaymentTransaction(amount, currency, userId, planId, userEmail) {
    try {


      // Validar que el plan exista y el monto sea correcto
      const planInfo = await this.getPlanDetails(planId);
      
      if (!planInfo) {
        throw new PaymentError('El plan seleccionado no existe');
      }
      
      // Crear referencia única
      const reference = `plan_${planId}_${userId}_${Date.now()}`;

      // El payload correcto según la documentación de Wompi
      const payload = {
        amount_in_cents: Math.round(parseFloat(amount) * 100), // Convertir a centavos
        currency,
        customer_email: userEmail || 'usuario@ejemplo.com',
        reference: reference,
        redirect_url: process.env.WOMPI_REDIRECT_URL || 'https://tuapp.com/payment/callback',
        // Wompi requiere que especifiques redirect_url
        
        // El método de pago debe estar dentro de un objeto de configuración
        payment_source_information: null, // Para que se muestre la página de selección de método
        
        // La siguiente línea no usar payment_method directo, usar payment_method_type
        payment_method_type: 'CARD'
      };


      const response = await axios.post(
        `${this.wompiBaseUrl}/payment_links`, // Usar payment_links en lugar de transactions
        payload, 
        {
          headers: {
            'Authorization': `Bearer ${this.wompiPrivateKey}`,
            'Content-Type': 'application/json'
          }
        }
      );


      // Guardar transacción en base de datos
      await this.saveTransactionLog(
        userId, 
        planId, 
        response.data.id, 
        amount, 
        reference,
        planInfo.name
      );

      return response.data;
    } catch (error) {
      // Asegurarse de acceder correctamente a los detalles del error
      const errorDetail = error.response?.data || error.message;
      console.error('Error creando transacción:', errorDetail);
      
      // Si es un error de validación, mostrar detalles específicos
      if (errorDetail && errorDetail.error && errorDetail.error.type === 'INPUT_VALIDATION_ERROR') {
        console.error('Detalles de validación:', JSON.stringify(errorDetail.error.messages, null, 2));
      }
      
      throw new PaymentError('No se pudo crear la transacción de pago');
    }
  }

  // Obtener detalles del plan
  async getPlanDetails(planId) {
    try {
      const query = 'SELECT id, name, price, description FROM plans WHERE id = $1';
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
        `${this.wompiBaseUrl}/payment_links/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.wompiPrivateKey}`
          }
        }
      );

      const transaction = transactionResponse.data;

      // Verificar firma
      const expectedSignature = this.generateSignature(transaction);
      
      const isValid = expectedSignature === signature && 
                      transaction.status === 'APPROVED';

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
    const { event, data } = payload;

    if (event === 'transaction.updated') {
      try {
        const isValid = await this.validateWompiPayment(
          data.transaction.id, 
          data.transaction.signature
        );

        if (isValid) {
          // Extraer información de referencia
          const [_, planId, userId] = data.transaction.reference.split('_');
          
          // Actualizar plan de usuario
          await this.updateUserPlan(userId, planId);
        }

        return { success: isValid };
      } catch (error) {
        console.error('Error procesando webhook:', error);
        throw new PaymentError('Error procesando webhook de Wompi');
      }
    }

    return { success: false };
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
        
        const userResult = await client.query(userUpdateQuery, [planId, userId]);
        
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
          endDate
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
  async saveTransactionLog(userId, planId, transactionId, amount, reference, planName = '') {
    try {
      const query = `
        INSERT INTO user_transactions (
          user_id, 
          plan_id, 
          transaction_id, 
          amount, 
          reference, 
          status,
          plan_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await pool.query(query, [
        userId, 
        planId, 
        transactionId, 
        amount, 
        reference, 
        'PENDING',
        planName
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

  // Obtener detalles de transacción
  async getTransactionDetails(transactionId) {
    try {
      // Para payment links (no transacciones)
      const response = await axios.get(
        `${this.wompiBaseUrl}/payment_links/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.wompiPrivateKey}`
          }
        }
      );
  
      
      // Para payment links, necesitamos verificar las transacciones asociadas
      if (response.data.data) {
        // Buscar transacciones asociadas al payment link
        const transactionsResponse = await axios.get(
          `${this.wompiBaseUrl}/transactions?payment_link_id=${transactionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.wompiPrivateKey}`
            }
          }
        );
        

        // Si hay transacciones, usar el estado de la más reciente
        const transactions = transactionsResponse.data?.data;
        if (transactions && transactions.length > 0) {
          // Ordenar por fecha (la más reciente primero)
          transactions.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at));
          
          return {
            ...response.data.data,
            status: transactions[0].status
          };
        }
        
        // Si no hay transacciones, devolver el estado del payment link
        return {
          ...response.data.data,
          status: 'PENDING' // Link sin transacciones = pendiente
        };
      }
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error obteniendo detalles de transacción:', 
        error.response?.data || error.message);
      
      // Intentar como transacción directa si falla como payment link
      try {
        const response = await axios.get(
          `${this.wompiBaseUrl}/transactions/${transactionId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.wompiPrivateKey}`
            }
          }
        );
        return response.data.data || response.data;
      } catch (secondError) {
        console.error('Error en segundo intento:', 
          secondError.response?.data || secondError.message);
        throw new PaymentError('No se pudieron obtener los detalles de la transacción');
      }
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