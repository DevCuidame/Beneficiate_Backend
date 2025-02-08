const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const beneficiaryRoutes = require('./modules/beneficiaries/beneficiary.routes');
const beneficiaryImageRoutes = require('./modules/images/beneficiary/beneficiary.images.routes');
const userImageRoutes = require('./modules/images/user/user.images.routes');
const authenticate = require('./middlewares/auth.middleware');

const router = express.Router();

// Register module routes
router.use('/auth', authRoutes);
router.use('/beneficiary', authenticate, beneficiaryRoutes);
router.use('/beneficiary/image', authenticate, beneficiaryImageRoutes);
router.use('/user/image', authenticate, userImageRoutes);

module.exports = router