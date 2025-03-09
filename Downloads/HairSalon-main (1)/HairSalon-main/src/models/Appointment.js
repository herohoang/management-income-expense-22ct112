const pool = require("../db");

const Appointment = {
  // 🟢 Tìm các cuộc hẹn theo user_id
  findByUserId: async (userId) => {
    const result = await pool.query(
      `SELECT * FROM appointments WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }
};

module.exports = Appointment;
