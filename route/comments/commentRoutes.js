const express = require('express');

const {
  createCommentCtrl,
  fetchAllCommentsCtrl,
  fetchCommentCtrl,
  updateCommentCtrl,
  deleteCommentCtrl
} = require('../../controllers/comments/commentCtrl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');

const commentRoutes = express.Router();

// Apply authentication middleware to all routes
commentRoutes.use(authMiddleware);

// Routes
commentRoutes.post('/', createCommentCtrl);
commentRoutes.get('/', fetchAllCommentsCtrl);
commentRoutes.get('/:id', fetchCommentCtrl);
commentRoutes.put('/:id', updateCommentCtrl);
commentRoutes.delete('/:id', deleteCommentCtrl);

module.exports = commentRoutes;