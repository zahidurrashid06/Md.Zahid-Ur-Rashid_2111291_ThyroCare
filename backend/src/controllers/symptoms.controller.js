const prisma = require('../config/db');

async function logSymptom(req, res, next) {
    try {
        const { symptomType, duration, severity, notes, timestamp } = req.body;

        if (!symptomType || !severity) {
            return res.status(400).json({ success: false, message: 'symptomType and severity are required.' });
        }
        const validSeverities = ['mild', 'moderate', 'severe'];
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({ success: false, message: `severity must be one of: ${validSeverities.join(', ')}.` });
        }

        const entry = await prisma.symptomEntry.create({
            data: {
                userId: req.user.id,
                symptomType,
                duration,
                severity,
                notes,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
            },
        });

        return res.status(201).json({ success: true, data: entry });
    } catch (err) {
        next(err);
    }
}

async function getTimeline(req, res, next) {
    try {
        const { from, to, symptomType } = req.query;

        const where = { userId: req.user.id };
        if (from || to) {
            where.timestamp = {};
            if (from) where.timestamp.gte = new Date(from);
            if (to) where.timestamp.lte = new Date(to);
        }
        if (symptomType) where.symptomType = symptomType;

        const entries = await prisma.symptomEntry.findMany({
            where,
            orderBy: { timestamp: 'asc' },
        });

        return res.json({ success: true, count: entries.length, data: entries });
    } catch (err) {
        next(err);
    }
}

async function exportSymptoms(req, res, next) {
    try {
        const entries = await prisma.symptomEntry.findMany({
            where: { userId: req.user.id },
            orderBy: { timestamp: 'asc' },
        });

        res.setHeader('Content-Disposition', 'attachment; filename="symptom_history.json"');
        res.setHeader('Content-Type', 'application/json');
        return res.send(JSON.stringify({ exportedAt: new Date().toISOString(), data: entries }, null, 2));
    } catch (err) {
        next(err);
    }
}

async function deleteSymptom(req, res, next) {
    try {
        const entry = await prisma.symptomEntry.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

        await prisma.symptomEntry.delete({ where: { id: req.params.id } });
        return res.json({ success: true, message: 'Symptom entry deleted.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { logSymptom, getTimeline, exportSymptoms, deleteSymptom };
