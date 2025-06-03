const jwt = require('jsonwebtoken');

exports.auth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ msg: "Please login" });
  }
  console.log("This is auth token",process.env.AUTH_TOKEN)
  try {
    const user = jwt.verify(token, process.env.AUTH_TOKEN);
    req.user = user;
    console.log("This is user id"+req.user.id)
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ msg: "Login Required" });
  }
};
