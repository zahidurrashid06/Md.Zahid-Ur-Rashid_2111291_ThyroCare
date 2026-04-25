const prisma = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are ThyroCare AI, an expert thyroid symptom analyzer. Your goal is to help university students in Bangladesh assess their thyroid health based on symptoms like fatigue, weight changes, neck swelling, or brain fog. Ask relevant follow-up questions to understand duration and severity. Keep your responses concise (max 3 sentences). Always conclude with a disclaimer that you are an AI, not a doctor, and they should consult a healthcare professional for a medical diagnosis.",
});

async function createSession(req, res, next) {
    try {
        const { title, messages } = req.body;
        const session = await prisma.chatSession.create({
            data: {
                userId: req.user.id,
                title: title || 'New Chat',
                messages: messages || [],
            },
        });
        return res.status(201).json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
}

async function getSessions(req, res, next) {
    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' },
        });
        return res.json({ success: true, data: sessions });
    } catch (err) {
        next(err);
    }
}

async function getSession(req, res, next) {
    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
}

async function updateSession(req, res, next) {
    try {
        const { messages, title } = req.body;
        const existing = await prisma.chatSession.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Session not found.' });

        const updated = await prisma.chatSession.update({
            where: { id: req.params.id },
            data: {
                ...(messages !== undefined && { messages }),
                ...(title !== undefined && { title }),
            },
        });
        return res.json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
}

async function deleteSession(req, res, next) {
    try {
        const existing = await prisma.chatSession.findFirst({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (!existing) return res.status(404).json({ success: false, message: 'Session not found.' });

        await prisma.chatSession.delete({ where: { id: req.params.id } });
        return res.json({ success: true, message: 'Session deleted.' });
    } catch (err) {
        next(err);
    }
}

async function sendMessage(req, res, next) {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();
        
        return res.json({
            success: true,
            reply: responseText,
        });

    } catch (err) {
        console.error("Gemini API Error:", err);
        return res.status(500).json({ success: false, message: 'AI failed to respond. Please try again later.' });
    }
}

module.exports = { createSession, getSessions, getSession, updateSession, deleteSession, sendMessage };
