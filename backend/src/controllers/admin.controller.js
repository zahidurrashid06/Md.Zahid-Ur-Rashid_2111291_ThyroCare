const prisma = require('../config/db');

async function writeAuditLog(adminId, action, targetId = null, details = null) {
    await prisma.auditLog.create({ data: { adminId, action, targetId, details } });
}

async function listUsers(req, res, next) {
    try {
        const { page = 1, limit = 20, role, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, name: true, email: true, university: true,
                    role: true, isActive: true, isSuspended: true, createdAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return res.json({ success: true, total, page: Number(page), data: users });
    } catch (err) {
        next(err);
    }
}

async function getUser(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, email: true, university: true, gender: true,
                yearOfStudy: true, department: true, role: true, isActive: true,
                isSuspended: true, failedLoginAttempts: true, lockedUntil: true, createdAt: true,
            },
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
}

async function approveUser(req, res, next) {
    try {
        await prisma.user.update({ where: { id: req.params.id }, data: { isActive: true, isSuspended: false } });
        await writeAuditLog(req.user.id, 'APPROVE_USER', req.params.id);
        return res.json({ success: true, message: 'User approved.' });
    } catch (err) {
        next(err);
    }
}

async function suspendUser(req, res, next) {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot suspend yourself.' });
        }
        await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: true } });
        await writeAuditLog(req.user.id, 'SUSPEND_USER', req.params.id, req.body.reason || null);
        return res.json({ success: true, message: 'User suspended.' });
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
        }
        await prisma.user.delete({ where: { id: req.params.id } });
        await writeAuditLog(req.user.id, 'DELETE_USER', req.params.id);
        return res.json({ success: true, message: 'User permanently deleted.' });
    } catch (err) {
        next(err);
    }
}

async function getStats(req, res, next) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            totalChats,
            chatsToday,
            totalArticles,
            totalSymptomEntries,
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isSuspended: true } }),
            prisma.chatSession.count(),
            prisma.chatSession.count({ where: { createdAt: { gte: today } } }),
            prisma.article.count({ where: { isApproved: true } }),
            prisma.symptomEntry.count(),
        ]);

        return res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                totalChats,
                chatsToday,
                totalArticles,
                totalSymptomEntries,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (err) {
        next(err);
    }
}

async function getAuditLog(req, res, next) {
    try {
        const { page = 1, limit = 20, adminId, action } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (adminId) where.adminId = adminId;
        if (action) where.action = action;

        const [logs, total] = await prisma.$transaction([
            prisma.auditLog.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: { admin: { select: { id: true, name: true, email: true } } },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return res.json({ success: true, total, page: Number(page), data: logs });
    } catch (err) {
        next(err);
    }
}

async function changeUserRole(req, res, next) {
    try {
        const { role } = req.body;
        const validRoles = ['student', 'medical_advisor', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `role must be one of: ${validRoles.join(', ')}` });
        }
        await prisma.user.update({ where: { id: req.params.id }, data: { role } });
        await writeAuditLog(req.user.id, 'CHANGE_ROLE', req.params.id, `New role: ${role}`);
        return res.json({ success: true, message: `Role updated to ${role}.` });
    } catch (err) {
        next(err);
    }
}

module.exports = { listUsers, getUser, approveUser, suspendUser, deleteUser, getStats, getAuditLog, changeUserRole };
