const pool = require("./db");

const alterTable = async () => {
  try {
    await pool.query(`
      ALTER TABLE users 
      ALTER COLUMN token TYPE TEXT USING token::TEXT;
    `);
    console.log("✅ Đã đổi kiểu dữ liệu của cột 'token' thành TEXT!");
  } catch (error) {
    console.error("❌ Lỗi khi thay đổi kiểu dữ liệu:", error);
  } finally {
    pool.end(); // Đóng kết nối sau khi chạy xong
  }
};

// Chạy lệnh ALTER TABLE
alterTable();
