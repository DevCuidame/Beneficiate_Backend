const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const beneficiaryRoutes = require('./modules/beneficiaries/beneficiary.routes');
const beneficiaryImageRoutes = require('./modules/images/beneficiary/beneficiary.images.routes');
const userImageRoutes = require('./modules/images/user/user.images.routes');
const townshipRoutes = require('./modules/township/township.routes');
const medicalAppointmentRoutes = require('./modules/appointment/appointment.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const medicalProfessionalsRoutes = require('./modules/medical_professionals/medicalProfessional.routes');
const medicalSpecialitiesRoutes = require('./modules/medical_specialties/medical_specialties.routes');
const authenticate = require('./middlewares/auth.middleware');
const paymentsRoutes = require('./modules/payments/payments.routes');
const plansRoutes = require('./modules/plans/plans.routes');
const passwordResetRoutes = require('./modules/auth/password/password.reset.routes');
const emailVerificationRoutes = require('./modules/auth/verification/email.verification.routes');
const agentChatRoutes = require('./modules/agent_chat/agent_chat.routes');

const router = express.Router();

// Register module routes
router.use('/auth', authRoutes);
router.use('/user', 
    // authenticate, 
    userRoutes);
router.use('/beneficiary', authenticate, beneficiaryRoutes);
router.use('/beneficiary/image', authenticate, beneficiaryImageRoutes);
router.use('/user/image', authenticate, userImageRoutes);
router.use('/townships', townshipRoutes);
router.use('/medical-appointment', medicalAppointmentRoutes);
router.use('/chat', authenticate, chatRoutes);
router.use('/medical-professionals', medicalProfessionalsRoutes);
router.use('/medical-specialties', medicalSpecialitiesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/plans', plansRoutes);
router.use('/password', passwordResetRoutes);
router.use('/email', emailVerificationRoutes);
router.use('/agent-chat', agentChatRoutes);

module.exports = router;
