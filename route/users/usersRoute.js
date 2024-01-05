const express = require('express');
const {
  userRegisterCtrl,
  loginUserCtrl,
  fetchUsersCtrl,
  deleteUsersCtrl,
  fetchUserDetailsCtrl,
  userProfileCtrl,
  updateUserCtrl,
  updateUserPasswordCtrl,
  followingUserCtrl,
  unfollowUserCtrl,
  blockUserCtrl,
  unBlockUserCtrl,
  generateVerificationTokenCtrl,
  accountVerificationCtrl,
  forgetPasswordTokenCtrl,
  passwordResetCtrl,
  profilePhotoUploadCtrl
} = require('../../controllers/users/usersCtrl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const {
  photoUpload,
  profilePhotoResize
} = require('../../middlewares/uploads/photoUpload');

const userRoutes = express.Router();

userRoutes.post('/register', userRegisterCtrl);
userRoutes.post('/login', loginUserCtrl);
userRoutes.put(
  '/profile-photo-upload',
  authMiddleware,
  photoUpload.single('image'),
  profilePhotoResize,
  profilePhotoUploadCtrl
);
userRoutes.get('/', authMiddleware, fetchUsersCtrl);
userRoutes.post('/forget-password-token', forgetPasswordTokenCtrl);
userRoutes.put('/reset-password', passwordResetCtrl);
userRoutes.put('/password', authMiddleware, updateUserPasswordCtrl);
userRoutes.put('/follow', authMiddleware, followingUserCtrl);
userRoutes.post(
  '/generate-verify-email-token',
  authMiddleware,
  generateVerificationTokenCtrl
);

userRoutes.put('/verify-account', authMiddleware, accountVerificationCtrl);
userRoutes.put('/unfollow', authMiddleware, unfollowUserCtrl);
userRoutes.put('/block-user/:id', authMiddleware, blockUserCtrl);
userRoutes.put('/unblock-user/:id', authMiddleware, unBlockUserCtrl);
userRoutes.get('/profile/:id', authMiddleware, userProfileCtrl);
userRoutes.put('/', authMiddleware, updateUserCtrl);
userRoutes.delete('/:id', deleteUsersCtrl);
userRoutes.get('/:id', fetchUserDetailsCtrl);

module.exports = userRoutes;