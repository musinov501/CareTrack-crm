const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/doctors/doctorController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('ADMINISTRATOR', 'RECEPTIONIST', 'CLINICIAN'), doctorController.getAllDoctors);
router.get('/:id/profile', authorize('ADMINISTRATOR', 'RECEPTIONIST', 'CLINICIAN'), doctorController.getDoctorProfile);
router.get('/:id', authorize('ADMINISTRATOR', 'RECEPTIONIST', 'CLINICIAN'), doctorController.getDoctorById);
router.post('/', authorize('ADMINISTRATOR'), doctorController.createDoctor);
router.put('/:id', authorize('ADMINISTRATOR'), doctorController.updateDoctor);
router.delete('/:id', authorize('ADMINISTRATOR'), doctorController.deleteDoctor);

module.exports = router;
