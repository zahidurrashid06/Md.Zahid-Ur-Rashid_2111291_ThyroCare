const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const {
    createSession,
    getSessions,
    getSession,
    updateSession,
    deleteSession,
    sendMessage,
} = require('../controllers/chat.controller');

const router = Router();

router.use(authenticate);

router.post('/sessions', createSession);
router.post('/message', sendMessage);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

module.exports = router;
