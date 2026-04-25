const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile, deactivateAccount } = require('../controllers/user.controller');

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.delete('/me', deactivateAccount);

module.exports = router;
