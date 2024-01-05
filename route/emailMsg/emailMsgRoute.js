const express = require('express');
const emailMsgRoute = express.Router();

const { sendEmailMsgCtrl } = require('../../controllers/emailMsg/emailMsgCtrl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');

emailMsgRoute.post('/', authMiddleware, sendEmailMsgCtrl);

module.exports = emailMsgRoute;