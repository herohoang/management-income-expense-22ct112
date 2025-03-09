const express = require('express');
const {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByUsername,
  addReviewToAppointment
} = require('../controllers/appointmentController');

const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Put specific routes BEFORE parameterized routes
router.get('/all', authMiddleware, getAllAppointments);  // Chỉ admin được xem
// Then put the parameterized route after
router.get('/:username', authMiddleware, getAppointmentsByUsername);
router.post('/create', authMiddleware, createAppointment);       // Ai cũng có thể đặt lịch hẹn
router.put('/update/:appointment_id', authMiddleware, updateAppointment);
router.delete('/:appointment_id',authMiddleware, deleteAppointment);
router.post('/:appointment_id/review', authMiddleware, addReviewToAppointment);


module.exports = router;
