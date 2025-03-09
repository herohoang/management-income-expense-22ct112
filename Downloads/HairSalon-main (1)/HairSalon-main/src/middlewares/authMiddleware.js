const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("Received Authorization Header:", authHeader); // Debug

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Không có token hoặc sai định dạng!" });
    }

    const token = authHeader.split(" ")[1]; // Lấy token thực
    console.log("Extracted Token:", token); // Debug

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET chưa được cấu hình trong .env!");
        return res.status(500).json({ message: "Lỗi server: Thiếu JWT_SECRET" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded); // Debug token data
        console.log("Token Expiration:", new Date(decoded.exp * 1000).toLocaleString()); // Log thời gian hết hạn

        req.user = decoded; // Gán thông tin người dùng vào req.user
        next();
    } catch (error) {
        console.error("JWT Verify Error:", error); // Ghi log chi tiết lỗi

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token đã hết hạn! Vui lòng đăng nhập lại." });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Token không hợp lệ!" });
        } else {
            return res.status(500).json({ message: "Lỗi xác thực token!", error: error.message });
        }
    }
};

// Middleware kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
  console.log('User info in isAdmin middleware:', req.user);
  if (!req.user || req.user.user_type_id !== 1) 
  { 
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
  next();
};

module.exports = { authMiddleware, isAdmin };


