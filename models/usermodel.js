// const mongoose = require('mongoose');
// const validator = require('validator');
// const bcryptjs = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: [true, 'Please Enter Your Name'],
//         lowercase: true,
//         trim: true,
//         index: true,
//     },
//     email: {
//         type: String,
//         required: [true, 'Please Enter Your Email'],
//         unique: true,
//         lowercase: true,
//         validate: [validator.isEmail, 'Please enter a valid email']
//     },
//     password: {
//         type: String,
//         required: [true, 'Please enter a password'],
//         minlength: 8,
//         select: false
//     },
//     confirmPassword: {
//         type: String,
//         required: [true, 'Please confirm your password'],
//         validate: {
//             validator: function(value) {
//                 return value === this.password;
//             },
//             message: 'Password and confirm password do not match'
//         }
//     },
//     twoFactorSecret: {
//         type: String
//     }
// }, { timestamps: true });

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please Enter Your Name'],
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Please Enter Your Email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: 8,
        select: false // Passwords should not be returned in queries by default
    },
    twoFactorSecret: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);