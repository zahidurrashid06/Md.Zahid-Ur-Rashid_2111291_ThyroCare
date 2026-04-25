const prisma = require('../config/db');

function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getDoctors(req, res, next) {
    try {
        const { lat, lng, radiusKm, specialization } = req.query;

        const where = {};
        if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };

        let doctors = await prisma.doctor.findMany({ where, orderBy: { rating: 'desc' } });

        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            doctors = doctors
                .map(d => ({
                    ...d,
                    distanceKm: d.latitude && d.longitude
                        ? parseFloat(haversineKm(userLat, userLng, d.latitude, d.longitude).toFixed(2))
                        : null,
                }))
                .filter(d => !radiusKm || d.distanceKm === null || d.distanceKm <= parseFloat(radiusKm))
                .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        }

        return res.json({ success: true, count: doctors.length, data: doctors });
    } catch (err) {
        next(err);
    }
}

async function preferDoctor(req, res, next) {
    try {
        const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

        const existing = await prisma.preferredDoctor.findFirst({
            where: { userId: req.user.id, doctorId: req.params.id },
        });
        if (existing) return res.json({ success: true, message: 'Already in your preferred list.' });

        await prisma.preferredDoctor.create({ data: { userId: req.user.id, doctorId: req.params.id } });
        return res.status(201).json({ success: true, message: 'Doctor saved to preferred list.' });
    } catch (err) {
        next(err);
    }
}

async function removePreferredDoctor(req, res, next) {
    try {
        await prisma.preferredDoctor.deleteMany({
            where: { userId: req.user.id, doctorId: req.params.id },
        });
        return res.json({ success: true, message: 'Doctor removed from preferred list.' });
    } catch (err) {
        next(err);
    }
}

async function getPreferredDoctors(req, res, next) {
    try {
        const preferred = await prisma.preferredDoctor.findMany({
            where: { userId: req.user.id },
            include: { doctor: true },
        });
        return res.json({ success: true, data: preferred.map(p => p.doctor) });
    } catch (err) {
        next(err);
    }
}

async function createDoctor(req, res, next) {
    try {
        const { name, specialization, experienceYears, hospitalAffiliation, latitude, longitude, phone, rating } = req.body;
        if (!name || !specialization) {
            return res.status(400).json({ success: false, message: 'name and specialization are required.' });
        }
        const doctor = await prisma.doctor.create({
            data: { name, specialization, experienceYears, hospitalAffiliation, latitude, longitude, phone, rating },
        });
        return res.status(201).json({ success: true, data: doctor });
    } catch (err) {
        next(err);
    }
}

module.exports = { getDoctors, preferDoctor, removePreferredDoctor, getPreferredDoctors, createDoctor };
