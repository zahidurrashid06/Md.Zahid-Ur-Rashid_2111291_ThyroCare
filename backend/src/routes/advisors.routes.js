const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getAdvisors, createAdvisor, updateAdvisor, deleteAdvisor } = require('../controllers/advisors.controller');

const router = Router();

router.get('/', getAdvisors);
router.post('/', authenticate, authorize('admin'), createAdvisor);
router.put('/:id', authenticate, authorize('admin'), updateAdvisor);
router.delete('/:id', authenticate, authorize('admin'), deleteAdvisor);

module.exports = router;
