/**
 * Defines a Mongoose schema for a user in a web application.
 * Includes fields for the user's first name, last name, profile photo, email, bio, password, post count, blocked status, admin status, role, following status, account verification status, account verification token, account verification token expiration, viewed by users, followers, following users, password change date, password reset token, password reset token expiration, and active status.
 * Provides virtuals for the user's posts.
 * Includes pre-save middleware to hash the user's password, and methods to check if a password matches, create an account verification token, and create a password reset token.
 *
 * @class User
 * @memberof module:models
 * @instance
 * @property {string} firstName - The user's first name.
 * @property {string} lastName - The user's last name.
 * @property {string} profilePhoto - The URL of the user's profile photo.
 * @property {string} email - The user's email address.
 * @property {string} bio - The user's biography.
 * @property {string} password - The user's password.
 * @property {number} postCount - The number of posts the user has.
 * @property {boolean} isBlocked - Whether the user is blocked or not.
 * @property {boolean} isAdmin - Whether the user is an admin or not.
 * @property {string} role - The user's role (must be one of 'Admin', 'Guest', 'Blogger').
 * @property {boolean} isFollowing - Whether the user is following someone or not.
 * @property {boolean} isUnFollowing - Whether the user is unfollowing someone or not.
 * @property {boolean} isAccountVerified - Whether the user's account is verified or not.
 * @property {string} accountVerificationToken - The token used for account verification.
 * @property {Date} accountVerificationTokenExpires - The expiration date of the account verification token.
 * @property {Array.<ObjectId>} viewedBy - The users who have viewed the user's profile.
 * @property {Array.<ObjectId>} followers - The users who are following the user.
 * @property {Array.<ObjectId>} following - The users who the user is following.
 * @property {Date} passwordChangeAt - The date when the user last changed their password.
 * @property {string} passwordResetToken - The token used for password reset.
 * @property {Date} passwordResetExpires - The expiration date of the password reset token.
 * @property {boolean} active - Whether the user's account is active or not.
 * @method isPasswordMatched - Checks if a entered password matches the hashed password.
 * @method createAccountVerificationToken - Creates an account verification token.
 * @method createPasswordResetToken - Creates a password reset token.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required']
    },
    profilePhoto: {
      type: String,
      default:
        'https://res.cloudinary.com/dp6wqzo2o/image/upload/v1702566305/anon_m9nm4m.webp'
    },
    email: {
      type: String,
      required: [true, 'Email is required']
    },
    bio: {
      type: String
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    postCount: {
      type: Number,
      default: 0
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ['Admin', 'Guest', 'Blogger']
    },
    isFollowing: {
      type: Boolean,
      default: false
    },
    isUnFollowing: {
      type: Boolean,
      default: false
    },
    isAccountVerified: {
      type: Boolean,
      default: false
    },
    accountVerificationToken: String,
    accountVerificationTokenExpires: Date,
    viewedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ]
    },
    followers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ]
    },
    following: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ]
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    },
    timestamps: true
  }
);

// Virtual method to populate created post
userSchema.virtual('posts', {
  ref: 'Post',
  foreignField: 'author',
  localField: '_id'
});

// Account Type
userSchema.virtual('accountType').get(function () {
  const totalFollowers = this.followers?.length;
  return totalFollowers >= 2 ? 'Pro' : 'Noob';
});

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Verify Account
userSchema.methods.createAccountVerificationToken = async function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.accountVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.accountVerificationTokenExpires = Date.now() + 30 * 60 * 1000; // 10 minutes
  return verificationToken;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
