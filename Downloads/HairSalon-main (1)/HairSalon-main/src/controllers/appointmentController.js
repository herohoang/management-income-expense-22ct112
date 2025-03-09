const pool = require('../db');
const User = require('../models/userModel');  // Điều chỉnh đường dẫn nếu cần thiết
const Appointment = require('../models/Appointment'); // Đảm bảo bạn đã tạo model Appointment
const { getIo } = require("../socket");

// Lấy tất cả lịch hẹn (Chỉ Admin mới được xem)
const getAllAppointments = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id, 
        a.user_id, 
        u.username as user_name,
        a.barber_id, 
        b.full_name as barber_name,
        a.service_id, 
        s.service_name as service_name,
        a.appointment_date, 
        a.status, 
        a.total_amount,
        a.created_at,
        a.rating,
        a.review_text,
        a.reviewed_at
      FROM 
        appointments a
      JOIN 
        users u ON a.user_id = u.id
      JOIN 
        barbers b ON a.barber_id = b.id
      JOIN 
        services s ON a.service_id = s.id
      ORDER BY 
        a.appointment_date DESC
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Không có lịch hẹn nào" });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Không thể lấy thông tin lịch hẹn", error: error.message });
  }
};

const getAppointmentsByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    // Lấy user_id từ username
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const userId = userResult.rows[0].id;

    // Câu query JOIN đã cập nhật để bao gồm username
    const appointmentsQuery = `
      SELECT 
        a.id, 
        a.user_id, 
        u.username as user_name,  -- Thêm username từ bảng users
        a.barber_id, 
        b.full_name as barber_name,
        a.service_id, 
        s.service_name as service_name,
        a.appointment_date, 
        a.status, 
        a.total_amount,
        a.created_at,
        a.rating,
        a.review_text,
        a.reviewed_at,
        (CASE WHEN a.rating IS NOT NULL THEN true ELSE false END) as has_review
      FROM 
        appointments a
      JOIN 
        users u ON a.user_id = u.id  -- Join với bảng users
      JOIN 
        barbers b ON a.barber_id = b.id
      JOIN 
        services s ON a.service_id = s.id
      WHERE 
        a.user_id = $1
      ORDER BY 
        a.appointment_date DESC
    `;

    const result = await pool.query(appointmentsQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không có cuộc hẹn nào' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Chi tiết lỗi:', error);
    res.status(500).json({ message: 'Lỗi khi lấy cuộc hẹn', error: error.message });
  }
};

// Thêm lịch hẹn mới (Ai cũng có thể đặt)
const createAppointment = async (req, res) => {
  const { user_name, barber_name, service_name, appointment_date, status } = req.body;

  try {
    const user = await pool.query('SELECT id FROM users WHERE username = $1', [user_name]);
    const barber = await pool.query('SELECT id FROM barbers WHERE full_name = $1', [barber_name]);
    const service = await pool.query('SELECT id, price FROM services WHERE service_name = $1', [service_name]);

    if (!user.rows.length || !barber.rows.length || !service.rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy user, barber hoặc service' });
    }

    const user_id = user.rows[0].id;
    const barber_id = barber.rows[0].id;
    const service_id = service.rows[0].id;
    const price = service.rows[0].price;
    const total_amount = price;

    const result = await pool.query(
      `INSERT INTO appointments (user_id, barber_id, service_id, appointment_date, status, total_amount) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING 
         id, 
         user_id, 
         (SELECT username FROM users WHERE id = $1) as user_name,
         barber_id, 
         (SELECT full_name FROM barbers WHERE id = $2) as barber_name,
         service_id, 
         (SELECT service_name FROM services WHERE id = $3) as service_name,
         appointment_date, 
         status, 
         total_amount, 
         created_at, 
         rating, 
         review_text, 
         reviewed_at`,
      [user_id, barber_id, service_id, appointment_date, status || 'pending', total_amount]
    );

    const newAppointment = result.rows[0];

    // Gửi thông báo qua WebSocket
    const io = getIo();
    io.emit("newAppointment", {
      message: `Lịch hẹn mới từ ${user_name}`,
      appointment: newAppointment,
    });

    res.status(201).json({ message: 'Lịch hẹn đã được tạo', appointment: newAppointment });
  } catch (error) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi khi tạo lịch hẹn', error: error.message });
  }
};

// Cập nhật lịch hẹn (Chỉ Admin và user)
const updateAppointment = async (req, res) => {
  const { appointment_id } = req.params;
  const { user_name, barber_name, service_name, appointment_date, status, rating, review_text } = req.body;

  try {
    // Kiểm tra xem lịch hẹn có tồn tại không
    const appointmentCheck = await pool.query('SELECT * FROM appointments WHERE id = $1', [appointment_id]);
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    }

    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;

    // Xây dựng câu lệnh SQL động dựa trên các trường được cung cấp
    if (user_name && barber_name && service_name) {
      const user = await pool.query('SELECT id FROM users WHERE username = $1', [user_name]);
      const barber = await pool.query('SELECT id FROM barbers WHERE full_name = $1', [barber_name]);
      const service = await pool.query('SELECT id, price FROM services WHERE service_name = $1', [service_name]);

      if (!user.rows.length || !barber.rows.length || !service.rows.length) {
        return res.status(404).json({ message: 'Không tìm thấy user, barber hoặc service' });
      }

      updateFields.push(`user_id = $${paramCounter++}`);
      queryParams.push(user.rows[0].id);

      updateFields.push(`barber_id = $${paramCounter++}`);
      queryParams.push(barber.rows[0].id);

      updateFields.push(`service_id = $${paramCounter++}`);
      queryParams.push(service.rows[0].id);

      updateFields.push(`total_amount = $${paramCounter++}`);
      queryParams.push(service.rows[0].price);
    }

    if (appointment_date) {
      updateFields.push(`appointment_date = $${paramCounter++}`);
      queryParams.push(appointment_date);
    }

    if (status) {
      updateFields.push(`status = $${paramCounter++}`);
      queryParams.push(status);
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Đánh giá phải có giá trị từ 1 đến 5' });
      }
      updateFields.push(`rating = $${paramCounter++}`);
      queryParams.push(rating);
    }

    if (review_text !== undefined) {
      updateFields.push(`review_text = $${paramCounter++}`);
      queryParams.push(review_text);
    }

    if (rating !== undefined || review_text !== undefined) {
      updateFields.push(`reviewed_at = CURRENT_TIMESTAMP`);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
    }

    queryParams.push(appointment_id);

    // Truy vấn cập nhật và trả về dữ liệu đầy đủ bằng cách join với các bảng khác
    const updateQuery = `
      UPDATE appointments
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING 
        id, 
        user_id, 
        (SELECT username FROM users WHERE id = appointments.user_id) as user_name,
        barber_id, 
        (SELECT full_name FROM barbers WHERE id = appointments.barber_id) as barber_name,
        service_id, 
        (SELECT service_name FROM services WHERE id = appointments.service_id) as service_name,
        appointment_date, 
        status, 
        total_amount, 
        created_at, 
        rating, 
        review_text, 
        reviewed_at
    `;

    const result = await pool.query(updateQuery, queryParams);

    res.status(200).json({ 
      message: 'Cập nhật lịch hẹn thành công', 
      appointment: result.rows[0] 
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật lịch hẹn', error: error.message });
  }
};
// Xóa lịch hẹn theo ID (Chỉ Admin)
const deleteAppointment = async (req, res) => {
  const { appointment_id } = req.params; // Lấy ID từ URL

  try {
    const result = await pool.query(
      `DELETE FROM appointments WHERE id = $1 RETURNING *`,
      [appointment_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn để xóa' });
    }

    res.status(200).json({ message: 'Xóa lịch hẹn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi khi xóa lịch hẹn', error });
  }
};

// Thêm đánh giá cho cuộc hẹn
const addReviewToAppointment = async (req, res) => {
  const { appointment_id } = req.params;
  const { rating, review_text } = req.body;

  try {
    // Kiểm tra xem rating có hợp lệ không (1-5)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Đánh giá phải có giá trị từ 1 đến 5' });
    }

    // Cập nhật thông tin đánh giá
    const result = await pool.query(
      `UPDATE appointments 
       SET rating = $2, review_text = $3, reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [appointment_id, rating, review_text]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc hẹn để đánh giá' });
    }

    res.status(200).json({ 
      message: 'Đánh giá đã được thêm thành công', 
      appointment: result.rows[0] 
    });
  } catch (error) {
    console.error('Lỗi khi thêm đánh giá:', error);
    res.status(500).json({ message: 'Lỗi khi thêm đánh giá', error: error.message });
  }
};





module.exports = {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByUsername,
  addReviewToAppointment
};
