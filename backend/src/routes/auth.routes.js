const { Router } = require('express');
const { authLimiter } = require('../middleware/rateLimiter');
const {
    register,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    resetPassword,
} = require('../controllers/auth.controller');

const router = Router();

router.use(authLimiter);

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
