const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authentication");
const {
  createReview,
  getAllReviews,
  getSingleReviews,
  updateReview,
  deleteReview,
} = require("../controller/reviewController");

router.route("/").get(getAllReviews).post(authenticateUser,createReview);
router
  .route("/:id")
  .get(getSingleReviews)
  .patch(authenticateUser,updateReview)
  .delete(authenticateUser,deleteReview);

module.exports = router;
