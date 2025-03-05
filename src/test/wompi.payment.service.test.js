const WompiPaymentService = require('../modules/wompi/wompi.payment.service');
const { PaymentError } = require('../core/errors');
const axios = require('axios');

// Mock de dependencias
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

describe('WompiPaymentService', () => {
  let wompiService;
  const mockUserId = '9';
  const mockPlanId = '1';
  const mockTransactionId = 'wompi_trans_789';

  beforeEach(() => {
    wompiService = new WompiPaymentService();
    jest.clearAllMocks();
  });

  describe('createPaymentTransaction', () => {
    it('debe crear una transacción de pago exitosamente', async () => {
      const mockResponse = {
        id: mockTransactionId,
        status: 'PENDING',
        data: { checkout_url: 'https://ejemplo.wompi.co/checkout' }
      };

      axios.post.mockResolvedValue({ data: mockResponse });

      const result = await wompiService.createPaymentTransaction(
        50000, 
        'COP', 
        mockUserId, 
        mockPlanId, 
        'usuario@ejemplo.com'
      );

      expect(result).toEqual(mockResponse);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/transactions'),
        expect.objectContaining({
          amount_in_cents: 5000000,
          reference: expect.stringContaining(`plan_${mockPlanId}_${mockUserId}_`)
        }),
        expect.any(Object)
      );
    });

    it('debe manejar errores en creación de transacción', async () => {
      axios.post.mockRejectedValue(new Error('Error de conexión'));

      await expect(
        wompiService.createPaymentTransaction(
          50000, 
          'COP', 
          mockUserId, 
          mockPlanId, 
          'usuario@ejemplo.com'
        )
      ).rejects.toThrow(PaymentError);
    });
  });

  describe('validateWompiPayment', () => {
    it('debe validar un pago correctamente', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        status: 'APPROVED',
        amount_in_cents: 5000000
      };

      axios.get.mockResolvedValue({ data: mockTransaction });

      // Mock de la firma
      const mockSignature = wompiService.generateSignature(mockTransaction);

      const result = await wompiService.validateWompiPayment(
        mockTransactionId, 
        mockSignature
      );

      expect(result).toBe(true);
    });

    it('debe rechazar pagos no aprobados', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        status: 'REJECTED',
        amount_in_cents: 5000000
      };

      axios.get.mockResolvedValue({ data: mockTransaction });

      // Mock de la firma
      const mockSignature = wompiService.generateSignature(mockTransaction);

      const result = await wompiService.validateWompiPayment(
        mockTransactionId, 
        mockSignature
      );

      expect(result).toBe(false);
    });
  });
});