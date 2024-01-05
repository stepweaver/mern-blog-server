const expressAsyncHandler = require('express-async-handler');
const Comment = require('../../models/comment/comment');
const validateMongodbId = require('../../utils/validateMongodbId');
const blockedUser = require('../../utils/blockUser');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};

//----------------------------------------
// Create Comment
//----------------------------------------
const createCommentCtrl = expressAsyncHandler(async (req, res, next) => {
  try {
    const { postId, description } = req.body;

    if (postId === undefined || description === undefined) {
      return res.status(400).json({ error: 'Invalid input data.' });
    }

    await blockedUser(req, res, async () => {
      const user = req.user;
      const comment = await Comment.create({ post: postId, user, description });
      res.json(comment);
    });
  } catch (err) {
    next(err);
  }
});

//----------------------------------------
// Fetch All Comments
//----------------------------------------
const fetchAllCommentsCtrl = expressAsyncHandler(async (req, res, next) => {
  try {
    const comments = await Comment.find({}).sort('-created');
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

//----------------------------------------
// Comment Details
//----------------------------------------
const fetchCommentCtrl = expressAsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

//----------------------------------------
// Update Comment
//----------------------------------------
const updateCommentCtrl = expressAsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    validateMongodbId(id);
    const update = await Comment.findByIdAndUpdate(
      id,
      {
        user: req.user || undefined,
        description: req.body ? req.body.description : undefined
      },
      { new: true, runValidators: true }
    );
    res.json(update);
  } catch (err) {
    next(err);
  }
});

//----------------------------------------
// Delete Comment
//----------------------------------------
const deleteCommentCtrl = expressAsyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    validateMongodbId(id);
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = {
  deleteCommentCtrl,
  createCommentCtrl,
  fetchAllCommentsCtrl,
  fetchCommentCtrl,
  updateCommentCtrl,
  errorHandler
};
