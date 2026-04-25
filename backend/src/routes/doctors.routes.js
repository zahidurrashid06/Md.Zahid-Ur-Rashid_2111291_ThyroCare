const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getDoctors, preferDoctor, removePreferredDoctor, getPreferredDoctors, createDoctor } = require('../controllers/doctors.controller');

const router = Router();

router.use(authenticate);

router.get('/preferred', getPreferredDoctors);
router.get('/', getDoctors);
router.post('/', authorize('admin'), createDoctor);
router.post('/:id/prefer', preferDoctor);
router.delete('/:id/prefer', removePreferredDoctor);

module.exports = router;
