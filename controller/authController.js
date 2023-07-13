const User = require("../model/User");
const Token = require("../model/Token");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  createHash
} = require("../utils");
const crypto = require("crypto");

const register = async (req, res) => {
  const { email, name, password } = req.body;
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // first user register as an admin
  const isFirstAccount = (await User.countDocuments({})) == 0;
  const role = isFirstAccount ? "admin" : "user";

  // adding  token
  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });

  const origin = "http://localhost:3000";

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin: origin,
  });
  // send verification token back only while testing in postman
  res.status(StatusCodes.CREATED).json({
    msg: "Success! Please check your email to verify account",
    verificationToken: user.verificationToken,
  });

  // const tokenUser = createTokenUser(user);

  // const token = createJWT({payload: tokenUser})
  // // creating cookie
  // const oneDay = 1000 * 60 * 60 * 24

  // res.cookie('token', token, {
  //     httpOnly: true,
  //     expires: new Date(Date.now() + oneDay)
  // })

  // attachCookiesToResponse({res,user:tokenUser})

  // res.status(StatusCodes.CREATED).json({tokenUser})
};

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  // check if email exist
  const user = await User.findOne({ email });
  if (!email) {
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }
  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }
  // set the user to be verified or true so that user can login
  user.isVerified = true;
  user.verified = Date.now();
  // set verificationToken to empty so that can't access verification link again
  user.verificationToken = "";
  await user.save();
  // check if verification token is same as user verification token
  res.status(StatusCodes.OK).json({ msg: "Email Verified" });
};
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const isUserVerified = user.isVerified;
  
  // if user is verified then only login otherwise give error.
  if (!isUserVerified) {
    throw new CustomError.UnauthenticatedError("Please Verify ur email");
  }

  const tokenUser = createTokenUser(user);
  // new work for project 11
  // create refresh token
  let refreshToken = "";
  // check for existing token
  // before creating userToken in db check if it is already present
  // if already present then, no need to create new refresh token as refresh token is for long term use
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    // console.log('already pressent')
    const { isValid } = existingToken;
    if (!isValid) {
      throw new CustomError.UnauthenticatedError("Invalid Credentials");
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  // if referes token in not present in db for the current user then create new refresh token and then create cookie
  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  // store in db for refresh token which last longer than access token
  await Token.create(userToken);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const logout = async (req, res) => {
  // delete the token for the current user from the token db.
  await Token.findOneAndDelete({ user: req.user.userId });
  // change the cookie value to logout within 5 seconds of logout
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError("Please provide valid email");
  }
  // check if user exist
  // send resetemail to his mail with all details
  const user = await User.findOne({ email });
  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = passwordToken;
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;

    await user.save();
    const origin = "http://localhost:3000";

    // send email
    sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      passwordToken: user.passwordToken,
      origin: origin,
    });
  }

  // sending res in case when account with email is not preset, to not let hacker know the accounts with mailid
  res.status(StatusCodes.OK).json({
    msg: "Please check your Email for reset Password Link",
  });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  // if anything not exist show error
  if (!email || !token || !password) {
    throw new CustomError.BadRequestError("Please fill all Details");
  }


  const user = await User.findOne({ email });
  // if user exist then only do change password otherwise show a message.
  // it will help not let user know the mail id for which account is registered

  if (user) {
    const currentDate = new Date();
    if (
      user.passwordToken === token &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      console.log('came inside')
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }
  res.status(StatusCodes.OK).json({ msg: "Password Changed Successfully" });
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
