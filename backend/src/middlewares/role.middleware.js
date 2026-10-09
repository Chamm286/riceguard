// Middleware kiểm tra role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Không có quyền truy cập. Yêu cầu role: " + allowedRoles.join(", ") 
      });
    }
    next();
  };
}

module.exports = { requireRole };
