const request = require('supertest');
const express = require('express');
const WompiPaymentService = require('../modules/wompi/wompi.payment.service');

// Crear una mini-app para pruebas
const createTestApp = (wompiService) => {
  const app = express();
  app.use(express.json());
  
  // Rutas de prueba
  app.post('/payments/create', async (req, res) => {
    try {
      const { userId, planId, amount, currency, email } = req.body;
      const result = await wompiService.createPaymentTransaction(
        amount, 
        currency, 
        userId, 
        planId, 
        email
      );
      
      res.json({
        transactionId: result.id,
        publicKey: wompiService.wompiPublicKey,
        redirectUrl: result.data?.checkout_url || '#'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/webhooks/wompi', async (req, res) => {
    try {
      const result = await wompiService.handleWompiWebhook(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  return app;
};

// Configurar mocks
jest.mock('axios');
jest.mock('../config/connection', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  connect: jest.fn().mockImplementation(() => ({
    release: jest.fn()
  }))
}));

// Configurar variables de entorno para las pruebas
process.env.NODE_ENV = 'test';
process.env.WOMPI_PUBLIC_KEY = 'pub_test_dummy_key';
process.env.WOMPI_PRIVATE_KEY = 'prv_test_dummy_key';

describe('Integración de Pagos Wompi', () => {
  let wompiService;
  let app;

  beforeEach(() => {
    wompiService = new WompiPaymentService();
    app = createTestApp(wompiService);
    jest.clearAllMocks();
  });

  describe('Flujo de Pago', () => {
    it('debe crear una transacción de pago completa', async () => {
      // Mock de respuesta de Wompi
      const mockResponse = {
        id: 'wompi_trans_123',
        status: 'PENDING',
        data: { checkout_url: 'https://sandbox.wompi.co/checkout/123' }
      };
      
      require('axios').post.mockResolvedValue({ data: mockResponse });

      const response = await request(app)
        .post('/payments/create')
        .send({
          userId: '9',
          planId: '1',
          amount: 50000,
          currency: 'COP',
          email: 'test@example.com'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('transactionId', 'wompi_trans_123');
      expect(response.body).toHaveProperty('publicKey');
      expect(response.body).toHaveProperty('redirectUrl');
    });
  });

  describe('Webhook de Wompi', () => {
    it('debe manejar webhook de transacción aprobada', async () => {
      // Mock de respuesta de verificación de transacción
      const mockTransaction = {
        id: 'wompi_trans_123',
        status: 'APPROVED',
        amount_in_cents: 5000000
      };
      
      require('axios').get.mockResolvedValue({ data: mockTransaction });
      
      // Crear firma válida
      const signature = wompiService.generateSignature(mockTransaction);

      const mockWebhookPayload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            id: 'wompi_trans_123',
            reference: 'plan_1_9_timestamp',
            status: 'APPROVED',
            signature
          }
        }
      };

      const response = await request(app)
        .post('/webhooks/wompi')
        .send(mockWebhookPayload);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});