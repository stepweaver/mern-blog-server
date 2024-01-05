const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required']
    },
    isLiked: {
      type: Boolean,
      default: false
    },
    isUnLiked: {
      type: Boolean,
      default: false
    },
    numViews: {
      type: Number,
      default: 0
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    unLikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    image: {
      type: String,
      default:
        'https://cdn.pixabay.com/photo/2020/10/25/09/23/seagull-5683637_960_720.jpg'
    }
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true
  }
);

// Populate comments
postSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'post',
  localField: '_id'
});

// Compile
const Post = mongoose.model('Post', postSchema);

// Error handling middleware
postSchema.post('validate', (doc, next) => {
  const validationErrors = doc.validateSync();
  if (validationErrors) {
    const error = new Error('Validation failed.');
    error.errors = validationErrors.errors;
    return next(error);
  }
  next();
});

module.exports = Post;