const prisma = require('../config/db');

async function getAdvisors(req, res, next) {
    try {
        const advisors = await prisma.advisor.findMany({ orderBy: { name: 'asc' } });
        return res.json({ success: true, data: advisors });
    } catch (err) {
        next(err);
    }
}

async function createAdvisor(req, res, next) {
    try {
        const { name, credentials, hospitalAffiliation, photoUrl, bio } = req.body;
        if (!name || !credentials) {
            return res.status(400).json({ success: false, message: 'name and credentials are required.' });
        }
        const advisor = await prisma.advisor.create({ data: { name, credentials, hospitalAffiliation, photoUrl, bio } });
        return res.status(201).json({ success: true, data: advisor });
    } catch (err) {
        next(err);
    }
}

async function updateAdvisor(req, res, next) {
    try {
        const { name, credentials, hospitalAffiliation, photoUrl, bio } = req.body;
        const advisor = await prisma.advisor.update({
            where: { id: req.params.id },
            data: { name, credentials, hospitalAffiliation, photoUrl, bio },
        });
        return res.json({ success: true, data: advisor });
    } catch (err) {
        next(err);
    }
}

async function deleteAdvisor(req, res, next) {
    try {
        await prisma.advisor.delete({ where: { id: req.params.id } });
        return res.json({ success: true, message: 'Advisor deleted.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAdvisors, createAdvisor, updateAdvisor, deleteAdvisor };
