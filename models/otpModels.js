const mongoose = require('mongoose');

const UserOTPVerificationSchema = new mongoose.Schema({
    userId: String,
    otp: String,
    createdAt: { type: Date, default: Date.now },
    expireAt: { type: Date, default: Date.now, index: { expires: '1h' } } // Automatically expire after 1 hour
});

const UserOTPVerification = mongoose.model('UserOTPVerification', UserOTPVerificationSchema);

module.exports = UserOTPVerification;