const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { logSymptom, getTimeline, exportSymptoms, deleteSymptom } = require('../controllers/symptoms.controller');

const router = Router();

router.use(authenticate);

router.get('/export', exportSymptoms);
router.get('/', getTimeline);
router.post('/', logSymptom);
router.delete('/:id', deleteSymptom);

module.exports = router;
