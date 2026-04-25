const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
    listUsers,
    getUser,
    approveUser,
    suspendUser,
    deleteUser,
    getStats,
    getAuditLog,
    changeUserRole,
} = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

router.get('/stats', getStats);
router.get('/audit-log', getAuditLog);

module.exports = router;
