const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
} = require('../controllers/notifications.controller');

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

router.post('/', authorize('admin'), createNotification);

module.exports = router;
