const jwt = require("jsonwebtoken");


module.exports = function (req, res, next) {
  //get token
  const token = req.header("x-auth-token");

  //if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authentication denied" });
  }

  //verify the token
  try {
    const decoded = jwt.verify(token, process.env.jwtSecret);

    req.user = decoded.user;

    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};