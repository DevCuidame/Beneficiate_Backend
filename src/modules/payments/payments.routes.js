const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Rutas protegidas (requieren autenticación)
router.post('/create', authMiddleware, paymentsController.createPayment);
router.get('/verify/:transactionId', authMiddleware, paymentsController.verifyTransaction);
router.get('/history', authMiddleware, paymentsController.getPaymentHistory);

router.post('/simulate-webhook', paymentsController.simulateWebhook);

// Webhook público para Wompi (no requiere autenticación)
// ¡IMPORTANTE! Esta ruta debe estar disponible públicamente
router.post('/webhook/wompi', paymentsController.handleWebhook);


module.exports = router;