const expressAsyncHandler = require('express-async-handler');
const Filter = require('bad-words');
const transporter = require('../../utils/transporter');
const emailMsg = require('../../models/emailMessaging/emailMessaging');

const sendEmailMsgCtrl = expressAsyncHandler(async (req, res, next) => {
  const { to, subject, message } = req.body;

  // Get the message
  const emailMessage = subject + ' ' + message;
  // Prevent profanity
  const filter = new Filter();
  
  const isProfane = filter.isProfane(emailMessage);
  
  if (isProfane) {
    return next(new Error('Email failed. Contains profanity.'));
  }

  // Build message
  const msg = {
    to,
    from: process.env.EMAIL,
    subject,
    text: message
  };

  // Send message
  transporter.sendMail(msg)
    .then(() => {
      // Save to DB
      return emailMsg.create({
        sentBy: req?.user?._id,
        from: req?.user?.email,
        to,
        message,
        subject
      });
    })
    .then(() => {
      res.json('Mail sent');
    })
    .catch(error => {
      next(error);
    });
});

module.exports = { sendEmailMsgCtrl };