const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Outlook',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
});

module.exports = transporter;