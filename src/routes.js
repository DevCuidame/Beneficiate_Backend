const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const beneficiaryRoutes = require('./modules/beneficiaries/beneficiary.routes');
const beneficiaryImageRoutes = require('./modules/images/beneficiary/beneficiary.images.routes');
const userImageRoutes = require('./modules/images/user/user.images.routes');
const townshipRoutes = require('./modules/township/township.routes');
const medicalAppointmentRoutes = require('./modules/appointment/appointment.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const medicalProfessionalsRoutes = require('./modules/medical_professionals/medicalProfessional.routes');
const authenticate = require('./middlewares/auth.middleware');

const router = express.Router();

// Register module routes
router.use('/auth', authRoutes);
router.use('/beneficiary', authenticate, beneficiaryRoutes);
router.use('/beneficiary/image', authenticate, beneficiaryImageRoutes);
router.use('/user/image', authenticate, userImageRoutes);
router.use('/townships', townshipRoutes);
router.use('/medical-appointment', medicalAppointmentRoutes);
router.use('/chat', authenticate, chatRoutes);
router.use('/medical-professionals', medicalProfessionalsRoutes);


module.exports = router;
