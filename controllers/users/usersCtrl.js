/**
 * This code snippet is a module that exports various controller functions for handling user registration, login, profile management, password reset, email verification, following/unfollowing users, blocking/unblocking users, and fetching user details.
 *
 * @module Code-Under-Test
 * @exports {
 *   profilePhotoUploadCtrl,
 *   forgetPasswordTokenCtrl,
 *   generateVerificationTokenCtrl,
 *   userRegisterCtrl,
 *   loginUserCtrl,
 *   fetchUsersCtrl,
 *   deleteUsersCtrl,
 *   fetchUserDetailsCtrl,
 *   userProfileCtrl,
 *   updateUserCtrl,
 *   updateUserPasswordCtrl,
 *   followingUserCtrl,
 *   unfollowUserCtrl,
 *   blockUserCtrl,
 *   unBlockUserCtrl,
 *   accountVerificationCtrl,
 *   passwordResetCtrl
 * }
 */
/**
 * This code snippet is a module that exports various controller functions for handling user registration, login, profile management, password reset, email verification, following/unfollowing users, blocking/unblocking users, and fetching user details.
 *
 * @module Code-Under-Test
 * @exports {
 *   profilePhotoUploadCtrl,
 *   forgetPasswordTokenCtrl,
 *   generateVerificationTokenCtrl,
 *   userRegisterCtrl,
 *   loginUserCtrl,
 *   fetchUsersCtrl,
 *   deleteUsersCtrl,
 *   fetchUserDetailsCtrl,
 *   userProfileCtrl,
 *   updateUserCtrl,
 *   updateUserPasswordCtrl,
 *   followingUserCtrl,
 *   unfollowUserCtrl,
 *   blockUserCtrl,
 *   unBlockUserCtrl,
 *   accountVerificationCtrl,
 *   passwordResetCtrl
 * }
 */
const expressAsyncHandler = require('express-async-handler');
const crypto = require('crypto');
const fs = require('fs');

const generateToken = require('../../config/token/generateToken');
const User = require('../../models/user/user');
const validateMongodbId = require('../../utils/validateMongodbId');
const transporter = require('../../utils/transporter');
const cloudinaryUploadImg = require('../../utils/cloudinary');
const blockedUser = require('../../utils/blockUser');

//----------------------------------------
// Register User
//----------------------------------------
const userRegisterCtrl = expressAsyncHandler(async (req, res) => {
  const { email, firstName, lastName, password } = req.body;
  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: `User already exists` });
  } else {
    const user = await User.create({ email, firstName, lastName, password });
    res.json(user);
  }
});

//----------------------------------------
// Login User
//----------------------------------------
const loginUserCtrl = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check if user exists
  const userFound = await User.findOne({ email });
  // Check if user is blocked
  if (userFound?.isBlocked) throw new Error(`User is blocked`);

  if (userFound && (await userFound.isPasswordMatched(password))) {
    res.json({
      _id: userFound._id,
      firstName: userFound.firstName,
      lastName: userFound.lastName,
      email: userFound.email,
      profilePhoto: userFound.profilePhoto,
      isAdmin: userFound.isAdmin,
      token: generateToken(userFound?._id),
      isVerified: userFound?.isAccountVerified
    });
  } else {
    res
      .status(401)
      .json({ message: `You shall not pass! Invalid credentials` });
  }
});

//----------------------------------------
// Users
//----------------------------------------
const fetchUsersCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).populate('posts');
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

//----------------------------------------
// Delete User
//----------------------------------------
const deleteUsersCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  // Check if user id is valid
  validateMongodbId(id);

  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    res.status(400).json({ message: `User does not exist` });
  } else {
    res.json(deletedUser);
  }
});

//----------------------------------------
// User Details
//----------------------------------------
const fetchUserDetailsCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  // Check if user id is valid
  validateMongodbId(id);

  const user = await User.findById(id);
  res.json(user);
});

//----------------------------------------
// User Profile
//----------------------------------------
const userProfileCtrl = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  validateMongodbId(id);

  const loginUserId = req?.user?._id?.toString();

  try {
    const myProfile = await User.findById(id)
      .populate(`posts`)
      .populate(`viewedBy`);

    // Check if loginUserId matches the profile user id
    if (myProfile?._id?.toString() === loginUserId) {
      res.json(myProfile); // Return the profile without modifying 'viewedBy'
    } else {
      const alreadyViewed = myProfile?.viewedBy?.find(
        (user) => user?._id?.toString() === loginUserId
      );

      if (alreadyViewed) {
        res.json(myProfile);
      } else {
        res.json('No views');
        myProfile.viewedBy.push(loginUserId);
        await myProfile.save();
      }
    }
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      // Handle invalid MongoDB ID
      const invalidIdError = new Error(`Invalid user ID`);
      invalidIdError.status = 400;
      next(invalidIdError);
    } else {
      // Handle other errors, e.g., User not found
      const notFoundError = new Error(`User not found`);
      notFoundError.status = 404;
      next(notFoundError);
    }
  }
});

//----------------------------------------
// Update Profile
//----------------------------------------
const updateUserCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user;
  validateMongodbId(_id);
  const { firstName, lastName, email, bio } = req.body;
  const user = await User.findByIdAndUpdate(
    _id,
    { firstName, lastName, email, bio },
    { new: true, runValidators: true }
  );
  res.json(user);
});

//----------------------------------------
// Update Password
//----------------------------------------
const updateUserPasswordCtrl = expressAsyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongodbId(_id);

  const user = await User.findById(_id);

  if (password) {
    user.password = password;

    const updatedUser = await user.save();

    if (!updatedUser) {
      const error = new Error(`User not found`);
      error.status = 404;
      next(error);
    } else {
      res.json(updatedUser);
    }
  } else {
    res.json(user);
  }
});

//----------------------------------------
// Follow
//----------------------------------------
const followingUserCtrl = expressAsyncHandler(async (req, res) => {
  const { followId } = req.body;
  const loginUserId = req.user.id;

  const targetUser = await User.findById(followId);

  const alreadyFollowing = targetUser?.followers?.includes(loginUserId);

  if (alreadyFollowing) {
    res.status(400).json({ message: `you are already following this user` });
  } else {
    // Find the user you want to follow and update its followers field
    await User.findByIdAndUpdate(
      followId,
      { $push: { followers: loginUserId }, isFollowing: true },
      { new: true }
    );

    // Update loginUser 'following' field
    await User.findByIdAndUpdate(
      loginUserId,
      { $push: { following: followId } },
      { new: true }
    );
    res.json(`You are now following this user`);
  }
});

//----------------------------------------
// Unfollow
//----------------------------------------
const unfollowUserCtrl = expressAsyncHandler(async (req, res) => {
  const { unFollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(
    unFollowId,
    { $pull: { followers: loginUserId }, isFollowing: false },
    { new: true }
  );

  await User.findByIdAndUpdate(
    loginUserId,
    { $pull: { following: unFollowId } },
    { new: true }
  );

  res.json(`You have unfollowed this user`);
});

//----------------------------------------
// Block User
//----------------------------------------
const blockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: true
    },
    { new: true }
  );
  res.json(user);
});

//----------------------------------------
// Unblock User
//----------------------------------------
const unBlockUserCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: false
    },
    { new: true }
  );
  res.json(user);
});

//----------------------------------------
// Generate Email Verification Token
//----------------------------------------
const generateVerificationTokenCtrl = expressAsyncHandler(async (req, res) => {
  const loginUserId = req.user.id;
  const user = await User.findById(loginUserId);

  // Generate token
  const verificationToken = await user?.createAccountVerificationToken();
  await user.save();

  // Build the message
  const resetURL = `If you were requested to verify your account, verify now within 10 minutes. Otherwise, ignore this message. <a href='http://localhost:3000/verify-account/${verificationToken}'>Click to verify your account.</a>`;

  const message = {
    to: user?.email,
    from: process.env.EMAIL,
    subject: `Verify your account`,
    html: resetURL
  };

  // Send message
  transporter.sendMail(message, (error, info) => {
    if (error) {
      console.error(`Error: ` + error);
      res.status(500).json({ error: `Email not sent` });
    } else {
      res.status(200).json({ resetURL });
    }
  });
});

//----------------------------------------
// Account Verification
//----------------------------------------
const accountVerificationCtrl = expressAsyncHandler(async (req, res) => {
  const { token } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find this user by token
  const userFound = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: new Date() }
  });

  if (!userFound) throw new Error(`Token expired. Try again later`);

  // Update the property to true
  userFound.isAccountVerified = true;
  userFound.accountVerificationToken = undefined;
  userFound.accountVerificationTokenExpires = undefined;
  await userFound.save();
  res.json(userFound);
});

//----------------------------------------
// Forgot Password Token Generator
//----------------------------------------
const forgetPasswordTokenCtrl = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) throw new Error(`User not found`);

  // Generate token
  const resetToken = await user.createPasswordResetToken();
  await user.save();

  // Build the message
  const resetURL = `If you have requested to reset your password, reset within 10 minutes. Otherwise, ignore this message. <a href='http://localhost:3000/reset-password/${resetToken}'>Click to reset your password.</a>`;

  const message = {
    to: email,
    from: process.env.EMAIL,
    subject: `Reset Password`,
    html: resetURL
  };

  transporter.sendMail(message, (error, info) => {
    if (error) {
      console.error('Error: ' + error);
      res.status(500).json({ error: `Email not sent` });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).json({
        msg: `A verification message has been sent to ${email}: ${resetURL}`
      });
    }
  });
});

//----------------------------------------
// Password Reset
//----------------------------------------
const passwordResetCtrl = expressAsyncHandler(async (req, res) => {
  const { resetToken, password } = req.body;
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find this user by token
  const userFound = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!userFound) throw new Error(`Token Expired. Try again later`);

  // Update/change the password
  userFound.password = password;
  userFound.passwordResetToken = undefined;
  userFound.passwordResetExpires = undefined;
  await userFound.save();
  res.json(userFound);
});

//----------------------------------------
// Profile Photo Upload
//----------------------------------------
const profilePhotoUploadCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;

  blockedUser(req.user);

  // Get image path
  const localPath = `public/images/profile/${req.file.filename}`;
  // Upload to Cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);

  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      profilePhoto: imgUploaded?.url
    },
    { new: true }
  );

  // Remove uploaded images
  fs.unlinkSync(localPath);
  res.json(imgUploaded);
});

module.exports = {
  profilePhotoUploadCtrl,
  forgetPasswordTokenCtrl,
  generateVerificationTokenCtrl,
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
  accountVerificationCtrl,
  passwordResetCtrl
};
