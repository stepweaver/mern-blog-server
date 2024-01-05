const blockedUser = (req, res, next) => {
  const user = req.user;

  if (user?.isBlocked) {
    return res.status(403).json({ error: `Denied! ${user?.firstName} ${user?.lastName} is blocked.` });
  }

  next();
};

module.exports = blockedUser;