const express = require('express');
const userController = require('../controller/userController');
const router = express.Router();

router.route('/signUp').post(userController.signUp);
router.route('/login').post(userController.login);
router.route('/verifyOtp').post(userController.verifyOtp);
router.route('/sendOtp').post(userController.sendOtp);
router.route('/verifyToken').post(userController.verifyToken);
router.route('/logout').get(userController.logout);
router.route('/updateDetails').get(userController.updateDetails);
router.route('/updatePassword/:id').post(userController.updatePassword);
router.route('/forgotPassword').post(userController.forgotPassword);
router.route('/resetPassword/:id/:token').post(userController.resetPassword);
router.route('/deleteMe').get(userController.deleteMe);

module.exports = router;