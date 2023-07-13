const User = require("../model/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {attachCookiesToResponse, createTokenUser, checkPermission} = require('../utils');


const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password");
  res.status(StatusCodes.OK).json({ users });
};

const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select("-password");
  if (!user) {
    throw new CustomError.NotFoundError(`No user with id: ${req.params.id}`);
  }
  // to not allow a user to access details of another use unless user role is admin
  checkPermission(req.user, user._id)
  
  res.status(StatusCodes.OK).json({ user });
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

const updateUser = async (req, res) => {
  console.log(req.body);
  const { name, email } = req.body;
  if (!name || !email) {
    throw new CustomError.BadRequestError("Please provide details");
  }
//   const user = User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { email, name },
//     { new: true, runValidators: true }
//   );

  // or use above part of code
  const user = User.findOne({_id: req.user.userId})

  user.email = email;
  user.name = name;

  await user.save();

  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({res,user: tokenUser})
  res.status(StatusCodes.CREATED).json({user: tokenUser})
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }
  // find the user with the userId
  const user = await User.findOne({ _id: req.user.userId });
  // check if password in db match with the given password
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;
  // again save the user value in the database
  await user.save();
  res.status(StatusCodes.OK).json({ msg: `Success! Password Updated` });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
