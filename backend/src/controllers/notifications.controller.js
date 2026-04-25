const prisma = require('../config/db');

async function getNotifications(req, res, next) {
    try {
        const { unreadOnly } = req.query;
        const where = { userId: req.user.id };
        if (unreadOnly === 'true') where.isRead = false;

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });

        return res.json({ success: true, unreadCount, data: notifications });
    } catch (err) {
        next(err);
    }
}

async function markAsRead(req, res, next) {
    try {
        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

        await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
        return res.json({ success: true, message: 'Marked as read.' });
    } catch (err) {
        next(err);
    }
}

async function markAllAsRead(req, res, next) {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        next(err);
    }
}

async function deleteNotification(req, res, next) {
    try {
        const notification = await prisma.notification.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

        await prisma.notification.delete({ where: { id: req.params.id } });
        return res.json({ success: true, message: 'Notification deleted.' });
    } catch (err) {
        next(err);
    }
}

async function createNotification(req, res, next) {
    try {
        const { userId, title, message } = req.body;
        if (!userId || !title || !message) {
            return res.status(400).json({ success: false, message: 'userId, title, and message are required.' });
        }
        const notification = await prisma.notification.create({ data: { userId, title, message } });
        return res.status(201).json({ success: true, data: notification });
    } catch (err) {
        next(err);
    }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification };
