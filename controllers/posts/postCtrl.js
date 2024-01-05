const expressAsyncHandler = require('express-async-handler');
const Filter = require('bad-words');
const fs = require('fs');

const Post = require('../../models/post/post');
const validateMongodbId = require('../../utils/validateMongodbId');
const User = require('../../models/user/user');
const cloudinaryUploadImg = require('../../utils/cloudinary');

// Middleware for checking profanity
const profanityFilter = new Filter();

//----------------------------------------
// Create Post
//----------------------------------------
const createPostCtrl = expressAsyncHandler(async (req, res, next) => {
  try {
    const { _id, accountType, postCount } = req.user;

    const isTitleProfane = profanityFilter.isProfane(req.body.title);
    const isDescriptionProfane = profanityFilter.isProfane(
      req.body.description
    );

    if (isTitleProfane || isDescriptionProfane) {
      await User.findByIdAndUpdate(_id, { $set: { isBlocked: true } });
      return res
        .status(400)
        .json({ error: 'Profanity not allowed. You have been blocked' });
    }
    // Prevent post if noob account
    if (req?.user?.accountType === 'Noob' && postCount >= 2) {
      throw new Error(' - Noob accounts may only create two posts. You must have at least two followers to be upgraded to a Pro account.');
    }
    // Get path to image
    const localPath = `public/images/posts/${req.file.filename}`;
    // Upload to Cloudinary
    const imgUploaded = await cloudinaryUploadImg(localPath);

    const post = await Post.create({
      ...req.body,
      author: _id,
      image: imgUploaded?.url
    });
    // Update user post count
    await User.findByIdAndUpdate(
      _id,
      {
        $inc: { postCount: 1 }
      },
      { new: true }
    );
    // Delete the image from local storage
    fs.unlinkSync(localPath);
    res.json(post);
  } catch (error) {
    next(error);
  }
});
const errorHandler = (err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' });
};

//----------------------------------------
// Fetch All Posts
//----------------------------------------
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
  const hasCategory = req.query.category;

  if (hasCategory) {
    const posts = await Post.find({ category: hasCategory })
      .populate('author')
      .populate('comments')
      .sort('-createdAt');
    res.json(posts);
  } else {
    const posts = await Post.find({})
      .populate('author')
      .populate('comments')
      .sort('-createdAt');
    res.json(posts);
  }
});

//----------------------------------------
// Fetch Single Post
//----------------------------------------
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  // Find a single post by its ID and populate the author field
  const post = await Post.findById(id)
    .populate('author')
    .populate('comments')
    .populate('likes')
    .populate('unLikes');

  // Increment the number of views for the post
  await Post.findByIdAndUpdate(id, { $inc: { numViews: 1 } }, { new: true });

  // Send the post as a response
  res.json(post);
});

//----------------------------------------
// Update Post
//----------------------------------------
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  // Update the post with new data and return the updated post
  const post = await Post.findByIdAndUpdate(
    id,
    { ...req.body, user: req.user?._id },
    { new: true }
  );

  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: `Post not found.` });
  }
});

//----------------------------------------
// Delete Post
//----------------------------------------
const deletePostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  // Find and delete the post by ID
  const post = await Post.findOneAndDelete(id);

  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: `Post not found.` });
  }
});

//----------------------------------------
// Likes
//----------------------------------------
const toggleAddLikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  // Find the post to be liked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  // Find the loginUser
  const loginUserId = req?.user?._id;
  // Check if loginUser has liked this post
  const isLiked = post?.isLiked;
  // Check if loginUser already unLiked this post
  const alreadyUnLiked = post?.unLikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  // Remove the user from unLikes array if exists
  if (alreadyUnLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { unLikes: loginUserId },
        isUnLiked: false
      },
      { new: true }
    );
    res.json(post);
  }
  // Toggle
  // Remove the user if they have liked the post
  if (isLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false
      },
      { new: true }
    );
    res.json(post);
  } else {
    // Add to likes
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loginUserId },
        isLiked: true
      },
      { new: true }
    );
    res.json(post);
  }
});

//----------------------------------------
// UnLikes
//----------------------------------------
const toggleAddUnLikeToPostCtrl = expressAsyncHandler(async (req, res) => {
  // Find the post to be unLiked
  const { postId } = req.body;
  const post = await Post.findById(postId);
  // Find the loginUser
  const loginUserId = req?.user?._id;
  // Check if loginUser has unLiked this post
  const isUnLiked = post?.isUnLiked;
  // Check if loginUser already liked this post
  const alreadyLiked = post?.likes?.find(
    (userId) => userId.toString() === loginUserId?.toString()
  );
  // Remove the user from likes array if exists
  if (alreadyLiked) {
    const post = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $pull: { likes: loginUserId },
        isLiked: false
      },
      { new: true }
    );
    res.json(post);
  }
  // Toggle
  // Remove the user if they have unLiked the post
  if (isUnLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { unLikes: loginUserId },
        isUnLiked: false
      },
      { new: true }
    );
    res.json(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { unLikes: loginUserId },
        isUnLiked: true
      },
      { new: true }
    );
    res.json(post);
  }
});

module.exports = {
  toggleAddUnLikeToPostCtrl,
  toggleAddLikeToPostCtrl,
  deletePostCtrl,
  updatePostCtrl,
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl
};
