const nodemailer = require('nodemailer');
const bcryptjs = require('bcryptjs');
const UserOTPVerification = require('../models/otpModels');

exports.transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendOTPVerificationEmail = async (user) => {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000);
        const hashedOTP = await bcryptjs.hash(otp.toString(), 10);
        await new UserOTPVerification({
            userId: user._id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000 // OTP expires in 1 hour
        }).save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Verify Your Email',
            html: `<p>Enter <b>${otp}</b> to verify your email address.</p>
                   <p>This code <b>expires in 1 hour</b>.</p>`
        });

        return { status: 'PENDING', message: 'Verification OTP email sent' };
    } catch (error) {
        throw error;
    }
};