const Product = require("../model/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermission } = require("../utils");
const Review = require("../model/Review");

const createReview = async (req, res) => {
  const { product: productId } = req.body;
  const isValidProduct = await Product.findOne({ _id: productId });
  // if given productId product exist in db
  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id: ${productId}`);
  }
  // if user is already submitted the review for a given product productId, then not allow to give second review
  // 1 user 1 review allow for one product
  const alreadySubmitted = await Review.findOne({
    user: req.user.userId,
    product: productId,
  });
  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      "Already submitted the review for this product"
    );
  }

  // add userId in the review
  req.body.user = req.user.userId;

  // add review in db
  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {

  // below line will add details of the given path in reviews
  const reviews = await Review.find({})
    .populate({path: 'product', select: 'name company price'})
    .populate({path: 'user', select: 'name email'})
  // const reviews = await Review.find({});
  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

const getSingleReviews = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }
  res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { rating, title, comment } = req.body;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }
  // check if user and review creator is same
  checkPermission(req.user, review.user);

  review.rating = rating;
  review.title = title;
  review.comment = comment;

  await review.save();

  res.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }
  // check if review is of same user
  checkPermission(req.user, review.user);
  await review.deleteOne();
  res.status(StatusCodes.OK).json({ review });
};

const getSingleProductReviews = async (req,res) => {
  const {id: productId} = req.params
  const reviews = await Review.find({product: productId});
  res.status(StatusCodes.OK).json({reviews, count: reviews.length})
}

module.exports = {
  createReview,
  getAllReviews,
  getSingleReviews,
  updateReview,
  deleteReview,
  getSingleProductReviews
};
