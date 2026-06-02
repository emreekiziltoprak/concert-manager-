const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access is denied, role information cant be obtained." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access is denied, you dont have permission to perform this action." });
    }

    next(); 
  };
};

module.exports = checkRole;