const expressAsyncHandler = require('express-async-handler');
const Category = require('../../models/category/Category');

//----------------------------------------
// Create Category
//----------------------------------------
const createCategoryCtrl = expressAsyncHandler((req, res) => {
  Category.create({
    user: req.user._id,
    title: req.body.title
  })
    .then(category => {
      res.json(category);
    })
    .catch(error => {
      res.json(error);
    });
});

//----------------------------------------
// Fetch All Categories
//----------------------------------------
const fetchCategoriesCtrl = expressAsyncHandler(async (req, res) => {
  Category.find({})
    .populate('user')
    .sort('-createdAt')
    .then(categories => {
      res.json(categories);
    })
    .catch(error => {
      res.json(error);
    });
});

//----------------------------------------
// Fetch Category
//----------------------------------------
const fetchCategoryCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  await Category.findById(id)
    .populate('user')
    .sort('-createdAt')
    .then(category => {
      res.json(category);
    })
    .catch(error => {
      res.json(error);
    });
});

//----------------------------------------
// Update Category
//----------------------------------------
const updateCategoryCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  Category.findByIdAndUpdate(
    id,
    {
      title: req?.body?.title
    },
    {
      new: true,
      runValidators: true
    }
  )
  .then((category) => {
    res.json(category);
  })
  .catch((error) => {
    res.json(error);
  });
});

//----------------------------------------
// Delete Category
//----------------------------------------
const deleteCategoryCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  
  Category.findByIdAndDelete(id)
    .then(category => {
      res.json(category);
    })
    .catch(error => {
      res.json(error);
    });
});

module.exports = {
  createCategoryCtrl,
  fetchCategoriesCtrl,
  fetchCategoryCtrl,
  updateCategoryCtrl,
  deleteCategoryCtrl
};