const prisma = require('../config/db');

async function getProfile(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                university: true,
                gender: true,
                yearOfStudy: true,
                department: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const { name, university, gender, yearOfStudy, department } = req.body;

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, university, gender, yearOfStudy, department },
            select: {
                id: true, name: true, email: true, university: true, gender: true,
                yearOfStudy: true, department: true, role: true,
            },
        });

        return res.json({ success: true, message: 'Profile updated.', data: updated });
    } catch (err) {
        next(err);
    }
}

async function deactivateAccount(req, res, next) {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { isActive: false },
        });
        return res.json({ success: true, message: 'Account deactivated. Contact support to reactivate.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getProfile, updateProfile, deactivateAccount };
