const pool = require("../config/db");
const jwt = require("jsonwebtoken");

// Lưu refresh token kèm thiết bị
const saveRefreshToken = async (userId, refreshToken, device) => {
    const result = await pool.query("SELECT token FROM users WHERE id = $1", [userId]);

    let tokens = result.rows[0]?.token ? JSON.parse(result.rows[0].token) : [];

    tokens.push({
        token: refreshToken,
        device,
        created_at: new Date().toISOString(),
    });

    await pool.query("UPDATE users SET token = $1 WHERE id = $2", [JSON.stringify(tokens), userId]);
};

// Kiểm tra refresh token
const verifyRefreshToken = async (refreshToken) => {
    const result = await pool.query("SELECT id, token FROM users");

    for (let row of result.rows) {
        let tokens = JSON.parse(row.token || "[]");
        if (tokens.some((t) => t.token === refreshToken)) {
            return row.id;
        }
    }
    return null;
};

// Xóa token của một thiết bị cụ thể
const logoutDevice = async (userId, refreshToken) => {
    const result = await pool.query("SELECT token FROM users WHERE id = $1", [userId]);

    let tokens = JSON.parse(result.rows[0]?.token || "[]");

    tokens = tokens.filter((t) => t.token !== refreshToken);

    await pool.query("UPDATE users SET token = $1 WHERE id = $2", [JSON.stringify(tokens), userId]);

    return { message: "Đã đăng xuất thiết bị thành công" };
};

// Lấy danh sách thiết bị đăng nhập
const getUserSessions = async (userId) => {
    const result = await pool.query("SELECT token FROM users WHERE id = $1", [userId]);

    return JSON.parse(result.rows[0]?.token || "[]");
};

module.exports = { saveRefreshToken, verifyRefreshToken, logoutDevice, getUserSessions };
