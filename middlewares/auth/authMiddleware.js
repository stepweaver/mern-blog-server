const expressAsyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../../models/user/user');

const authMiddleware = expressAsyncHandler(async (req, res, next) => {
  if (!req?.headers?.authorization?.startsWith(`Bearer`)) {
    return next(new Error(`There is no token attached to the header.`));
  }

  const token = req.headers.authorization.split(` `)[1];
  if (!token) {
    return next(new Error(`There is no token attached to the header.`));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (!decoded) {
      return next(new Error(`Not Authorized, or Token expired. Login again.`));
    }

    const user = await User.findById(decoded.id).select(`-password`);
    if (!user) {
      return next(new Error(`User not found.`));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = authMiddleware;