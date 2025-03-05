const WompiPaymentService = require('../modules/wompi/wompi.payment.service');
const pool = require('../config/connection');
const axios = require('axios');

// Configuración para pruebas con base de datos real
jest.mock('axios');

// Identificadores para prueba
const TEST_USER_ID = 9;
const TEST_PLAN_ID = 1;
const TEST_TRANSACTION_ID = `test_trans_${Date.now()}`;

/**
 * Test para validar la integración completa con tablas de usuario, planes y pagos
 */
describe('WompiPaymentService - Integración Completa', () => {
  let wompiService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_TEST_MODE = 'true';
    
    try {
      const client = await pool.connect();
      console.log('✅ Conexión a BD de pruebas establecida');
      client.release();
    } catch (error) {
      console.error('Error conectando a BD de pruebas:', error);
      throw new Error('No se pudo conectar a la BD de pruebas');
    }
    
    await cleanupTestData();
  });

  beforeEach(() => {
    wompiService = new WompiPaymentService();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  async function cleanupTestData() {
    try {
      await pool.query('DELETE FROM user_transactions WHERE transaction_id LIKE $1', ['test_%']);
      await pool.query('DELETE FROM payments WHERE user_id = $1', [TEST_USER_ID]);
      await pool.query('UPDATE users SET plan_id = $1 WHERE id = $2', [TEST_PLAN_ID, TEST_USER_ID]);
      console.log('✅ Datos de prueba limpiados');
    } catch (error) {
      console.error('Error limpiando datos de prueba:', error);
    }
  }

  describe('Validación de Precios y Registro de Pagos', () => {
    it('debe validar el precio del plan antes de crear la transacción', async () => {
      // 1. Obtener el precio real del plan
      const planResult = await pool.query('SELECT price FROM plans WHERE id = $1', [TEST_PLAN_ID]);
      const correctPrice = parseFloat(planResult.rows[0].price);
      const incorrectPrice = correctPrice + 100;
      
      // 2. Mock para getPlanDetails
      const mockPlan = {
        id: TEST_PLAN_ID,
        name: 'Plan Test',
        price: correctPrice,
        description: 'Plan para pruebas'
      };
      
      // 3. Spy en console.warn para verificar la advertencia
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      
      // 4. Mock de respuesta de Wompi
      const mockResponse = {
        id: TEST_TRANSACTION_ID,
        status: 'PENDING',
        data: { checkout_url: 'https://sandbox.wompi.co/checkout' }
      };
      axios.post.mockResolvedValue({ data: mockResponse });
      
      // 5. Sobrescribir getPlanDetails para evitar consulta a BD
      wompiService.getPlanDetails = jest.fn().mockResolvedValue(mockPlan);
      
      // 6. Ejecutar con precio incorrecto
      await wompiService.createPaymentTransaction(
        incorrectPrice, 
        'COP', 
        TEST_USER_ID, 
        TEST_PLAN_ID, 
        'test@example.com'
      );
      
      // 7. Verificar que se emitió advertencia
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Advertencia: El monto');
      
      // Limpieza
      consoleWarnSpy.mockRestore();
    });

    it('debe registrar el pago en la tabla payments al actualizar el plan', async () => {
      // 1. ID de plan premium para la prueba
      const PREMIUM_PLAN_ID = 2;
      
      // 2. Crear transacción ficticia
      const testReference = `plan_${PREMIUM_PLAN_ID}_${TEST_USER_ID}_${Date.now()}`;
      const uniqueTransactionId = `test_trans_payment_${Date.now()}`;
      
      await pool.query(`
        INSERT INTO user_transactions (
          user_id, plan_id, transaction_id, amount, reference, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        TEST_USER_ID,
        PREMIUM_PLAN_ID,
        uniqueTransactionId,
        50000,
        testReference,
        'PENDING'
      ]);
      
      // 3. Actualizar plan de usuario
      await wompiService.updateUserPlan(TEST_USER_ID, PREMIUM_PLAN_ID);
      
      // 4. Verificar registro en tabla payments
      const paymentResult = await pool.query(
        'SELECT * FROM payments WHERE user_id = $1 AND plan_id = $2',
        [TEST_USER_ID, PREMIUM_PLAN_ID]
      );
      
      // 5. Verificaciones
      expect(paymentResult.rows.length).toBeGreaterThan(0);
      expect(paymentResult.rows[0].user_id).toBe(TEST_USER_ID);
      expect(paymentResult.rows[0].plan_id).toBe(PREMIUM_PLAN_ID);
      expect(paymentResult.rows[0].status).toBe('APPROVED');
      expect(paymentResult.rows[0].payment_method).toBe('WOMPI');
      
      // 6. Verificar fechas
      expect(paymentResult.rows[0].start_date).toBeDefined();
      expect(paymentResult.rows[0].end_date).toBeDefined();
      
      // Calcular la duración en días
      const startDate = new Date(paymentResult.rows[0].start_date);
      const endDate = new Date(paymentResult.rows[0].end_date);
      const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // 7. Obtener duración esperada del plan
      const planResult = await pool.query(
        'SELECT duration_days FROM plans WHERE id = $1',
        [PREMIUM_PLAN_ID]
      );
      
      const expectedDuration = planResult.rows[0].duration_days;
      
      // 8. Verificar que la duración sea correcta
      expect(durationDays).toBe(expectedDuration);
    });
  });
});