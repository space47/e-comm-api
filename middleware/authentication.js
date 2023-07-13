const CustomError = require("../errors");
const Token = require("../model/Token");
const { attachCookiesToResponse } = require("../utils");

const { isTokenValid } = require("../utils");

const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;
  // console.log(req.signedCookies)
  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }
    // if above access token is not present then reassign accesstoken with the help of refresh token
    // but first check if refreshToken is still isValid => true in db
    const payload = isTokenValid(refreshToken);
    const existingToken = await Token.findOne({
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });
    if (!existingToken || !existingToken.isValid) {
      throw new CustomError.UnauthenticatedError("Aunthentication Invalid");
    }
    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });
    req.user = payload.user

    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError("Aunthentication Invalid");
  }
};

const authorizePermission = (...roles) => {
  // if(req.user.role!=='admin'){
  //   throw new CustomError.UnauthorizedError('Unauthorized to Access')
  // }
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        "Unauthorized to Access this page"
      );
    }
    // return a callback to express if role not present in array then log an error otherwise go to next call, here it is getAllUser function
    next();
  };
};

module.exports = { authenticateUser, authorizePermission };
