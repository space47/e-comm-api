const jwt = require("jsonwebtoken");

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const isTokenValid = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  // short term will be reassigned if refresh token is not expired
  const accessTokenJWT = createJWT({ payload: { user } });
  // long term
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const longExp = 1000 * 60 * 60 * 24 * 30;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    expires: new Date(Date.now() + longExp),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
  // from above code 2 cookies will be created and added to the res
};

// const attachCookiesToResponse = ({res,user}) => {
//     const token = createJWT({payload: user})

//     const oneDay = 1000 * 60 * 60 * 24;
//     const fiveSeconds = 1000 * 5;
//     res.cookie('token', token, {
//         httpOnly: true,
//         expires: new Date(Date.now() + fiveSeconds),
//         secure: process.env.NODE_ENV === 'production',
//         signed: true,
//     })
// }

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
