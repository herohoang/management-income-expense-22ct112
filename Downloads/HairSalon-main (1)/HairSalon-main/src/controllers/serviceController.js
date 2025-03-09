const pool = require('../db');

// Lấy danh sách tất cả dịch vụ (Mọi người đều có thể truy cập)
const getAllServices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY created_at DESC;');
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ', error });
  }
};

// Lấy thông tin dịch vụ theo name (Mọi người đều có thể truy cập)
const getServiceByName = async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query('SELECT * FROM services WHERE service_name = $1;', [name]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Lỗi khi lấy dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dịch vụ', error });
  }
};

// Thêm dịch vụ mới (Chỉ admin)
const createService = async (req, res) => {
  const { service_name, description, price, duration_minutes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO services (service_name, description, price, duration_minutes) VALUES ($1, $2, $3, $4) RETURNING *;',
      [service_name, description, price, duration_minutes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Lỗi khi thêm dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi khi thêm dịch vụ', error });
  }
};

const updateServiceByName = async (req, res) => {
  const { name } = req.params;
  const { description, price, duration_minutes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE services SET description = $1, price = $2, duration_minutes = $3 WHERE service_name = $4 RETURNING *;',
      [description, price, duration_minutes, name]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Lỗi khi cập nhật dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật dịch vụ', error });
  }
};

// Xóa dịch vụ theo name
const deleteServiceByName = async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query('DELETE FROM services WHERE service_name = $1 RETURNING *;', [name]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
    }
    res.json({ message: 'Đã xóa dịch vụ thành công', deletedService: result.rows[0] });
  } catch (error) {
    console.error('Lỗi khi xóa dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi khi xóa dịch vụ', error });
  }
};

module.exports = { getAllServices, getServiceByName, createService, updateServiceByName, deleteServiceByName };
