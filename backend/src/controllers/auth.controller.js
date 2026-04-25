const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const { sendEmail } = require('../config/email');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
const ACCOUNT_LOCK_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 30;

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function register(req, res, next) {
    try {
        const { name, email, password, university, gender, yearOfStudy, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.isActive) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = existing
            ? await prisma.user.update({
                where: { email },
                data: { name, passwordHash, university, gender, yearOfStudy, department, isActive: true },
            })
            : await prisma.user.create({
                data: { name, email, passwordHash, university, gender, yearOfStudy, department, isActive: true },
            });

        return res.status(201).json({
            success: true,
            message: `Registration successful. You can now log in.`,
        });
    } catch (err) {
        next(err);
    }
}

async function verifyOtp(req, res, next) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }

        const record = await prisma.otpCode.findFirst({
            where: { email, code: otp, isUsed: false },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        }
        if (new Date() > record.expiresAt) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
        }

        await prisma.otpCode.update({ where: { id: record.id }, data: { isUsed: true } });
        const user = await prisma.user.update({ where: { email }, data: { isActive: true } });

        const token = signToken(user);
        return res.json({
            success: true,
            message: 'Email verified successfully.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        next(err);
    }
}

async function resendOtp(req, res, next) {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.isActive) {

            return res.json({ success: true, message: 'If that email is pending verification, a new OTP has been sent.' });
        }

        await prisma.otpCode.updateMany({ where: { email, isUsed: false }, data: { isUsed: true } });
        const code = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await prisma.otpCode.create({ data: { email, code, expiresAt } });

        await sendEmail({
            to: email,
            subject: 'ThyroCare – New Verification Code',
            html: `<p>Your new OTP is: <strong>${code}</strong>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
        });

        return res.json({ success: true, message: 'New OTP sent.' });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.lockedUntil && new Date() < user.lockedUntil) {
            const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Account locked. Try again in ${remaining} minute(s).`,
            });
        }

        if (user.isSuspended) {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
        }


        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
            const newAttempts = user.failedLoginAttempts + 1;
            const isLocked = newAttempts >= ACCOUNT_LOCK_ATTEMPTS;
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    lockedUntil: isLocked ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000) : null,
                },
            });
            if (isLocked) {
                return res.status(423).json({
                    success: false,
                    message: `Too many failed attempts. Account locked for ${ACCOUNT_LOCK_MINUTES} minutes.`,
                });
            }
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });

        const token = signToken(user);
        return res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.isActive) {
            return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        }

        await prisma.passwordResetToken.updateMany({ where: { userId: user.id, isUsed: false }, data: { isUsed: true } });

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

        const resetUrl = `http://localhost:5500/reset-password?token=${token}`;

        await sendEmail({
            to: email,
            subject: 'ThyroCare – Password Reset',
            html: `
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
      `,
        });

        return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required.' });
        }

        const record = await prisma.passwordResetToken.findUnique({ where: { token } });
        if (!record || record.isUsed || new Date() > record.expiresAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.user.update({ where: { id: record.userId }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } });
        await prisma.passwordResetToken.update({ where: { id: record.id }, data: { isUsed: true } });

        return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, verifyOtp, resendOtp, login, forgotPassword, resetPassword };
