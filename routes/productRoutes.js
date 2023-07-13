const express = require('express');
const {authenticateUser, authorizePermission} = require('../middleware/authentication')

const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require("../controller/productController");

const {getSingleProductReviews} = require('../controller/reviewController')
const router = express.Router();

router.route("/").get(getAllProducts).post([authenticateUser,authorizePermission('admin', 'user')],createProduct)
router.route('/uploadImage').post([authenticateUser,authorizePermission('admin')],uploadImage);
router.route('/:id').get(getSingleProduct).patch([authenticateUser,authorizePermission('admin')],updateProduct).delete([authenticateUser,authorizePermission('admin')],deleteProduct)

router.route('/:id/reviews').get(getSingleProductReviews)
module.exports = router