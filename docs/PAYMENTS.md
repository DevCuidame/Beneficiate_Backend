# Documentación: Procesamiento de Pagos 

## 1. Procesamiento de Pagos

### 1.1 Integración con Wompi

El sistema Beneficiate implementa una integración con la pasarela de pagos Wompi para procesar suscripciones a planes. Esta implementación se encuentra en el módulo `wompi` y utiliza el servicio `WompiPaymentService`.

#### 1.1.1 Configuración

```javascript
// src/modules/wompi/user.payment.service.js
constructor() {
  this.wompiPublicKey = process.env.WOMPI_PUBLIC_KEY || '';
  this.wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY || '';
  this.wompiBaseUrl = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
}
```

#### 1.1.2 Flujo de Pago

1. **Creación de Transacción**:
   - El usuario selecciona un plan de suscripción
   - El sistema genera un enlace de pago a través de la API de Wompi
   - Se registra la intención de pago en la base de datos

   ```javascript
   async createPaymentTransaction(amount, currency, userId, planId, userEmail) {
     // Validar que el plan exista
     const planInfo = await this.getPlanDetails(planId);
     
     // Crear referencia única
     const reference = `plan_${planId}_${userId}_${Date.now()}`;
     
     // Preparar payload para Wompi
     const payload = {
       name: `Plan ${planInfo.name}`,
       description: planInfo.description || `Suscripción al plan ${planInfo.name}`,
       // ...otros campos...
     };
     
     // Llamar a la API de Wompi
     const response = await axios.post(`${this.wompiBaseUrl}/payment_links`, payload, { /* headers */ });
     
     // Guardar transacción en base de datos
     await this.saveTransactionLog(userId, planId, transactionId, amount, reference, planInfo.name);
     
     return { /* datos de la transacción */ };
   }
   ```

2. **Webhook para Procesamiento**:
   - Wompi notifica cambios en el estado de la transacción mediante un webhook
   - El sistema verifica la autenticidad de la notificación
   - Si el pago es aprobado, se actualiza el plan del usuario

   ```javascript
   async handleWebhook(payload) {
     const { event, data } = payload;

     if (event === 'transaction.updated') {
       try {
         const transaction = data.transaction;
         
         // Verificar si está aprobada
         if (transaction.status === 'APPROVED') {
           // Obtener el ID del payment_link
           const paymentLinkId = transaction.payment_link_id;
           
           // Buscar en base de datos
           const dbTransaction = /* consulta de BD */;
           
           // Actualizar estado
           await this.updateTransactionStatus(paymentLinkId, 'APPROVED');
           
           // Actualizar plan del usuario
           await this.updateUserPlan(dbTransaction.user_id, dbTransaction.plan_id);
           
           return { success: true };
         }
       } catch (error) {
         // Manejo de errores
       }
     }
     
     return { success: false };
   }
   ```

3. **Verificación de Transacción**:
   - El cliente puede consultar el estado de su transacción
   - El sistema obtiene los detalles actualizados desde Wompi
   - Se actualiza la suscripción si es necesario

#### 1.1.3 Actualización de Plan

Cuando un pago se aprueba, el sistema actualiza automáticamente el plan del usuario:

```javascript
async updateUserPlan(userId, planId) {
  try {
    // Iniciar transacción de BD
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Actualizar plan en tabla users
      const userUpdateQuery = `UPDATE users SET plan_id = $1 WHERE id = $2 RETURNING *`;
      
      // 2. Obtener detalles del plan
      const planResult = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
      const plan = planResult.rows[0];
      
      // 3. Registrar el pago y calcular fechas de vigencia
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + plan.duration_days);
      
      const paymentQuery = `INSERT INTO payments (...) VALUES (...) RETURNING id`;
      await client.query(paymentQuery, [/* valores */]);
      
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
```

### 1.2 Rutas y Controladores de Pago

#### 1.2.1 Rutas de Pagos

```javascript
// src/modules/payments/payments.routes.js
const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.post('/create', authMiddleware, paymentsController.createPayment);
router.get('/verify/:transactionId', authMiddleware, paymentsController.verifyTransaction);
router.get('/history', authMiddleware, paymentsController.getPaymentHistory);
router.get('/verify-details/:transactionId', authMiddleware, paymentsController.verifyTransactionDetails);

// Webhook público para Wompi (no requiere autenticación)
router.post('/webhook/wompi', paymentsController.handleWebhook);

module.exports = router;
```

#### 1.2.2 Controladores de Pago

```javascript
// src/modules/payments/payments.controller.js

// Iniciar proceso de pago
const createPayment = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    // Obtener datos del usuario y plan
    const user = await userService.getUserById(userId);
    const plan = await planService.getPlanById(planId);
    
    // Iniciar transacción de pago
    const transaction = await wompiService.createPaymentTransaction(
      plan.price, 'COP', userId, planId, user.email
    );
    
    res.json({
      transactionId: transaction.id,
      publicKey: wompiService.wompiPublicKey,
      redirectUrl: transaction.data?.checkout_url,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
};

// Webhook para Wompi
const handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (event !== 'transaction.updated') {
      return res.json({ success: false, message: 'Evento no procesable' });
    }
    
    // Procesar actualización de transacción
    // ...
    
    return res.json({ success: true });
  } catch (error) {
    // Siempre responder con 200 para confirmar recepción a Wompi
    return res.json({ success: false, error: error.message });
  }
};
```

### 1.3 Seguridad en Pagos

- **Manejo de Errores**: Clase `PaymentError` para errores específicos de pago
- **Transacciones de BD**: Asegura la integridad de los datos de pago
- **Verificación de Estados**: Verifica la autenticidad de las notificaciones de Wompi
