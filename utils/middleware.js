const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  console.log(req.headers.authorization);
  const token = req.headers.authorization.replace("Bearer ", "");

  const identifiedUser = await User.findOne({ token: token });

  if (identifiedUser) {
    req.user = identifiedUser;
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

module.exports = isAuthenticated;
