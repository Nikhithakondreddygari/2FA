const User = require('../models/usermodel');
const UserOTPVerification = require('../models/otpModels');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { transporter, sendOTPVerificationEmail } = require('../utility/mailer');

exports.signUp = async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json({ status: "success", data: { User: newUser } });
    } catch (error) {
        res.status(400).json({ status: "Fail", message: "Duplicate field value entered"  });
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const result = await sendOTPVerificationEmail(user);
        const remainingDays = user.passwordExpiration ? 
            Math.ceil((user.passwordExpiration - Date.now()) / (1000 * 60 * 60 * 24)) : null;

        res.status(200).json({
            success: true,
            user,
            expirationTime: new Date(Date.now() + 1 * 60 * 1000),
            remainingDays,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) throw new Error("Empty OTP details are not allowed");

        const otpRecord = await UserOTPVerification.findOne({ userId });
        if (!otpRecord) throw new Error("Account record doesn't exist or has been verified already.");

        if (otpRecord.expiresAt < Date.now()) {
            await UserOTPVerification.deleteMany({ userId });
            throw new Error("Code has expired. Please request again");
        }

        const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValidOTP) throw new Error("Invalid code passed. Check your inbox");

        await User.updateOne({ _id: userId }, { verified: true });
        await UserOTPVerification.deleteMany({ userId });

        const token = jwt.sign({ id: userId }, process.env.SECRET_KEY, { expiresIn: process.env.LOGIN_EXP });
        res.json({ status: "VERIFIED", jwtToken: token, expirationTime: new Date(Date.now() + parseInt(process.env.LOGIN_EXP, 10) * 1000), message: "User email verified successfully." });
    } catch (error) {
        res.status(400).json({ status: "FAILED", message: error.message });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ status: "FAILED", message: "User not found" });

        const result = await sendOTPVerificationEmail(user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ status: "FAILED", message: error.message });
    }
};

exports.verifyToken = (req, res) => {
    const { token } = req.body;
    if (!token) return res.json({ login: false, data: "Token not provided" });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        res.json({ login: true, data: decoded });
    } catch (error) {
        res.status(401).json({ login: false, data: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const hash = await bcrypt.hash(password, 12);

        const updatedUser = await User.findByIdAndUpdate(id, { password: hash });

        if (updatedUser) {
            res.status(200).json({ success: true, message: "User password updated" });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating password", error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ Status: "User not found" });
        }

        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '2000s' });

        // Prepare email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset your password',
            text: `http://localhost:3000/api/v1/users/resetPassword/${user._id}/${token}`
        };

        // Send email
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).send({ Status: "Failed to send email" });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).send({ Status: "Success", message: "Link sent to your email" });
            }
        });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).send({ Status: "Internal Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        jwt.verify(token, process.env.SECRET_KEY, async (err) => {
            if (err) {
                return res.status(401).json({ Status: "Invalid or expired token" });
            } else {
                try {
                    const hash = await bcrypt.hash(password, 12);
                    const user = await User.findByIdAndUpdate(id, { password: hash }, { new: true });
                    res.json({ message: "Password reset successfully", user });
                } catch (error) {
                    res.status(500).json({ Status: "Error updating password", error });
                }
            }
        });
    } catch (error) {
        res.status(400).json({ Status: error.message });
    }
};

exports.deleteMe = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { active: false });

        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (error) {
        next(error);
    }
};

exports.updateDetails = async (req, res, next) => {
    try {
        if (req.body.password || req.body.confirmPassword) {
            return res.status(400).json({ error: 'You cannot update your password using this endpoint.' });
        }
        if (!req.user || !req.user._id) {
             return res.status(401).json({ error: 'Unauthorized' });
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { runValidators: true, new: true });

        res.status(200).json({
            status:"success",
            data:{
                user:updatedUser
            }
        })
    } 
    catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.clearCookie('token');
    res.json({ status: "success" });
};