const express = require('express');
const {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  toggleAddLikeToPostCtrl,
  toggleAddUnLikeToPostCtrl
} = require('../../controllers/posts/postCtrl');
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const {
  photoUpload,
  postImgResize
} = require('../../middlewares/uploads/photoUpload');
const blockedUser = require('../../utils/blockUser');

const postRoute = express.Router();

postRoute.post(
  '/',
  authMiddleware,
  blockedUser,
  photoUpload.single('image'),
  postImgResize,
  createPostCtrl
);
postRoute.put('/likes', authMiddleware, toggleAddLikeToPostCtrl);
postRoute.put('/unlikes', authMiddleware, toggleAddUnLikeToPostCtrl);
postRoute.get('/', fetchPostsCtrl);
postRoute.get('/:id', fetchPostCtrl);
postRoute.put('/:id', authMiddleware, updatePostCtrl);
postRoute.delete('/:id', authMiddleware, deletePostCtrl);

module.exports = postRoute;