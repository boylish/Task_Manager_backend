const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Middleware to protect routes (verify JWT and user)
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // Attach user to request
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token, access denied" });
  }
};

// ✅ Middleware to allow only admin users
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // user is admin, continue
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};

module.exports = { protect, adminOnly };
